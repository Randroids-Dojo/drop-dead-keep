// Drop Dead Keep — Feedback FAB
// Floating action button for submitting feedback as GitHub issues

import { initConsoleCapture, getCapturedLogs } from './console-capture.js';

function captureScreenshot() {
  try {
    const canvas = document.getElementById('game-canvas');
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

    const maxWidth = 320;
    const scale = Math.min(1, maxWidth / canvas.width);
    const w = Math.round(canvas.width * scale);
    const h = Math.round(canvas.height * scale);

    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const ctx = tmp.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(canvas, 0, 0, w, h);
    return tmp.toDataURL('image/jpeg', 0.5);
  } catch {
    return null;
  }
}

export class FeedbackFab {
  constructor() {
    this.view = 'closed'; // 'closed' | 'menu' | 'feedback'
    this.submitState = 'idle'; // 'idle' | 'sending' | 'success' | 'error'
    this.fabEl = null;
    this.menuEl = null;
    this.panelEl = null;
    this.textareaEl = null;

    this._onKeydown = this._onKeydown.bind(this);
    this._onClickOutside = this._onClickOutside.bind(this);
  }

  init() {
    initConsoleCapture();
    this._buildDOM();
    document.addEventListener('keydown', this._onKeydown);
    document.addEventListener('click', this._onClickOutside);
  }

  _buildDOM() {
    // FAB button
    this.fabEl = document.createElement('button');
    this.fabEl.id = 'feedback-fab';
    this.fabEl.setAttribute('aria-label', 'Open menu');
    this.fabEl.innerHTML = `
      <svg class="fab-icon fab-icon--default" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <svg class="fab-icon fab-icon--close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    `;
    this.fabEl.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggle();
    });

    // Menu
    this.menuEl = document.createElement('div');
    this.menuEl.id = 'feedback-menu';
    this.menuEl.innerHTML = `
      <button class="feedback-menu-item" id="feedback-menu-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Feedback
      </button>
    `;

    // Feedback panel
    this.panelEl = document.createElement('div');
    this.panelEl.id = 'feedback-panel';
    this.panelEl.innerHTML = `
      <div class="feedback-header"><span>// send feedback</span></div>
      <form class="feedback-form" id="feedback-form">
        <textarea class="feedback-textarea" id="feedback-textarea" placeholder="What's on your mind?" rows="4" required></textarea>
        <button type="submit" class="feedback-submit" id="feedback-submit">
          <span class="label">Send Feedback</span>
          <span class="sending">Sending\u2026</span>
          <svg class="arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
        <span class="feedback-hint">Posted as a GitHub issue \u00b7 screenshot included</span>
      </form>
      <div class="feedback-success" id="feedback-success" style="display:none">
        <div class="feedback-success-icon">\u2713</div>
        <p>Thanks for the feedback!</p>
        <p class="sub">Your message has been submitted.</p>
      </div>
    `;

    document.body.appendChild(this.fabEl);
    document.body.appendChild(this.menuEl);
    document.body.appendChild(this.panelEl);

    this.textareaEl = document.getElementById('feedback-textarea');

    document.getElementById('feedback-menu-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this._openFeedback();
    });

    document.getElementById('feedback-form').addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._handleSubmit();
    });

    // Prevent clicks inside panel from closing it
    this.panelEl.addEventListener('click', (e) => e.stopPropagation());
    this.menuEl.addEventListener('click', (e) => e.stopPropagation());
  }

  _toggle() {
    if (this.view === 'closed') {
      this._setView('menu');
    } else {
      this._setView('closed');
    }
  }

  _openFeedback() {
    this._setView('feedback');
    setTimeout(() => this.textareaEl?.focus(), 50);
  }

  _setView(view) {
    this.view = view;
    this.fabEl.classList.toggle('open', view !== 'closed');
    this.menuEl.classList.toggle('open', view === 'menu');
    this.panelEl.classList.toggle('open', view === 'feedback');
  }

  async _handleSubmit() {
    const message = this.textareaEl.value.trim();
    if (!message) return;

    const screenshot = captureScreenshot();
    const consoleLogs = getCapturedLogs();

    this._setSubmitState('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Player Feedback',
          body: message,
          context: {
            urlPath: window.location.pathname,
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString(),
            screenshot,
            consoleLogs: consoleLogs.length > 0 ? consoleLogs : null,
          },
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);

      this._setSubmitState('success');
      this.textareaEl.value = '';
      setTimeout(() => {
        this._setView('closed');
        setTimeout(() => this._setSubmitState('idle'), 350);
      }, 2000);
    } catch {
      this._setSubmitState('error');
      setTimeout(() => this._setSubmitState('idle'), 3000);
    }
  }

  _setSubmitState(state) {
    this.submitState = state;
    const submitBtn = document.getElementById('feedback-submit');
    const form = document.getElementById('feedback-form');
    const success = document.getElementById('feedback-success');

    submitBtn.className = 'feedback-submit' + (state === 'sending' ? ' sending' : '') + (state === 'error' ? ' error' : '');
    submitBtn.disabled = state === 'sending';

    const label = submitBtn.querySelector('.label');
    if (label) label.textContent = state === 'error' ? 'Failed \u2014 try again' : 'Send Feedback';

    if (state === 'success') {
      form.style.display = 'none';
      success.style.display = '';
    } else {
      form.style.display = '';
      success.style.display = 'none';
    }
  }

  _onKeydown(e) {
    if (e.key === 'Escape' && this.view !== 'closed') {
      this._setView('closed');
    }
  }

  _onClickOutside() {
    if (this.view !== 'closed') {
      this._setView('closed');
    }
  }

  /** Show/hide the FAB */
  setVisible(visible) {
    if (this.fabEl) this.fabEl.style.display = visible ? '' : 'none';
    if (!visible && this.view !== 'closed') {
      this._setView('closed');
    }
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeydown);
    document.removeEventListener('click', this._onClickOutside);
    this.fabEl?.remove();
    this.menuEl?.remove();
    this.panelEl?.remove();
  }
}
