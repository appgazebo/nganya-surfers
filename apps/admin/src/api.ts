export interface IssueReport {
  id: number;
  title: string;
  description: string;
  category: string;
  device: string;
  browser: string;
  country: string;
  contact: string;
  status: 'OPEN' | 'RESOLVED';
  created_at: string;
}

export interface FeatureSuggestion {
  id: number;
  title: string;
  description: string;
  submitter_name: string;
  contact: string;
  category: string;
  upvotes: number;
  status: 'NEW' | 'PLANNED' | 'COMPLETED';
  created_at: string;
}

export interface AnalyticsStats {
  totals: {
    totalVisitors: number;
    totalVisits: number;
    totalPlays: number;
    totalCompleted: number;
    bestDistance: number;
    avgDistance: number;
  };
  topCountries: { country: string; count: number }[];
  topCities: { city: string; country: string; count: number }[];
  devices: { device: string; count: number }[];
  recentActivity: {
    id: number;
    event_type: 'VISIT' | 'PLAY' | 'GAME_OVER';
    country: string;
    city: string;
    device: string;
    distance: number;
    coins: number;
    created_at: string;
  }[];
  timestamp: string;
}

const COUNTRY_NAMES: Record<string, { name: string; flag: string }> = {
  KE: { name: 'Kenya', flag: '🇰🇪' },
  US: { name: 'United States', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  TZ: { name: 'Tanzania', flag: '🇹🇿' },
  UG: { name: 'Uganda', flag: '🇺🇬' },
  RW: { name: 'Rwanda', flag: '🇷🇼' },
  ZA: { name: 'South Africa', flag: '🇿🇦' },
  NG: { name: 'Nigeria', flag: '🇳🇬' },
  GH: { name: 'Ghana', flag: '🇬🇭' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  FR: { name: 'France', flag: '🇫🇷' },
  IN: { name: 'India', flag: '🇮🇳' },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪' }
};

export function getCountryDetails(code: string): { name: string; flag: string } {
  if (!code || code === 'Unknown') return { name: 'Unknown Location', flag: '🌐' };
  const upper = code.toUpperCase();
  if (COUNTRY_NAMES[upper]) return COUNTRY_NAMES[upper];

  // Convert 2-letter ISO to flag emoji
  const flag = upper.replace(/./g, char =>
    String.fromCodePoint(char.charCodeAt(0) + 127397)
  );
  return { name: upper, flag };
}

export function formatTimeAgo(dateStr: string): string {
  try {
    const past = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z').getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return dateStr;
  }
}

export async function fetchStats(adminKey: string): Promise<AnalyticsStats> {
  const endpoints = [
    'https://nganyarunner.humblesherrif.online/api/stats',
    'https://nganyarunner.pages.dev/api/stats',
    '/api/stats'
  ];

  let lastError = 'Failed to connect to analytics endpoint';

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'x-admin-key': adminKey
        }
      });

      if (resp.status === 401 || resp.status === 403) {
        throw new Error('401_UNAUTHORIZED');
      }

      if (resp.ok) {
        return await resp.json();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === '401_UNAUTHORIZED') {
        throw err;
      }
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(lastError);
}

export async function fetchIssues(adminKey: string): Promise<IssueReport[]> {
  const endpoints = [
    'https://nganyarunner.humblesherrif.online/api/issues',
    'https://nganyarunner.pages.dev/api/issues',
    '/api/issues'
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json', 'x-admin-key': adminKey }
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.issues || [];
      }
    } catch {
      // try next
    }
  }
  return [];
}

export async function updateIssueStatus(adminKey: string, id: number, status: string): Promise<boolean> {
  const endpoints = [
    'https://nganyarunner.humblesherrif.online/api/issues',
    'https://nganyarunner.pages.dev/api/issues',
    '/api/issues'
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, status })
      });
      if (resp.ok) return true;
    } catch {
      // try next
    }
  }
  return false;
}

export async function fetchFeatures(adminKey: string): Promise<FeatureSuggestion[]> {
  const endpoints = [
    'https://nganyarunner.humblesherrif.online/api/features',
    'https://nganyarunner.pages.dev/api/features',
    '/api/features'
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json', 'x-admin-key': adminKey }
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.features || [];
      }
    } catch {
      // try next
    }
  }
  return [];
}

export async function updateFeatureStatus(adminKey: string, id: number, status: string): Promise<boolean> {
  const endpoints = [
    'https://nganyarunner.humblesherrif.online/api/features',
    'https://nganyarunner.pages.dev/api/features',
    '/api/features'
  ];

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ id, status })
      });
      if (resp.ok) return true;
    } catch {
      // try next
    }
  }
  return false;
}
