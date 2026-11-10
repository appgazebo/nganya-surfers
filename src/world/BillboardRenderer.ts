import { Scene, DynamicTexture, StandardMaterial, Color3 } from '@babylonjs/core';

export type BillboardBrand = 'SAFARICOM' | 'NAIVAS' | 'MPESA' | 'EQUITY' | 'MATWANA';

export class BillboardRenderer {
  public static createBillboardMaterial(
    scene: Scene,
    id: number,
    brand: BillboardBrand
  ): StandardMaterial {
    const tex = new DynamicTexture(`bbTex_${brand}_${id}`, { width: 1024, height: 512 }, scene, false);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    ctx.clearRect(0, 0, 1024, 512);

    switch (brand) {
      case 'SAFARICOM':
        BillboardRenderer.drawSafaricom(ctx);
        break;
      case 'NAIVAS':
        BillboardRenderer.drawNaivas(ctx);
        break;
      case 'MPESA':
        BillboardRenderer.drawMpesa(ctx);
        break;
      case 'EQUITY':
        BillboardRenderer.drawEquity(ctx);
        break;
      case 'MATWANA':
      default:
        BillboardRenderer.drawMatwana(ctx);
        break;
    }

    tex.update();

    const mat = new StandardMaterial(`bbMat_${brand}_${id}`, scene);
    mat.diffuseTexture = tex;
    mat.emissiveColor = new Color3(0.65, 0.65, 0.65); // High self-illumination: crisp in daylight and night!
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    mat.backFaceCulling = false; // Never backface-culled!
    return mat;
  }

  /**
   * Official Safaricom Billboard with Logo & 5G branding
   */
  private static drawSafaricom(ctx: CanvasRenderingContext2D) {
    // 1. Background: Clean white with green side curves
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 512);

    // Green dynamic background waves
    ctx.fillStyle = '#00a84e';
    ctx.beginPath();
    ctx.moveTo(720, 0);
    ctx.bezierCurveTo(780, 200, 850, 320, 1024, 380);
    ctx.lineTo(1024, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#e61e2b'; // Safaricom accent red
    ctx.beginPath();
    ctx.moveTo(850, 0);
    ctx.bezierCurveTo(900, 120, 950, 200, 1024, 230);
    ctx.lineTo(1024, 0);
    ctx.closePath();
    ctx.fill();

    // Bottom green footer band
    ctx.fillStyle = '#00a84e';
    ctx.fillRect(0, 420, 1024, 92);

    // 2. Safaricom Logo Icon (Green signal arcs + red accent)
    const cx = 160;
    const cy = 210;

    // Outer green wave arc
    ctx.strokeStyle = '#00a84e';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, 75, -Math.PI * 0.75, Math.PI * 0.65);
    ctx.stroke();

    // Middle green wave arc
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, -Math.PI * 0.7, Math.PI * 0.55);
    ctx.stroke();

    // Inner green dot
    ctx.fillStyle = '#00a84e';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();

    // Red swoosh flourish on top
    ctx.strokeStyle = '#e61e2b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx + 8, cy - 8, 92, -Math.PI * 0.65, -Math.PI * 0.25);
    ctx.stroke();

    // 3. Wordmark: "Safaricom"
    ctx.fillStyle = '#00a84e';
    ctx.font = '900 88px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Safaricom', 280, 220);

    // Brand Slogan
    ctx.fillStyle = '#555555';
    ctx.font = '600 32px "Inter", sans-serif';
    ctx.fillText('Together We Can', 285, 275);

    // 5G Network callout badge
    ctx.fillStyle = '#e61e2b';
    ctx.beginPath();
    ctx.roundRect(285, 305, 140, 44, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Inter", sans-serif';
    ctx.fillText('5G ULTRA', 300, 336);

    ctx.fillStyle = '#00a84e';
    ctx.font = '700 24px "Inter", sans-serif';
    ctx.fillText('Fastest Internet in Kenya', 440, 336);

    // 4. Footer Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px "Bungee", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M-PESA  •  FASTEST 5G  •  GO BEYOND', 512, 478);
  }

  /**
   * Official Naivas Supermarket Billboard with Orange/Green Branding
   */
  private static drawNaivas(ctx: CanvasRenderingContext2D) {
    // 1. Background: Warm modern gradient with dark green bottom
    const grad = ctx.createLinearGradient(0, 0, 1024, 0);
    grad.addColorStop(0, '#f97316'); // Vibrant Naivas Orange
    grad.addColorStop(0.65, '#ea580c');
    grad.addColorStop(1, '#058a3e'); // Naivas Green
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Top subtle white glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(0, 0, 1024, 80);

    // 2. Naivas Shopping Basket Icon inside white circle
    const cx = 170;
    const cy = 200;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.fill();

    // Basket body (Green)
    ctx.fillStyle = '#058a3e';
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy - 10);
    ctx.lineTo(cx + 50, cy - 10);
    ctx.lineTo(cx + 38, cy + 45);
    ctx.lineTo(cx - 38, cy + 45);
    ctx.closePath();
    ctx.fill();

    // Basket handle (Orange arc)
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 36, Math.PI, 0);
    ctx.stroke();

    // Cart wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 22, cy + 56, 10, 0, Math.PI * 2);
    ctx.arc(cx + 22, cy + 56, 10, 0, Math.PI * 2);
    ctx.fill();

    // 3. Wordmark: "NAIVAS"
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 115px "Inter", "Arial Black", sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 12;
    ctx.fillText('NAIVAS', 295, 215);
    ctx.shadowBlur = 0;

    // Green Sub-badge: "SUPERMARKET"
    ctx.fillStyle = '#058a3e';
    ctx.beginPath();
    ctx.roundRect(295, 235, 370, 52, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 30px "Inter", sans-serif';
    ctx.fillText('SUPERMARKET', 345, 272);

    // 4. Famous Slogan: "SAVES YOU MONEY!"
    ctx.fillStyle = '#fef08a'; // Bright sunny yellow
    ctx.font = '900 48px "Bungee", sans-serif';
    ctx.fillText('SAVES YOU MONEY!', 295, 355);

    // 5. Bottom banner
    ctx.fillStyle = '#04642d';
    ctx.fillRect(0, 420, 1024, 92);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 28px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛒 100+ BRANCHES  •  FRESH PRODUCE  •  KARIBU TENA', 512, 476);
  }

  /**
   * M-PESA Billboard (Safaricom Mobile Money)
   */
  private static drawMpesa(ctx: CanvasRenderingContext2D) {
    // 1. Full Safaricom Green Background
    ctx.fillStyle = '#00a84e';
    ctx.fillRect(0, 0, 1024, 512);

    // White center card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(40, 40, 944, 432, 28);
    ctx.fill();

    // 2. M-PESA Ribbon Badge
    const cx = 175;
    const cy = 220;

    // Red badge background
    ctx.fillStyle = '#e61e2b';
    ctx.beginPath();
    ctx.roundRect(cx - 85, cy - 85, 170, 170, 24);
    ctx.fill();

    // White bold letter M
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 120px "Inter", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('M', cx, cy + 42);

    // 3. Wordmark: "M-PESA"
    ctx.fillStyle = '#00a84e';
    ctx.font = '900 105px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('M-PESA', 285, 210);

    ctx.fillStyle = '#333333';
    ctx.font = '700 38px "Inter", sans-serif';
    ctx.fillText('Tuma na Kupokea Pesa', 290, 275);

    // Bullet highlights
    ctx.fillStyle = '#00a84e';
    ctx.font = '700 26px "Bungee", sans-serif';
    ctx.fillText('⚡ LIPA NA M-PESA  •  SEND MONEY ANYWHERE', 290, 345);

    // Top header tag
    ctx.fillStyle = '#e61e2b';
    ctx.font = '800 24px "Inter", sans-serif';
    ctx.fillText('SAFARICOM FINANCIAL SERVICES', 290, 110);
  }

  /**
   * Equity Bank Billboard
   */
  private static drawEquity(ctx: CanvasRenderingContext2D) {
    // Maroon background
    ctx.fillStyle = '#800020';
    ctx.fillRect(0, 0, 1024, 512);

    // Gold decorative frame
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.strokeRect(25, 25, 974, 462);

    // Pitched roof house emblem
    const cx = 180;
    const cy = 230;

    ctx.fillStyle = '#f59e0b'; // Gold roof
    ctx.beginPath();
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx + 80, cy);
    ctx.lineTo(cx - 80, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 65, cy + 10, 130, 75);

    // Door
    ctx.fillStyle = '#800020';
    ctx.fillRect(cx - 20, cy + 35, 40, 50);

    // Wordmark
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 100px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EQUITY', 300, 220);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '700 32px "Inter", sans-serif';
    ctx.fillText('Your Listening, Caring Partner', 305, 275);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px "Bungee", sans-serif';
    ctx.fillText('BANKING  •  INVESTMENTS  •  EQUITEL', 305, 345);
  }

  /**
   * Matwana Culture Street Art Billboard
   */
  private static drawMatwana(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, 1024, 512);

    // Vibrant graffiti streaks
    ctx.fillStyle = '#f72585';
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.lineTo(1024, 0);
    ctx.lineTo(1024, 120);
    ctx.lineTo(0, 200);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#7209b7';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.lineTo(1024, 260);
    ctx.lineTo(1024, 400);
    ctx.lineTo(0, 460);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4cc9f0';
    ctx.font = '900 80px "Bungee", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MATWANA CULTURE', 512, 230);

    ctx.fillStyle = '#ffd166';
    ctx.font = '700 40px "Bungee", sans-serif';
    ctx.fillText('KING OF NAIROBI ROADS', 512, 305);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.fillText('CUSTOM SOUND  •  UNDERGLOW  •  RONGAI EXPRESS 001', 512, 430);
  }
}
