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
import { HumanCharacter } from './HumanCharacter';
import { BodaBoda } from './BodaBoda';

export const LANE_WIDTH = 3.2;
export const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

export class Player {
  public root: TransformNode;
  public character: HumanCharacter;
  public boda: BodaBoda;
  public shadowMesh: Mesh;

  public currentLane: number = 1;
  public targetX: number = 0;

  // Jump & physics
  public isGrounded: boolean = true;
  public isJumping: boolean = false;
  public isSliding: boolean = false;
  public isStumbling: boolean = false;
  public isOnRoof: boolean = false;
  public isRidingBoda: boolean = false;
  public bodaTimer: number = 0;
  public bodaDuration: number = 25.0;
  public invulnerableTimer: number = 0; // Post-crash shield window
  public stumbleTimer: number = 0;
  private velocityY: number = 0;
  private gravity: number = 44;
  private jumpForce: number = 13.8;
  public baseGroundY: number = 0.9;
  public currentGroundY: number = 0.9;
  public targetGroundY: number = 0.9;
  private slideTimer: number = 0;
  private slideDuration: number = 0.65;
  private slideBlend: number = 0;
  private jumpBlend: number = 0;

  public get hitBox() {
    const pos = this.root.position;
    const height = this.isSliding ? 0.7 : 1.8;
    const yCenter = this.isSliding ? pos.y - 0.5 : pos.y;
    return {
      min: new Vector3(pos.x - 0.45, yCenter - height / 2, pos.z - 0.45),
      max: new Vector3(pos.x + 0.45, yCenter + height / 2, pos.z + 0.45),
      width: 0.9,
      height: height,
      depth: 0.9,
      center: new Vector3(pos.x, yCenter, pos.z)
    };
  }

  constructor(private scene: Scene, private sound: SoundManager) {
    this.root = new TransformNode('playerRoot', scene);
    this.root.position = new Vector3(0, this.baseGroundY, 0);

    // Create realistic human character
    this.character = new HumanCharacter(scene);
    this.character.root.parent = this.root;
    this.character.root.scaling.setAll(1.05);

    // Create Boda-Boda motorbike (mounted under player)
    this.boda = new BodaBoda(scene);
    this.boda.root.parent = this.root;
    this.boda.root.position.set(0, -this.baseGroundY, 0);

    // Blob shadow
    this.shadowMesh = MeshBuilder.CreateDisc('playerShadow', { radius: 0.6, tessellation: 24 }, scene);
    this.shadowMesh.rotation.x = Math.PI / 2;
    this.shadowMesh.position.y = 0.04;
    this.shadowMesh.parent = this.root;
    const shadowMat = new StandardMaterial('shadowMat', scene);
    shadowMat.diffuseColor = new Color3(0, 0, 0);
    shadowMat.alpha = 0.4;
    this.shadowMesh.material = shadowMat;
  }

  public moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = LANES[this.currentLane];
      this.sound.playLaneSwitch();
    }
  }

  public moveRight() {
    if (this.currentLane < LANES.length - 1) {
      this.currentLane++;
      this.targetX = LANES[this.currentLane];
      this.sound.playLaneSwitch();
    }
  }

  public jump() {
    if (this.isGrounded) {
      this.isGrounded = false;
      this.isJumping = true;
      this.velocityY = this.jumpForce;
      this.isSliding = false;
      this.slideBlend = 0;
      this.sound.playJump();
    }
  }

  public slide() {
    if (!this.isGrounded) {
      // Fast fall snap
      this.velocityY = -24;
    }
    this.isSliding = true;
    this.slideTimer = this.slideDuration;
    this.sound.playSlide();
  }

  public triggerStumble() {
    this.isStumbling = true;
    this.stumbleTimer = 1.8; // 1.8s stumble window
    this.sound.playStumble();
  }

  public reset() {
    this.currentLane = 1;
    this.targetX = LANES[this.currentLane];
    this.currentGroundY = this.baseGroundY;
    this.targetGroundY = this.baseGroundY;
    this.isOnRoof = false;
    this.isRidingBoda = false;
    this.bodaTimer = 0;
    this.invulnerableTimer = 0;
    this.boda.root.setEnabled(false);
    this.character.root.setEnabled(true);
    this.root.position.set(0, this.baseGroundY, 0);
    this.root.rotation.set(0, 0, 0);
    this.velocityY = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.isSliding = false;
    this.isStumbling = false;
    this.stumbleTimer = 0;
    this.slideBlend = 0;
    this.jumpBlend = 0;
    this.character.resetPose();
  }

  /**
   * Mount and ride Boda-Boda motorbike!
   */
  public mountBoda(bikeStyle: string = 'STANDARD') {
    this.isRidingBoda = true;
    this.bodaTimer = this.bodaDuration;
    this.boda.applyTheme(bikeStyle);
    this.boda.root.setEnabled(true);
    this.boda.root.position.set(0, -this.baseGroundY, 0);
    this.character.setBackpackVisible(false); // Hide backpack so rider cleanly sits on the bike!
    this.character.poseRideBoda();
    this.isSliding = false;
  }

  /**
   * Dismount Boda-Boda (either naturally or after crash absorption).
   */
  public dismountBoda(crashed: boolean = false) {
    this.isRidingBoda = false;
    this.bodaTimer = 0;
    this.boda.root.setEnabled(false);
    this.character.setBackpackVisible(true);
    this.character.resetPose();

    if (crashed) {
      // Emergency leap forward onto the road with safety invincibility window
      this.invulnerableTimer = 1.8;
      this.isGrounded = false;
      this.isJumping = true;
      this.velocityY = this.jumpForce * 1.05;
      this.sound.playJump();
    }
  }

  /**
   * Set platform surface height under the player.
   * If on ground: platformHeight = 0.
   * If on roof: platformHeight = 2.50.
   * If on ramp: platformHeight = ramp surface height.
   */
  public setPlatformHeight(platformHeight: number | null) {
    if (platformHeight !== null) {
      this.targetGroundY = platformHeight + this.baseGroundY;
      this.isOnRoof = platformHeight > 1.0;
    } else {
      this.targetGroundY = this.baseGroundY;
      this.isOnRoof = false;
    }
  }

  public update(dt: number, forwardSpeed: number) {
    // 1. Smooth, snappy lane transition
    const dx = this.targetX - this.root.position.x;
    if (Math.abs(dx) < 0.02) {
      this.root.position.x = this.targetX;
    } else {
      this.root.position.x += dx * Math.min(22 * dt, 1.0);
    }

    // Dynamic bank roll tilt during lane switch
    const rollAngle = -dx * 0.12;
    this.root.rotation.z += (rollAngle - this.root.rotation.z) * Math.min(18 * dt, 1.0);

    // 2. Multi-tier Platform & Gravity Physics
    if (this.targetGroundY > this.currentGroundY) {
      // Riding up an inclined ramp
      if (this.isGrounded) {
        this.currentGroundY = this.targetGroundY;
        this.root.position.y = this.currentGroundY;
      } else {
        // Airborne approaching higher platform
        this.currentGroundY = this.targetGroundY;
      }
    } else if (this.targetGroundY < this.currentGroundY) {
      // Stepped off edge of a roof into open air!
      if (this.isGrounded) {
        this.isGrounded = false;
        this.velocityY = 0; // Fall smoothly
      }
      this.currentGroundY = this.targetGroundY;
    }

    if (!this.isGrounded) {
      this.velocityY -= this.gravity * dt;
      this.root.position.y += this.velocityY * dt;

      // Check landing on current supported platform or ground
      if (this.root.position.y <= this.currentGroundY) {
        this.root.position.y = this.currentGroundY;
        this.velocityY = 0;
        this.isGrounded = true;
        this.isJumping = false;
      }
    } else {
      // Firmly attached to platform surface
      this.root.position.y = this.currentGroundY;
    }

    // Shadow placement on the current platform surface
    const heightAboveGround = this.root.position.y - this.currentGroundY;
    const shadowScale = Math.max(0.25, 1 - heightAboveGround * 0.18);
    this.shadowMesh.scaling.set(shadowScale, shadowScale, shadowScale);
    this.shadowMesh.position.y = -heightAboveGround + 0.04;

    // 3. Boda-Boda & Invulnerability timers
    if (this.isRidingBoda) {
      this.bodaTimer -= dt;
      if (this.bodaTimer <= 0) {
        this.dismountBoda(false);
      }
      this.boda.update(dt, forwardSpeed, this.root.rotation.z * 1.8);
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      // Strobe character mesh for visual invulnerability feedback
      const blink = Math.floor(Date.now() / 80) % 2 === 0;
      this.character.root.setEnabled(blink);
      if (this.invulnerableTimer <= 0) {
        this.character.root.setEnabled(true);
      }
    }

    // 4. Sliding & Stumble timers
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    if (this.isStumbling) {
      this.stumbleTimer -= dt;
      // Stumble body wobble on Z axis
      const wobble = Math.sin(this.stumbleTimer * 22) * 0.16;
      this.root.rotation.z += wobble;
      this.root.rotation.x = 0.25; // Lean forward unsteadily
      if (this.stumbleTimer <= 0) {
        this.isStumbling = false;
        this.root.rotation.x = 0;
      }
    } else {
      this.root.rotation.x = 0;
    }

    // 5. Animation blending
    const blendSpeed = 12;

    if (this.isRidingBoda) {
      // Seated riding pose on Boda-Boda
      this.character.poseRideBoda(1.0);
    } else if (this.isSliding && this.isGrounded) {
      // Sliding
      this.slideBlend = Math.min(1, this.slideBlend + blendSpeed * dt);
      this.jumpBlend = Math.max(0, this.jumpBlend - blendSpeed * dt);
      this.character.poseSlide(this.slideBlend);
    } else if (this.isJumping || !this.isGrounded) {
      // Jumping / airborne
      this.slideBlend = Math.max(0, this.slideBlend - blendSpeed * dt);
      this.jumpBlend = Math.min(1, this.jumpBlend + blendSpeed * dt);
      this.character.poseJump(this.jumpBlend);
    } else {
      // Running on ground
      this.slideBlend = Math.max(0, this.slideBlend - blendSpeed * dt);
      this.jumpBlend = Math.max(0, this.jumpBlend - blendSpeed * dt);

      if (this.slideBlend > 0.01) {
        this.character.poseSlide(this.slideBlend);
      } else if (this.jumpBlend > 0.01) {
        this.character.poseJump(this.jumpBlend);
      } else {
        // Full running animation
        this.character.animateRun(dt, forwardSpeed);
      }
    }
  }

  public playCrashAnimation() {
    this.character.poseCrash();
    this.root.position.y = 0.5;
  }

  public setSkin(skinId: string) {
    this.character.applySkin(skinId);
  }
}
