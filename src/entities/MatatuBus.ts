import {
  Scene,
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  Vector3,
  Mesh,
  DynamicTexture,
  PointLight,
  Texture
} from '@babylonjs/core';

export interface MatatuTheme {
  name: string;
  bodyColor: Color3;
  roofColor: Color3;
  accentColor: Color3;
  stripeColor: Color3;
  underglowColor: Color3;
  sloganFront: string;
}

const MATATU_THEMES: MatatuTheme[] = [
  {
    name: 'RONGAI BEAST',
    bodyColor: new Color3(0.82, 0.04, 0.15),
    roofColor: new Color3(0.65, 0.03, 0.1),
    accentColor: new Color3(1.0, 0.85, 0.0),
    stripeColor: new Color3(1.0, 0.9, 0.0),
    underglowColor: new Color3(1.0, 0.15, 0.1),
    sloganFront: 'RONGAI BEAST'
  },
  {
    name: 'KAYOLE 1960',
    bodyColor: new Color3(0.04, 0.06, 0.1),
    roofColor: new Color3(0.03, 0.04, 0.08),
    accentColor: new Color3(0.1, 0.95, 0.4),
    stripeColor: new Color3(0.0, 1.0, 0.35),
    underglowColor: new Color3(0.0, 1.0, 0.4),
    sloganFront: 'KAYOLE 1960'
  },
  {
    name: 'SUPER METRO',
    bodyColor: new Color3(0.06, 0.32, 0.92),
    roofColor: new Color3(0.04, 0.22, 0.72),
    accentColor: new Color3(0.95, 0.95, 0.95),
    stripeColor: new Color3(1.0, 0.2, 0.1),
    underglowColor: new Color3(0.2, 0.55, 1.0),
    sloganFront: 'SUPER METRO'
  },
  {
    name: 'EASTLANDS PHANTOM',
    bodyColor: new Color3(0.42, 0.04, 0.62),
    roofColor: new Color3(0.30, 0.02, 0.45),
    accentColor: new Color3(1.0, 0.2, 0.7),
    stripeColor: new Color3(1.0, 0.0, 0.6),
    underglowColor: new Color3(0.9, 0.1, 0.8),
    sloganFront: 'EASTLANDS PHANTOM'
  },
  {
    name: 'BURU CYBERPUNK',
    bodyColor: new Color3(0.0, 0.65, 0.78),
    roofColor: new Color3(0.0, 0.50, 0.60),
    accentColor: new Color3(1.0, 0.45, 0.0),
    stripeColor: new Color3(1.0, 0.5, 0.0),
    underglowColor: new Color3(0.0, 0.85, 1.0),
    sloganFront: 'BURU CYBERPUNK'
  },
  {
    name: 'GITHURAI 45',
    bodyColor: new Color3(0.1, 0.1, 0.1),
    roofColor: new Color3(0.06, 0.06, 0.06),
    accentColor: new Color3(1.0, 0.0, 0.0),
    stripeColor: new Color3(0.9, 0.0, 0.0),
    underglowColor: new Color3(1.0, 0.0, 0.0),
    sloganFront: 'GITHURAI 45'
  }
];

/**
 * Realistic Kenyan Matatu / Nganya 3D model.
 * Based on a Toyota HiAce / Nissan Caravan silhouette with full
 * custom modifications: bull bar, side skirts, rear spoiler,
 * roof speakers, LED strips, graffiti, chrome rims, and neon underglow.
 */
export class MatatuBus {
  public meshRoot: TransformNode;
  public exhaustMesh: Mesh;

  // References for theme changes
  private bodyParts: Mesh[] = [];
  private roofParts: Mesh[] = [];
  private accentParts: Mesh[] = [];
  private stripeParts: Mesh[] = [];
  private sideTextL: Mesh;
  private sideTextR: Mesh;
  private frontTextMesh: Mesh;
  private underglowPlane: Mesh;
  private wheels: Mesh[] = [];

  constructor(private scene: Scene, id: number) {
    this.meshRoot = new TransformNode(`matatuRoot_${id}`, scene);

    // === BODY SHELL ===
    // Main body (elongated minibus shape)
    const bodyMain = this.roundedBox(`body_${id}`, 2.2, 2.0, 5.8, 0.12);
    bodyMain.position.set(0, 1.35, 0);
    bodyMain.parent = this.meshRoot;
    this.bodyParts.push(bodyMain);

    // Roof (slightly wider, acts as the roof panel)
    const roof = MeshBuilder.CreateBox(`roof_${id}`, { width: 2.3, height: 0.1, depth: 5.6 }, scene);
    roof.position.set(0, 2.4, 0);
    roof.parent = this.meshRoot;
    this.roofParts.push(roof);

    // Roof edge trim (rounded lip)
    const roofTrim = MeshBuilder.CreateCapsule(`roofTrim_${id}`, { radius: 0.04, height: 5.6 }, scene);
    roofTrim.rotation.x = Math.PI / 2;
    roofTrim.position.set(0, 2.45, 0);
    roofTrim.parent = this.meshRoot;
    this.accentParts.push(roofTrim);

    // Roof rails (left + right)
    for (const side of [-1, 1]) {
      const rail = MeshBuilder.CreateCapsule(`roofRail_${id}_${side}`, { radius: 0.025, height: 4.8 }, scene);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(side * 1.05, 2.48, 0);
      rail.parent = this.meshRoot;
      this.accentParts.push(rail);
    }

    // === WINDSHIELD (FRONT) ===
    const windshield = this.roundedBox(`wind_${id}`, 2.0, 1.0, 0.08, 0.06);
    windshield.position.set(0, 1.8, -2.88);
    windshield.parent = this.meshRoot;
    const glassMat = new StandardMaterial(`glassMat_${id}`, scene);
    glassMat.diffuseColor = new Color3(0.04, 0.08, 0.14);
    glassMat.specularColor = new Color3(0.8, 0.85, 0.9);
    glassMat.alpha = 0.78;
    windshield.material = glassMat;

    // Windshield visor / sun strip (tinted band at top)
    const visor = MeshBuilder.CreateBox(`visor_${id}`, { width: 2.15, height: 0.2, depth: 0.1 }, scene);
    visor.position.set(0, 2.25, -2.87);
    visor.parent = this.meshRoot;
    const visorMat = new StandardMaterial(`visorMat_${id}`, scene);
    visorMat.diffuseColor = new Color3(0.02, 0.02, 0.04);
    visorMat.alpha = 0.88;
    visor.material = visorMat;

    // === REAR WINDOW ===
    const rearWin = this.roundedBox(`rearWin_${id}`, 1.9, 0.85, 0.06, 0.04);
    rearWin.position.set(0, 1.75, 2.88);
    rearWin.material = glassMat;
    rearWin.parent = this.meshRoot;

    // === SIDE WINDOWS (row of 4 on each side) ===
    for (const side of [-1, 1]) {
      for (let w = 0; w < 4; w++) {
        const sideWin = MeshBuilder.CreateBox(`sWin_${id}_${side}_${w}`, {
          width: 0.06, height: 0.65, depth: 1.1
        }, scene);
        sideWin.position.set(side * 1.12, 1.85, -1.6 + w * 1.25);
        sideWin.material = glassMat;
        sideWin.parent = this.meshRoot;
      }
    }

    // === FRONT FACE DETAILS ===
    // Grille
    const grille = MeshBuilder.CreateBox(`grille_${id}`, { width: 1.6, height: 0.55, depth: 0.08 }, scene);
    grille.position.set(0, 0.75, -2.92);
    grille.parent = this.meshRoot;
    const grilleMat = new StandardMaterial(`grilleMat_${id}`, scene);
    grilleMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
    grilleMat.specularColor = new Color3(0.5, 0.5, 0.5);
    grille.material = grilleMat;

    // Grille slats (horizontal chrome strips)
    for (let s = 0; s < 4; s++) {
      const slat = MeshBuilder.CreateBox(`slat_${id}_${s}`, { width: 1.5, height: 0.025, depth: 0.09 }, scene);
      slat.position.set(0, 0.58 + s * 0.13, -2.93);
      slat.parent = this.meshRoot;
      const slatMat = new StandardMaterial(`slatMat_${id}_${s}`, scene);
      slatMat.diffuseColor = new Color3(0.75, 0.78, 0.8);
      slatMat.specularColor = new Color3(0.9, 0.9, 0.9);
      slat.material = slatMat;
    }

    // === HEADLIGHTS (Projector style) ===
    for (const side of [-1, 1]) {
      // Housing
      const hlHousing = MeshBuilder.CreateCylinder(`hlHousing_${id}_${side}`, {
        height: 0.1, diameter: 0.38, tessellation: 16
      }, scene);
      hlHousing.rotation.x = Math.PI / 2;
      hlHousing.position.set(side * 0.75, 1.1, -2.94);
      hlHousing.parent = this.meshRoot;
      const hlMat = new StandardMaterial(`hlMat_${id}_${side}`, scene);
      hlMat.diffuseColor = new Color3(0.9, 0.9, 0.92);
      hlMat.specularColor = new Color3(1, 1, 1);
      hlHousing.material = hlMat;

      // Lens (bright emissive)
      const hlLens = MeshBuilder.CreateCylinder(`hlLens_${id}_${side}`, {
        height: 0.06, diameter: 0.28, tessellation: 16
      }, scene);
      hlLens.rotation.x = Math.PI / 2;
      hlLens.position.set(side * 0.75, 1.1, -2.97);
      hlLens.parent = this.meshRoot;
      const lensMat = new StandardMaterial(`lensMat_${id}_${side}`, scene);
      lensMat.diffuseColor = new Color3(1, 1, 0.9);
      lensMat.emissiveColor = new Color3(1.0, 0.95, 0.7);
      hlLens.material = lensMat;
    }

    // === TAIL LIGHTS ===
    for (const side of [-1, 1]) {
      const tail = MeshBuilder.CreateBox(`tail_${id}_${side}`, { width: 0.3, height: 0.5, depth: 0.06 }, scene);
      tail.position.set(side * 0.9, 1.0, 2.93);
      tail.parent = this.meshRoot;
      const tailMat = new StandardMaterial(`tailMat_${id}_${side}`, scene);
      tailMat.diffuseColor = new Color3(0.8, 0.02, 0.02);
      tailMat.emissiveColor = new Color3(0.6, 0.0, 0.0);
      tail.material = tailMat;
    }

    // === BULL BAR / FRONT BUMPER ===
    const bullBarMain = MeshBuilder.CreateCapsule(`bbMain_${id}`, { radius: 0.04, height: 2.3 }, scene);
    bullBarMain.rotation.z = Math.PI / 2;
    bullBarMain.position.set(0, 0.52, -3.08);
    bullBarMain.parent = this.meshRoot;
    const chromeMat = new StandardMaterial(`chrome_${id}`, scene);
    chromeMat.diffuseColor = new Color3(0.82, 0.84, 0.88);
    chromeMat.specularColor = new Color3(1, 1, 1);
    bullBarMain.material = chromeMat;

    // Bull bar vertical supports
    for (const side of [-0.85, -0.3, 0.3, 0.85]) {
      const vert = MeshBuilder.CreateCapsule(`bbVert_${id}_${side}`, { radius: 0.03, height: 0.6 }, scene);
      vert.position.set(side, 0.52, -3.06);
      vert.parent = this.meshRoot;
      vert.material = chromeMat;
    }

    // Bull bar lower rail
    const bbLower = MeshBuilder.CreateCapsule(`bbLower_${id}`, { radius: 0.035, height: 2.1 }, scene);
    bbLower.rotation.z = Math.PI / 2;
    bbLower.position.set(0, 0.28, -3.05);
    bbLower.parent = this.meshRoot;
    bbLower.material = chromeMat;

    // === SIDE SKIRTS ===
    for (const side of [-1, 1]) {
      const skirt = MeshBuilder.CreateBox(`skirt_${id}_${side}`, { width: 0.06, height: 0.25, depth: 5.2 }, scene);
      skirt.position.set(side * 1.13, 0.38, 0);
      skirt.parent = this.meshRoot;
      this.accentParts.push(skirt);
    }

    // === SIDE STRIPE / GRAPHIC BAND ===
    for (const side of [-1, 1]) {
      const stripe = MeshBuilder.CreateBox(`stripe_${id}_${side}`, { width: 0.065, height: 0.15, depth: 5.4 }, scene);
      stripe.position.set(side * 1.14, 1.15, 0);
      stripe.parent = this.meshRoot;
      this.stripeParts.push(stripe);
    }

    // === SIDE TEXT / GRAFFITI BANNER ===
    this.sideTextL = MeshBuilder.CreatePlane(`sTextL_${id}`, { width: 4.5, height: 0.8 }, scene);
    this.sideTextL.position.set(-1.16, 1.55, 0.2);
    this.sideTextL.rotation.y = -Math.PI / 2;
    this.sideTextL.parent = this.meshRoot;

    this.sideTextR = MeshBuilder.CreatePlane(`sTextR_${id}`, { width: 4.5, height: 0.8 }, scene);
    this.sideTextR.position.set(1.16, 1.55, 0.2);
    this.sideTextR.rotation.y = Math.PI / 2;
    this.sideTextR.parent = this.meshRoot;

    // Front route display
    this.frontTextMesh = MeshBuilder.CreatePlane(`fText_${id}`, { width: 1.8, height: 0.35 }, scene);
    this.frontTextMesh.position.set(0, 2.28, -2.88);
    this.frontTextMesh.parent = this.meshRoot;

    // === REAR SPOILER / WING ===
    const spoiler = MeshBuilder.CreateBox(`spoiler_${id}`, { width: 2.3, height: 0.08, depth: 0.55 }, scene);
    spoiler.position.set(0, 2.55, 2.6);
    spoiler.rotation.x = -0.15;
    spoiler.parent = this.meshRoot;
    this.accentParts.push(spoiler);

    // Spoiler supports
    for (const side of [-0.75, 0.75]) {
      const sup = MeshBuilder.CreateCapsule(`spoilerSup_${id}_${side}`, { radius: 0.025, height: 0.25 }, scene);
      sup.position.set(side, 2.48, 2.55);
      sup.parent = this.meshRoot;
      sup.material = chromeMat;
    }

    // === ROOF DJ SPEAKERS ===
    for (const xPos of [-0.55, 0.55]) {
      const spkBox = MeshBuilder.CreateCylinder(`spk_${id}_${xPos}`, {
        height: 0.5, diameter: 0.55, tessellation: 12
      }, scene);
      spkBox.position.set(xPos, 2.55, 1.0);
      spkBox.parent = this.meshRoot;
      const spkMat = new StandardMaterial(`spkMat_${id}_${xPos}`, scene);
      spkMat.diffuseColor = new Color3(0.08, 0.08, 0.08);
      spkBox.material = spkMat;

      // Speaker cone
      const cone = MeshBuilder.CreateCylinder(`cone_${id}_${xPos}`, {
        height: 0.06, diameterTop: 0.15, diameterBottom: 0.38, tessellation: 12
      }, scene);
      cone.position.set(xPos, 2.82, 1.0);
      cone.parent = this.meshRoot;
      const coneMat = new StandardMaterial(`coneMat_${id}_${xPos}`, scene);
      coneMat.diffuseColor = new Color3(0.2, 0.2, 0.22);
      cone.material = coneMat;
    }

    // === ANTENNA ===
    const antenna = MeshBuilder.CreateCapsule(`antenna_${id}`, { radius: 0.01, height: 1.2 }, scene);
    antenna.position.set(0.85, 3.0, -1.5);
    antenna.rotation.z = 0.15;
    antenna.parent = this.meshRoot;
    antenna.material = chromeMat;

    // === MIRRORS ===
    for (const side of [-1, 1]) {
      const mirrorArm = MeshBuilder.CreateCapsule(`mArm_${id}_${side}`, { radius: 0.02, height: 0.35 }, scene);
      mirrorArm.rotation.z = Math.PI / 2;
      mirrorArm.position.set(side * 1.25, 1.55, -2.4);
      mirrorArm.parent = this.meshRoot;
      mirrorArm.material = chromeMat;

      const mirrorHead = MeshBuilder.CreateCapsule(`mHead_${id}_${side}`, { radius: 0.06, height: 0.22 }, scene);
      mirrorHead.position.set(side * 1.42, 1.55, -2.4);
      mirrorHead.parent = this.meshRoot;
      mirrorHead.material = chromeMat;
    }

    // === WHEELS (4 wheels with rims and tire tread) ===
    const wheelPositions = [
      new Vector3(-1.05, 0.32, -1.75),
      new Vector3(1.05, 0.32, -1.75),
      new Vector3(-1.05, 0.32, 1.75),
      new Vector3(1.05, 0.32, 1.75)
    ];

    wheelPositions.forEach((pos, idx) => {
      this.buildWheel(id, idx, pos, chromeMat);
    });

    // === WHEEL ARCHES (fender flares) ===
    wheelPositions.forEach((pos, idx) => {
      const arch = MeshBuilder.CreateTorus(`arch_${id}_${idx}`, {
        diameter: 0.82, thickness: 0.08, tessellation: 20
      }, scene);
      arch.rotation.z = Math.PI / 2;
      arch.position.set(pos.x > 0 ? 1.12 : -1.12, pos.y + 0.08, pos.z);
      arch.scaling.set(1, 1, 0.5);
      arch.parent = this.meshRoot;
      this.bodyParts.push(arch);
    });

    // === NEON UNDERGLOW ===
    this.underglowPlane = MeshBuilder.CreatePlane(`ug_${id}`, { width: 2.0, height: 5.2 }, scene);
    this.underglowPlane.rotation.x = Math.PI / 2;
    this.underglowPlane.position.set(0, 0.08, 0);
    this.underglowPlane.parent = this.meshRoot;

    const ugMat = new StandardMaterial(`ugMat_${id}`, scene);
    ugMat.diffuseColor = new Color3(0, 0, 0);
    ugMat.emissiveColor = new Color3(1, 0, 1);
    ugMat.alpha = 0.75;
    this.underglowPlane.material = ugMat;

    // Side LED strips
    for (const side of [-1, 1]) {
      const ledStrip = MeshBuilder.CreateBox(`led_${id}_${side}`, { width: 0.04, height: 0.04, depth: 4.8 }, scene);
      ledStrip.position.set(side * 1.12, 0.28, 0);
      ledStrip.parent = this.meshRoot;
      const ledMat = new StandardMaterial(`ledMat_${id}_${side}`, scene);
      ledMat.emissiveColor = new Color3(1, 0, 1);
      ledMat.diffuseColor = new Color3(0, 0, 0);
      ledStrip.material = ledMat;
      this.stripeParts.push(ledStrip);
    }

    // === EXHAUST PIPE (Chimney / pipe tip for diesel smoke) ===
    this.exhaustMesh = MeshBuilder.CreateCylinder(`exPipe_${id}`, { height: 0.35, diameter: 0.12 }, scene);
    this.exhaustMesh.rotation.x = Math.PI / 2;
    this.exhaustMesh.position.set(0.95, 0.4, 2.85);
    this.exhaustMesh.parent = this.meshRoot;
    this.exhaustMesh.material = chromeMat;
  }

  private roundedBox(name: string, w: number, h: number, d: number, bevel: number): Mesh {
    // Approximate a rounded box by scaling a capsule or using a box (simple but effective)
    const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, this.scene);
    return m;
  }

  private buildWheel(busId: number, idx: number, pos: Vector3, chromeMat: StandardMaterial) {
    const wheelGroup = new TransformNode(`wheelGrp_${busId}_${idx}`, this.scene);
    wheelGroup.position.copyFrom(pos);
    wheelGroup.parent = this.meshRoot;

    // Tire (dark rubber torus)
    const tire = MeshBuilder.CreateTorus(`tire_${busId}_${idx}`, {
      diameter: 0.72, thickness: 0.22, tessellation: 24
    }, this.scene);
    tire.rotation.z = Math.PI / 2;
    tire.parent = wheelGroup;
    const tireMat = new StandardMaterial(`tireMat_${busId}_${idx}`, this.scene);
    tireMat.diffuseColor = new Color3(0.06, 0.06, 0.06);
    tire.material = tireMat;

    // Rim (chrome disc inside the tire)
    const rim = MeshBuilder.CreateCylinder(`rim_${busId}_${idx}`, {
      height: 0.14, diameter: 0.48, tessellation: 16
    }, this.scene);
    rim.rotation.z = Math.PI / 2;
    rim.parent = wheelGroup;
    rim.material = chromeMat;

    // Rim spokes (5 spokes)
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spoke = MeshBuilder.CreateCapsule(`spoke_${busId}_${idx}_${s}`, {
        radius: 0.015, height: 0.40
      }, this.scene);
      spoke.parent = wheelGroup;
      spoke.position.set(0, Math.sin(angle) * 0.18, Math.cos(angle) * 0.18);
      spoke.rotation.x = angle;
      spoke.material = chromeMat;
    }

    // Hub cap center
    const hub = MeshBuilder.CreateSphere(`hub_${busId}_${idx}`, { diameter: 0.1 }, this.scene);
    hub.parent = wheelGroup;
    hub.material = chromeMat;

    this.wheels.push(tire);
  }

  /**
   * Apply a random Matatu theme to this bus (colors, text, underglow).
   */
  public applyTheme(theme?: MatatuTheme) {
    const t = theme || MATATU_THEMES[Math.floor(Math.random() * MATATU_THEMES.length)];

    // Body color
    for (const part of this.bodyParts) {
      let mat = part.material as StandardMaterial;
      if (!mat) {
        mat = new StandardMaterial('auto', this.scene);
        part.material = mat;
      }
      mat.diffuseColor = t.bodyColor;
      mat.specularColor = new Color3(0.3, 0.3, 0.3);
    }

    // Roof
    for (const part of this.roofParts) {
      let mat = part.material as StandardMaterial;
      if (!mat) {
        mat = new StandardMaterial('auto', this.scene);
        part.material = mat;
      }
      mat.diffuseColor = t.roofColor;
    }

    // Accent parts (spoiler, skirts, rails)
    for (const part of this.accentParts) {
      let mat = part.material as StandardMaterial;
      if (!mat) {
        mat = new StandardMaterial('auto', this.scene);
        part.material = mat;
      }
      mat.diffuseColor = t.accentColor;
      mat.specularColor = new Color3(0.5, 0.5, 0.5);
    }

    // Stripe parts (side stripes, LED strips)
    for (const part of this.stripeParts) {
      const mat = part.material as StandardMaterial;
      if (mat) {
        mat.diffuseColor = t.stripeColor;
        mat.emissiveColor = t.stripeColor.scale(0.5);
      }
    }

    // Underglow
    const ugMat = this.underglowPlane.material as StandardMaterial;
    ugMat.emissiveColor = t.underglowColor;

    // Side graffiti text
    const createTextTex = (text: string, accent: Color3): StandardMaterial => {
      const tex = new DynamicTexture(`dt_${text}_${Math.random()}`, { width: 512, height: 128 }, this.scene);

      // Draw gradient-ish background
      const ctx = tex.getContext();
      const grd = ctx.createLinearGradient(0, 0, 512, 0);
      const bg = t.bodyColor;
      grd.addColorStop(0, `rgba(${bg.r * 255 | 0}, ${bg.g * 255 | 0}, ${bg.b * 255 | 0}, 0.9)`);
      grd.addColorStop(1, `rgba(${bg.r * 200 | 0}, ${bg.g * 200 | 0}, ${bg.b * 200 | 0}, 0.9)`);
      ctx.fillStyle = grd as unknown as string;
      ctx.fillRect(0, 0, 512, 128);

      tex.drawText(text, null, 85, 'bold 48px Bungee, Impact, sans-serif', '#ffffff', null, true);

      const mat = new StandardMaterial(`sTextMat_${text}`, this.scene);
      mat.diffuseTexture = tex;
      mat.emissiveColor = accent.scale(0.4);
      return mat;
    };

    this.sideTextL.material = createTextTex(t.name, t.accentColor);
    this.sideTextR.material = createTextTex(t.name, t.accentColor);

    // Front route display
    const frontTex = new DynamicTexture(`fdt_${t.sloganFront}`, { width: 256, height: 64 }, this.scene);
    frontTex.drawText(t.sloganFront, null, 42, 'bold 28px Bungee, Impact, sans-serif', '#ffffff', '#111111', true);
    const fMat = new StandardMaterial(`fTextMat`, this.scene);
    fMat.diffuseTexture = frontTex;
    fMat.emissiveColor = t.accentColor.scale(0.6);
    this.frontTextMesh.material = fMat;
  }

  /**
   * Spin wheels based on speed.
   */
  public animateWheels(dt: number, speed: number) {
    for (const wheel of this.wheels) {
      if (wheel.parent) {
        (wheel.parent as TransformNode).rotation.x += speed * dt * 0.7;
      }
    }
  }

  public dispose() {
    this.meshRoot.dispose(false, true);
  }
}
