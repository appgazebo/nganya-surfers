import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  Matrix
} from '@babylonjs/core';

/**
 * Realistic procedural 3D human character with full skeletal running animation.
 * Uses capsules, spheres, and smooth primitives — NO boxes.
 * Proper anatomical proportions (~7.5 heads tall) and joint hierarchy.
 */
export class HumanCharacter {
  public root: TransformNode;

  // Skeleton joints
  public pelvis: TransformNode;
  public spine: TransformNode;
  public chest: TransformNode;
  public neck: TransformNode;
  public headJoint: TransformNode;

  // Arms
  public leftUpperArm: TransformNode;
  public leftForearm: TransformNode;
  public rightUpperArm: TransformNode;
  public rightForearm: TransformNode;

  // Legs
  public leftThigh: TransformNode;
  public leftShin: TransformNode;
  public leftFoot: TransformNode;
  public rightThigh: TransformNode;
  public rightShin: TransformNode;
  public rightFoot: TransformNode;

  // Materials
  private skinMat: StandardMaterial;
  private shirtMat: StandardMaterial;
  private pantsMat: StandardMaterial;
  private shoeMat: StandardMaterial;
  private hairMat: StandardMaterial;
  private capMat: StandardMaterial;
  private backpackMat: StandardMaterial;
  private hpMat: StandardMaterial;
  private eyeWhiteMat: StandardMaterial;
  private eyePupilMat: StandardMaterial;

  private backpackNode!: TransformNode;

  private runPhase: number = 0;

  constructor(private scene: Scene) {
    this.root = new TransformNode('humanRoot', scene);

    // Create materials
    this.skinMat = this.makeMat('skin', new Color3(0.47, 0.3, 0.2));
    this.shirtMat = this.makeMat('shirt', new Color3(0.92, 0.15, 0.08));
    this.shirtMat.specularColor = new Color3(0.35, 0.1, 0.05);
    this.pantsMat = this.makeMat('pants', new Color3(0.1, 0.12, 0.2));
    this.shoeMat = this.makeMat('shoe', new Color3(0.95, 0.95, 0.97));
    this.shoeMat.specularColor = new Color3(0.6, 0.6, 0.6);
    this.hairMat = this.makeMat('hair', new Color3(0.04, 0.03, 0.03));
    this.capMat = this.makeMat('cap', new Color3(0.06, 0.42, 0.88));
    this.capMat.specularColor = new Color3(0.3, 0.3, 0.4);
    this.backpackMat = this.makeMat('backpack', new Color3(0.08, 0.08, 0.1));
    this.hpMat = this.makeMat('headphones', new Color3(0.12, 0.85, 0.35));
    this.hpMat.emissiveColor = new Color3(0.04, 0.25, 0.1);
    this.eyeWhiteMat = this.makeMat('eyeW', new Color3(0.95, 0.95, 0.95));
    this.eyePupilMat = this.makeMat('eyeP', new Color3(0.06, 0.04, 0.02));

    // Build skeleton hierarchy and meshes
    this.pelvis = this.joint('pelvis', this.root, 0, 0, 0);
    this.spine = this.joint('spine', this.pelvis, 0, 0.22, 0);
    this.chest = this.joint('chest', this.spine, 0, 0.28, 0);
    this.neck = this.joint('neck', this.chest, 0, 0.30, 0);
    this.headJoint = this.joint('head', this.neck, 0, 0.12, 0);

    // Arms (attached to chest)
    this.leftUpperArm = this.joint('lUpperArm', this.chest, -0.28, 0.24, 0);
    this.leftForearm = this.joint('lForearm', this.leftUpperArm, 0, -0.3, 0);
    this.rightUpperArm = this.joint('rUpperArm', this.chest, 0.28, 0.24, 0);
    this.rightForearm = this.joint('rForearm', this.rightUpperArm, 0, -0.3, 0);

    // Legs (attached to pelvis)
    this.leftThigh = this.joint('lThigh', this.pelvis, -0.12, -0.05, 0);
    this.leftShin = this.joint('lShin', this.leftThigh, 0, -0.42, 0);
    this.leftFoot = this.joint('lFoot', this.leftShin, 0, -0.42, 0.06);
    this.rightThigh = this.joint('rThigh', this.pelvis, 0.12, -0.05, 0);
    this.rightShin = this.joint('rShin', this.rightThigh, 0, -0.42, 0);
    this.rightFoot = this.joint('rFoot', this.rightShin, 0, -0.42, 0.06);

    this.buildMeshes();

    // Default forward lean
    this.spine.rotation.x = 0.12;
  }

  private makeMat(name: string, color: Color3): StandardMaterial {
    const m = new StandardMaterial(`hc_${name}`, this.scene);
    m.diffuseColor = color;
    m.specularColor = new Color3(0.12, 0.12, 0.12);
    return m;
  }

  private joint(name: string, parent: TransformNode, x: number, y: number, z: number): TransformNode {
    const j = new TransformNode(`j_${name}`, this.scene);
    j.position.set(x, y, z);
    j.parent = parent;
    return j;
  }

  private capsule(name: string, parent: TransformNode, radius: number, height: number, mat: StandardMaterial, pos?: Vector3): Mesh {
    const m = MeshBuilder.CreateCapsule(`hm_${name}`, {
      radius,
      height,
      tessellation: 16,
      subdivisions: 6,
      capSubdivisions: 6
    }, this.scene);
    m.material = mat;
    m.parent = parent;
    if (pos) m.position.copyFrom(pos);
    return m;
  }

  private sphere(name: string, parent: TransformNode, diameter: number, mat: StandardMaterial, pos: Vector3): Mesh {
    const m = MeshBuilder.CreateSphere(`hm_${name}`, { diameter, segments: 16 }, this.scene);
    m.material = mat;
    m.parent = parent;
    m.position.copyFrom(pos);
    return m;
  }

  private buildMeshes() {
    // ======== TORSO ========
    // Lower abdomen/pelvis area
    this.capsule('pelvisMesh', this.pelvis, 0.17, 0.32, this.shirtMat, new Vector3(0, 0.1, 0));

    // Spine/belly area
    this.capsule('spineMesh', this.spine, 0.19, 0.34, this.shirtMat, new Vector3(0, 0.12, 0));

    // Chest - wider, athletic build
    this.capsule('chestMesh', this.chest, 0.22, 0.36, this.shirtMat, new Vector3(0, 0.1, 0));

    // Shoulders (rounded spheres at top of chest for natural shoulder line)
    this.sphere('lShoulder', this.chest, 0.16, this.shirtMat, new Vector3(-0.24, 0.24, 0));
    this.sphere('rShoulder', this.chest, 0.16, this.shirtMat, new Vector3(0.24, 0.24, 0));

    // Collar / neckline cylinder
    const collarMesh = MeshBuilder.CreateCylinder('hm_collar', { height: 0.08, diameterTop: 0.14, diameterBottom: 0.18, tessellation: 16 }, this.scene);
    collarMesh.material = this.shirtMat;
    collarMesh.parent = this.neck;
    collarMesh.position.set(0, 0.02, 0);

    // ======== NECK ========
    this.capsule('neckMesh', this.neck, 0.07, 0.16, this.skinMat, new Vector3(0, 0.06, 0));

    // ======== HEAD ========
    // Main head - slightly elongated sphere
    const headMesh = MeshBuilder.CreateSphere('hm_head', { diameterX: 0.30, diameterY: 0.34, diameterZ: 0.30, segments: 20 }, this.scene);
    headMesh.material = this.skinMat;
    headMesh.parent = this.headJoint;
    headMesh.position.set(0, 0.17, 0);

    // Jaw / chin area (rounded)
    const jawMesh = MeshBuilder.CreateSphere('hm_jaw', { diameterX: 0.22, diameterY: 0.14, diameterZ: 0.18, segments: 14 }, this.scene);
    jawMesh.material = this.skinMat;
    jawMesh.parent = this.headJoint;
    jawMesh.position.set(0, 0.07, 0.02);

    // Ears
    this.sphere('lEar', this.headJoint, 0.06, this.skinMat, new Vector3(-0.15, 0.15, 0));
    this.sphere('rEar', this.headJoint, 0.06, this.skinMat, new Vector3(0.15, 0.15, 0));

    // Nose
    const noseMesh = MeshBuilder.CreateCylinder('hm_nose', { height: 0.08, diameterTop: 0.03, diameterBottom: 0.06, tessellation: 8 }, this.scene);
    noseMesh.material = this.skinMat;
    noseMesh.parent = this.headJoint;
    noseMesh.position.set(0, 0.14, 0.15);
    noseMesh.rotation.x = Math.PI / 2;

    // Eyes
    this.buildEye('left', -0.07, 0.19, 0.12);
    this.buildEye('right', 0.07, 0.19, 0.12);

    // Eyebrows (thin dark capsules)
    const lBrow = MeshBuilder.CreateCapsule('hm_lBrow', { radius: 0.012, height: 0.09 }, this.scene);
    lBrow.material = this.hairMat;
    lBrow.parent = this.headJoint;
    lBrow.position.set(-0.07, 0.23, 0.13);
    lBrow.rotation.z = Math.PI / 2;

    const rBrow = MeshBuilder.CreateCapsule('hm_rBrow', { radius: 0.012, height: 0.09 }, this.scene);
    rBrow.material = this.hairMat;
    rBrow.parent = this.headJoint;
    rBrow.position.set(0.07, 0.23, 0.13);
    rBrow.rotation.z = Math.PI / 2;

    // Mouth
    const mouthMesh = MeshBuilder.CreateCapsule('hm_mouth', { radius: 0.015, height: 0.08 }, this.scene);
    const mouthMat = this.makeMat('mouth', new Color3(0.35, 0.12, 0.1));
    mouthMesh.material = mouthMat;
    mouthMesh.parent = this.headJoint;
    mouthMesh.position.set(0, 0.08, 0.13);
    mouthMesh.rotation.z = Math.PI / 2;

    // ======== HAIR / CAP ========
    // Short textured hair on back/sides
    const hairBack = MeshBuilder.CreateSphere('hm_hairBack', { diameterX: 0.31, diameterY: 0.20, diameterZ: 0.31, segments: 12 }, this.scene);
    hairBack.material = this.hairMat;
    hairBack.parent = this.headJoint;
    hairBack.position.set(0, 0.24, -0.02);

    // Snapback cap
    const capTop = MeshBuilder.CreateCylinder('hm_capTop', {
      height: 0.12,
      diameterTop: 0.30,
      diameterBottom: 0.33,
      tessellation: 20
    }, this.scene);
    capTop.material = this.capMat;
    capTop.parent = this.headJoint;
    capTop.position.set(0, 0.33, 0.0);

    // Cap brim (flat disc facing forward)
    const capBrim = MeshBuilder.CreateCylinder('hm_capBrim', {
      height: 0.025,
      diameterTop: 0.34,
      diameterBottom: 0.34,
      tessellation: 20
    }, this.scene);
    capBrim.material = this.capMat;
    capBrim.parent = this.headJoint;
    capBrim.position.set(0, 0.28, 0.14);
    capBrim.rotation.x = -0.1;
    capBrim.scaling.set(0.75, 1, 1.3);

    // ======== HEADPHONES AROUND NECK ========
    const hp = MeshBuilder.CreateTorus('hm_hp', { diameter: 0.28, thickness: 0.04, tessellation: 24 }, this.scene);
    hp.material = this.hpMat;
    hp.parent = this.neck;
    hp.position.set(0, 0.0, 0.02);
    hp.rotation.x = 0.35;

    // Headphone ear cups
    this.sphere('hpCupL', this.neck, 0.07, this.hpMat, new Vector3(-0.14, -0.02, 0.02));
    this.sphere('hpCupR', this.neck, 0.07, this.hpMat, new Vector3(0.14, -0.02, 0.02));

    // ======== ARMS ========
    // Left arm
    this.capsule('lUpperArmMesh', this.leftUpperArm, 0.06, 0.32, this.shirtMat, new Vector3(0, -0.14, 0));
    this.capsule('lForearmMesh', this.leftForearm, 0.055, 0.30, this.skinMat, new Vector3(0, -0.13, 0));
    // Left hand
    this.sphere('lHand', this.leftForearm, 0.08, this.skinMat, new Vector3(0, -0.28, 0));
    // Fingers (3 small capsules fanned)
    for (let f = -1; f <= 1; f++) {
      this.capsule(`lFinger${f}`, this.leftForearm, 0.015, 0.06, this.skinMat, new Vector3(f * 0.02, -0.33, 0));
    }

    // Right arm
    this.capsule('rUpperArmMesh', this.rightUpperArm, 0.06, 0.32, this.shirtMat, new Vector3(0, -0.14, 0));
    this.capsule('rForearmMesh', this.rightForearm, 0.055, 0.30, this.skinMat, new Vector3(0, -0.13, 0));
    // Right hand
    this.sphere('rHand', this.rightForearm, 0.08, this.skinMat, new Vector3(0, -0.28, 0));
    for (let f = -1; f <= 1; f++) {
      this.capsule(`rFinger${f}`, this.rightForearm, 0.015, 0.06, this.skinMat, new Vector3(f * 0.02, -0.33, 0));
    }

    // ======== LEGS ========
    // Left leg
    this.capsule('lThighMesh', this.leftThigh, 0.085, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));
    this.capsule('lShinMesh', this.leftShin, 0.065, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));

    // Left shoe / sneaker
    this.buildShoe('left', this.leftFoot);

    // Right leg
    this.capsule('rThighMesh', this.rightThigh, 0.085, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));
    this.capsule('rShinMesh', this.rightShin, 0.065, 0.44, this.pantsMat, new Vector3(0, -0.20, 0));

    // Right shoe
    this.buildShoe('right', this.rightFoot);

    // ======== BACKPACK ========
    this.backpackNode = new TransformNode('hm_bpNode', this.scene);
    this.backpackNode.parent = this.chest;

    const bpBody = MeshBuilder.CreateCapsule('hm_bpBody', { radius: 0.14, height: 0.42, tessellation: 12 }, this.scene);
    bpBody.material = this.backpackMat;
    bpBody.parent = this.backpackNode;
    bpBody.position.set(0, 0.08, -0.26);

    // Backpack straps (two thin capsules over shoulders)
    const strapMat = this.makeMat('strap', new Color3(0.12, 0.12, 0.15));
    const lStrap = MeshBuilder.CreateCapsule('hm_lStrap', { radius: 0.018, height: 0.40 }, this.scene);
    lStrap.material = strapMat;
    lStrap.parent = this.backpackNode;
    lStrap.position.set(-0.10, 0.15, -0.10);
    lStrap.rotation.x = 0.15;

    const rStrap = MeshBuilder.CreateCapsule('hm_rStrap', { radius: 0.018, height: 0.40 }, this.scene);
    rStrap.material = strapMat;
    rStrap.parent = this.backpackNode;
    rStrap.position.set(0.10, 0.15, -0.10);
    rStrap.rotation.x = 0.15;

    // Backpack pocket (small front pouch)
    const bpPocket = MeshBuilder.CreateSphere('hm_bpPocket', { diameterX: 0.18, diameterY: 0.12, diameterZ: 0.08, segments: 8 }, this.scene);
    bpPocket.material = this.backpackMat;
    bpPocket.parent = this.backpackNode;
    bpPocket.position.set(0, -0.04, -0.32);
  }

  private buildEye(side: string, x: number, y: number, z: number) {
    // White of eye
    const eyeWhite = MeshBuilder.CreateSphere(`hm_${side}EyeW`, { diameterX: 0.055, diameterY: 0.045, diameterZ: 0.03, segments: 10 }, this.scene);
    eyeWhite.material = this.eyeWhiteMat;
    eyeWhite.parent = this.headJoint;
    eyeWhite.position.set(x, y, z);

    // Pupil / iris
    const pupil = MeshBuilder.CreateSphere(`hm_${side}Pupil`, { diameter: 0.025, segments: 8 }, this.scene);
    pupil.material = this.eyePupilMat;
    pupil.parent = this.headJoint;
    pupil.position.set(x, y, z + 0.015);
  }

  private buildShoe(side: string, footJoint: TransformNode) {
    // Sneaker sole
    const sole = MeshBuilder.CreateCapsule(`hm_${side}Sole`, {
      radius: 0.055,
      height: 0.26
    }, this.scene);
    sole.material = this.shoeMat;
    sole.parent = footJoint;
    sole.position.set(0, -0.03, 0.04);
    sole.rotation.x = Math.PI / 2;
    sole.scaling.set(1.1, 1, 0.65);

    // Shoe upper
    const upper = MeshBuilder.CreateCapsule(`hm_${side}Upper`, {
      radius: 0.05,
      height: 0.22
    }, this.scene);
    upper.material = this.shoeMat;
    upper.parent = footJoint;
    upper.position.set(0, 0.01, 0.02);
    upper.rotation.x = Math.PI / 2;
    upper.scaling.set(1.0, 0.9, 0.7);

    // Shoe accent stripe
    const accentMat = this.makeMat(`${side}ShoeAccent`, new Color3(0.9, 0.15, 0.1));
    const stripe = MeshBuilder.CreateCapsule(`hm_${side}Stripe`, { radius: 0.012, height: 0.16 }, this.scene);
    stripe.material = accentMat;
    stripe.parent = footJoint;
    stripe.position.set(side === 'left' ? -0.055 : 0.055, 0.01, 0.03);
    stripe.rotation.x = Math.PI / 2;

    // Shoe sole bottom (darker)
    const soleBotMat = this.makeMat(`${side}SoleBot`, new Color3(0.2, 0.2, 0.22));
    const soleBottom = MeshBuilder.CreateCapsule(`hm_${side}SoleBot`, { radius: 0.058, height: 0.25 }, this.scene);
    soleBottom.material = soleBotMat;
    soleBottom.parent = footJoint;
    soleBottom.position.set(0, -0.05, 0.04);
    soleBottom.rotation.x = Math.PI / 2;
    soleBottom.scaling.set(1.1, 1, 0.4);
  }

  /**
   * Full biomechanical running cycle animation.
   * Call every frame with dt and current forward speed.
   */
  public animateRun(dt: number, speed: number) {
    const cycleSpeed = speed * 0.42;
    this.runPhase += cycleSpeed * dt;

    const p = this.runPhase;
    const sin = Math.sin;
    const cos = Math.cos;

    // Pelvis vertical bob (double frequency)
    this.pelvis.position.y = sin(p * 2) * 0.025 + 0.01;

    // Pelvis slight lateral sway
    this.pelvis.rotation.z = sin(p) * 0.03;

    // Spine forward lean with slight twist
    this.spine.rotation.x = 0.14 + sin(p * 2) * 0.02;
    this.spine.rotation.y = sin(p) * 0.04;

    // Head stabilization (counters body motion)
    this.headJoint.rotation.x = -sin(p * 2) * 0.015;
    this.headJoint.rotation.z = -sin(p) * 0.02;

    // === LEFT LEG ===
    // Thigh: swings forward (+x rotation) and back
    this.leftThigh.rotation.x = sin(p) * 0.7;
    // Shin: bends backward when leg is behind body
    const leftKnee = Math.max(0, -sin(p - 0.6)) * 1.1;
    this.leftShin.rotation.x = leftKnee;
    // Foot: plantarflexion/dorsiflexion
    this.leftFoot.rotation.x = sin(p + 0.5) * 0.3 - 0.1;

    // === RIGHT LEG (opposite phase) ===
    this.rightThigh.rotation.x = sin(p + Math.PI) * 0.7;
    const rightKnee = Math.max(0, -sin(p + Math.PI - 0.6)) * 1.1;
    this.rightShin.rotation.x = rightKnee;
    this.rightFoot.rotation.x = sin(p + Math.PI + 0.5) * 0.3 - 0.1;

    // === LEFT ARM (opposite to left leg, same as right leg) ===
    this.leftUpperArm.rotation.x = sin(p + Math.PI) * 0.55;
    this.leftForearm.rotation.x = -0.45 - cos(p + Math.PI) * 0.35;

    // === RIGHT ARM (opposite to right leg) ===
    this.rightUpperArm.rotation.x = sin(p) * 0.55;
    this.rightForearm.rotation.x = -0.45 - cos(p) * 0.35;
  }

  public setBackpackVisible(visible: boolean) {
    this.backpackNode.setEnabled(visible);
  }

  /**
   * Reset to idle pose
   */
  public resetPose() {
    this.runPhase = 0;
    this.pelvis.position.set(0, 0, 0);
    this.pelvis.rotation.set(0, 0, 0);
    this.spine.rotation.set(0.12, 0, 0);
    this.chest.rotation.set(0, 0, 0);
    this.headJoint.rotation.set(0, 0, 0);
    this.leftThigh.rotation.set(0, 0, 0);
    this.leftShin.rotation.set(0, 0, 0);
    this.leftFoot.rotation.set(0, 0, 0);
    this.rightThigh.rotation.set(0, 0, 0);
    this.rightShin.rotation.set(0, 0, 0);
    this.rightFoot.rotation.set(0, 0, 0);
    this.leftUpperArm.rotation.set(0, 0, 0);
    this.leftForearm.rotation.set(-0.3, 0, 0);
    this.rightUpperArm.rotation.set(0, 0, 0);
    this.rightForearm.rotation.set(-0.3, 0, 0);
    this.setBackpackVisible(true);
  }

  /**
   * Slide pose — crouch low, legs folded, arms forward.
   * @param t 0 = idle, 1 = full slide
   */
  public poseSlide(t: number) {
    const lerp = (a: number, b: number) => a + (b - a) * t;

    this.spine.rotation.x = lerp(0.14, 0.75);
    this.leftThigh.rotation.x = lerp(0, -1.4);
    this.rightThigh.rotation.x = lerp(0, -1.4);
    this.leftShin.rotation.x = lerp(0, 1.5);
    this.rightShin.rotation.x = lerp(0, 1.5);
    this.leftUpperArm.rotation.x = lerp(0, -0.6);
    this.rightUpperArm.rotation.x = lerp(0, -0.6);
    this.leftForearm.rotation.x = lerp(-0.3, -1.0);
    this.rightForearm.rotation.x = lerp(-0.3, -1.0);
  }

  /**
   * Jump pose — legs tucked, arms up.
   * @param t 0 = idle, 1 = full jump
   */
  public poseJump(t: number) {
    const lerp = (a: number, b: number) => a + (b - a) * t;

    this.spine.rotation.x = lerp(0.14, 0.06);
    this.leftThigh.rotation.x = lerp(0, -0.5);
    this.rightThigh.rotation.x = lerp(0, 0.3);
    this.leftShin.rotation.x = lerp(0, 0.8);
    this.rightShin.rotation.x = lerp(0, 0.4);
    this.leftUpperArm.rotation.x = lerp(0, 0.7);
    this.rightUpperArm.rotation.x = lerp(0, 0.7);
    this.leftForearm.rotation.x = lerp(-0.3, -1.2);
    this.rightForearm.rotation.x = lerp(-0.3, -1.2);
  }

  /**
   * Authentic Boda-Boda motorbike riding pose:
   * Pelvis seated directly on the saddle, torso leaning forward over the fuel tank,
   * hands gripping the handlebar grips, and feet planted on the footpegs!
   */
  public poseRideBoda(t: number = 1.0) {
    // 1. Lower pelvis onto motorcycle seat at z = -0.10, y = -0.08
    this.pelvis.position.set(0, -0.08, -0.10);
    this.pelvis.rotation.set(0, 0, 0);

    // 2. Torso forward lean over the fuel tank
    this.spine.rotation.set(0.38, 0, 0);
    this.chest.rotation.set(0.12, 0, 0);
    this.headJoint.rotation.set(-0.25, 0, 0); // Head tilted up looking forward down the road

    // 3. Arms reaching forward directly to the handlebar grips
    this.leftUpperArm.rotation.set(0.70, 0.14, -0.06);
    this.leftForearm.rotation.set(-0.40, 0, 0);
    this.rightUpperArm.rotation.set(0.70, -0.14, 0.06);
    this.rightForearm.rotation.set(-0.40, 0, 0);

    // 4. Legs straddling the tank and bent onto footpegs
    this.leftThigh.rotation.set(-0.68, -0.28, 0.16);
    this.leftShin.rotation.set(1.22, 0.08, 0);
    this.leftFoot.rotation.set(-0.35, 0, 0);

    this.rightThigh.rotation.set(-0.68, 0.28, -0.16);
    this.rightShin.rotation.set(1.22, -0.08, 0);
    this.rightFoot.rotation.set(-0.35, 0, 0);
  }

  /** Ragdoll / crash tumble pose */
  public poseCrash() {
    this.spine.rotation.x = 1.2;
    this.spine.rotation.z = 0.4;
    this.leftThigh.rotation.x = -0.5;
    this.rightThigh.rotation.x = 0.6;
    this.leftShin.rotation.x = 1.2;
    this.rightShin.rotation.x = 0.8;
    this.leftUpperArm.rotation.x = -1.0;
    this.leftUpperArm.rotation.z = 0.8;
    this.rightUpperArm.rotation.x = 0.5;
    this.rightUpperArm.rotation.z = -0.6;
    this.leftForearm.rotation.x = -1.3;
    this.rightForearm.rotation.x = -0.9;
  }

  /**
   * Apply character outfit / skin customization.
   */
  public applySkin(skinId: string) {
    if (skinId === 'MAKANGA') {
      // Makanga VIP uniform
      this.shirtMat.diffuseColor = new Color3(0.55, 0.36, 0.18); // Corduroy brown
      this.shirtMat.emissiveColor = new Color3(0, 0, 0);
      this.capMat.diffuseColor = new Color3(0.18, 0.18, 0.20); // Dark grey cap
      this.pantsMat.diffuseColor = new Color3(0.38, 0.34, 0.24); // Khaki trousers
      this.hpMat.diffuseColor = new Color3(0.95, 0.65, 0.1); // Gold lanyard
      this.hpMat.emissiveColor = new Color3(0.15, 0.1, 0.0);
      this.backpackMat.diffuseColor = new Color3(0.42, 0.26, 0.14); // Leather coin pouch
    } else if (skinId === 'CYBERPUNK') {
      // Cyber Matwana skin
      this.shirtMat.diffuseColor = new Color3(0.02, 0.85, 0.95); // Cyber neon cyan
      this.shirtMat.emissiveColor = new Color3(0.01, 0.35, 0.45);
      this.capMat.diffuseColor = new Color3(0.06, 0.06, 0.12);
      this.pantsMat.diffuseColor = new Color3(0.08, 0.08, 0.14);
      this.hpMat.diffuseColor = new Color3(1.0, 0.1, 0.65); // Hot magenta
      this.hpMat.emissiveColor = new Color3(0.5, 0.05, 0.3);
      this.backpackMat.diffuseColor = new Color3(0.12, 0.18, 0.25);
    } else {
      // Default Street Runner
      this.shirtMat.diffuseColor = new Color3(0.92, 0.15, 0.08); // Red hoodie
      this.shirtMat.emissiveColor = new Color3(0, 0, 0);
      this.capMat.diffuseColor = new Color3(0.06, 0.42, 0.88); // Blue snapback
      this.pantsMat.diffuseColor = new Color3(0.1, 0.12, 0.2); // Denim
      this.hpMat.diffuseColor = new Color3(0.12, 0.85, 0.35); // Neon green
      this.hpMat.emissiveColor = new Color3(0.04, 0.25, 0.1);
      this.backpackMat.diffuseColor = new Color3(0.08, 0.08, 0.1);
    }
  }

  public dispose() {
    this.root.dispose(false, true);
  }
}
