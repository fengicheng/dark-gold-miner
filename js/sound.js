// Web Audio API - all sounds procedurally synthesized
export class SoundManager {
    constructor() {
        this.ctx = null;
        this.darkBoost = 1.0;
        this.bgm = null;
        this.bgmGain = null;
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
        o.stop(now + duration + 0.01);
    }

    playShoot() {
        this.ensure();
        const now = this.ctx.currentTime;
        const g = this._gain(0.15);
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(600, now);
        o.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        o.connect(g);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        o.start(now);
        o.stop(now + 0.11);
    }

    playKill(type) {
        this.ensure();
        this._osc('sawtooth', 120, 0.2, 0.2);
        this._osc('square', 80, 0.15, 0.1);
        if (type === 'fast') setTimeout(() => this._osc('sine', 800, 0.1, 0.1), 50);
        else if (type === 'heavy') this._osc('sine', 60, 0.4, 0.2);
        else if (type === 'stealth') setTimeout(() => this._osc('sine', 1200, 0.15, 0.12), 30);
    }

    playHit() {
        this._osc('square', 200, 0.08, 0.15);
        this._osc('sawtooth', 150, 0.05, 0.1);
    }

    playFootstep(type, pan) {
        this.ensure();
        const now = this.ctx.currentTime;
        const g = this.ctx.createGain();
        g.gain.value = 0.04 * this.darkBoost;
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        g.connect(panner);
        panner.connect(this.ctx.destination);
        const o = this.ctx.createOscillator();
        switch (type) {
            case 'normal': o.type = 'triangle'; o.frequency.value = 100 + Math.random() * 30; break;
            case 'fast': o.type = 'sine'; o.frequency.value = 300 + Math.random() * 50; break;
            case 'heavy': o.type = 'sine'; o.frequency.value = 50 + Math.random() * 15; g.gain.value = 0.08 * this.darkBoost; break;
            default: o.type = 'triangle'; o.frequency.value = 100;
        }
        o.connect(g);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        o.start(now);
        o.stop(now + 0.09);
    }

    playBomberBeep() {
        this._osc('square', 1000, 0.05, 0.2);
        setTimeout(() => this._osc('square', 1200, 0.04, 0.15), 60);
    }

    playIlluminate() {
        this._osc('sine', 400, 0.15, 0.1);
        this._osc('sine', 600, 0.1, 0.06);
    }

    playBaseHit() {
        this._osc('sawtooth', 200, 0.3, 0.3);
        this._osc('square', 300, 0.25, 0.2);
        setTimeout(() => this._osc('sawtooth', 150, 0.2, 0.25), 100);
    }

    playBaseDestroy() {
        this._osc('sawtooth', 200, 0.5, 0.35);
        this._osc('square', 100, 0.6, 0.3);
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => this._osc('sawtooth', 2000 + Math.random() * 2000, 0.05, 0.12), i * 30);
            }
        }, 200);
    }

    playHeartbeat(rate) {
        this._osc('sine', 55, 0.15, 0.12 * (0.5 + rate * 0.5));
        setTimeout(() => this._osc('sine', 45, 0.1, 0.08 * (0.5 + rate * 0.5)), 150);
    }

    playRadarBlip() {
        this._osc('sine', 1500, 0.04, 0.06);
    }

    playWind() {
        this.ensure();
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180;
        const g = this._gain(0.04);
        source.connect(filter);
        filter.connect(g);
        source.start(now);
    }

    playPowerup() {
        this._osc('sine', 600, 0.1, 0.15);
        setTimeout(() => this._osc('sine', 900, 0.1, 0.15), 80);
        setTimeout(() => this._osc('sine', 1200, 0.12, 0.15), 160);
    }

    playLevelUp() {
        [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._osc('sine', f, 0.2, 0.18), i * 120));
    }

    playGameOver() {
        [400, 350, 300, 250].forEach((f, i) => setTimeout(() => this._osc('sine', f, 0.3, 0.18), i * 200));
    }

    playSonar() {
        this._osc('sine', 500, 0.3, 0.15);
        setTimeout(() => this._osc('sine', 400, 0.4, 0.1), 100);
    }

    playReload() {
        this.ensure();
        const now = this.ctx.currentTime;
        // Metallic click sequence simulating magazine swap
        const g1 = this._gain(0.12);
        const o1 = this.ctx.createOscillator();
        o1.type = 'square';
        o1.frequency.setValueAtTime(300, now);
        o1.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        o1.connect(g1);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o1.start(now);
        o1.stop(now + 0.21);

        // Magazine insert click
        setTimeout(() => {
            this._osc('square', 500, 0.06, 0.15);
            this._osc('triangle', 350, 0.04, 0.1);
        }, 600);

        // Chamber rack
        setTimeout(() => {
            this._osc('sawtooth', 200, 0.08, 0.12);
            this._osc('square', 400, 0.05, 0.1);
        }, 900);
    }

    playDarkWhisper() {
        this.ensure();
        const now = this.ctx.currentTime;
        // Low rumbling whisper effect
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.03;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 200;
        filter.Q.value = 3;

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.15 * this.darkBoost, now + 0.5);
        g.gain.linearRampToValueAtTime(0.08 * this.darkBoost, now + 1.2);
        g.gain.linearRampToValueAtTime(0, now + 2.0);
        g.connect(this.ctx.destination);

        // Deep tone underneath
        const oLow = this.ctx.createOscillator();
        oLow.type = 'sine';
        oLow.frequency.setValueAtTime(65, now);
        oLow.frequency.linearRampToValueAtTime(45, now + 2.0);
        const gLow = this.ctx.createGain();
        gLow.gain.setValueAtTime(0, now);
        gLow.gain.linearRampToValueAtTime(0.1 * this.darkBoost, now + 0.3);
        gLow.gain.linearRampToValueAtTime(0, now + 2.0);
        gLow.connect(this.ctx.destination);
        oLow.connect(gLow);
        oLow.start(now);
        oLow.stop(now + 2.1);

        source.connect(filter);
        filter.connect(g);
        source.start(now);
        source.stop(now + 2.1);
    }

    async playBGM() {
        this.ensure();
        this.stopBGM();
        try {
            const resp = await fetch('bgm.mp3');
            const buf = await resp.arrayBuffer();
            const audioBuf = await this.ctx.decodeAudioData(buf);
            this.bgm = this.ctx.createBufferSource();
            this.bgm.buffer = audioBuf;
            this.bgm.loop = true;
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.3;
            this.bgm.connect(this.bgmGain);
            this.bgmGain.connect(this.ctx.destination);
            this.bgm.start(0);
        } catch (e) {
            console.warn('BGM load failed:', e);
        }
    }

    stopBGM() {
        if (this.bgm) {
            try { this.bgm.stop(); } catch (e) {}
            this.bgm = null;
        }
    }

    playFlare() {
        this.ensure();
        const now = this.ctx.currentTime;
        const g = this._gain(0.15);
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(300, now);
        o.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
        o.connect(g);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o.start(now);
        o.stop(now + 0.31);
    }
}
