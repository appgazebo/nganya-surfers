export type InputAction = 'LEFT' | 'RIGHT' | 'JUMP' | 'SLIDE' | 'START' | 'BODA';

export class InputManager {
  private listeners: ((action: InputAction) => void)[] = [];
  private touchStartX = 0;
  private touchStartY = 0;
  private minSwipeDistance = 30;
  private lastTapTime: number = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.setupKeyboard();
    this.setupTouch();
    this.setupTouchButtons();
  }

  private setupTouchButtons() {
    const bindBtn = (id: string, action: InputAction) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.emit(action);
        });
      }
    };

    bindBtn('btn-left', 'LEFT');
    bindBtn('btn-right', 'RIGHT');
    bindBtn('btn-jump', 'JUMP');
    bindBtn('btn-slide', 'SLIDE');
    bindBtn('btn-boda', 'BODA');
  }

  public onAction(cb: (action: InputAction) => void) {
    this.listeners.push(cb);
  }

  private emit(action: InputAction) {
    for (const cb of this.listeners) {
      cb(action);
    }
  }

  private setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling on space/arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || e.key === ' ') {
        e.preventDefault();
      }

      const key = e.key ? e.key.toLowerCase() : '';

      // Direct check for Boda-Boda ride: E or B key
      if (key === 'e' || key === 'b' || e.code === 'KeyE' || e.code === 'KeyB') {
        e.preventDefault();
        this.emit('BODA');
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.emit('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.emit('RIGHT');
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.emit('JUMP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.emit('SLIDE');
          break;
        case 'Enter':
          this.emit('START');
          break;
      }
    });
  }

  private setupTouch() {
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < this.minSwipeDistance) {
        // Tap / Double-tap detection
        const now = Date.now();
        if (now - this.lastTapTime < 340) {
          // Double-tap activates Boda-Boda!
          this.emit('BODA');
        } else {
          this.emit('START');
        }
        this.lastTapTime = now;
        return;
      }

      if (absX > absY) {
        if (dx > 0) {
          this.emit('RIGHT');
        } else {
          this.emit('LEFT');
        }
      } else {
        if (dy < 0) {
          this.emit('JUMP');
        } else {
          this.emit('SLIDE');
        }
      }
    }, { passive: true });
  }
}
