// Main game entry point - state machine & game loop
import { CONFIG } from './config.js';
import { Input } from './input.js';
import { PhaseController, Phase } from './phases.js';
import { Renderer } from './renderer.js';
import { Hook, HookState } from './hook.js';
import { Item, generateItems } from './items.js';
import { SoundManager } from './sound.js';
import { PowerupManager } from './powerups.js';
import { HUD } from './hud.js';
import { Tutorial } from './tutorial.js';
import { getTargetScore, getLevelConfig } from './levels.js';

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    ROUND_END: 'roundEnd',
    LEVEL_UP: 'levelUp',
    GAME_OVER: 'gameOver',
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        this.input = new Input(this.canvas);
        this.renderer = new Renderer(this.canvas);
        this.sound = new SoundManager();
        this.phase = new PhaseController();
        this.hook = new Hook();
        this.powerups = new PowerupManager();
        this.hud = new HUD();
        this.tutorial = new Tutorial();

        this.state = GameState.MENU;
        this.level = 1;
        this.score = 0;
        this.elapsed = 0;
        this.items = [];
        this.particles = [];
        this.mistakes = 0;
        this.consecutiveMistakes = 0;
        this.consecutiveSuccess = 0;
        this.expertMode = false;
        this.expertStreak = 0;
        this.heartbeatTimer = 0;
        this.windTimer = 0;
        this.retractTrail = null;
        this.lastTime = 0;
        this.tutorialAutoFireTimer = 0;

        // Adaptive difficulty
        this.adaptiveStruggling = false;
        this.adaptiveDoingWell = false;

        // UI overlays
        this.menuDiv = document.getElementById('menuScreen');
        this.endDiv = document.getElementById('endScreen');
        this.endTitle = document.getElementById('endTitle');
        this.endScore = document.getElementById('endScore');
        this.endBtn = document.getElementById('endBtn');
        this.startBtn = document.getElementById('startBtn');
        this.expertBtn = document.getElementById('expertBtn');
        this.expertInfo = document.getElementById('expertInfo');

        this.startBtn.addEventListener('click', () => this.startGame());
        this.endBtn.addEventListener('click', () => this.handleEndAction());
        if (this.expertBtn) {
            this.expertBtn.addEventListener('click', () => {
                this.expertMode = !this.expertMode;
                this.expertBtn.textContent = this.expertMode ? '高手模式: 开' : '高手模式: 关';
            });
        }

        this.showMenu();
        requestAnimationFrame(t => this.loop(t));
    }

    showMenu() {
        this.state = GameState.MENU;
        this.menuDiv.style.display = 'flex';
        this.endDiv.style.display = 'none';
        // Show expert button if unlocked
        if (this.expertStreak >= CONFIG.EXPERT_UNLOCK_STREAK && this.expertBtn) {
            this.expertBtn.style.display = 'block';
            this.expertInfo.style.display = 'block';
        }
    }

    startGame() {
        this.sound.ensure();
        this.menuDiv.style.display = 'none';
        this.endDiv.style.display = 'none';
        this.level = 1;
        this.score = 0;
        this.mistakes = 0;
        this.consecutiveMistakes = 0;
        this.consecutiveSuccess = 0;
        this.startRound();

        // Tutorial check
        if (this.tutorial.shouldRun()) {
            this.tutorial.start();
        }
    }

    startRound() {
        this.state = GameState.PLAYING;
        this.elapsed = 0;
        this.score = 0;
        this.mistakes = 0;
        this.consecutiveMistakes = 0;
        this.consecutiveSuccess = 0;
        this.particles = [];
        this.retractTrail = null;

        this.phase.reset();
        this.phase.adaptiveDelay = this.adaptiveStruggling ? CONFIG.ADAPTIVE_DARK_DELAY : 0;
        this.hook.reset();
        this.powerups.reset();
        this.items = generateItems(this.level);

        const cfg = getLevelConfig(this.level);
        // Could adjust hook swing speed per level here
    }

    handleEndAction() {
        if (this.state === GameState.LEVEL_UP) {
            this.level++;
            this.startRound();
            this.endDiv.style.display = 'none';
        } else {
            this.showMenu();
        }
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        if (this.state === GameState.PLAYING) {
            this.update(dt);
        }
        this.draw();

        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        this.elapsed += dt;
        const timeLeft = CONFIG.ROUND_DURATION - this.elapsed;

        // Phase update
        this.phase.update(this.elapsed);
        this.sound.setDarkBoost(this.phase.isDark());

        // Heartbeat in dark
        if (this.phase.isDark()) {
            this.heartbeatTimer += dt;
            const rate = 1 - timeLeft / CONFIG.ROUND_DURATION;
            if (this.heartbeatTimer > (1.2 - rate * 0.6)) {
                this.sound.playHeartbeat(rate);
                this.heartbeatTimer = 0;
            }
        }

        // Wind in dim phase
        if (this.phase.current === Phase.DIM) {
            this.windTimer += dt;
            if (this.windTimer > 3) {
                this.sound.playWind();
                this.windTimer = 0;
            }
        }

        // Update items
        for (const item of this.items) {
            item.update(dt);
        }

        // Tutorial auto-fire
        if (this.tutorial.active && this.elapsed > 2 && this.elapsed < 5) {
            this.tutorialAutoFireTimer += dt;
            if (this.tutorialAutoFireTimer > 2 && this.hook.state === HookState.SWINGING) {
                const target = this.tutorial.getAutoTarget(this.items);
                if (target) {
                    this.hook.fire(target.x, target.y);
                    this.sound.playHookFire();
                }
            }
        }

        // Input handling
        if (this.input.consumeClick()) {
            if (this.hook.state === HookState.SWINGING) {
                this.hook.fire(this.input.mouseX, this.input.mouseY);
                this.sound.playHookFire();
            }
        }

        // Aim line while holding
        if (this.input.isHolding() && this.hook.state === HookState.SWINGING) {
            this._aimTarget = { x: this.input.mouseX, y: this.input.mouseY };
        } else {
            this._aimTarget = null;
        }

        // Space bar: auto-aim at brightest glow
        if (this.input.consumeKey(' ') && this.hook.state === HookState.SWINGING) {
            const target = this._findBrightestItem();
            if (target) {
                this.hook.fire(target.x, target.y);
                this.sound.playHookFire();
            } else {
                this.hook.fireAtAngle();
                this.sound.playHookFire();
            }
        }

        // Powerup keys 1-3
        for (let i = 0; i < 3; i++) {
            if (this.input.consumeKey(`${i + 1}`)) {
                if (this.powerups.use(i, this.items)) {
                    this.sound.playPowerup();
                }
            }
        }

        // R to restart
        if (this.input.consumeKey('r') || this.input.consumeKey('R')) {
            this.startRound();
            return;
        }

        // Hook update
        const caught = this.hook.update(dt, this.items);

        // Retract trail effect
        if (this.hook.state === HookState.RETRACTING) {
            this.retractTrail = {
                x: this.hook.tipX, y: this.hook.tipY,
                ox: this.hook.originX, oy: this.hook.originY,
                alpha: 0.3,
            };
            // Retract tick sound
            if (this.hook.caughtItem && Math.random() < 0.1) {
                this.sound.playRetract(this.hook.caughtItem.weight);
            }
        } else if (this.retractTrail) {
            this.retractTrail.alpha -= dt * 3;
            if (this.retractTrail.alpha <= 0) this.retractTrail = null;
        }

        // Handle caught item
        if (caught) {
            this._onCatch(caught);
        }

        // Handle miss (hook returned with nothing)
        if (this.hook.state === HookState.SWINGING && !caught && this._wasFiring) {
            // miss
        }
        this._wasFiring = this.hook.state === HookState.FIRING;

        // Powerup update
        this.powerups.update(dt);

        // Particle update
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 80 * dt; // gravity
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // HUD update
        this.hud.update(dt);

        // Tutorial update
        this.tutorial.update(dt, this.elapsed, {
            consecutiveMistakes: this.consecutiveMistakes,
        });

        // Time up
        if (timeLeft <= 0) {
            this._endRound();
        }
    }

    _onCatch(item) {
        let points = item.points;
        const isTrap = item.type === 'sandGold' || item.type === 'rock';

        // Amulet protection
        if (isTrap && this.powerups.hasAmulet) {
            this.powerups.hasAmulet = false;
            points = 0;
            this.hud.addFloatingText(item.x, item.y - 20, '护身符!', '#FF6347', 16);
            this.hud.addScreenFlash('rgba(255,99,71,0.3)', 0.2);
        }

        // Lucky coin doubles positive
        if (this.powerups.luckyCoinActive && points > 0) {
            points *= 2;
        }

        // Expert mode bonus
        if (this.expertMode && points > 0) {
            points = Math.floor(points * CONFIG.EXPERT_SCORE_BONUS);
        }

        // Mistake tracking
        if (isTrap && points <= 0) {
            this.mistakes++;
            this.consecutiveMistakes++;
            this.consecutiveSuccess = 0;

            // Double penalty after MAX_MISTAKES
            if (this.mistakes > CONFIG.MAX_MISTAKES && item.type === 'sandGold') {
                points *= CONFIG.MISTAKE_PENALTY_MULTIPLIER;
            }
        } else if (points > 0) {
            this.consecutiveSuccess++;
            this.consecutiveMistakes = 0;
            if (this.consecutiveSuccess >= CONFIG.CONSECUTIVE_SUCCESS_TO_CLEAR && this.mistakes > 0) {
                this.mistakes--;
                this.consecutiveSuccess = 0;
            }
        }

        // Adaptive difficulty
        if (this.consecutiveMistakes >= 3) {
            this.adaptiveStruggling = true;
        }
        if (this.consecutiveSuccess >= 5) {
            this.adaptiveDoingWell = true;
        }

        this.score += points;

        // Sound
        this._playCatchSound(item);

        // Visual feedback
        this._showCatchFeedback(item, points);

        // Bag = powerup
        if (item.type === 'bag') {
            const pType = this.powerups.addRandom();
            if (pType) {
                this.sound.playPowerup();
                const info = this.powerups.getInfo(pType);
                this.hud.addFloatingText(item.x, item.y - 30, info.icon, info.color, 28);
                // Auto-activate non-manual powerups
                if (pType !== 'flashBomb' && pType !== 'echo') {
                    this.powerups.use(this.powerups.inventory.indexOf(pType), this.items);
                }
            }
        }

        // Spawn particles
        this._spawnParticles(item);
    }

    _playCatchSound(item) {
        switch (item.type) {
            case 'smallGold': this.sound.playSmallGold(); break;
            case 'medGold': this.sound.playMedGold(); break;
            case 'largeGold': this.sound.playLargeGold(); break;
            case 'diamond': this.sound.playDiamond(); break;
            case 'sandGold': this.sound.playSandGold(); break;
            case 'rock': this.sound.playRock(); break;
            case 'creature': this.sound.playCreature(); break;
            case 'bag': this.sound.playBag(); break;
        }
    }

    _showCatchFeedback(item, points) {
        if (points > 0) {
            const color = item.type === 'diamond' ? '#FFFFFF' : '#FFD700';
            this.hud.addFloatingText(this.hook.originX, this.hook.originY + 30,
                `+${points}`, color, Math.min(30, 14 + points / 10));

            if (item.type === 'diamond') {
                this.hud.addScreenFlash('rgba(255,255,255,0.3)', 0.2);
            } else if (item.type === 'largeGold') {
                this.hud.addScreenFlash('rgba(218,165,32,0.2)', 0.3);
            } else {
                this.hud.addScreenFlash('rgba(255,215,0,0.15)', 0.1);
            }
        } else if (points < 0) {
            this.hud.addFloatingText(this.hook.originX, this.hook.originY + 30,
                `${points}`, '#FF4444', 18);
            this.hud.addScreenShake(5, 0.2);
            this.hud.addScreenFlash('rgba(255,0,0,0.2)', 0.15);
        } else {
            // Rock or neutralized trap
            this.hud.addScreenShake(3, 0.15);
        }
    }

    _spawnParticles(item) {
        const colors = {
            smallGold: '#FFD700', medGold: '#FFC125', largeGold: '#DAA520',
            diamond: '#FFFFFF', sandGold: '#8B7500', rock: '#696969',
            creature: '#FFB6C1', bag: '#FF69B4',
        };
        const color = colors[item.type] || '#FFF';
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.particles.push({
                x: this.hook.originX,
                y: this.hook.originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40,
                color,
                size: 2 + Math.random() * 3,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                alpha: 1,
            });
        }
    }

    _findBrightestItem() {
        let best = null;
        let bestIntensity = 0;
        for (const item of this.items) {
            if (!item.alive) continue;
            if (item.points <= 0) continue;
            const intensity = item.getGlowIntensity();
            if (intensity > bestIntensity) {
                bestIntensity = intensity;
                best = item;
            }
        }
        return best;
    }

    _endRound() {
        const target = getTargetScore(this.level);
        if (this.score >= target) {
            this.state = GameState.LEVEL_UP;
            this.sound.playLevelUp();
            this.endTitle.textContent = '过关！';
            this.endScore.textContent = `得分: ${this.score} / ${target}`;
            this.endBtn.textContent = '下一关';

            // Expert streak
            if (this.mistakes <= 1) {
                this.expertStreak++;
            } else {
                this.expertStreak = 0;
            }
        } else {
            this.state = GameState.GAME_OVER;
            this.sound.playGameOver();
            this.endTitle.textContent = '时间到！';
            this.endScore.textContent = `得分: ${this.score} / ${target}`;
            this.endBtn.textContent = '再来一局';
            this.expertStreak = 0;
        }
        this.endDiv.style.display = 'flex';

        if (this.tutorial.active) {
            this.tutorial.complete();
        }
    }

    draw() {
        const ctx = this.renderer.ctx;
        const shake = this.hud.getShakeOffset();

        ctx.save();
        ctx.translate(shake.x, shake.y);

        this.renderer.clear();
        this.renderer.drawBackground();

        // Draw items (visible in light)
        for (const item of this.items) {
            item.draw(ctx, this.phase.darknessAlpha, 1);
        }

        // Hook
        this.hook.draw(ctx);

        // Aim line
        if (this._aimTarget && this.hook.state === HookState.SWINGING) {
            this.renderer.drawAimLine(
                this.hook.originX, this.hook.originY,
                this._aimTarget.x, this._aimTarget.y
            );
        }

        // Darkness overlay
        const darkMod = this.powerups.getDarknessModifier();
        this.renderer.drawDarknessOverlay(this.phase.darknessAlpha, darkMod);

        // Glow effects (visible through darkness)
        if (this.phase.isDimOrDarker()) {
            const pulse = this.phase.getPulseIntensity(this.elapsed);
            this.renderer.drawItemGlows(this.items, pulse);

            // Hook glow
            this.hook.drawGlow(ctx);

            // Stethoscope outlines
            if (this.powerups.isStethoscopeActive()) {
                this.renderer.drawStethoscopeOutlines(this.items);
            }

            // Night vision silhouettes
            if (this.powerups.active && this.powerups.active.type === 'nightVision') {
                this.renderer.drawNightVisionSilhouettes(this.items);
            }
        }

        // Retract trail
        if (this.retractTrail) {
            ctx.globalAlpha = this.retractTrail.alpha;
            this.renderer.drawRetractTrail(
                this.retractTrail.x, this.retractTrail.y,
                this.retractTrail.ox, this.retractTrail.oy
            );
            ctx.globalAlpha = 1;
        }

        // Particles
        this.renderer.drawParticles(this.particles);

        // Echo effect
        this.powerups.drawEcho(ctx);

        ctx.restore();

        // HUD (no shake)
        const timeLeft = Math.max(0, CONFIG.ROUND_DURATION - this.elapsed);
        this.hud.draw(ctx, this.score, getTargetScore(this.level), timeLeft, this.level, this.mistakes);

        // Powerup inventory
        this.powerups.drawInventory(ctx, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Tutorial overlay
        this.tutorial.draw(ctx, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Hover info in bright phase
        if (this.state === GameState.PLAYING && !this.phase.isDimOrDarker()) {
            this._drawHoverInfo(ctx);
        }
    }

    _drawHoverInfo(ctx) {
        for (const item of this.items) {
            if (!item.alive) continue;
            const dist = Math.hypot(this.input.mouseX - item.x, this.input.mouseY - item.y);
            if (dist < item.radius + 10) {
                ctx.font = '12px Arial';
                ctx.fillStyle = '#FFF';
                ctx.textAlign = 'center';
                ctx.fillText(item.cfg.name, item.x, item.y - item.radius - 8);
                ctx.fillText(`${item.points > 0 ? '+' : ''}${item.points}分`, item.x, item.y - item.radius - 22);
                break;
            }
        }
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
