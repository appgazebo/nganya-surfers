import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  DynamicTexture,
  PointLight
} from '@babylonjs/core';
import { LANES } from './Player';

export class RampTruck {
  public root: TransformNode;
  public laneIndex: number = 0;
  public active: boolean = false;
  public speed: number = 0;

  public rampLength: number = 6.5;
  public rampHeight: number = 2.50;

  private beaconMesh: Mesh;

  public get hitBox() {
    const pos = this.root.position;
    return {
      min: new Vector3(pos.x - 1.2, pos.y, pos.z - 3.5),
      max: new Vector3(pos.x + 1.2, pos.y + 2.5, pos.z + 3.5),
      width: 2.4,
      height: 2.5,
      depth: 7.0,
      center: new Vector3(pos.x, pos.y + 1.25, pos.z)
    };
  }

  constructor(private scene: Scene, id: number) {
    this.root = new TransformNode(`rampTruck_${id}`, scene);
    this.root.position.set(0, 0, -100);

    const { beaconMesh } = this.buildTruckModel(id);
    this.beaconMesh = beaconMesh;

    this.root.setEnabled(false);
  }

  private buildTruckModel(id: number) {
    const root = this.root;

    // 1. The Full-Length Inclined Wedge Ramp Bed
    // Spans from z = -3.5 (road level) up to z = 3.0 (roof level 2.50m)
    // Hypotenuse length of the incline
    const totalDz = 6.5;
    const totalDy = this.rampHeight;
    const rampHypot = Math.sqrt(totalDz * totalDz + totalDy * totalDy);
    const rampAngle = Math.atan2(totalDy, totalDz); // ~21 degrees incline

    const rampBed = MeshBuilder.CreateBox(`rampBed_${id}`, {
      width: 2.3,
      height: 0.2,
      depth: rampHypot
    }, this.scene);
    rampBed.position.set(0, this.rampHeight / 2 + 0.05, -0.25);
    rampBed.rotation.x = -rampAngle;
    rampBed.parent = root;

    // Ramp surface texture (steel diamond tread plate + bright yellow/black hazard borders)
    const rampTex = new DynamicTexture(`rampTex_${id}`, { width: 256, height: 512 }, this.scene);
    const ctx = rampTex.getContext();
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(0, 0, 256, 512);

    // Hazard warning border chevrons along sides
    ctx.fillStyle = '#ffb703';
    for (let y = -20; y < 540; y += 40) {
      // Left border stripe
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(30, y + 20);
      ctx.lineTo(30, y + 35);
      ctx.lineTo(0, y + 15);
      ctx.fill();

      // Right border stripe
      ctx.beginPath();
      ctx.moveTo(226, y);
      ctx.lineTo(256, y + 20);
      ctx.lineTo(256, y + 35);
      ctx.lineTo(226, y + 15);
      ctx.fill();
    }

    // Diamond steel cross-hatch grip lines
    ctx.strokeStyle = '#323842';
    ctx.lineWidth = 2.5;
    for (let i = -100; i < 600; i += 28) {
      ctx.beginPath();
      ctx.moveTo(35, i);
      ctx.lineTo(220, i + 70);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(220, i);
      ctx.lineTo(35, i + 70);
      ctx.stroke();
    }
    rampTex.update();

    const rampMat = new StandardMaterial(`rampMat_${id}`, this.scene);
    rampMat.diffuseTexture = rampTex;
    rampMat.specularColor = new Color3(0.5, 0.5, 0.5);
    rampBed.material = rampMat;

    // 2. Yellow Side Guard Rails along the ramp
    for (const side of [-1, 1]) {
      const rail = MeshBuilder.CreateBox(`rampRail_${id}_${side}`, {
        width: 0.1,
        height: 0.35,
        depth: rampHypot
      }, this.scene);
      rail.position.set(side * 1.18, this.rampHeight / 2 + 0.22, -0.25);
      rail.rotation.x = -rampAngle;
      rail.parent = root;

      const railMat = new StandardMaterial(`rRailMat_${id}_${side}`, this.scene);
      railMat.diffuseColor = new Color3(0.95, 0.75, 0.05); // Safety yellow
      rail.material = railMat;
    }

    // 3. Low-Profile Front Chassis & Cab Underneath (Cleanly below the ramp top)
    const chassis = MeshBuilder.CreateBox(`chassis_${id}`, { width: 2.2, height: 1.5, depth: 3.2 }, this.scene);
    chassis.position.set(0, 0.8, 1.4);
    chassis.parent = root;
    const chassisMat = new StandardMaterial(`chassisMat_${id}`, this.scene);
    chassisMat.diffuseColor = new Color3(0.85, 0.35, 0.05); // Breakdown orange
    chassis.material = chassisMat;

    // Front Bumper / Tow Guard
    const frontBumper = MeshBuilder.CreateBox(`fBumper_${id}`, { width: 2.35, height: 0.45, depth: 0.35 }, this.scene);
    frontBumper.position.set(0, 0.35, 3.1);
    frontBumper.parent = root;
    const chromeMat = new StandardMaterial(`fBumperMat_${id}`, this.scene);
    chromeMat.diffuseColor = new Color3(0.85, 0.85, 0.9);
    chromeMat.specularColor = new Color3(1, 1, 1);
    frontBumper.material = chromeMat;

    // 4. Heavy Truck Wheels (6 wheels along the lower sides)
    const wheelPositions = [
      [-1.15, 0.45, 2.0],
      [1.15, 0.45, 2.0],
      [-1.15, 0.45, -0.2],
      [1.15, 0.45, -0.2],
      [-1.15, 0.45, -2.0],
      [1.15, 0.45, -2.0]
    ];
    const wheelMat = new StandardMaterial(`truckWheelMat_${id}`, this.scene);
    wheelMat.diffuseColor = new Color3(0.08, 0.08, 0.08);

    wheelPositions.forEach((p, idx) => {
      const wheel = MeshBuilder.CreateCylinder(`truckWheel_${id}_${idx}`, { diameter: 0.9, height: 0.35 }, this.scene);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p[0], p[1], p[2]);
      wheel.parent = root;
      wheel.material = wheelMat;
    });

    // 5. Flashing Amber Roof Beacon (High emissive pulse, zero lighting cost)
    const beaconMesh = MeshBuilder.CreateCylinder(`beacon_${id}`, { height: 0.25, diameter: 0.4 }, this.scene);
    beaconMesh.position.set(0, 3.0, 2.6);
    beaconMesh.parent = root;

    const beaconMat = new StandardMaterial(`beaconMat_${id}`, this.scene);
    beaconMat.diffuseColor = new Color3(1.0, 0.65, 0.1);
    beaconMat.emissiveColor = new Color3(1.0, 0.65, 0.1);
    beaconMesh.material = beaconMat;

    return { beaconMesh };
  }

  public spawn(laneIndex: number, startZ: number, speed: number = 0) {
    this.laneIndex = laneIndex;
    this.root.position.x = LANES[laneIndex];
    this.root.position.y = 0;
    this.root.position.z = startZ;
    this.speed = speed;
    this.active = true;
    this.root.setEnabled(true);
  }

  /**
   * Calculate ramp surface height at player coordinates.
   * Player approaches from -Z moving toward +Z.
   * Ramp begins at z = -3.5 (road level y = 0.05) and rises to z = +3.0 (roof level y = 2.50).
   */
  public getRampHeightAt(playerX: number, playerZ: number): number | null {
    if (!this.active) return null;

    const relX = Math.abs(playerX - this.root.position.x);
    const relZ = playerZ - this.root.position.z;

    // Within ramp width (~2.3m)
    if (relX > 1.35) return null;

    // Inside ramp incline (from -3.5 to +3.0)
    if (relZ >= -3.6 && relZ <= 3.2) {
      const progress = Math.max(0, Math.min(1, (relZ - (-3.5)) / 6.5));
      return 0.05 + progress * (this.rampHeight - 0.05);
    }

    // Overhang transition to bus roof directly ahead
    if (relZ > 3.2 && relZ <= 3.8) {
      return this.rampHeight;
    }

    return null;
  }

  public update(dt: number, playerZ: number): boolean {
    if (!this.active) return false;

    this.root.position.z -= this.speed * dt;

    // Flashing amber beacon
    const flash = Math.sin(Date.now() * 0.012) > 0 ? 1.0 : 0.2;
    const mat = this.beaconMesh.material as StandardMaterial;
    if (mat) {
      mat.emissiveColor.set(flash, flash * 0.65, flash * 0.1);
    }

    if (this.root.position.z < playerZ - 20) {
      this.despawn();
      return false;
    }
    return true;
  }

  public despawn() {
    this.active = false;
    this.root.setEnabled(false);
  }

  public dispose() {
    this.root.dispose(false, true);
  }
}
