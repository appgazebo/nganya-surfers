import { Game } from './game';
import { Analytics } from './core/Analytics';

// Register PWA Service Worker with Automatic Immediate Updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Check for updates immediately on load
      reg.update();

      // Check for updates whenever user returns to the tab or mobile PWA
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          reg.update();
        }
      });

      // When an update is detected
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Tell new service worker to activate immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    }).catch((err) => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });

    // When the new worker takes control, reload cleanly to apply fresh update
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
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

  // Setup Modals & Community Links (Report Issue, Suggest Feature, Support Dev)
  setupCommunityModals();

  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #renderCanvas not found');
  }

  // Initialize Game
  const game = new Game(canvas);

  // Focus canvas for immediate keyboard control
  canvas.focus();
});

function setupCommunityModals() {
  const openModal = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  };

  const closeModal = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  };

  // Nav Links
  document.getElementById('link-report')?.addEventListener('click', () => openModal('modal-report'));
  document.getElementById('link-suggest')?.addEventListener('click', () => openModal('modal-suggest'));
  document.getElementById('link-support')?.addEventListener('click', () => openModal('modal-support'));

  // Close buttons
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = (btn as HTMLElement).dataset.close;
      if (targetId) closeModal(targetId);
    });
  });

  // Close when clicking backdrop
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('active');
      }
    });
  });

  // Copy M-PESA Number (0798794745)
  const copyBtn = document.getElementById('btn-copy-mpesa');
  const copyFeedback = document.getElementById('copy-feedback');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('0798794745');
        if (copyFeedback) copyFeedback.textContent = '✓ Copied 0798794745 to clipboard!';
        setTimeout(() => { if (copyFeedback) copyFeedback.textContent = ''; }, 3000);
      } catch {
        if (copyFeedback) copyFeedback.textContent = 'Number: 0798794745';
      }
    });
  }

  // 1. Submit Bug Report Form
  const formReport = document.getElementById('form-report') as HTMLFormElement;
  const reportStatus = document.getElementById('report-status');
  if (formReport) {
    formReport.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (reportStatus) {
        reportStatus.textContent = 'Submitting report...';
        reportStatus.className = 'form-status';
      }

      const payload = {
        title: (document.getElementById('report-title') as HTMLInputElement).value,
        category: (document.getElementById('report-category') as HTMLSelectElement).value,
        description: (document.getElementById('report-desc') as HTMLTextAreaElement).value,
        contact: (document.getElementById('report-contact') as HTMLInputElement).value
      };

      try {
        const res = await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          formReport.reset();
          if (reportStatus) {
            reportStatus.textContent = '✓ Asante sana! Issue submitted to developer queue.';
            reportStatus.className = 'form-status success';
          }
          setTimeout(() => closeModal('modal-report'), 2200);
        } else {
          throw new Error('Failed to submit report');
        }
      } catch {
        if (reportStatus) {
          reportStatus.textContent = 'Failed to submit. Please check your connection.';
          reportStatus.className = 'form-status error';
        }
      }
    });
  }

  // 2. Submit Feature Suggestion Form
  const formSuggest = document.getElementById('form-suggest') as HTMLFormElement;
  const suggestStatus = document.getElementById('suggest-status');
  if (formSuggest) {
    formSuggest.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (suggestStatus) {
        suggestStatus.textContent = 'Submitting feature idea...';
        suggestStatus.className = 'form-status';
      }

      const payload = {
        title: (document.getElementById('suggest-title') as HTMLInputElement).value,
        category: (document.getElementById('suggest-category') as HTMLSelectElement).value,
        description: (document.getElementById('suggest-desc') as HTMLTextAreaElement).value,
        submitter_name: (document.getElementById('suggest-contact') as HTMLInputElement).value
      };

      try {
        const res = await fetch('/api/features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          formSuggest.reset();
          if (suggestStatus) {
            suggestStatus.textContent = '✓ Asante sana! Feature idea received.';
            suggestStatus.className = 'form-status success';
          }
          setTimeout(() => closeModal('modal-suggest'), 2200);
        } else {
          throw new Error('Failed to submit feature');
        }
      } catch {
        if (suggestStatus) {
          suggestStatus.textContent = 'Failed to submit. Please check your connection.';
          suggestStatus.className = 'form-status error';
        }
      }
    });
  }
}
