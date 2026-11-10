import { Game } from './game';
import { Analytics } from './core/Analytics';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('PWA ServiceWorker registered successfully:', reg.scope);
    }).catch((err) => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  });
}

// Global PWA Install prompt handler
let deferredPrompt: any = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  (window as any).pwaInstallPrompt = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
      });
    }
  };
});

window.addEventListener('DOMContentLoaded', () => {
  // Track page visit
  Analytics.trackVisit();

  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #renderCanvas not found');
  }

  // Initialize Game
  const game = new Game(canvas);

  // Focus canvas for immediate keyboard control
  canvas.focus();
});
