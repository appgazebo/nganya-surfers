export class Analytics {
  private static visitorIdKey = 'nganya_analytics_vid';
  private static visitorId: string = Analytics.getOrCreateVisitorId();
  private static visitTracked: boolean = false;

  private static getOrCreateVisitorId(): string {
    try {
      let id = localStorage.getItem(Analytics.visitorIdKey);
      if (!id) {
        id = 'v_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem(Analytics.visitorIdKey, id);
      }
      return id;
    } catch {
      return 'v_temp_' + Math.random().toString(36).substring(2, 10);
    }
  }

  private static send(event_type: 'VISIT' | 'PLAY' | 'GAME_OVER', extra: { distance?: number; coins?: number } = {}) {
    try {
      const payload = {
        event_type,
        visitor_id: Analytics.visitorId,
        referrer: document.referrer || 'Direct',
        distance: extra.distance || 0,
        coins: extra.coins || 0
      };

      const bodyStr = JSON.stringify(payload);

      // Primary send via fetch (most reliable across mobile browsers & PWAs)
      fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: bodyStr,
        keepalive: true
      }).catch(() => {
        // Fallback to absolute production domain if relative path fails in standalone PWA mode
        fetch('https://nganyarunner.humblesherrif.online/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr
        }).catch(() => {});
      });
    } catch {
      // Ignore background tracking failures gracefully
    }
  }

  public static trackVisit() {
    if (Analytics.visitTracked) return;
    Analytics.visitTracked = true;
    Analytics.send('VISIT');
  }

  public static trackPlay() {
    Analytics.send('PLAY');
  }

  public static trackGameOver(distance: number, coins: number) {
    Analytics.send('GAME_OVER', { distance, coins });
  }
}
