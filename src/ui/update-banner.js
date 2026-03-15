// Drop Dead Keep — Update Banner
// Polls for new versions and shows a reload notification

const POLL_INTERVAL_MS = 60_000;
const INITIAL_DELAY_MS = 30_000;

export class UpdateBanner {
  constructor() {
    this.el = null;
    this.currentVersion = null;
    this.initialTimeout = null;
    this.pollInterval = null;
  }

  async init() {
    // Fetch current version on load
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      this.currentVersion = data.version;
      if (!this.currentVersion || this.currentVersion === 'dev') return;
    } catch {
      return;
    }

    // Start polling after initial delay
    this.initialTimeout = setTimeout(() => {
      this.check();
      this.pollInterval = setInterval(() => this.check(), POLL_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }

  async check() {
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version !== this.currentVersion) {
        this.show();
      }
    } catch {
      // Network error — ignore
    }
  }

  show() {
    if (this.el) return;

    // Stop polling once stale
    clearInterval(this.pollInterval);

    this.el = document.createElement('div');
    this.el.id = 'update-banner';
    this.el.innerHTML = `
      <span>NEW VERSION AVAILABLE</span>
      <button id="update-reload-btn">RELOAD</button>
    `;
    document.body.appendChild(this.el);

    document.getElementById('update-reload-btn').addEventListener('click', () => {
      window.location.reload();
    });
  }

  destroy() {
    clearTimeout(this.initialTimeout);
    clearInterval(this.pollInterval);
    if (this.el) this.el.remove();
  }
}
