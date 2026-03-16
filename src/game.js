// Drop Dead Keep — Core Game Loop & State Machine

export const GameState = {
  TITLE: 'title',
  LEVEL_SELECT: 'level_select',
  PRE_LEVEL: 'pre_level',
  PLAYING: 'playing',
  GATE_DEFENSE: 'gate_defense',
  WAVE_CLEAR: 'wave_clear',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
  PAUSED: 'paused',
};

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.state = GameState.TITLE;
    this.prevState = null;
    this.currentLevel = null;
    this.dt = 0;
    this.lastTime = 0;
    this.systems = {};
    this.transition = null;
    this.transitionAlpha = 0;

    // Player progress
    this.progress = this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('ddk-progress');
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return {
      levelsCompleted: {},
      stars: {},
      highScores: {},
      unlockedAmmo: ['boulder'],
      bestiary: [],
    };
  }

  saveProgress() {
    try {
      localStorage.setItem('ddk-progress', JSON.stringify(this.progress));
    } catch (e) { /* ignore */ }
  }

  setState(newState) {
    this.prevState = this.state;
    this.state = newState;
  }

  update(time) {
    this.dt = Math.min((time - this.lastTime) / 1000, 0.05); // Cap at 50ms
    this.lastTime = time;
  }
}
