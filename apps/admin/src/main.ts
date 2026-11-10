import { fetchStats, getCountryDetails, formatTimeAgo, AnalyticsStats } from './api';

let activeAdminKey = sessionStorage.getItem('admin_key') || '';
let autoRefreshTimer: number | null = null;

async function updateDashboard() {
  const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
  if (refreshBtn) refreshBtn.textContent = '↻ Loading...';

  try {
    const data = await fetchStats(activeAdminKey);
    renderKPIs(data.totals);
    renderCountries(data.topCountries, data.totals.totalVisitors);
    renderCities(data.topCities);
    renderDevices(data.devices, data.totals.totalVisits || data.totals.totalVisitors);
    renderActivity(data.recentActivity);

    const updatedEl = document.getElementById('last-updated');
    if (updatedEl) {
      updatedEl.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    }
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === '401_UNAUTHORIZED') {
      showAuthModal('Invalid Admin Key. Access Denied.');
    } else {
      console.error('Failed to update admin dashboard:', err);
    }
    return false;
  } finally {
    if (refreshBtn) refreshBtn.textContent = '↻ Refresh';
  }
}

function showAuthModal(errorMsg: string = '') {
  const modal = document.getElementById('auth-modal');
  const errorEl = document.getElementById('auth-error');
  const logoutBtn = document.getElementById('logout-btn');

  if (modal) modal.classList.remove('hidden');
  if (errorEl) errorEl.textContent = errorMsg;
  if (logoutBtn) logoutBtn.style.display = 'none';

  if (autoRefreshTimer !== null) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  const logoutBtn = document.getElementById('logout-btn');

  if (modal) modal.classList.add('hidden');
  if (logoutBtn) logoutBtn.style.display = 'block';

  if (!autoRefreshTimer) {
    autoRefreshTimer = window.setInterval(updateDashboard, 20000);
  }
}

function renderKPIs(totals: AnalyticsStats['totals']) {
  const setEl = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setEl('kpi-visitors', totals.totalVisitors.toLocaleString());
  setEl('kpi-plays', totals.totalPlays.toLocaleString());

  const playRate = totals.totalVisitors > 0
    ? Math.round((totals.totalPlays / totals.totalVisitors) * 100)
    : 0;
  setEl('kpi-play-rate', `${playRate}% play-through rate`);

  setEl('kpi-completed', totals.totalCompleted.toLocaleString());
  setEl('kpi-best', `${totals.bestDistance.toLocaleString()} m`);
  setEl('kpi-avg', `Avg: ${totals.avgDistance.toLocaleString()} m`);
}

function renderCountries(countries: AnalyticsStats['topCountries'], totalVisitors: number) {
  const container = document.getElementById('countries-list');
  if (!container) return;

  if (!countries || countries.length === 0) {
    container.innerHTML = '<div class="empty-state">No country data recorded yet.</div>';
    return;
  }

  const maxCount = Math.max(...countries.map(c => c.count), 1);

  container.innerHTML = countries.map(item => {
    const { name, flag } = getCountryDetails(item.country);
    const pct = Math.round((item.count / maxCount) * 100);

    return `
      <div class="list-item">
        <div class="list-row">
          <span class="list-label">
            <span class="flag-icon">${flag}</span>
            <span>${name}</span>
          </span>
          <span class="list-count">${item.count.toLocaleString()}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCities(cities: AnalyticsStats['topCities']) {
  const container = document.getElementById('cities-list');
  if (!container) return;

  if (!cities || cities.length === 0) {
    container.innerHTML = '<div class="empty-state">No city data recorded yet.</div>';
    return;
  }

  const maxCount = Math.max(...cities.map(c => c.count), 1);

  container.innerHTML = cities.map(item => {
    const { flag } = getCountryDetails(item.country);
    const pct = Math.round((item.count / maxCount) * 100);

    return `
      <div class="list-item">
        <div class="list-row">
          <span class="list-label">
            <span class="flag-icon">${flag}</span>
            <span>${item.city}</span>
          </span>
          <span class="list-count">${item.count.toLocaleString()}</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar gold" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderDevices(devices: AnalyticsStats['devices'], total: number) {
  const container = document.getElementById('devices-list');
  if (!container) return;

  if (!devices || devices.length === 0) {
    container.innerHTML = '<div class="empty-state">No device data yet.</div>';
    return;
  }

  const deviceIcons: Record<string, string> = {
    Mobile: '📱',
    Desktop: '💻',
    Tablet: '📟'
  };

  const safeTotal = Math.max(total, 1);

  container.innerHTML = devices.map(item => {
    const icon = deviceIcons[item.device] || '💻';
    const pct = Math.round((item.count / safeTotal) * 100);

    return `
      <div class="list-item">
        <div class="list-row">
          <span class="list-label">
            <span>${icon}</span>
            <span>${item.device}</span>
          </span>
          <span class="list-count">${item.count.toLocaleString()} (${pct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar green" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderActivity(activity: AnalyticsStats['recentActivity']) {
  const tbody = document.getElementById('activity-tbody');
  if (!tbody) return;

  if (!activity || activity.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No recent activity logged.</td></tr>';
    return;
  }

  tbody.innerHTML = activity.map(event => {
    const { name, flag } = getCountryDetails(event.country);
    const loc = event.city && event.city !== 'Unknown' ? `${event.city}, ${name}` : name;
    const timeAgo = formatTimeAgo(event.created_at);

    let eventClass = 'visit';
    let eventLabel = 'VISIT';
    if (event.event_type === 'PLAY') {
      eventClass = 'play';
      eventLabel = 'PLAY';
    } else if (event.event_type === 'GAME_OVER') {
      eventClass = 'game_over';
      eventLabel = 'GAME OVER';
    }

    const outcome = event.distance > 0
      ? `${Math.floor(event.distance)}m (KSh ${event.coins * 50})`
      : '—';

    return `
      <tr>
        <td><span class="event-tag ${eventClass}">${eventLabel}</span></td>
        <td>${flag} ${loc}</td>
        <td>${event.device}</td>
        <td>${outcome}</td>
        <td>${timeAgo}</td>
      </tr>
    `;
  }).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form') as HTMLFormElement;
  const keyInput = document.getElementById('admin-key-input') as HTMLInputElement;
  const logoutBtn = document.getElementById('logout-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  if (activeAdminKey) {
    updateDashboard().then(success => {
      if (success) {
        hideAuthModal();
      }
    });
  } else {
    showAuthModal();
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const enteredKey = keyInput.value.trim();
      if (!enteredKey) return;

      activeAdminKey = enteredKey;
      const success = await updateDashboard();
      if (success) {
        sessionStorage.setItem('admin_key', enteredKey);
        hideAuthModal();
      } else {
        sessionStorage.removeItem('admin_key');
        showAuthModal('Incorrect Admin Key. Unauthorized.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      activeAdminKey = '';
      sessionStorage.removeItem('admin_key');
      showAuthModal();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => updateDashboard());
  }
});
