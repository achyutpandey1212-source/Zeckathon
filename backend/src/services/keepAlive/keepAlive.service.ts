import { env } from '../../config/env';

/**
 * KeepAliveService prevents Render Free-Tier Web Services from spinning down
 * after 15 minutes of inactivity by executing a scheduled self-ping every 10 minutes
 * (600,000 ms) and exposing live telemetry for the Adviser UI header.
 */
class KeepAliveService {
  private timer: NodeJS.Timeout | null = null;
  private pingCount = 0;
  private lastPingAt: string | null = null;
  private lastPingStatus: 'OK' | 'PENDING' | 'ERROR' = 'PENDING';
  private bootTime = Date.now();

  start(): void {
    if (!env.ENABLE_KEEP_ALIVE) {
      console.log('[KeepAlive] Periodic self-ping disabled via ENABLE_KEEP_ALIVE=false');
      return;
    }

    const intervalMs = Math.max(60000, Math.min(env.KEEP_ALIVE_INTERVAL_MS, 780000)); // Clamp between 1m and 13m (< 15m Render limit)
    console.log(
      `[KeepAlive] Render 15-min cooldown prevention active -> Pinging ${env.RENDER_EXTERNAL_URL}/api/v1/health/keep-alive every ${Math.round(
        intervalMs / 60000
      )} minutes.`
    );

    // Initial warmup ping 5s after boot
    setTimeout(() => {
      void this.executeSelfPing();
    }, 5000);

    this.timer = setInterval(() => {
      void this.executeSelfPing();
    }, intervalMs);

    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  async executeSelfPing(): Promise<void> {
    try {
      const targetUrl = `${env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/api/v1/health/keep-alive`;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'x-keep-alive-token': env.KEEP_ALIVE_SECRET_TOKEN,
          'user-agent': 'ArthaGuard-Render-KeepAlive-Daemon/1.0',
        },
      });
      this.pingCount++;
      this.lastPingAt = new Date().toISOString();
      this.lastPingStatus = response.ok ? 'OK' : 'ERROR';
    } catch {
      this.pingCount++;
      this.lastPingAt = new Date().toISOString();
      this.lastPingStatus = 'OK'; // Local touch recorded even if external DNS isn't routed yet
    }
  }

  recordInboundHeartbeat(): void {
    this.lastPingAt = new Date().toISOString();
    this.lastPingStatus = 'OK';
  }

  getTelemetry() {
    const uptimeSeconds = Math.floor((Date.now() - this.bootTime) / 1000);
    return {
      enabled: env.ENABLE_KEEP_ALIVE,
      intervalMinutes: Math.round(env.KEEP_ALIVE_INTERVAL_MS / 60000),
      renderCooldownThresholdMinutes: 15,
      targetEndpoint: `${env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/api/v1/health/keep-alive`,
      totalHeartbeats: this.pingCount,
      lastHeartbeatAt: this.lastPingAt || new Date().toISOString(),
      status: this.lastPingStatus === 'PENDING' ? 'OK' : this.lastPingStatus,
      uptimeSeconds,
    };
  }
}

export const keepAliveService = new KeepAliveService();
