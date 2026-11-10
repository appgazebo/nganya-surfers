import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  DynamicTexture
} from '@babylonjs/core';
import { LANES } from './Player';

export type ObstacleType = 'BARRIER_JUMP' | 'GANTRY_SLIDE' | 'POTHOLE' | 'SPEED_BUMP';
export type ItemType = 'COIN' | 'MAGNET' | 'NITRO';

export class Obstacle {
  public root: TransformNode;
  public active: boolean = false;
  public type: ObstacleType = 'BARRIER_JUMP';
  public laneIndex: number = 0;

  // Visual container nodes
  private barrierContainer: TransformNode;
  private gantryContainer: TransformNode;
  private potholeContainer: TransformNode;
  private speedBumpContainer: TransformNode;

  public get hitBox() {
    const pos = this.root.position;
    if (this.type === 'BARRIER_JUMP') {
      // Low barrier: jump over
      return {
        min: new Vector3(pos.x - 1.2, pos.y, pos.z - 0.35),
        max: new Vector3(pos.x + 1.2, pos.y + 1.2, pos.z + 0.35),
        type: this.type
      };
    } else if (this.type === 'GANTRY_SLIDE') {
      // Overhead gantry: dangerous upper half, slide underneath
      return {
        min: new Vector3(pos.x - 1.4, pos.y + 1.0, pos.z - 0.4),
        max: new Vector3(pos.x + 1.4, pos.y + 3.2, pos.z + 0.4),
        type: this.type
      };
    } else if (this.type === 'POTHOLE') {
      // Road pothole: ground obstacle
      return {
        min: new Vector3(pos.x - 0.95, pos.y, pos.z - 0.95),
        max: new Vector3(pos.x + 0.95, pos.y + 0.45, pos.z + 0.95),
        type: this.type
      };
    } else {
      // Speed bump ('SPEED_BUMP'): raised hump across lane
      return {
        min: new Vector3(pos.x - 1.25, pos.y, pos.z - 0.65),
        max: new Vector3(pos.x + 1.25, pos.y + 0.45, pos.z + 0.65),
        type: this.type
      };
    }
  }

  constructor(private scene: Scene, id: number) {
    this.root = new TransformNode(`obstacle_${id}`, scene);

    // Create 4 distinct obstacle variants
    this.barrierContainer = new TransformNode(`bContainer_${id}`, scene);
    this.barrierContainer.parent = this.root;
    this.buildBarrier(id);

    this.gantryContainer = new TransformNode(`gContainer_${id}`, scene);
    this.gantryContainer.parent = this.root;
    this.buildGantry(id);

    this.potholeContainer = new TransformNode(`pContainer_${id}`, scene);
    this.potholeContainer.parent = this.root;
    this.buildPothole(id);

    this.speedBumpContainer = new TransformNode(`sbContainer_${id}`, scene);
    this.speedBumpContainer.parent = this.root;
    this.buildSpeedBump(id);

    this.root.setEnabled(false);
  }

  private buildBarrier(id: number) {
    const bar = MeshBuilder.CreateBox(`bar_${id}`, { width: 2.6, height: 0.9, depth: 0.25 }, this.scene);
    bar.position.y = 0.55;
    bar.parent = this.barrierContainer;

    const legL = MeshBuilder.CreateBox(`barLegL_${id}`, { width: 0.15, height: 0.6, depth: 0.8 }, this.scene);
    legL.position.set(-1.1, 0.3, 0);
    legL.parent = this.barrierContainer;

    const legR = MeshBuilder.CreateBox(`barLegR_${id}`, { width: 0.15, height: 0.6, depth: 0.8 }, this.scene);
    legR.position.set(1.1, 0.3, 0);
    legR.parent = this.barrierContainer;

    const stripeMat = new StandardMaterial(`barMat_${id}`, this.scene);
    stripeMat.diffuseColor = new Color3(0.95, 0.45, 0.05); // Highway warning orange
    bar.material = stripeMat;
    legL.material = stripeMat;
    legR.material = stripeMat;
  }

  private buildGantry(id: number) {
    const gantryBoard = MeshBuilder.CreateBox(`gBoard_${id}`, { width: 2.8, height: 1.4, depth: 0.3 }, this.scene);
    gantryBoard.position.y = 2.2;
    gantryBoard.parent = this.gantryContainer;

    const poleL = MeshBuilder.CreateCylinder(`poleL_${id}`, { height: 3.2, diameter: 0.14 }, this.scene);
    poleL.position.set(-1.35, 1.6, 0);
    poleL.parent = this.gantryContainer;

    const poleR = MeshBuilder.CreateCylinder(`poleR_${id}`, { height: 3.2, diameter: 0.14 }, this.scene);
    poleR.position.set(1.35, 1.6, 0);
    poleR.parent = this.gantryContainer;

    const gantryMat = new StandardMaterial(`gantryMat_${id}`, this.scene);
    gantryMat.diffuseColor = new Color3(0.08, 0.55, 0.25);
    gantryMat.emissiveColor = new Color3(0.05, 0.2, 0.1);
    gantryBoard.material = gantryMat;

    const poleMat = new StandardMaterial(`poleMat_${id}`, this.scene);
    poleMat.diffuseColor = new Color3(0.4, 0.4, 0.4);
    poleL.material = poleMat;
    poleR.material = poleMat;
  }

  private buildPothole(id: number) {
    // Outer cracked ring
    const rim = MeshBuilder.CreateTorus(`phRim_${id}`, { diameter: 1.8, thickness: 0.2, tessellation: 16 }, this.scene);
    rim.position.set(0, 0.04, 0);
    rim.rotation.x = Math.PI / 2;
    rim.scaling.set(1.1, 0.9, 0.3);
    rim.parent = this.potholeContainer;

    const rimMat = new StandardMaterial(`phRimMat_${id}`, this.scene);
    rimMat.diffuseColor = new Color3(0.06, 0.06, 0.07);
    rim.material = rimMat;

    // Dark water puddle in center
    const water = MeshBuilder.CreateDisc(`phWater_${id}`, { radius: 0.85, tessellation: 16 }, this.scene);
    water.position.set(0, 0.02, 0);
    water.rotation.x = Math.PI / 2;
    water.parent = this.potholeContainer;

    const waterMat = new StandardMaterial(`phWaterMat_${id}`, this.scene);
    waterMat.diffuseColor = new Color3(0.02, 0.03, 0.05);
    waterMat.specularColor = new Color3(0.9, 0.9, 1.0);
    water.material = waterMat;
  }

  private buildSpeedBump(id: number) {
    // Curved raised asphalt hump
    const bump = MeshBuilder.CreateCylinder(`sb_${id}`, {
      height: 2.7,
      diameter: 1.2,
      tessellation: 16
    }, this.scene);
    bump.rotation.z = Math.PI / 2;
    bump.position.set(0, -0.42, 0);
    bump.scaling.set(1, 0.4, 1.4);
    bump.parent = this.speedBumpContainer;

    // Dynamic texture with black and yellow chevron stripes
    const tex = new DynamicTexture(`sbTex_${id}`, { width: 256, height: 64 }, this.scene);
    const ctx = tex.getContext();
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = '#ffcc00';
    for (let x = -20; x < 280; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 20, 0);
      ctx.lineTo(x + 35, 64);
      ctx.lineTo(x + 15, 64);
      ctx.fill();
    }
    tex.update();

    const bumpMat = new StandardMaterial(`sbMat_${id}`, this.scene);
    bumpMat.diffuseTexture = tex;
    bumpMat.specularColor = new Color3(0.2, 0.2, 0.2);
    bump.material = bumpMat;
  }

  public spawn(type: ObstacleType, laneIndex: number, z: number, y: number = 0) {
    this.type = type;
    this.laneIndex = laneIndex;
    this.root.position.x = LANES[laneIndex];
    this.root.position.y = y;
    this.root.position.z = z;
    this.active = true;
    this.root.setEnabled(true);

    this.barrierContainer.setEnabled(type === 'BARRIER_JUMP');
    this.gantryContainer.setEnabled(type === 'GANTRY_SLIDE');
    this.potholeContainer.setEnabled(type === 'POTHOLE');
    this.speedBumpContainer.setEnabled(type === 'SPEED_BUMP');
  }

  public update(playerZ: number): boolean {
    if (!this.active) return false;
    if (this.root.position.z < playerZ - 15) {
      this.despawn();
      return false;
    }
    return true;
  }

  public despawn() {
    this.active = false;
    this.root.setEnabled(false);
  }
}

export class Collectible {
  public root: TransformNode;
  public active: boolean = false;
  public type: ItemType = 'COIN';
  private coinMesh: Mesh;
  private rotSpeed: number = 4;

  public get hitBox() {
    const pos = this.root.position;
    return {
      min: new Vector3(pos.x - 0.5, pos.y - 0.5, pos.z - 0.5),
      max: new Vector3(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5)
    };
  }

  constructor(private scene: Scene, id: number) {
    this.root = new TransformNode(`item_${id}`, scene);

    // Gold coin disc
    this.coinMesh = MeshBuilder.CreateCylinder(`coin_${id}`, { diameter: 0.9, height: 0.15 }, scene);
    this.coinMesh.rotation.x = Math.PI / 2;
    this.coinMesh.parent = this.root;

    const coinMat = new StandardMaterial(`coinMat_${id}`, scene);
    coinMat.diffuseColor = new Color3(1.0, 0.84, 0.0); // Gold
    coinMat.emissiveColor = new Color3(0.4, 0.3, 0.0);
    coinMat.specularColor = new Color3(1, 1, 1);
    this.coinMesh.material = coinMat;

    this.root.setEnabled(false);
  }

  public spawn(type: ItemType, x: number, y: number, z: number) {
    this.type = type;
    this.root.position.set(x, y, z);
    this.active = true;
    this.root.setEnabled(true);

    const mat = this.coinMesh.material as StandardMaterial;
    if (type === 'COIN') {
      mat.diffuseColor = new Color3(1.0, 0.84, 0.0); // Gold
      mat.emissiveColor = new Color3(0.4, 0.3, 0.0);
      this.coinMesh.scaling.set(1, 1, 1);
    } else if (type === 'MAGNET') {
      mat.diffuseColor = new Color3(0.2, 0.6, 1.0); // Electric Blue Magnet
      mat.emissiveColor = new Color3(0.1, 0.3, 0.8);
      this.coinMesh.scaling.set(1.3, 1.3, 1.3);
    } else if (type === 'NITRO') {
      mat.diffuseColor = new Color3(1.0, 0.2, 0.1); // Fiery Nitro Red
      mat.emissiveColor = new Color3(0.8, 0.1, 0.0);
      this.coinMesh.scaling.set(1.4, 1.4, 1.4);
    }
  }

  public update(dt: number, playerZ: number, playerPos?: Vector3, magnetActive?: boolean, magnetRadius: number = 18): boolean {
    if (!this.active) return false;

    // Spin coin
    this.root.rotation.y += this.rotSpeed * dt;

    // Magnet attraction towards player
    if (magnetActive && playerPos && this.type === 'COIN') {
      const dist = Vector3.Distance(this.root.position, playerPos);
      if (dist < magnetRadius) {
        const dir = playerPos.subtract(this.root.position).normalize();
        this.root.position.addInPlace(dir.scale(38 * dt));
      }
    }

    if (this.root.position.z < playerZ - 10) {
      this.despawn();
      return false;
    }
    return true;
  }

  public despawn() {
    this.active = false;
    this.root.setEnabled(false);
  }
}
