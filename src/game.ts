import {
  Engine,
  Scene,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  FreeCamera,
  Mesh,
  TransformNode
} from '@babylonjs/core';
import { Player, LANES } from './entities/Player';
import { Nganya } from './entities/Nganya';
import { Chaser } from './entities/Chaser';
import { RampTruck } from './entities/RampTruck';
import { Obstacle, Collectible, ObstacleType, ItemType } from './entities/Obstacles';
import { RoadManager } from './world/RoadManager';
import { EnvironmentManager } from './world/EnvironmentManager';
import { FXManager } from './core/FXManager';
import { SoundManager } from './core/SoundManager';
import { SaveManager } from './core/SaveManager';
import { InputManager } from './core/InputManager';
import { Hud } from './ui/Hud';
import { ShopModal } from './ui/ShopModal';

export enum GameState {
  START,
  PLAYING,
  GAMEOVER
}

export class Game {
  private engine: Engine;
  private scene: Scene;
  private camera: FreeCamera;
  private sound: SoundManager;
  private input: InputManager;
  private hud: Hud;
  private fx: FXManager;
  private env: EnvironmentManager;
  private saveManager: SaveManager;
  private shopModal: ShopModal;

  private player: Player;
  private chaser: Chaser;
  private road: RoadManager;
  private nganyas: Nganya[] = [];
  private rampTrucks: RampTruck[] = [];
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];

  // Skyline meshes & materials
  private skylineRoot!: TransformNode;
  private skylineBuildings: Mesh[] = [];
  private skylineMats: StandardMaterial[] = [];

  private state: GameState = GameState.START;
  private baseSpeed: number = 18.5;
  private currentSpeed: number = 18.5;
  private maxSpeed: number = 38.0;
  private distanceTraveled: number = 0;
  private coinsCollected: number = 0;
  private highScore: number = 0;

  // Powerups
  private nitroTimer: number = 0;
  private magnetTimer: number = 0;

  // Near miss tracking
  private nearMissIds: Set<string> = new Set();

  // Camera tracking
  private camDistZ: number = 7.2;
  private camTarget: Vector3 = new Vector3();

  // Spawning clocks
  private nextNganyaSpawnZ: number = 70;
  private nextConvoySpawnZ: number = 85;
  private nextObstacleSpawnZ: number = 40;
  private nextCoinSpawnZ: number = 30;

  constructor(private canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      powerPreference: 'high-performance',
      antialias: true
    });

    // Cap devicePixelRatio to 1.5 to prevent GPU fillrate throttling on 4K/retina displays
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.engine.setHardwareScalingLevel(1 / dpr);

    this.scene = new Scene(this.engine);
    this.scene.autoClear = true; // Clean frame buffer clearing every frame
    this.scene.clearColor = new Color4(0.35, 0.65, 0.95, 1.0); // Bright Nairobi Daylight!

    // Atmospheric Fog (Gentle distant atmospheric haze)
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.fogDensity = 0.0045;
    this.scene.fogColor = new Color3(0.40, 0.65, 0.90);

    // Camera
    this.camera = new FreeCamera('mainCam', new Vector3(0, 4.2, -7.5), this.scene);
    this.camera.fov = 0.85;
    this.camera.setTarget(new Vector3(0, 1.5, 12));

    this.sound = new SoundManager();
    this.saveManager = new SaveManager();
    this.highScore = this.saveManager.highScore;
    this.input = new InputManager(canvas);

    // Environment & Day/Night system
    this.env = new EnvironmentManager(this.scene);
    this.fx = new FXManager(this.scene, this.camera);

    this.createDistantSkyline();

    // World & Entities
    this.road = new RoadManager(this.scene);
    this.player = new Player(this.scene, this.sound);
    this.player.setSkin(this.saveManager.activeSkin); // Apply equipped skin
    this.chaser = new Chaser(this.scene, this.sound);

    // Pools
    this.initPools();

    // UI & Shop Modal
    this.hud = new Hud();
    this.hud.onStartClick = () => this.startGame();
    this.hud.onRestartClick = () => this.restartGame();

    this.shopModal = new ShopModal(this.hud.getUI(), this.saveManager, this.sound);
    this.shopModal.onSkinChanged = (skinId) => this.player.setSkin(skinId);
    this.hud.onShopClick = () => this.shopModal.show();

    // Controls
    this.setupControls();

    // Window resize
    window.addEventListener('resize', () => this.engine.resize());

    // Game Loop
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });
  }

  private createDistantSkyline() {
    this.skylineRoot = new TransformNode('skylineRoot', this.scene);

    // Skyline with windows that illuminate at night!
    for (let i = -14; i <= 14; i++) {
      if (Math.abs(i) < 2) continue;
      const height = 24 + Math.random() * 36;
      const width = 16 + Math.random() * 8;
      const building = MeshBuilder.CreateBox(`bldg_${i}`, {
        width: width,
        height: height,
        depth: 20
      }, this.scene);
      building.position.set(i * 18, height / 2 - 2, 140);
      building.parent = this.skylineRoot;

      // Window grid texture
      const tex = new DynamicTexture(`bldgTex_${i}`, { width: 256, height: 256 }, this.scene);
      const ctx = tex.getContext();
      ctx.fillStyle = '#080a12';
      ctx.fillRect(0, 0, 256, 256);

      // Draw random window dots
      for (let y = 10; y < 250; y += 18) {
        for (let x = 10; x < 250; x += 18) {
          if (Math.random() < 0.35) {
            ctx.fillStyle = Math.random() < 0.8 ? '#ffe680' : '#4dd2ff';
            ctx.fillRect(x, y, 9, 10);
          }
        }
      }
      tex.update();

      const bldgMat = new StandardMaterial(`bldgMat_${i}`, this.scene);
      bldgMat.diffuseTexture = tex;
      bldgMat.diffuseColor = new Color3(0.08, 0.09, 0.14);
      bldgMat.emissiveColor = new Color3(0.15, 0.15, 0.18);
      building.material = bldgMat;

      this.skylineBuildings.push(building);
      this.skylineMats.push(bldgMat);
    }
  }

  private initPools() {
    // Pool of 10 Nganyas with diesel exhaust particles (traffic + convoys)
    for (let i = 0; i < 10; i++) {
      const nganya = new Nganya(this.scene, this.sound, i);
      nganya.exhaustParticles = this.fx.createMatatuExhaust(nganya.bus.exhaustMesh);
      nganya.exhaustParticles.stop();
      this.nganyas.push(nganya);
    }

    // Pool of 4 Ramp Trucks for roof surfing
    for (let i = 0; i < 4; i++) {
      this.rampTrucks.push(new RampTruck(this.scene, i));
    }

    // Pool of 18 Obstacles
    for (let i = 0; i < 18; i++) {
      this.obstacles.push(new Obstacle(this.scene, i));
    }

    // Pool of 35 Collectibles
    for (let i = 0; i < 35; i++) {
      this.collectibles.push(new Collectible(this.scene, i));
    }
  }

  private setupControls() {
    this.input.onAction((action) => {
      // Don't register gameplay controls if shop modal is open
      if (this.shopModal.isVisible) return;

      if (this.state === GameState.START) {
        if (action === 'START' || action === 'JUMP' || action === 'BODA') {
          this.hud.hideStartScreen();
          this.startGame();
          if (action === 'BODA') {
            this.saveManager.useBoda();
            this.player.mountBoda(this.saveManager.activeBike);
            this.sound.playBodaRev();
            this.fx.addTrauma(0.2);
          }
        }
        return;
      }

      if (this.state === GameState.GAMEOVER) {
        if (action === 'START' || action === 'JUMP') {
          this.hud.hideGameOverScreen();
          this.restartGame();
        }
        return;
      }

      if (this.state === GameState.PLAYING) {
        switch (action) {
          case 'LEFT':
            this.player.moveLeft();
            break;
          case 'RIGHT':
            this.player.moveRight();
            break;
          case 'JUMP':
            this.player.jump();
            break;
          case 'SLIDE':
            this.player.slide();
            break;
          case 'BODA':
            if (!this.player.isRidingBoda) {
              this.saveManager.useBoda();
              this.player.mountBoda(this.saveManager.activeBike);
              this.sound.playBodaRev();
              this.fx.addTrauma(0.2);
            }
            break;
        }
      }
    });
  }

  public startGame() {
    this.state = GameState.PLAYING;
    this.currentSpeed = this.baseSpeed;
    this.distanceTraveled = 0;
    this.coinsCollected = 0;
    this.nitroTimer = 0;
    this.magnetTimer = 0;
    this.nearMissIds.clear();

    const pz = this.player.root.position.z;
    this.nextNganyaSpawnZ = pz + 65;
    this.nextConvoySpawnZ = pz + 80;
    this.nextObstacleSpawnZ = pz + 32;
    this.nextCoinSpawnZ = pz + 20;
    this.chaser.reset(pz);
  }

  public restartGame() {
    this.player.reset();
    this.skylineRoot.position.z = 0;
    this.chaser.reset(this.player.root.position.z);
    this.nganyas.forEach(n => n.despawn());
    this.rampTrucks.forEach(t => t.despawn());
    this.obstacles.forEach(o => o.despawn());
    this.collectibles.forEach(c => c.despawn());
    this.road.reset();
    this.startGame();
  }

  private gameOver(reason: 'KNOCKED' | 'ARRESTED' = 'KNOCKED') {
    this.state = GameState.GAMEOVER;

    if (reason === 'ARRESTED') {
      this.sound.playWhistle();
      this.fx.addTrauma(0.5);
      this.chaser.poseArrest(this.player.root.position);
    } else {
      this.sound.playCrash();
      this.fx.addTrauma(0.95); // Heavy impact screen shake!
      this.player.playCrashAnimation();
    }

    // Permanently bank earned coins & high score
    const earnedKSh = this.coinsCollected * 50;
    this.saveManager.bankCoins(earnedKSh);
    this.saveManager.setHighScore(this.distanceTraveled);
    this.highScore = this.saveManager.highScore;

    this.hud.showGameOver(this.distanceTraveled, this.coinsCollected, this.highScore, reason);
  }

  private update() {
    const dt = Math.min(this.engine.getDeltaTime() / 1000, 0.1);

    if (this.state === GameState.PLAYING) {
      // 1. Ramp speed with distance
      const speedMultiplier = 1.0 + (this.distanceTraveled / 450) * 0.15;
      let effectiveSpeed = Math.min(this.baseSpeed * speedMultiplier, this.maxSpeed);

      // Nitro Powerup boost
      if (this.nitroTimer > 0) {
        this.nitroTimer -= dt;
        effectiveSpeed *= 1.45;
      }

      // If stumbling, temporarily lose momentum
      if (this.player.isStumbling) {
        effectiveSpeed *= 0.72;
      }

      // Magnet timer
      if (this.magnetTimer > 0) {
        this.magnetTimer -= dt;
      }

      this.currentSpeed = effectiveSpeed;

      // 2. Move player forward
      this.player.root.position.z += this.currentSpeed * dt;
      this.distanceTraveled = this.player.root.position.z;

      // Check Multi-Tier Platforms (Ramps and Nganya Roofs)
      const pPos = this.player.root.position;
      let supportedHeight: number | null = null;

      // Check Ramp Trucks
      for (const truck of this.rampTrucks) {
        if (!truck.active) continue;
        const rH = truck.getRampHeightAt(pPos.x, pPos.z);
        if (rH !== null) {
          supportedHeight = supportedHeight === null ? rH : Math.max(supportedHeight, rH);
        }
      }

      // Check Nganya Roofs
      for (const nganya of this.nganyas) {
        if (!nganya.active) continue;
        const rfH = nganya.getRoofHeightAt(pPos.x, pPos.z);
        if (rfH !== null) {
          if (pPos.y >= 2.2 || this.player.isOnRoof) {
            supportedHeight = supportedHeight === null ? rfH : Math.max(supportedHeight, rfH);
          }
        }
      }

      this.player.setPlatformHeight(supportedHeight);

      // Update player controls/skeletal animation
      this.player.update(dt, this.currentSpeed);

      // Update Chaser pursuit AI
      this.chaser.update(dt, pPos, this.currentSpeed, this.player.isStumbling);

      // Elevated Camera when on the roof (Zero Z-jitter tracking)
      const desiredDistZ = this.nitroTimer > 0 ? 8.5 : 7.2;
      this.camDistZ += (desiredDistZ - this.camDistZ) * Math.min(8 * dt, 1.0);
      this.camera.position.z = pPos.z - this.camDistZ;

      const targetCamX = pPos.x * 0.35;
      const targetCamY = (this.player.isOnRoof ? 5.6 : 3.8) + (pPos.y - (this.player.isOnRoof ? 3.4 : 0.9)) * 0.35;

      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(14 * dt, 1.0);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(10 * dt, 1.0);

      this.camTarget.set(pPos.x * 0.45, pPos.y + 1.2, pPos.z + 12);
      this.camera.setTarget(this.camTarget);

      // 4. Update Day / Sunset / Night cycle
      this.env.update(this.distanceTraveled);
      const nightRatio = this.env.currentNightRatio;

      // Adjust skyline window lights based on night ratio
      const bldgGlow = 0.15 + nightRatio * 0.85;
      for (const mat of this.skylineMats) {
        mat.emissiveColor.set(bldgGlow, bldgGlow, bldgGlow * 1.1);
      }

      // Update skyline position to stay with player in distant horizon
      this.skylineRoot.position.z = pPos.z;

      // 5. Update Infinite Road
      this.road.update(pPos.z, nightRatio);

      // 6. Spawn & Update Systems
      this.spawnSystems(pPos.z);
      this.updateNganyas(dt, pPos.z);
      this.updateRampTrucks(dt, pPos.z);
      this.updateObstacles(pPos.z);
      this.updateCollectibles(dt, pPos.z);

      // 7. Check Collisions & Near-Misses
      this.checkCollisions();
      this.checkNearMisses(pPos);

      // 8. Update Visual Juice & Particle FX (Dust, Sparks, Nitro, Camera Shake)
      this.fx.update(
        dt,
        pPos,
        this.player.isSliding,
        this.player.isGrounded,
        this.nitroTimer > 0
      );

      // 9. Update HUD
      let powerupNotice = '';
      if (this.nitroTimer > 0) {
        powerupNotice = `🚀 SHENG NITRO (${Math.ceil(this.nitroTimer)}s)`;
      } else if (this.magnetTimer > 0) {
        powerupNotice = `🧲 COIN MAGNET (${Math.ceil(this.magnetTimer)}s)`;
      }
      this.hud.updateStats(
        this.distanceTraveled,
        this.coinsCollected,
        speedMultiplier,
        powerupNotice,
        this.chaser.isClose,
        this.player.isRidingBoda,
        this.player.bodaTimer,
        this.saveManager.bodaInventory
      );
    }
  }

  private checkNearMisses(pPos: Vector3) {
    // When a speeding matatu rushes right past the player in an adjacent lane
    for (const nganya of this.nganyas) {
      if (!nganya.active) continue;
      const id = nganya.root.name;
      const dz = nganya.root.position.z - pPos.z;
      const dx = Math.abs(nganya.root.position.x - pPos.x);

      // If passing right beside player within 3.5m and not already counted
      if (Math.abs(dz) < 2.5 && dx > 1.2 && dx < 4.2 && !this.nearMissIds.has(id)) {
        this.nearMissIds.add(id);
        // Exciting camera rumble on close call!
        this.fx.addTrauma(0.32);
      }

      // Clean up passed id
      if (dz < -10 && this.nearMissIds.has(id)) {
        this.nearMissIds.delete(id);
      }
    }
  }

  private spawnSystems(playerZ: number) {
    // 1. Spawn Rooftop Traffic Convoys (Ramp Truck + Parked Nganyas)
    if (playerZ + 120 > this.nextConvoySpawnZ) {
      const freeTruck = this.rampTrucks.find(t => !t.active);
      const freeNganya1 = this.nganyas.find(n => !n.active);
      const freeNganya2 = this.nganyas.find(n => !n.active && n !== freeNganya1);

      if (freeTruck && freeNganya1) {
        const lane = Math.floor(Math.random() * LANES.length);
        const spawnZ = playerZ + 120;
        const laneX = LANES[lane];

        // Spawn Ramp Truck
        freeTruck.spawn(lane, spawnZ);

        // Spawn parked Nganya 1 directly ahead
        freeNganya1.spawn(lane, spawnZ + 6.0, 0, true);

        // If second nganya available, extend the rooftop convoy!
        if (freeNganya2) {
          freeNganya2.spawn(lane, spawnZ + 12.0, 0, true);
        }

        // Spawn row of elevated coins on the roofs!
        for (let i = 0; i < 7; i++) {
          const coin = this.collectibles.find(c => !c.active);
          if (coin) {
            coin.spawn('COIN', laneX, 3.8, spawnZ + 2.0 + i * 2.2);
          }
        }
      }

      this.nextConvoySpawnZ += 85 + Math.random() * 45;
    }

    // 2. Spawn Regular Incoming Nganyas (Barrelling towards player)
    if (playerZ + 110 > this.nextNganyaSpawnZ) {
      const freeNganya = this.nganyas.find(n => !n.active);
      if (freeNganya) {
        const lane = Math.floor(Math.random() * LANES.length);
        freeNganya.spawn(lane, playerZ + 110, this.currentSpeed, false);
      }
      const gap = Math.max(45, 80 - (this.distanceTraveled / 200) * 8);
      this.nextNganyaSpawnZ += gap + Math.random() * 25;
    }

    // 2. Spawn Road Obstacles (Barriers, Gantries, Potholes, Speed Bumps)
    if (playerZ + 85 > this.nextObstacleSpawnZ) {
      const freeObs = this.obstacles.find(o => !o.active);
      if (freeObs) {
        const lane = Math.floor(Math.random() * LANES.length);
        const types: ObstacleType[] = ['BARRIER_JUMP', 'GANTRY_SLIDE', 'POTHOLE', 'SPEED_BUMP'];
        const type = types[Math.floor(Math.random() * types.length)];
        freeObs.spawn(type, lane, playerZ + 90);

        // If barrier or speed bump, spawn jumping coin arc!
        if (type === 'BARRIER_JUMP' || type === 'SPEED_BUMP') {
          this.spawnCoinArc(LANES[lane], playerZ + 90);
        }
      }
      this.nextObstacleSpawnZ += 32 + Math.random() * 28;
    }

    // 3. Spawn Regular Coin Lines & Powerups
    if (playerZ + 70 > this.nextCoinSpawnZ) {
      const lane = Math.floor(Math.random() * LANES.length);
      const laneX = LANES[lane];

      if (Math.random() < 0.12) {
        const pType: ItemType = Math.random() < 0.5 ? 'NITRO' : 'MAGNET';
        const freeItem = this.collectibles.find(c => !c.active);
        if (freeItem) {
          freeItem.spawn(pType, laneX, 1.2, playerZ + 75);
        }
      } else {
        for (let i = 0; i < 4; i++) {
          const freeCoin = this.collectibles.find(c => !c.active);
          if (freeCoin) {
            freeCoin.spawn('COIN', laneX, 1.0, playerZ + 70 + i * 4);
          }
        }
      }
      this.nextCoinSpawnZ += 28 + Math.random() * 20;
    }
  }

  private spawnCoinArc(laneX: number, barrierZ: number) {
    const offsets = [
      { dz: -3.5, y: 1.0 },
      { dz: 0, y: 2.2 },
      { dz: 3.5, y: 1.0 }
    ];

    offsets.forEach(off => {
      const coin = this.collectibles.find(c => !c.active);
      if (coin) {
        coin.spawn('COIN', laneX, off.y, barrierZ + off.dz);
      }
    });
  }

  private updateNganyas(dt: number, playerZ: number) {
    for (const nganya of this.nganyas) {
      nganya.update(dt, playerZ);
    }
  }

  private updateRampTrucks(dt: number, playerZ: number) {
    for (const truck of this.rampTrucks) {
      truck.update(dt, playerZ);
    }
  }

  private updateObstacles(playerZ: number) {
    for (const obs of this.obstacles) {
      obs.update(playerZ);
    }
  }

  private updateCollectibles(dt: number, playerZ: number) {
    const isMagnet = this.magnetTimer > 0;
    const pPos = this.player.root.position;
    // Upgraded magnet pull radius (from 18m up to 34m)
    const magnetRadius = 18 + (this.saveManager.getUpgradeInfo('magnet').level - 1) * 4;
    for (const col of this.collectibles) {
      col.update(dt, playerZ, pPos, isMagnet, magnetRadius);
    }
  }

  private checkCollisions() {
    const pHit = this.player.hitBox;
    const isInvincible = this.nitroTimer > 0 || this.player.invulnerableTimer > 0;

    // 1. Collisions with Nganyas (Unless climbing or safely on the roof!)
    for (const nganya of this.nganyas) {
      if (!nganya.active) continue;

      // If player is on the roof or elevated near roof level, player is safely on top!
      if (this.player.isOnRoof || pHit.center.y >= 2.0) {
        continue;
      }

      // If this is a parked convoy bus, never crash if player is approaching roof
      if (nganya.isParkedConvoy && pHit.center.y >= 1.6) {
        continue;
      }

      const nHit = nganya.hitBox;

      if (
        pHit.max.x > nHit.min.x &&
        pHit.min.x < nHit.max.x &&
        pHit.max.y > nHit.min.y &&
        pHit.min.y < nHit.max.y &&
        pHit.max.z > nHit.min.z &&
        pHit.min.z < nHit.max.z
      ) {
        if (isInvincible) {
          nganya.despawn();
          this.sound.playCrash();
          this.fx.addTrauma(0.5);
        } else if (this.player.isRidingBoda) {
          // Boda-Boda Crash Shield absorbs the impact!
          this.player.dismountBoda(true);
          this.sound.playBodaCrash();
          this.fx.addTrauma(0.65);
          nganya.despawn();
        } else {
          this.gameOver('KNOCKED');
          return;
        }
      }
    }

    // 2. Collisions with Ramp Trucks (Ramp is a wedge, player in lane climbs safely!)
    for (const truck of this.rampTrucks) {
      if (!truck.active) continue;

      const relX = Math.abs(pHit.center.x - truck.root.position.x);

      // In the same lane: player is running up the ramp, always safe!
      if (relX <= 1.35) {
        continue;
      }

      // Only check collision if player clips the side from an adjacent lane
      const tHit = truck.hitBox;
      if (
        pHit.max.x > tHit.min.x &&
        pHit.min.x < tHit.max.x &&
        pHit.max.y > tHit.min.y &&
        pHit.min.y < tHit.max.y &&
        pHit.max.z > tHit.min.z &&
        pHit.min.z < tHit.max.z
      ) {
        if (isInvincible) {
          truck.despawn();
          this.sound.playCrash();
          this.fx.addTrauma(0.5);
        } else if (this.player.isRidingBoda) {
          this.player.dismountBoda(true);
          this.sound.playBodaCrash();
          this.fx.addTrauma(0.65);
          truck.despawn();
        } else {
          this.gameOver('KNOCKED');
          return;
        }
      }
    }

    // 3. Collisions with Road Obstacles (ONLY on the road at usual height!)
    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      // If player is elevated on the ramp or roof, player cruises safely ABOVE road hazards!
      if (this.player.isOnRoof || pHit.min.y >= 1.5) {
        continue;
      }

      const oHit = obs.hitBox;

      if (
        pHit.max.x > oHit.min.x &&
        pHit.min.x < oHit.max.x &&
        pHit.max.z > oHit.min.z &&
        pHit.min.z < oHit.max.z
      ) {
        if (isInvincible) {
          obs.despawn();
          continue;
        }

        let isCollision = false;

        if (obs.type === 'BARRIER_JUMP') {
          // If player bottom is below top of barrier -> hit!
          if (pHit.min.y < oHit.max.y - 0.2) {
            isCollision = true;
          }
        } else if (obs.type === 'GANTRY_SLIDE') {
          // If player top touches upper gantry -> hit!
          if (pHit.max.y > oHit.min.y + 0.1) {
            isCollision = true;
          }
        } else if (obs.type === 'POTHOLE' || obs.type === 'SPEED_BUMP') {
          // Road obstacles: jump over them!
          if (pHit.min.y < oHit.max.y) {
            isCollision = true;
          }
        }

        if (isCollision) {
          if (this.player.isRidingBoda) {
            // Boda-Boda Crash Shield absorbs the collision!
            this.player.dismountBoda(true);
            this.sound.playBodaCrash();
            this.fx.addTrauma(0.6);
            obs.despawn();
          } else if (this.player.isStumbling || (this.chaser.isClose && this.chaser.distance < 3.2)) {
            // Second stumble / caught right in front of officer -> ARRESTED!
            this.gameOver('ARRESTED');
            return;
          } else {
            // First stumble -> stumble wobble and officer surges forward!
            this.player.triggerStumble();
            this.chaser.triggerStumbleSurge();
            this.fx.addTrauma(0.42);
            obs.despawn(); // Despawn so player doesn't collide multiple frames
          }
        }
      }
    }

    // 3. Collectibles & Powerups
    for (const col of this.collectibles) {
      if (!col.active) continue;
      const cHit = col.hitBox;

      if (
        pHit.max.x > cHit.min.x &&
        pHit.min.x < cHit.max.x &&
        pHit.max.y > cHit.min.y &&
        pHit.min.y < cHit.max.y &&
        pHit.max.z > cHit.min.z &&
        pHit.min.z < cHit.max.z
      ) {
        if (col.type === 'COIN') {
          this.coinsCollected++;
          this.sound.playCoin();
        } else if (col.type === 'NITRO') {
          // Upgraded Nitro Duration (from 5.5s up to 12.0s)
          this.nitroTimer = this.saveManager.getUpgradeInfo('nitro').value;
          this.sound.playPowerup();
          this.fx.addTrauma(0.25);
        } else if (col.type === 'MAGNET') {
          // Upgraded Magnet Duration (from 8.0s up to 16.0s)
          this.magnetTimer = this.saveManager.getUpgradeInfo('magnet').value;
          this.sound.playPowerup();
        }
        col.despawn();
      }
    }
  }
}
