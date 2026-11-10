import {
  Scene,
  TransformNode,
  Vector3,
  ParticleSystem
} from '@babylonjs/core';
import { LANES } from './Player';
import { SoundManager } from '../core/SoundManager';
import { MatatuBus } from './MatatuBus';

export class Nganya {
  public root: TransformNode;
  public bus: MatatuBus;
  public laneIndex: number = 0;
  public active: boolean = false;
  public speed: number = 32;
  public isParkedConvoy: boolean = false;
  private hasHonked: boolean = false;
  public exhaustParticles?: ParticleSystem;

  public get hitBox() {
    const pos = this.root.position;
    return {
      min: new Vector3(pos.x - 1.1, pos.y, pos.z - 3.0),
      max: new Vector3(pos.x + 1.1, pos.y + 2.5, pos.z + 3.0),
      width: 2.2,
      height: 2.5,
      depth: 6.0,
      center: new Vector3(pos.x, pos.y + 1.25, pos.z)
    };
  }

  constructor(private scene: Scene, private sound: SoundManager, id: number) {
    this.root = new TransformNode(`nganya_${id}`, scene);
    this.root.position.set(0, 0, -100);

    // Build realistic matatu bus model
    this.bus = new MatatuBus(scene, id);
    this.bus.meshRoot.parent = this.root;

    this.root.setEnabled(false);
  }

  public spawn(laneIndex: number, startZ: number, playerSpeed: number, isConvoy: boolean = false) {
    this.laneIndex = laneIndex;
    this.root.position.x = LANES[laneIndex];
    this.root.position.y = 0;
    this.root.position.z = startZ;
    this.hasHonked = false;
    this.active = true;
    this.isParkedConvoy = isConvoy;
    this.root.setEnabled(true);

    // Apply random matatu theme (colors, text, underglow)
    this.bus.applyTheme();

    if (isConvoy) {
      // Parked or slow queue
      this.speed = 0;
      this.exhaustParticles?.stop();
    } else {
      // Readable oncoming speed: gives player fair, fluid reaction time
      this.speed = 10 + Math.random() * 6;
      this.exhaustParticles?.start();
    }
  }

  /**
   * Check if player is on the roof of this Nganya.
   * Roof platform surface is at y = 2.50.
   */
  public getRoofHeightAt(playerX: number, playerZ: number): number | null {
    if (!this.active) return null;

    const relX = Math.abs(playerX - this.root.position.x);
    const relZ = playerZ - this.root.position.z;

    // Inside roof perimeter (width 2.4, length 6.0)
    if (relX <= 1.25 && relZ >= -3.0 && relZ <= 3.0) {
      return 2.50;
    }

    return null;
  }

  public update(dt: number, playerZ: number): boolean {
    if (!this.active) return false;

    // Move toward player (-Z direction)
    this.root.position.z -= this.speed * dt;

    // Honk when getting close
    if (!this.hasHonked && this.root.position.z - playerZ <= 38 && this.root.position.z > playerZ) {
      this.hasHonked = true;
      this.sound.playNganyaHorn();
    }

    // Matatu engine bounce
    this.root.position.y = Math.sin(Date.now() * 0.015) * 0.025;

    // Animate wheel spin
    this.bus.animateWheels(dt, this.speed);

    // Despawn once behind player
    if (this.root.position.z < playerZ - 20) {
      this.despawn();
      return false;
    }

    return true;
  }

  public despawn() {
    this.active = false;
    this.root.setEnabled(false);
    this.exhaustParticles?.stop();
  }
}
