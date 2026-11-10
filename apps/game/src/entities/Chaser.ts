import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh
} from '@babylonjs/core';
import { SoundManager } from '../core/SoundManager';

export class Chaser {
  public root: TransformNode;

  // Joints
  private pelvis: TransformNode;
  private spine: TransformNode;
  private chest: TransformNode;
  private neck: TransformNode;
  private headJoint: TransformNode;

  private leftUpperArm: TransformNode;
  private leftForearm: TransformNode;
  private rightUpperArm: TransformNode;
  private rightForearm: TransformNode;

  private leftThigh: TransformNode;
  private leftShin: TransformNode;
  private leftFoot: TransformNode;
  private rightThigh: TransformNode;
  private rightShin: TransformNode;
  private rightFoot: TransformNode;

  // Materials
  private skinMat: StandardMaterial;
  private uniformMat: StandardMaterial;
  private vestMat: StandardMaterial;
  private pantsMat: StandardMaterial;
  private bootMat: StandardMaterial;
  private capMat: StandardMaterial;
  private badgeMat: StandardMaterial;

  // Pursuit mechanics
  public distance: number = 3.5; // Meters behind player
  public targetDistance: number = 14.0;
  public isClose: boolean = true;
  private runPhase: number = 0;
  private whistleTimer: number = 2.0;

  constructor(private scene: Scene, private sound: SoundManager) {
    this.root = new TransformNode('chaserRoot', scene);

    // Materials
    this.skinMat = this.makeMat('c_skin', new Color3(0.38, 0.24, 0.15));
    this.uniformMat = this.makeMat('c_uniform', new Color3(0.08, 0.12, 0.22)); // Deep Navy Blue
    this.vestMat = this.makeMat('c_vest', new Color3(0.85, 0.95, 0.1)); // High-vis neon yellow-green
    this.vestMat.emissiveColor = new Color3(0.2, 0.25, 0.02);
    this.pantsMat = this.makeMat('c_pants', new Color3(0.07, 0.10, 0.18));
    this.bootMat = this.makeMat('c_boot', new Color3(0.06, 0.06, 0.07));
    this.capMat = this.makeMat('c_cap', new Color3(0.06, 0.09, 0.18));
    this.badgeMat = this.makeMat('c_badge', new Color3(0.95, 0.85, 0.2));
    this.badgeMat.specularColor = new Color3(1, 1, 1);

    // Joints hierarchy
    this.pelvis = this.joint('c_pelvis', this.root, 0, 0.9, 0);
    this.spine = this.joint('c_spine', this.pelvis, 0, 0.22, 0);
    this.chest = this.joint('c_chest', this.spine, 0, 0.28, 0);
    this.neck = this.joint('c_neck', this.chest, 0, 0.30, 0);
    this.headJoint = this.joint('c_head', this.neck, 0, 0.12, 0);

    // Arms
    this.leftUpperArm = this.joint('c_lUpperArm', this.chest, -0.28, 0.24, 0);
    this.leftForearm = this.joint('c_lForearm', this.leftUpperArm, 0, -0.3, 0);
    this.rightUpperArm = this.joint('c_rUpperArm', this.chest, 0.28, 0.24, 0);
    this.rightForearm = this.joint('c_rForearm', this.rightUpperArm, 0, -0.3, 0);

    // Legs
    this.leftThigh = this.joint('c_lThigh', this.pelvis, -0.12, -0.05, 0);
    this.leftShin = this.joint('c_lShin', this.leftThigh, 0, -0.42, 0);
    this.leftFoot = this.joint('c_lFoot', this.leftShin, 0, -0.42, 0.06);
    this.rightThigh = this.joint('c_rThigh', this.pelvis, 0.12, -0.05, 0);
    this.rightShin = this.joint('c_rShin', this.rightThigh, 0, -0.42, 0);
    this.rightFoot = this.joint('c_rFoot', this.rightShin, 0, -0.42, 0.06);

    this.buildOfficerModel();
  }

  private makeMat(name: string, color: Color3): StandardMaterial {
    const m = new StandardMaterial(name, this.scene);
    m.diffuseColor = color;
    m.specularColor = new Color3(0.15, 0.15, 0.15);
    return m;
  }

  private joint(name: string, parent: TransformNode, x: number, y: number, z: number): TransformNode {
    const j = new TransformNode(name, this.scene);
    j.position.set(x, y, z);
    j.parent = parent;
    return j;
  }

  private buildOfficerModel() {
    // 1. Torso & Reflective Traffic Vest
    const pelvisMesh = MeshBuilder.CreateCapsule('copPelvis', { radius: 0.17, height: 0.32 }, this.scene);
    pelvisMesh.material = this.uniformMat;
    pelvisMesh.parent = this.pelvis;
    pelvisMesh.position.y = 0.1;

    const spineMesh = MeshBuilder.CreateCapsule('copSpine', { radius: 0.19, height: 0.34 }, this.scene);
    spineMesh.material = this.uniformMat;
    spineMesh.parent = this.spine;
    spineMesh.position.y = 0.12;

    const chestMesh = MeshBuilder.CreateCapsule('copChest', { radius: 0.22, height: 0.36 }, this.scene);
    chestMesh.material = this.uniformMat;
    chestMesh.parent = this.chest;
    chestMesh.position.y = 0.1;

    // High-Vis Reflective Vest (Layered over chest)
    const vestBody = MeshBuilder.CreateCapsule('copVestBody', { radius: 0.23, height: 0.38 }, this.scene);
    vestBody.material = this.vestMat;
    vestBody.parent = this.chest;
    vestBody.position.y = 0.1;
    vestBody.scaling.set(1.02, 0.95, 1.05);

    // Reflective white safety stripe across vest
    const stripeMat = this.makeMat('c_vStripe', new Color3(0.95, 0.95, 0.95));
    stripeMat.emissiveColor = new Color3(0.5, 0.5, 0.5);
    const vStripe = MeshBuilder.CreateTorus('copVStripe', { diameter: 0.47, thickness: 0.04 }, this.scene);
    vStripe.material = stripeMat;
    vStripe.parent = this.chest;
    vStripe.position.set(0, 0.12, 0);

    // 2. Head & Peaked Police Service Cap
    const head = MeshBuilder.CreateSphere('copHead', { diameterX: 0.30, diameterY: 0.34, diameterZ: 0.30 }, this.scene);
    head.material = this.skinMat;
    head.parent = this.headJoint;
    head.position.y = 0.17;

    // Service cap crown (flared top)
    const capCrown = MeshBuilder.CreateCylinder('copCapCrown', {
      height: 0.16,
      diameterTop: 0.38,
      diameterBottom: 0.32,
      tessellation: 20
    }, this.scene);
    capCrown.material = this.capMat;
    capCrown.parent = this.headJoint;
    capCrown.position.set(0, 0.34, 0.02);

    // Cap visor / black brim
    const capVisor = MeshBuilder.CreateCylinder('copCapVisor', {
      height: 0.025,
      diameter: 0.34,
      tessellation: 20
    }, this.scene);
    capVisor.material = this.bootMat;
    capVisor.parent = this.headJoint;
    capVisor.position.set(0, 0.27, 0.14);
    capVisor.rotation.x = -0.15;
    capVisor.scaling.set(0.8, 1, 1.25);

    // Gold Police Badge on Cap
    const badge = MeshBuilder.CreateSphere('copBadge', { diameterX: 0.08, diameterY: 0.08, diameterZ: 0.03 }, this.scene);
    badge.material = this.badgeMat;
    badge.parent = this.headJoint;
    badge.position.set(0, 0.36, 0.16);

    // Whistle around neck
    const whistle = MeshBuilder.CreateCylinder('copWhistle', { height: 0.06, diameter: 0.025 }, this.scene);
    whistle.rotation.x = Math.PI / 2;
    whistle.position.set(0, 0.08, 0.12);
    whistle.parent = this.neck;
    whistle.material = this.badgeMat;

    // 3. Service Belt & Baton ("Rungu")
    const belt = MeshBuilder.CreateTorus('copBelt', { diameter: 0.38, thickness: 0.05 }, this.scene);
    belt.material = this.bootMat;
    belt.parent = this.pelvis;
    belt.position.y = 0.18;

    // Baton (hanging on left hip)
    const baton = MeshBuilder.CreateCylinder('copBaton', { height: 0.45, diameter: 0.03 }, this.scene);
    baton.position.set(-0.24, 0.05, 0.05);
    baton.rotation.z = 0.2;
    baton.parent = this.pelvis;
    baton.material = this.bootMat;

    // 4. Arms
    this.capsule('cLUA', this.leftUpperArm, 0.06, 0.32, this.uniformMat, new Vector3(0, -0.14, 0));
    this.capsule('cLFA', this.leftForearm, 0.055, 0.30, this.skinMat, new Vector3(0, -0.13, 0));
    this.sphere('cLHand', this.leftForearm, 0.08, this.skinMat, new Vector3(0, -0.28, 0));

    this.capsule('cRUA', this.rightUpperArm, 0.06, 0.32, this.uniformMat, new Vector3(0, -0.14, 0));
    this.capsule('cRFA', this.rightForearm, 0.055, 0.30, this.skinMat, new Vector3(0, -0.13, 0));
    this.sphere('cRHand', this.rightForearm, 0.08, this.skinMat, new Vector3(0, -0.28, 0));

    // 5. Legs & Boots
    this.capsule('cLT', this.leftThigh, 0.085, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));
    this.capsule('cLS', this.leftShin, 0.065, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));
    this.capsule('cLF', this.leftFoot, 0.065, 0.28, this.bootMat, new Vector3(0, -0.02, 0.04));

    this.capsule('cRT', this.rightThigh, 0.085, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));
    this.capsule('cRS', this.rightShin, 0.065, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));
    this.capsule('cRF', this.rightFoot, 0.065, 0.28, this.bootMat, new Vector3(0, -0.02, 0.04));
  }

  private capsule(name: string, parent: TransformNode, radius: number, height: number, mat: StandardMaterial, pos?: Vector3): Mesh {
    const m = MeshBuilder.CreateCapsule(name, { radius, height, tessellation: 14 }, this.scene);
    m.material = mat;
    m.parent = parent;
    if (pos) m.position.copyFrom(pos);
    return m;
  }

  private sphere(name: string, parent: TransformNode, diameter: number, mat: StandardMaterial, pos: Vector3): Mesh {
    const m = MeshBuilder.CreateSphere(name, { diameter, segments: 12 }, this.scene);
    m.material = mat;
    m.parent = parent;
    m.position.copyFrom(pos);
    return m;
  }

  public reset(playerZ: number) {
    this.distance = 3.5; // Starts right behind player
    this.targetDistance = 14.0;
    this.isClose = true;
    this.runPhase = 0;
    this.whistleTimer = 1.5;
    this.root.position.set(0, 0, playerZ - this.distance);
  }

  /**
   * Called when player stumbles on an obstacle.
   * Chaser surges right on the player's heels!
   */
  public triggerStumbleSurge() {
    this.distance = Math.min(this.distance, 2.3);
    this.targetDistance = 2.4;
    this.isClose = true;
    this.sound.playWhistle();
    this.whistleTimer = 2.0;
  }

  public update(dt: number, playerPos: Vector3, playerSpeed: number, playerStumbling: boolean) {
    // 1. Pursuit distance dynamics
    if (playerStumbling) {
      // Surged forward
      this.targetDistance = 2.3;
    } else {
      // Slowly pull away back to 14m if player is running cleanly
      this.targetDistance = Math.min(14.0, this.targetDistance + 1.2 * dt);
    }

    // Smoothly approach target distance
    const distRate = this.targetDistance < this.distance ? 12 : 1.8;
    this.distance += (this.targetDistance - this.distance) * Math.min(distRate * dt, 1.0);

    this.isClose = this.distance < 4.5;

    // 2. Position tracking (Z follows player at distance, X follows player with slight natural delay)
    this.root.position.z = playerPos.z - this.distance;
    const dx = playerPos.x - this.root.position.x;
    this.root.position.x += dx * Math.min(11 * dt, 1.0);
    this.root.rotation.z = -dx * 0.08;

    // Follow onto roof if close behind player
    const targetY = playerPos.y > 1.8 ? playerPos.y - 0.9 : 0;
    this.root.position.y += (targetY - this.root.position.y) * 8 * dt;

    // 3. Periodic whistle blowing when hot on player's tail
    if (this.isClose) {
      this.whistleTimer -= dt;
      if (this.whistleTimer <= 0) {
        this.sound.playWhistle();
        this.whistleTimer = 4.0 + Math.random() * 3.0;
      }
    }

    // 4. Running animation
    const cycleSpeed = (playerSpeed + (this.isClose ? 6 : 0)) * 0.44;
    this.runPhase += cycleSpeed * dt;
    const p = this.runPhase;
    const sin = Math.sin;
    const cos = Math.cos;

    // Pelvis bounce
    this.pelvis.position.y = 0.9 + sin(p * 2) * 0.03;

    // Spine aggressive lean
    this.spine.rotation.x = 0.22 + (this.isClose ? 0.15 : 0);

    // Legs
    this.leftThigh.rotation.x = sin(p) * 0.75;
    this.leftShin.rotation.x = Math.max(0, -sin(p - 0.6)) * 1.15;
    this.rightThigh.rotation.x = sin(p + Math.PI) * 0.75;
    this.rightShin.rotation.x = Math.max(0, -sin(p + Math.PI - 0.6)) * 1.15;

    // Arms: if close, right arm reaches forward to grab!
    if (this.isClose) {
      this.rightUpperArm.rotation.x = 1.1 + sin(p * 2) * 0.15; // Reaching out!
      this.rightForearm.rotation.x = -0.1;
      this.leftUpperArm.rotation.x = sin(p + Math.PI) * 0.6;
      this.leftForearm.rotation.x = -0.5;
    } else {
      this.leftUpperArm.rotation.x = sin(p + Math.PI) * 0.6;
      this.leftForearm.rotation.x = -0.5 - cos(p + Math.PI) * 0.35;
      this.rightUpperArm.rotation.x = sin(p) * 0.6;
      this.rightForearm.rotation.x = -0.5 - cos(p) * 0.35;
    }
  }

  /**
   * Arrest / capture animation when player is caught.
   */
  public poseArrest(playerPos: Vector3) {
    this.root.position.set(playerPos.x + 0.3, 0, playerPos.z - 0.6);
    this.root.rotation.y = -0.2;
    // Grabbing shoulders
    this.rightUpperArm.rotation.set(0.9, -0.4, 0);
    this.leftUpperArm.rotation.set(0.9, 0.4, 0);
    this.rightForearm.rotation.set(-0.2, 0, 0);
    this.leftForearm.rotation.set(-0.2, 0, 0);
  }

  public dispose() {
    this.root.dispose(false, true);
  }
}
