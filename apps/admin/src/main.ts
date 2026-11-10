import {
  fetchStats,
  fetchIssues,
  updateIssueStatus,
  fetchFeatures,
  updateFeatureStatus,
  getCountryDetails,
  formatTimeAgo,
  AnalyticsStats,
  IssueReport,
  FeatureSuggestion
} from './api';

let activeAdminKey = sessionStorage.getItem('admin_key') || '';
let autoRefreshTimer: number | null = null;

let allIssues: IssueReport[] = [];
let activeIssueFilter = 'ALL';

let allFeatures: FeatureSuggestion[] = [];
let activeFeatureFilter = 'ALL';

async function updateAllData() {
  const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
  if (refreshBtn) refreshBtn.textContent = '↻ Loading...';

  try {
    // 1. Fetch Analytics
    const statsData = await fetchStats(activeAdminKey);
    renderKPIs(statsData.totals);
    renderCountries(statsData.topCountries, statsData.totals.totalVisitors);
    renderCities(statsData.topCities);
    renderDevices(statsData.devices, statsData.totals.totalVisits || statsData.totals.totalVisitors);
    renderActivity(statsData.recentActivity);

    // 2. Fetch Reported Issues
    allIssues = await fetchIssues(activeAdminKey);
    renderIssues();

    // 3. Fetch Feature Suggestions
    allFeatures = await fetchFeatures(activeAdminKey);
    renderFeatures();

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
    autoRefreshTimer = window.setInterval(updateAllData, 20000);
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

// 2. DEDICATED ISSUES PAGE RENDERING
function renderIssues() {
  const container = document.getElementById('issues-container');
  const countBadge = document.getElementById('badge-issues-count');
  const countAll = document.getElementById('count-issues-all');
  const countOpen = document.getElementById('count-issues-open');
  const countResolved = document.getElementById('count-issues-resolved');

  const openCount = allIssues.filter(i => i.status === 'OPEN').length;
  const resolvedCount = allIssues.filter(i => i.status === 'RESOLVED').length;

  if (countBadge) countBadge.textContent = String(openCount);
  if (countAll) countAll.textContent = String(allIssues.length);
  if (countOpen) countOpen.textContent = String(openCount);
  if (countResolved) countResolved.textContent = String(resolvedCount);

  if (!container) return;

  const filtered = activeIssueFilter === 'ALL'
    ? allIssues
    : allIssues.filter(i => i.status === activeIssueFilter);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No bug reports match this filter.</div>';
    return;
  }

  container.innerHTML = filtered.map(issue => {
    const isResolved = issue.status === 'RESOLVED';
    const timeAgo = formatTimeAgo(issue.created_at);

    return `
      <div class="item-card" data-issue-id="${issue.id}">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">${issue.title}</div>
            <div class="item-meta">
              <span class="badge">${issue.category}</span>
              <span>📍 ${issue.country || 'Unknown'}</span>
              <span>💻 ${issue.device} (${issue.browser})</span>
              ${issue.contact ? `<span>📞 Contact: <strong>${issue.contact}</strong></span>` : ''}
              <span>⏱️ ${timeAgo}</span>
            </div>
          </div>
          <span class="status-badge ${issue.status.toLowerCase()}">${issue.status}</span>
        </div>
        <div class="item-desc">${issue.description}</div>
        <div class="item-card-footer">
          <span>Issue #${issue.id}</span>
          <button class="btn-action ${isResolved ? '' : 'resolve'}" onclick="window.handleToggleIssue(${issue.id}, '${isResolved ? 'OPEN' : 'RESOLVED'}')">
            ${isResolved ? 'Re-open Issue' : '✓ Mark as Resolved'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 3. DEDICATED FEATURES PAGE RENDERING
function renderFeatures() {
  const container = document.getElementById('features-container');
  const countBadge = document.getElementById('badge-features-count');
  const countAll = document.getElementById('count-features-all');
  const countNew = document.getElementById('count-features-new');
  const countPlanned = document.getElementById('count-features-planned');
  const countCompleted = document.getElementById('count-features-completed');

  const newCount = allFeatures.filter(f => f.status === 'NEW').length;
  const plannedCount = allFeatures.filter(f => f.status === 'PLANNED').length;
  const completedCount = allFeatures.filter(f => f.status === 'COMPLETED').length;

  if (countBadge) countBadge.textContent = String(newCount);
  if (countAll) countAll.textContent = String(allFeatures.length);
  if (countNew) countNew.textContent = String(newCount);
  if (countPlanned) countPlanned.textContent = String(plannedCount);
  if (countCompleted) countCompleted.textContent = String(completedCount);

  if (!container) return;

  const filtered = activeFeatureFilter === 'ALL'
    ? allFeatures
    : allFeatures.filter(f => f.status === activeFeatureFilter);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No feature ideas match this filter.</div>';
    return;
  }

  container.innerHTML = filtered.map(feat => {
    const timeAgo = formatTimeAgo(feat.created_at);

    return `
      <div class="item-card">
        <div class="item-card-header">
          <div>
            <div class="item-card-title">💡 ${feat.title}</div>
            <div class="item-meta">
              <span class="badge">${feat.category}</span>
              <span>👤 ${feat.submitter_name || 'Anonymous'}</span>
              ${feat.contact ? `<span>📞 ${feat.contact}</span>` : ''}
              <span>⏱️ ${timeAgo}</span>
            </div>
          </div>
          <span class="status-badge ${feat.status.toLowerCase()}">${feat.status}</span>
        </div>
        <div class="item-desc">${feat.description}</div>
        <div class="item-card-footer">
          <span>Feature #${feat.id}</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn-action" onclick="window.handleUpdateFeature(${feat.id}, 'PLANNED')">Set Planned</button>
            <button class="btn-action resolve" onclick="window.handleUpdateFeature(${feat.id}, 'COMPLETED')">✓ Completed</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Global Actions for buttons
(window as unknown as { handleToggleIssue: (id: number, status: string) => Promise<void> }).handleToggleIssue = async (id: number, status: string) => {
  await updateIssueStatus(activeAdminKey, id, status);
  const target = allIssues.find(i => i.id === id);
  if (target) target.status = status as 'OPEN' | 'RESOLVED';
  renderIssues();
};

(window as unknown as { handleUpdateFeature: (id: number, status: string) => Promise<void> }).handleUpdateFeature = async (id: number, status: string) => {
  await updateFeatureStatus(activeAdminKey, id, status);
  const target = allFeatures.find(f => f.id === id);
  if (target) target.status = status as 'NEW' | 'PLANNED' | 'COMPLETED';
  renderFeatures();
};

window.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form') as HTMLFormElement;
  const keyInput = document.getElementById('admin-key-input') as HTMLInputElement;
  const logoutBtn = document.getElementById('logout-btn');
  const refreshBtn = document.getElementById('refresh-btn');

  // Tab switching
  document.querySelectorAll('.nav-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tabBtn.classList.add('active');
      const targetTabId = (tabBtn as HTMLElement).dataset.tab;
      if (targetTabId) {
        document.getElementById(targetTabId)?.classList.add('active');
      }
    });
  });

  // Issue filter pills
  document.querySelectorAll('#issue-filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#issue-filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeIssueFilter = (pill as HTMLElement).dataset.filter || 'ALL';
      renderIssues();
    });
  });

  // Feature filter pills
  document.querySelectorAll('#feature-filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#feature-filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFeatureFilter = (pill as HTMLElement).dataset.filter || 'ALL';
      renderFeatures();
    });
  });

  if (activeAdminKey) {
    updateAllData().then(success => {
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
      const success = await updateAllData();
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
    refreshBtn.addEventListener('click', () => updateAllData());
  }
});
