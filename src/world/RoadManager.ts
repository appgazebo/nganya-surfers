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
import { LANE_WIDTH } from '../entities/Player';
import { BillboardRenderer, BillboardBrand } from './BillboardRenderer';

const BILLBOARD_ADS = [
  'MATWANA CULTURE',
  'RONGAI BASS EXPRESS',
  'KAYOLE 1960 SOUND',
  'M-PESA: TUMA PESA',
  'CHOMA ZONE BBQ',
  'EASTLANDS PRIDE',
  'SAFARICOM 5G'
];

const KIBANDA_NAMES = [
  'SMOKIE & MAYAI PASUA',
  'M-PESA & AIRTIME',
  'CHIPS MAFUTA SPECIAL',
  'FRUIT PARADISE',
  'MAMA MBOGA CORNER'
];

export class RoadManager {
  private chunks: TransformNode[] = [];
  private chunkLength: number = 40;
  private totalChunks: number = 8;

  // Materials to dynamically tweak with day/night cycle
  private lampMaterials: StandardMaterial[] = [];
  private windowMaterials: StandardMaterial[] = [];
  private billboardMaterials: StandardMaterial[] = [];
  private spotlightMaterials: StandardMaterial[] = [];

  constructor(private scene: Scene) {
    this.createRoadSegments();
  }

  private createRoadSegments() {
    for (let i = 0; i < this.totalChunks; i++) {
      const chunk = new TransformNode(`roadChunk_${i}`, this.scene);
      chunk.position.z = i * this.chunkLength;

      // 1. Asphalt Highway Surface
      const road = MeshBuilder.CreateBox(`asphalt_${i}`, {
        width: 12.0,
        height: 0.2,
        depth: this.chunkLength
      }, this.scene);
      road.position.y = -0.1;
      road.parent = chunk;

      const roadMat = new StandardMaterial(`roadMat_${i}`, this.scene);
      roadMat.diffuseColor = new Color3(0.12, 0.13, 0.15);
      roadMat.specularColor = new Color3(0.1, 0.1, 0.1);
      road.material = roadMat;

      // 2. Road Lane Dividers (Dashed stripes between 3 lanes)
      const dividerPositions = [-LANE_WIDTH / 2, LANE_WIDTH / 2];
      dividerPositions.forEach((xPos, idx) => {
        for (let d = -this.chunkLength / 2 + 3; d < this.chunkLength / 2; d += 6) {
          const dash = MeshBuilder.CreateBox(`dash_${i}_${idx}_${d}`, {
            width: 0.18,
            height: 0.22,
            depth: 3.0
          }, this.scene);
          dash.position.set(xPos, -0.08, d);
          dash.parent = chunk;

          const dashMat = new StandardMaterial(`dashMat_${i}`, this.scene);
          dashMat.diffuseColor = new Color3(0.9, 0.9, 0.9);
          dashMat.emissiveColor = new Color3(0.3, 0.3, 0.3);
          dash.material = dashMat;
        }
      });

      // 3. Sidewalks & Curbs
      [-6.5, 6.5].forEach((xSide, idx) => {
        const curb = MeshBuilder.CreateBox(`curb_${i}_${idx}`, {
          width: 2.2,
          height: 0.5,
          depth: this.chunkLength
        }, this.scene);
        curb.position.set(xSide, 0.05, 0);
        curb.parent = chunk;

        const curbMat = new StandardMaterial(`curbMat_${i}_${idx}`, this.scene);
        curbMat.diffuseColor = new Color3(0.28, 0.28, 0.3);
        curb.material = curbMat;
      });

      // 4. Street Lamps (Alternating sides)
      const lampSide = i % 2 === 0 ? -7.2 : 7.2;
      const pole = MeshBuilder.CreateCylinder(`lampPole_${i}`, { height: 7.5, diameter: 0.2 }, this.scene);
      pole.position.set(lampSide, 3.75, 0);
      pole.parent = chunk;

      const lampHead = MeshBuilder.CreateBox(`lampHead_${i}`, { width: 0.4, height: 0.2, depth: 0.8 }, this.scene);
      lampHead.position.set(lampSide + (lampSide > 0 ? -0.8 : 0.8), 7.4, 0);
      lampHead.parent = chunk;

      const lampMat = new StandardMaterial(`lampMat_${i}`, this.scene);
      lampMat.diffuseColor = new Color3(1.0, 0.9, 0.6);
      lampMat.emissiveColor = new Color3(1.0, 0.85, 0.4);
      lampHead.material = lampMat;
      this.lampMaterials.push(lampMat);

      // 5. Expressway Flyover Pillars (Concrete pillars along road edge)
      if (i % 2 === 0) {
        const pillar = MeshBuilder.CreateCylinder(`expPillar_${i}`, { height: 11, diameter: 1.4, tessellation: 16 }, this.scene);
        pillar.position.set(lampSide > 0 ? 8.8 : -8.8, 5.5, 10);
        pillar.parent = chunk;

        const pMat = new StandardMaterial(`pillarMat_${i}`, this.scene);
        pMat.diffuseColor = new Color3(0.42, 0.44, 0.46);
        pillar.material = pMat;

        // Crossbeam header at top
        const beam = MeshBuilder.CreateBox(`expBeam_${i}`, { width: 4.5, height: 1.2, depth: 2.5 }, this.scene);
        beam.position.set(lampSide > 0 ? 9.5 : -9.5, 11, 10);
        beam.parent = chunk;
        beam.material = pMat;
      }

      // 6. Roadside Kibanda (Street Kiosks) on sidewalks
      if (i % 3 === 1) {
        this.buildKibanda(chunk, i, lampSide > 0 ? -9.2 : 9.2);
      }

      // 7. Stacked Tire Barriers along road shoulder
      if (i % 2 === 1) {
        this.buildTireStack(chunk, i, lampSide > 0 ? -6.8 : 6.8);
      }

      // 8. Highway Billboards with Real Kenyan Brand Advertisements (Safaricom, Naivas, M-Pesa, etc.)
      if (i % 2 === 1) {
        const bbSide = lampSide > 0 ? -9.8 : 9.8;
        this.buildBillboard(chunk, i, bbSide);
      }

      this.chunks.push(chunk);
    }
  }

  private buildBillboard(chunk: TransformNode, id: number, xPos: number) {
    const brands: BillboardBrand[] = ['SAFARICOM', 'NAIVAS', 'MPESA', 'EQUITY', 'MATWANA'];
    const brand = brands[Math.floor(id / 2) % brands.length];

    const bbRoot = new TransformNode(`billboard_${brand}_${id}`, this.scene);
    bbRoot.parent = chunk;

    const isRightSide = xPos > 0;
    // Inward angle (~20 degrees) facing oncoming traffic approaching from -Z
    const bbAngle = isRightSide ? -0.35 : 0.35;

    // 1. Structural Backing Frame (Dark industrial gunmetal)
    const frame = MeshBuilder.CreateBox(`bbFrame_${id}`, { width: 8.8, height: 4.4, depth: 0.25 }, this.scene);
    frame.position.set(xPos, 5.4, 0);
    frame.rotation.y = bbAngle;
    frame.parent = bbRoot;

    const frameMat = new StandardMaterial(`bbFrameMat_${id}`, this.scene);
    frameMat.diffuseColor = new Color3(0.12, 0.14, 0.18);
    frameMat.specularColor = new Color3(0.3, 0.3, 0.3);
    frame.material = frameMat;

    // 2. High-Res Advertising Poster Face (Directly facing oncoming runner!)
    const adFace = MeshBuilder.CreatePlane(`bbFace_${id}`, { width: 8.6, height: 4.2 }, this.scene);
    // Positioned slightly in front of the frame along its rotated normal (-Z)
    const offsetZ = -0.15 * Math.cos(bbAngle);
    const offsetX = -0.15 * Math.sin(bbAngle);
    adFace.position.set(xPos + offsetX, 5.4, offsetZ);
    adFace.rotation.y = bbAngle;
    adFace.parent = bbRoot;

    // Render brand graphic (Safaricom, Naivas, etc.)
    const bbMat = BillboardRenderer.createBillboardMaterial(this.scene, id, brand);
    adFace.material = bbMat;
    this.billboardMaterials.push(bbMat);

    // 3. Dual Support Steel Pylons
    for (const xOffset of [-2.8, 2.8]) {
      const pylon = MeshBuilder.CreateCylinder(`bbPylon_${id}_${xOffset}`, {
        height: 5.4,
        diameter: 0.35,
        tessellation: 16
      }, this.scene);
      pylon.position.set(xPos + xOffset * Math.cos(bbAngle), 2.7, xOffset * Math.sin(bbAngle));
      pylon.parent = bbRoot;
      pylon.material = frameMat;

      // Concrete footing block
      const footing = MeshBuilder.CreateBox(`bbFooting_${id}_${xOffset}`, {
        width: 0.8,
        height: 0.5,
        depth: 0.8
      }, this.scene);
      footing.position.set(xPos + xOffset * Math.cos(bbAngle), 0.25, xOffset * Math.sin(bbAngle));
      footing.parent = bbRoot;
      const concMat = new StandardMaterial(`concMat_${id}_${xOffset}`, this.scene);
      concMat.diffuseColor = new Color3(0.45, 0.45, 0.48);
      footing.material = concMat;
    }

    // 4. Overhead Spotlight Fixture Bar (Overhanging in front of ad)
    const lightBar = MeshBuilder.CreateBox(`bbLightBar_${id}`, { width: 8.0, height: 0.15, depth: 0.15 }, this.scene);
    lightBar.position.set(xPos + offsetX * 3, 7.7, offsetZ * 3 - 0.5);
    lightBar.rotation.y = bbAngle;
    lightBar.parent = bbRoot;
    lightBar.material = frameMat;

    // Overhead spotlights pointing down at the poster face
    for (const xOff of [-2.6, 0, 2.6]) {
      const lamp = MeshBuilder.CreateCylinder(`bbLamp_${id}_${xOff}`, { height: 0.35, diameter: 0.28 }, this.scene);
      lamp.position.set(xPos + xOff * Math.cos(bbAngle) - 0.4, 7.6, xOff * Math.sin(bbAngle) - 0.5);
      lamp.rotation.x = Math.PI / 3;
      lamp.rotation.y = bbAngle;
      lamp.parent = bbRoot;

      const spotMat = new StandardMaterial(`bbSpotMat_${id}_${xOff}`, this.scene);
      spotMat.diffuseColor = new Color3(1.0, 0.95, 0.7);
      spotMat.emissiveColor = new Color3(0.3, 0.3, 0.2);
      lamp.material = spotMat;
      this.spotlightMaterials.push(spotMat);
    }
  }

  private buildKibanda(chunk: TransformNode, id: number, xPos: number) {
    const kibandaRoot = new TransformNode(`kibanda_${id}`, this.scene);
    kibandaRoot.position.set(xPos, 0, -5);
    kibandaRoot.parent = chunk;

    // Main kiosk shed
    const shed = MeshBuilder.CreateBox(`shed_${id}`, { width: 2.8, height: 2.4, depth: 3.2 }, this.scene);
    shed.position.y = 1.2;
    shed.parent = kibandaRoot;

    const shedMat = new StandardMaterial(`shedMat_${id}`, this.scene);
    const colors = [new Color3(0.1, 0.5, 0.7), new Color3(0.8, 0.3, 0.1), new Color3(0.2, 0.6, 0.3)];
    shedMat.diffuseColor = colors[id % colors.length];
    shed.material = shedMat;

    // Slanted corrugated iron roof
    const roof = MeshBuilder.CreateBox(`kRoof_${id}`, { width: 3.2, height: 0.15, depth: 3.6 }, this.scene);
    roof.position.set(0, 2.45, 0);
    roof.rotation.z = xPos > 0 ? 0.15 : -0.15;
    roof.parent = kibandaRoot;

    const roofMat = new StandardMaterial(`kRoofMat_${id}`, this.scene);
    roofMat.diffuseColor = new Color3(0.55, 0.25, 0.15); // Rusted iron sheet
    roof.material = roofMat;

    // Signboard
    const sign = MeshBuilder.CreatePlane(`kSign_${id}`, { width: 2.6, height: 0.6 }, this.scene);
    sign.position.set(xPos > 0 ? -1.42 : 1.42, 2.1, 0);
    sign.rotation.y = xPos > 0 ? -Math.PI / 2 : Math.PI / 2;
    sign.parent = kibandaRoot;

    const signTex = new DynamicTexture(`kSignTex_${id}`, { width: 512, height: 128 }, this.scene);
    const kName = KIBANDA_NAMES[id % KIBANDA_NAMES.length];
    signTex.drawText(kName, null, 75, 'bold 36px Bungee, sans-serif', '#ffffff', '#111111', true);
    const signMat = new StandardMaterial(`kSignMat_${id}`, this.scene);
    signMat.diffuseTexture = signTex;
    signMat.emissiveColor = new Color3(0.4, 0.4, 0.4);
    sign.material = signMat;
  }

  private buildTireStack(chunk: TransformNode, id: number, xPos: number) {
    const tireMatWhite = new StandardMaterial(`tireW_${id}`, this.scene);
    tireMatWhite.diffuseColor = new Color3(0.9, 0.9, 0.9);

    const tireMatRed = new StandardMaterial(`tireR_${id}`, this.scene);
    tireMatRed.diffuseColor = new Color3(0.8, 0.1, 0.1);

    for (let t = 0; t < 3; t++) {
      const tire = MeshBuilder.CreateTorus(`stackTire_${id}_${t}`, { diameter: 0.85, thickness: 0.22, tessellation: 16 }, this.scene);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(xPos, 0.15 + t * 0.24, -8 + t * 0.1);
      tire.parent = chunk;
      tire.material = t % 2 === 0 ? tireMatWhite : tireMatRed;
    }
  }

  /**
   * Update road chunks for infinite recycling and adjust day/night lighting.
   */
  public update(playerZ: number, nightRatio: number = 0) {
    // 1. Seamless infinite road chunk recycling
    for (const chunk of this.chunks) {
      if (chunk.position.z < playerZ - this.chunkLength * 1.5) {
        chunk.position.z += this.totalChunks * this.chunkLength;
      }
    }

    // 2. Adjust streetlamp emissive brightness based on day/night
    const lampGlow = Math.max(0.1, nightRatio * 2.5);
    for (const mat of this.lampMaterials) {
      mat.emissiveColor.set(lampGlow, lampGlow * 0.85, lampGlow * 0.4);
    }

    // 3. Dynamic Billboard Lights for Night Mode
    // At night: overhead spotlights beam brightly and billboard posters glow like real LED signs
    const spotGlow = nightRatio > 0.2 ? 1.0 : 0.15;
    for (const spotMat of this.spotlightMaterials) {
      spotMat.emissiveColor.set(spotGlow, spotGlow * 0.95, spotGlow * 0.5);
    }

    const bbGlow = 0.65 + nightRatio * 0.35; // 0.65 in daylight -> 1.0 at night!
    for (const bbMat of this.billboardMaterials) {
      bbMat.emissiveColor.set(bbGlow, bbGlow, bbGlow);
    }
  }

  public reset() {
    this.chunks.forEach((chunk, i) => {
      chunk.position.z = i * this.chunkLength;
    });
  }
}
