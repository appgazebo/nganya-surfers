import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Vector3,
  Mesh,
  PointLight
} from '@babylonjs/core';

export interface BodaTheme {
  name: string;
  tankColor: Color3;
  frameColor: Color3;
  accentColor: Color3;
  rimColor: Color3;
  hasDeliveryBox: boolean;
  boxColor?: Color3;
  isCyber?: boolean;
}

export const BODA_THEMES: Record<string, BodaTheme> = {
  STANDARD: {
    name: 'BOXER 150 CLASSIC',
    tankColor: new Color3(0.85, 0.1, 0.1), // Fire Red
    frameColor: new Color3(0.1, 0.1, 0.12), // Black
    accentColor: new Color3(0.85, 0.85, 0.9), // Chrome
    rimColor: new Color3(0.85, 0.85, 0.9), // Chrome spokes
    hasDeliveryBox: false
  },
  DELIVERY: {
    name: 'SAFARI DELIVERY RACER',
    tankColor: new Color3(0.95, 0.75, 0.05), // High-vis Yellow
    frameColor: new Color3(0.12, 0.14, 0.18),
    accentColor: new Color3(0.1, 0.7, 0.3),
    rimColor: new Color3(0.15, 0.15, 0.15),
    hasDeliveryBox: true,
    boxColor: new Color3(0.95, 0.45, 0.05) // Delivery Box
  },
  CYBER: {
    name: 'CYBER BODA ELECTRIC',
    tankColor: new Color3(0.02, 0.85, 0.95), // Neon Cyan
    frameColor: new Color3(0.05, 0.06, 0.1),
    accentColor: new Color3(1.0, 0.1, 0.65), // Neon Magenta
    rimColor: new Color3(0.02, 0.85, 0.95), // Glowing cyan rims
    hasDeliveryBox: true,
    boxColor: new Color3(0.08, 0.10, 0.18),
    isCyber: true
  }
};

/**
 * 3D Boda-Boda Motorbike model (Boxer 150 style).
 * Supports lean tilting, spinning spoke wheels, headlight beam, and customizable styles.
 */
export class BodaBoda {
  public root: TransformNode;
  private wheels: Mesh[] = [];
  private headlightMesh: Mesh;
  private tankMesh: Mesh;
  private frameMeshes: Mesh[] = [];
  private deliveryBox?: Mesh;

  // Materials
  private tankMat: StandardMaterial;
  private frameMat: StandardMaterial;
  private chromeMat: StandardMaterial;
  private tireMat: StandardMaterial;
  private rimMat: StandardMaterial;
  private boxMat: StandardMaterial;

  constructor(private scene: Scene) {
    this.root = new TransformNode('bodaRoot', scene);

    // Materials
    this.tankMat = new StandardMaterial('bodaTankMat', scene);
    this.frameMat = new StandardMaterial('bodaFrameMat', scene);
    this.chromeMat = new StandardMaterial('bodaChromeMat', scene);
    this.tireMat = new StandardMaterial('bodaTireMat', scene);
    this.rimMat = new StandardMaterial('bodaRimMat', scene);
    this.boxMat = new StandardMaterial('bodaBoxMat', scene);

    this.tankMat.diffuseColor = new Color3(0.85, 0.1, 0.1);
    this.frameMat.diffuseColor = new Color3(0.1, 0.1, 0.12);
    this.chromeMat.diffuseColor = new Color3(0.85, 0.85, 0.9);
    this.chromeMat.specularColor = new Color3(1, 1, 1);
    this.tireMat.diffuseColor = new Color3(0.06, 0.06, 0.07);
    this.rimMat.diffuseColor = new Color3(0.85, 0.85, 0.9);
    this.boxMat.diffuseColor = new Color3(0.95, 0.45, 0.05);

    // Build the 3D motorcycle
    const { tank, hl, wheels, frameParts, box } = this.buildMotorcycle();
    this.tankMesh = tank;
    this.headlightMesh = hl;
    this.wheels = wheels;
    this.frameMeshes = frameParts;
    this.deliveryBox = box;

    // Apply standard default style
    this.applyTheme('STANDARD');
    this.root.setEnabled(false);
  }

  private buildMotorcycle() {
    const root = this.root;
    const wheels: Mesh[] = [];
    const frameParts: Mesh[] = [];

    // 1. Main Tubular Frame Backbone
    const spine = MeshBuilder.CreateCapsule('bodaSpine', { radius: 0.045, height: 1.4 }, this.scene);
    spine.rotation.x = -0.35;
    spine.position.set(0, 0.65, 0.1);
    spine.parent = root;
    spine.material = this.frameMat;
    frameParts.push(spine);

    // Lower cradle frame
    const cradle = MeshBuilder.CreateCapsule('bodaCradle', { radius: 0.04, height: 1.2 }, this.scene);
    cradle.rotation.x = Math.PI / 2;
    cradle.position.set(0, 0.32, -0.05);
    cradle.parent = root;
    cradle.material = this.frameMat;
    frameParts.push(cradle);

    // 2. Engine Block (Single-cylinder 150cc Boxer engine with cooling fins)
    const engine = MeshBuilder.CreateBox('bodaEngine', { width: 0.32, height: 0.38, depth: 0.42 }, this.scene);
    engine.position.set(0, 0.44, 0.0);
    engine.parent = root;
    engine.material = this.chromeMat;
    frameParts.push(engine);

    // Cylinder head with cooling fins
    const cyl = MeshBuilder.CreateCylinder('bodaCyl', { height: 0.28, diameter: 0.22, tessellation: 12 }, this.scene);
    cyl.rotation.x = -0.4;
    cyl.position.set(0, 0.60, 0.12);
    cyl.parent = root;
    cyl.material = this.chromeMat;
    frameParts.push(cyl);

    // Chrome Exhaust Pipe & Muffler (Right side)
    const exhaust = MeshBuilder.CreateCylinder('bodaExhaust', { height: 1.3, diameterTop: 0.07, diameterBottom: 0.09 }, this.scene);
    exhaust.rotation.x = Math.PI / 2 - 0.1;
    exhaust.position.set(0.24, 0.32, -0.35);
    exhaust.parent = root;
    exhaust.material = this.chromeMat;
    frameParts.push(exhaust);

    // 3. Fuel Tank (Iconic tear-drop motorcycle tank)
    const tank = MeshBuilder.CreateSphere('bodaTank', { diameterX: 0.38, diameterY: 0.32, diameterZ: 0.68, segments: 14 }, this.scene);
    tank.position.set(0, 0.88, 0.28);
    tank.parent = root;
    tank.material = this.tankMat;

    // Tank chrome cap
    const tankCap = MeshBuilder.CreateCylinder('bodaTankCap', { height: 0.04, diameter: 0.08 }, this.scene);
    tankCap.position.set(0, 1.05, 0.34);
    tankCap.parent = root;
    tankCap.material = this.chromeMat;
    frameParts.push(tankCap);

    // 4. Motorcycle Seat (Dual long saddle)
    const seat = MeshBuilder.CreateBox('bodaSeat', { width: 0.30, height: 0.12, depth: 0.72 }, this.scene);
    seat.position.set(0, 0.82, -0.22);
    seat.parent = root;
    const seatMat = new StandardMaterial('bodaSeatMat', this.scene);
    seatMat.diffuseColor = new Color3(0.08, 0.08, 0.1);
    seat.material = seatMat;

    // 5. Handlebars & Controls
    const barCenter = MeshBuilder.CreateCapsule('bodaBar', { radius: 0.022, height: 0.78 }, this.scene);
    barCenter.rotation.z = Math.PI / 2;
    barCenter.position.set(0, 1.08, 0.58);
    barCenter.parent = root;
    barCenter.material = this.chromeMat;
    frameParts.push(barCenter);

    // Rubber Grips
    for (const side of [-0.36, 0.36]) {
      const grip = MeshBuilder.CreateCylinder(`bodaGrip_${side}`, { height: 0.12, diameter: 0.04 }, this.scene);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(side, 1.08, 0.58);
      grip.parent = root;
      grip.material = this.tireMat;
    }

    // Mirrors
    for (const side of [-0.34, 0.34]) {
      const stem = MeshBuilder.CreateCapsule(`mStem_${side}`, { radius: 0.012, height: 0.18 }, this.scene);
      stem.position.set(side, 1.18, 0.59);
      stem.rotation.z = side > 0 ? 0.25 : -0.25;
      stem.parent = root;
      stem.material = this.chromeMat;

      const mirror = MeshBuilder.CreateCylinder(`mirror_${side}`, { height: 0.02, diameter: 0.1 }, this.scene);
      mirror.position.set(side > 0 ? side + 0.04 : side - 0.04, 1.26, 0.59);
      mirror.rotation.x = Math.PI / 2;
      mirror.parent = root;
      mirror.material = this.chromeMat;
    }

    // 6. Round Front Headlight
    const hl = MeshBuilder.CreateCylinder('bodaHeadlight', { height: 0.14, diameter: 0.26, tessellation: 16 }, this.scene);
    hl.rotation.x = Math.PI / 2;
    hl.position.set(0, 0.96, 0.76);
    hl.parent = root;

    const hlMat = new StandardMaterial('bodaHlMat', this.scene);
    hlMat.diffuseColor = new Color3(1.0, 1.0, 0.9);
    hlMat.emissiveColor = new Color3(1.0, 0.95, 0.6);
    hl.material = hlMat;

    // 7. Front Fork & Mudguard
    for (const side of [-0.11, 0.11]) {
      const fork = MeshBuilder.CreateCylinder(`bodaFork_${side}`, { height: 0.75, diameter: 0.04 }, this.scene);
      fork.rotation.x = -0.32;
      fork.position.set(side, 0.65, 0.68);
      fork.parent = root;
      fork.material = this.chromeMat;
      frameParts.push(fork);
    }

    // Front Mudguard (curved fender)
    const fFender = MeshBuilder.CreateTorus('bodaFFender', { diameter: 0.72, thickness: 0.06, tessellation: 16 }, this.scene);
    fFender.rotation.z = Math.PI / 2;
    fFender.position.set(0, 0.40, 0.85);
    fFender.scaling.set(0.7, 0.7, 0.4);
    fFender.parent = root;
    fFender.material = this.tankMat;

    // 8. Wheels (Front & Rear Spoke Wheels)
    const frontWheel = this.buildWheel('front', new Vector3(0, 0.35, 0.82), root);
    const rearWheel = this.buildWheel('rear', new Vector3(0, 0.35, -0.68), root);
    wheels.push(frontWheel, rearWheel);

    // 9. Rear Luggage Rack & Delivery Box (Cleanly positioned behind the rider's seat)
    const rack = MeshBuilder.CreateBox('bodaRack', { width: 0.38, height: 0.05, depth: 0.45 }, this.scene);
    rack.position.set(0, 0.78, -0.68);
    rack.parent = root;
    rack.material = this.chromeMat;
    frameParts.push(rack);

    // Delivery cargo box (Safari / Courier style) - sits on rack behind the rider
    const box = MeshBuilder.CreateBox('bodaBox', { width: 0.44, height: 0.40, depth: 0.42 }, this.scene);
    box.position.set(0, 1.02, -0.74);
    box.parent = root;
    box.material = this.boxMat;
    box.setEnabled(false); // Enabled by theme

    // Footpegs
    for (const side of [-0.22, 0.22]) {
      const peg = MeshBuilder.CreateCylinder(`peg_${side}`, { height: 0.12, diameter: 0.035 }, this.scene);
      peg.rotation.z = Math.PI / 2;
      peg.position.set(side, 0.38, 0.05);
      peg.parent = root;
      peg.material = this.tireMat;
    }

    return { tank, hl, wheels, frameParts, box };
  }

  private buildWheel(name: string, pos: Vector3, parent: TransformNode): Mesh {
    const wheelGrp = new Mesh(`bodaWGrp_${name}`, this.scene);
    wheelGrp.position.copyFrom(pos);
    wheelGrp.parent = parent;

    // Rubber Tire
    const tire = MeshBuilder.CreateTorus(`bodaTire_${name}`, {
      diameter: 0.70,
      thickness: 0.13,
      tessellation: 20
    }, this.scene);
    tire.rotation.z = Math.PI / 2;
    tire.parent = wheelGrp;
    tire.material = this.tireMat;

    // Center Hub
    const hub = MeshBuilder.CreateCylinder(`bodaHub_${name}`, { height: 0.12, diameter: 0.14 }, this.scene);
    hub.rotation.z = Math.PI / 2;
    hub.parent = wheelGrp;
    hub.material = this.rimMat;

    // Spokes (4 crossed pairs)
    for (let s = 0; s < 4; s++) {
      const spoke = MeshBuilder.CreateBox(`spoke_${name}_${s}`, { width: 0.015, height: 0.58, depth: 0.015 }, this.scene);
      spoke.rotation.x = (s / 4) * Math.PI;
      spoke.parent = wheelGrp;
      spoke.material = this.rimMat;
    }

    return wheelGrp;
  }

  public applyTheme(themeKey: string) {
    const t = BODA_THEMES[themeKey] || BODA_THEMES.STANDARD;

    // Tank color
    this.tankMat.diffuseColor = t.tankColor;
    if (t.isCyber) {
      this.tankMat.emissiveColor = t.tankColor.scale(0.5);
    } else {
      this.tankMat.emissiveColor = new Color3(0, 0, 0);
    }

    // Frame
    this.frameMat.diffuseColor = t.frameColor;
    this.chromeMat.diffuseColor = t.accentColor;

    // Rims
    this.rimMat.diffuseColor = t.rimColor;
    if (t.isCyber) {
      this.rimMat.emissiveColor = t.rimColor.scale(0.6);
    } else {
      this.rimMat.emissiveColor = new Color3(0, 0, 0);
    }

    // Delivery Box
    if (this.deliveryBox) {
      this.deliveryBox.setEnabled(t.hasDeliveryBox);
      if (t.boxColor) {
        this.boxMat.diffuseColor = t.boxColor;
      }
    }
  }

  public update(dt: number, speed: number, laneTilt: number) {
    // 1. Wheel spin animation
    for (const w of this.wheels) {
      w.rotation.x += speed * 2.2 * dt;
    }

    // 2. Motorcycle dynamic lean when steering into lanes
    this.root.rotation.z += (laneTilt - this.root.rotation.z) * Math.min(18 * dt, 1.0);

    // 3. Engine vibration bounce (maintaining correct road-level position at y = -0.9)
    this.root.position.y = -0.9 + Math.sin(Date.now() * 0.02) * 0.015;
  }

  public dispose() {
    this.root.dispose(false, true);
  }
}
