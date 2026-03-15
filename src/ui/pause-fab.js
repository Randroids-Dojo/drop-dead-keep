// Drop Dead Keep — Pause FAB
// HTML-based pause button overlay for the game canvas

export class PauseFab {
  constructor() {
    this.el = null;
    this.visible = false;
    this._onClick = null;
  }

  init(onPause) {
    this._onClick = onPause;

    this.el = document.createElement('button');
    this.el.id = 'pause-fab';
    this.el.setAttribute('aria-label', 'Pause game');
    this.el.textContent = 'PAUSE';
    this.el.style.display = 'none';

    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._onClick) this._onClick();
    });

    document.body.appendChild(this.el);
  }

  setVisible(visible) {
    this.visible = visible;
    if (this.el) this.el.style.display = visible ? '' : 'none';
  }

  destroy() {
    this.el?.remove();
  }
}
