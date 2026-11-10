import {
  Scene,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  Vector3
} from '@babylonjs/core';

export class EnvironmentManager {
  private hemiLight: HemisphericLight;
  private sunLight: DirectionalLight;

  // Cycle parameters: 2000 meters for full day -> sunset -> night -> sunrise cycle
  private cycleDistance: number = 2000;
  public currentNightRatio: number = 0; // 0 = full day, 1 = full night

  constructor(private scene: Scene) {
    // Hemispheric ambient light
    this.hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
    this.hemiLight.intensity = 1.0;
    this.hemiLight.diffuse = new Color3(0.95, 0.95, 1.0);
    this.hemiLight.groundColor = new Color3(0.28, 0.28, 0.32);

    // Directional sunlight
    this.sunLight = new DirectionalLight('sunLight', new Vector3(-0.4, -1, 0.8), scene);
    this.sunLight.intensity = 1.1;
    this.sunLight.diffuse = new Color3(1.0, 0.98, 0.92);
  }

  /**
   * Update time of day based on total distance traveled.
   * Starts in glorious bright daylight!
   */
  public update(distance: number) {
    const progress = (distance % this.cycleDistance) / this.cycleDistance;

    // Phase 1 (0.00 - 0.40): Bright Nairobi Daylight (Crisp blue sky, sunshine)
    // Phase 2 (0.40 - 0.60): Golden Sunset (Fiery orange, purple dusk)
    // Phase 3 (0.60 - 0.85): Electric Neon Night (Deep midnight blue, glowing billboards & neons)
    // Phase 4 (0.85 - 1.00): Sunrise & Dawn (Warm amber, morning light returning to day)

    let sky: Color4;
    let fog: Color3;
    let hemi: Color3;
    let hemiGround: Color3;
    let hemiInt: number;
    let sun: Color3;
    let sunInt: number;
    let nightRatio: number;

    if (progress < 0.40) {
      // 1. Bright Daylight
      sky = new Color4(0.35, 0.65, 0.95, 1.0); // Vibrant blue sky
      fog = new Color3(0.40, 0.65, 0.90);
      hemi = new Color3(0.95, 0.95, 1.0);
      hemiGround = new Color3(0.28, 0.28, 0.32);
      hemiInt = 1.05;
      sun = new Color3(1.0, 0.98, 0.92);
      sunInt = 1.15;
      nightRatio = 0.0;
    } else if (progress < 0.60) {
      // 2. Sunset / Golden Hour -> Twilight
      const t = (progress - 0.40) / 0.20;
      sky = this.lerpColor4(new Color4(0.35, 0.65, 0.95, 1), new Color4(0.90, 0.38, 0.18, 1), t);
      fog = this.lerpColor3(new Color3(0.40, 0.65, 0.90), new Color3(0.85, 0.35, 0.16), t);
      hemi = this.lerpColor3(new Color3(0.95, 0.95, 1.0), new Color3(1.0, 0.70, 0.45), t);
      hemiGround = new Color3(0.25, 0.20, 0.25);
      hemiInt = this.lerp(1.05, 0.65, t);
      sun = this.lerpColor3(new Color3(1.0, 0.98, 0.92), new Color3(1.0, 0.50, 0.25), t);
      sunInt = this.lerp(1.15, 0.50, t);
      nightRatio = t * 0.75;
    } else if (progress < 0.85) {
      // 3. Electric Neon Night
      const t = (progress - 0.60) / 0.25;
      sky = this.lerpColor4(new Color4(0.90, 0.38, 0.18, 1), new Color4(0.04, 0.06, 0.15, 1), Math.min(1, t * 1.5));
      fog = this.lerpColor3(new Color3(0.85, 0.35, 0.16), new Color3(0.04, 0.06, 0.14), Math.min(1, t * 1.5));
      hemi = new Color3(0.25, 0.30, 0.55); // Cool blue ambient moonlight
      hemiGround = new Color3(0.08, 0.08, 0.14);
      hemiInt = 0.42;
      sun = new Color3(0.35, 0.45, 0.75); // Moonlight
      sunInt = 0.35;
      nightRatio = 1.0;
    } else {
      // 4. Sunrise / Dawn back to Day
      const t = (progress - 0.85) / 0.15;
      sky = this.lerpColor4(new Color4(0.04, 0.06, 0.15, 1), new Color4(0.35, 0.65, 0.95, 1), t);
      fog = this.lerpColor3(new Color3(0.04, 0.06, 0.14), new Color3(0.40, 0.65, 0.90), t);
      hemi = this.lerpColor3(new Color3(0.25, 0.30, 0.55), new Color3(0.95, 0.95, 1.0), t);
      hemiGround = new Color3(0.28, 0.28, 0.32);
      hemiInt = this.lerp(0.42, 1.05, t);
      sun = this.lerpColor3(new Color3(0.35, 0.45, 0.75), new Color3(1.0, 0.98, 0.92), t);
      sunInt = this.lerp(0.35, 1.15, t);
      nightRatio = 1.0 - t;
    }

    this.currentNightRatio = nightRatio;

    // Apply to scene
    this.scene.clearColor = sky;
    this.scene.fogColor = fog;

    this.hemiLight.diffuse = hemi;
    this.hemiLight.groundColor = hemiGround;
    this.hemiLight.intensity = hemiInt;

    this.sunLight.diffuse = sun;
    this.sunLight.intensity = sunInt;
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private lerpColor3(c1: Color3, c2: Color3, t: number): Color3 {
    return new Color3(
      c1.r + (c2.r - c1.r) * t,
      c1.g + (c2.g - c1.g) * t,
      c1.b + (c2.b - c1.b) * t
    );
  }

  private lerpColor4(c1: Color4, c2: Color4, t: number): Color4 {
    return new Color4(
      c1.r + (c2.r - c1.r) * t,
      c1.g + (c2.g - c1.g) * t,
      c1.b + (c2.b - c1.b) * t,
      1.0
    );
  }
}
