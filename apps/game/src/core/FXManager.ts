import {
  Scene,
  ParticleSystem,
  Texture,
  Color4,
  Vector3,
  AbstractMesh,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Color3,
  FreeCamera
} from '@babylonjs/core';

export class FXManager {
  private smokeTexture: Texture;
  private sparkTexture: Texture;

  // Player slide particles
  private slideSparks: ParticleSystem;
  private slideDust: ParticleSystem;

  // Nitro speed streak particles
  private nitroStreaks: ParticleSystem;

  // Reusable emitter vectors to prevent GC allocations
  private slideEmitterPos = new Vector3();
  private nitroEmitterPos = new Vector3();

  // Screen shake state
  private trauma: number = 0; // 0 to 1
  private maxShakeOffset: number = 0.35;
  private maxShakeAngle: number = 0.05;
  private baseCamTargetY: number = 1.5;

  constructor(private scene: Scene, private camera: FreeCamera) {
    this.smokeTexture = this.createSmokeTexture();
    this.sparkTexture = this.createSparkTexture();

    this.slideSparks = this.createSlideSparks();
    this.slideDust = this.createSlideDust();
    this.nitroStreaks = this.createNitroStreaks();
  }

  private createSmokeTexture(): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.5, 'rgba(200, 200, 200, 0.45)');
    grad.addColorStop(1, 'rgba(100, 100, 100, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    return new Texture(canvas.toDataURL(), this.scene);
  }

  private createSparkTexture(): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
    grad.addColorStop(0, 'rgba(255, 255, 200, 1.0)');
    grad.addColorStop(0.3, 'rgba(255, 180, 50, 0.9)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();

    return new Texture(canvas.toDataURL(), this.scene);
  }

  private createSlideSparks(): ParticleSystem {
    const ps = new ParticleSystem('slideSparks', 100, this.scene);
    ps.particleTexture = this.sparkTexture;
    ps.emitter = new Vector3(0, 0.1, 0);

    ps.minEmitBox = new Vector3(-0.25, 0, -0.2);
    ps.maxEmitBox = new Vector3(0.25, 0.1, 0.2);

    ps.color1 = new Color4(1.0, 0.8, 0.2, 1.0);
    ps.color2 = new Color4(1.0, 0.3, 0.05, 0.9);
    ps.colorDead = new Color4(0.8, 0.1, 0.0, 0.0);

    ps.minSize = 0.08;
    ps.maxSize = 0.22;

    ps.minLifeTime = 0.15;
    ps.maxLifeTime = 0.35;

    ps.emitRate = 0; // Controlled in update
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;

    ps.direction1 = new Vector3(-0.6, 1.2, -3.0);
    ps.direction2 = new Vector3(0.6, 2.5, -4.5);

    ps.minEmitPower = 3.0;
    ps.maxEmitPower = 6.5;
    ps.updateSpeed = 0.02;

    ps.start();
    return ps;
  }

  private createSlideDust(): ParticleSystem {
    const ps = new ParticleSystem('slideDust', 60, this.scene);
    ps.particleTexture = this.smokeTexture;
    ps.emitter = new Vector3(0, 0.1, 0);

    ps.minEmitBox = new Vector3(-0.3, 0, -0.2);
    ps.maxEmitBox = new Vector3(0.3, 0.1, 0.2);

    ps.color1 = new Color4(0.4, 0.4, 0.42, 0.5);
    ps.color2 = new Color4(0.3, 0.3, 0.32, 0.3);
    ps.colorDead = new Color4(0.2, 0.2, 0.22, 0.0);

    ps.minSize = 0.25;
    ps.maxSize = 0.65;

    ps.minLifeTime = 0.25;
    ps.maxLifeTime = 0.55;

    ps.emitRate = 0;
    ps.direction1 = new Vector3(-0.8, 0.4, -2.5);
    ps.direction2 = new Vector3(0.8, 0.9, -3.8);

    ps.minEmitPower = 2.0;
    ps.maxEmitPower = 4.0;
    ps.updateSpeed = 0.015;

    ps.start();
    return ps;
  }

  private createNitroStreaks(): ParticleSystem {
    const ps = new ParticleSystem('nitroStreaks', 120, this.scene);
    ps.particleTexture = this.sparkTexture;
    ps.emitter = new Vector3(0, 1.2, 0);

    ps.minEmitBox = new Vector3(-3.5, -1.0, 5);
    ps.maxEmitBox = new Vector3(3.5, 3.0, 15);

    ps.color1 = new Color4(0.2, 0.8, 1.0, 0.8);
    ps.color2 = new Color4(1.0, 0.2, 0.8, 0.9);
    ps.colorDead = new Color4(0.1, 0.2, 0.8, 0.0);

    ps.minSize = 0.1;
    ps.maxSize = 0.35;

    ps.minLifeTime = 0.12;
    ps.maxLifeTime = 0.25;

    ps.emitRate = 0;
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;

    ps.direction1 = new Vector3(0, 0, -22);
    ps.direction2 = new Vector3(0, 0, -32);

    ps.minEmitPower = 18;
    ps.maxEmitPower = 30;

    ps.start();
    return ps;
  }

  /**
   * Create exhaust smoke particle system for a matatu.
   */
  public createMatatuExhaust(emitterMesh: AbstractMesh): ParticleSystem {
    const ps = new ParticleSystem(`exhaust_${emitterMesh.name}`, 40, this.scene);
    ps.particleTexture = this.smokeTexture;
    ps.emitter = emitterMesh;

    ps.minEmitBox = new Vector3(-0.1, 0, -0.1);
    ps.maxEmitBox = new Vector3(0.1, 0.1, 0.1);

    // Dark diesel soot
    ps.color1 = new Color4(0.18, 0.18, 0.20, 0.65);
    ps.color2 = new Color4(0.25, 0.25, 0.28, 0.45);
    ps.colorDead = new Color4(0.15, 0.15, 0.15, 0.0);

    ps.minSize = 0.25;
    ps.maxSize = 0.85;

    ps.minLifeTime = 0.35;
    ps.maxLifeTime = 0.75;

    ps.emitRate = 35;
    ps.direction1 = new Vector3(-0.3, 0.8, 3.0);
    ps.direction2 = new Vector3(0.3, 1.8, 5.5);

    ps.minEmitPower = 2.5;
    ps.maxEmitPower = 5.0;

    ps.start();
    return ps;
  }

  /**
   * Add screen shake trauma (0.0 to 1.0)
   */
  public addTrauma(amount: number) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  /**
   * Update FX every frame
   */
  public update(
    dt: number,
    playerPos: Vector3,
    isSliding: boolean,
    isGrounded: boolean,
    isNitro: boolean
  ) {
    // 1. Slide dust & sparks
    if (isSliding && isGrounded) {
      this.slideEmitterPos.set(playerPos.x, playerPos.y - 0.7, playerPos.z);
      this.slideSparks.emitter = this.slideEmitterPos;
      this.slideDust.emitter = this.slideEmitterPos;
      this.slideSparks.emitRate = 120;
      this.slideDust.emitRate = 45;
    } else {
      this.slideSparks.emitRate = 0;
      this.slideDust.emitRate = 0;
    }

    // 2. Nitro speed streaks
    if (isNitro) {
      this.nitroEmitterPos.set(playerPos.x, playerPos.y, playerPos.z);
      this.nitroStreaks.emitter = this.nitroEmitterPos;
      this.nitroStreaks.emitRate = 160;
      // Camera FOV dynamic kick
      this.camera.fov += (1.05 - this.camera.fov) * 8 * dt;
      // Continuous subtle rumble
      this.addTrauma(0.04);
    } else {
      this.nitroStreaks.emitRate = 0;
      this.camera.fov += (0.85 - this.camera.fov) * 6 * dt;
    }

    // 3. Screen Shake calculation
    if (this.trauma > 0) {
      const shakePower = Math.pow(this.trauma, 2);
      const offsetX = (Math.random() * 2 - 1) * this.maxShakeOffset * shakePower;
      const offsetY = (Math.random() * 2 - 1) * this.maxShakeOffset * shakePower;
      const roll = (Math.random() * 2 - 1) * this.maxShakeAngle * shakePower;

      this.camera.position.x += offsetX;
      this.camera.position.y += offsetY;
      this.camera.rotation.z = roll;

      // Decay trauma
      this.trauma = Math.max(0, this.trauma - 1.8 * dt);
    } else {
      this.camera.rotation.z += (0 - this.camera.rotation.z) * 10 * dt;
    }
  }

  public dispose() {
    this.smokeTexture.dispose();
    this.sparkTexture.dispose();
    this.slideSparks.dispose();
    this.slideDust.dispose();
    this.nitroStreaks.dispose();
  }
}
