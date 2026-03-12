// Web Audio API sound manager - all sounds synthesized procedurally
export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.darkBoost = 1.0;
    }

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    ensure() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    setDarkBoost(isDark) {
        this.darkBoost = isDark ? 1.2 : 1.0;
    }

    _gain(volume = 0.3) {
        const g = this.ctx.createGain();
        g.gain.value = volume * this.darkBoost;
        g.connect(this.ctx.destination);
        return g;
    }

    _osc(type, freq, duration, volume = 0.3) {
        this.ensure();
        const g = this._gain(volume);
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.value = freq;
        o.connect(g);
        const now = this.ctx.currentTime;
        o.start(now);
        g.gain.exponentialRampToValueAtTime(0.001, now + duration);
        o.stop(now + duration);
    }

    playHookFire() {
        this.ensure();
        const now = this.ctx.currentTime;
        const g = this._gain(0.15);
        // Noise-like swoosh using rapid frequency sweep
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, now);
        o.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        o.connect(g);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.start(now);
        o.stop(now + 0.2);
    }

    playHookMiss() {
        this._osc('sine', 300, 0.15, 0.1);
    }

    playSmallGold() {
        // Crisp "ding"
        this._osc('sine', 1200, 0.15, 0.25);
        setTimeout(() => this._osc('sine', 1500, 0.1, 0.15), 50);
    }

    playMedGold() {
        this._osc('sine', 800, 0.2, 0.25);
        setTimeout(() => this._osc('sine', 1000, 0.15, 0.15), 80);
    }

    playLargeGold() {
        // Deep "dong"
        this._osc('sine', 200, 0.5, 0.3);
        this._osc('triangle', 400, 0.3, 0.15);
    }

    playDiamond() {
        // Crystal "ting!"
        this._osc('sine', 2000, 0.3, 0.3);
        setTimeout(() => this._osc('sine', 2500, 0.2, 0.2), 60);
        setTimeout(() => this._osc('sine', 3000, 0.15, 0.15), 120);
    }

    playSandGold() {
        // Dull "puff"
        this._osc('triangle', 150, 0.2, 0.2);
    }

    playRock() {
        // Rough "crack"
        this._osc('sawtooth', 100, 0.15, 0.2);
        this._osc('square', 80, 0.1, 0.15);
    }

    playBag() {
        // Soft thud + jingle
        this._osc('sine', 300, 0.2, 0.15);
        setTimeout(() => this._osc('sine', 600, 0.15, 0.1), 100);
    }

    playCreature() {
        this._osc('sine', 500, 0.1, 0.15);
        setTimeout(() => this._osc('sine', 700, 0.1, 0.1), 80);
    }

    playRetract(weight) {
        // Gear sound, slower for heavier
        this.ensure();
        const now = this.ctx.currentTime;
        const dur = 0.05 * weight;
        const g = this._gain(0.08);
        const o = this.ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = 60 + 20 / weight;
        o.connect(g);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        o.start(now);
        o.stop(now + dur);
    }

    playHeartbeat(rate) {
        // rate: 0-1, higher = faster
        this._osc('sine', 60, 0.15, 0.15 * (0.5 + rate * 0.5));
        setTimeout(() => this._osc('sine', 50, 0.1, 0.1 * (0.5 + rate * 0.5)), 150);
    }

    playPowerup() {
        this._osc('sine', 600, 0.1, 0.2);
        setTimeout(() => this._osc('sine', 900, 0.1, 0.2), 100);
        setTimeout(() => this._osc('sine', 1200, 0.15, 0.2), 200);
    }

    playExplosion() {
        this._osc('sawtooth', 80, 0.4, 0.35);
        this._osc('square', 50, 0.5, 0.25);
    }

    playLevelUp() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
            setTimeout(() => this._osc('sine', f, 0.2, 0.2), i * 120);
        });
    }

    playGameOver() {
        const notes = [400, 350, 300, 250];
        notes.forEach((f, i) => {
            setTimeout(() => this._osc('sine', f, 0.3, 0.2), i * 200);
        });
    }

    // Wind ambient for dim phase
    playWind() {
        this.ensure();
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.02;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        const g = this._gain(0.05);
        source.connect(filter);
        filter.connect(g);
        source.start(now);
    }
}
