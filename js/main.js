// Main game - Dark Domain Defense (暗域防线)
import { CONFIG } from './config.js';
import { Input } from './input.js';
import { PhaseController, Phase } from './phases.js';
import { Renderer } from './renderer.js';
import { Turret, Bullet } from './turret.js';
import { Enemy, WaveSpawner } from './enemies.js';
import { SoundManager } from './sound.js';
import { PowerupManager } from './powerups.js';
import { HUD } from './hud.js';
import { Radar } from './radar.js';
import { Tutorial } from './tutorial.js';
import { getTargetScore } from './levels.js';

const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
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
        this.turret = new Turret();
        this.radar = new Radar();
        this.powerups = new PowerupManager();
        this.hud = new HUD();
        this.tutorial = new Tutorial();
        this.spawner = new WaveSpawner();

        this.state = GameState.MENU;
        this.level = 1;
        this.savedLevel = 1; // 进度暂存：已通过的最高关卡+1
        this.score = 0;
        this.lives = CONFIG.MAX_LIVES;
        this.elapsed = 0;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.illuminations = []; // {x, y, timer}
        this.hitFeedback = 0;
        this.heartbeatTimer = 0;
        this.windTimer = 0;
        this.footstepTimers = {};
        this.lastTime = 0;
        this.darkWhisperPlayed = false;
        this.prevPhase = null;

        // UI
        this.menuDiv = document.getElementById('menuScreen');
        this.endDiv = document.getElementById('endScreen');
        this.endTitle = document.getElementById('endTitle');
        this.endScore = document.getElementById('endScore');
        this.endBtn = document.getElementById('endBtn');
        this.startBtn = document.getElementById('startBtn');

        this.startBtn.addEventListener('click', () => this.startGame());
        this.endBtn.addEventListener('click', () => this.handleEndAction());

        this.showMenu();
        requestAnimationFrame(t => this.loop(t));
    }

    showMenu() {
        this.state = GameState.MENU;
        this.menuDiv.style.display = 'flex';
        this.endDiv.style.display = 'none';
    }

    startGame() {
        this.sound.ensure();
        this.menuDiv.style.display = 'none';
        this.endDiv.style.display = 'none';
        this.level = this.savedLevel;
        this.startRound();
        if (this.tutorial.shouldRun()) this.tutorial.start();
    }

    startRound() {
        this.state = GameState.PLAYING;
        this.elapsed = 0;
        this.score = 0;
        this.lives = CONFIG.MAX_LIVES;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.illuminations = [];
        this.hitFeedback = 0;
        this.heartbeatTimer = 0;
        this.footstepTimers = {};

        this.phase.reset();
        this.turret.reset();
        this.radar.reset();
        this.powerups.reset();
        this.spawner.reset(this.level);
        this.darkWhisperPlayed = false;
    }

    handleEndAction() {
        if (this.state === GameState.LEVEL_UP) {
            this.level++;
            this.savedLevel = this.level; // 暂存进度
            this.startRound();
            this.endDiv.style.display = 'none';
        } else {
            // 失败后从当前关重新开始
            this.startRound();
            this.endDiv.style.display = 'none';
        }
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        if (this.state === GameState.PLAYING) this.update(dt);
        this.draw();

        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        this.elapsed += dt;
        const timeLeft = CONFIG.ROUND_DURATION - this.elapsed;

        // Phase
        const prevPhase = this.phase.current;
        this.phase.update(this.elapsed);
        this.sound.setDarkBoost(this.phase.isDark());
        const speedMult = this.phase.getSpeedMultiplier();

        // Dark whisper when entering dark phase
        if (this.phase.isDark() && !this.darkWhisperPlayed) {
            this.sound.playDarkWhisper();
            this.darkWhisperPlayed = true;
        }
        if (!this.phase.isDark()) {
            this.darkWhisperPlayed = false;
        }

        // Rapid fire powerup
        this.turret.fireRateMultiplier = this.powerups.isRapidFireActive() ? CONFIG.RAPID_FIRE_MULT : 1;

        // Turret
        this.turret.update(dt, this.input.mouseX, this.input.mouseY);

        // Shooting - click or hold
        if (this.input.mouseDown || this.input.consumeClick()) {
            if (this.turret.canFire()) {
                const wasNotReloading = !this.turret.reloading;
                const bullet = this.turret.fire(this.input.mouseX, this.input.mouseY);
                if (bullet) {
                    this.bullets.push(bullet);
                    this.sound.playShoot();
                    // Play reload sound when magazine empties
                    if (this.turret.reloading && wasNotReloading) {
                        this.sound.playReload();
                    }
                }
            }
        }

        // Powerup keys 1-3
        for (let i = 0; i < 3; i++) {
            if (this.input.consumeKey(`${i + 1}`)) {
                if (this.powerups.use(i)) {
                    if (this.powerups.isFlareActive()) this.sound.playFlare();
                    else this.sound.playSonar();
                }
            }
        }

        // R 清零全部进度，回到第一关
        if (this.input.consumeKey('r') || this.input.consumeKey('R')) {
            this.level = 1;
            this.savedLevel = 1;
            this.startRound();
            return;
        }

        // Spawn enemies
        this.spawner.update(dt, this.elapsed, this.enemies);

        // Update enemies
        let closestDist = Infinity;
        for (const enemy of this.enemies) {
            enemy.update(dt, speedMult);
            const d = enemy.distToTurret();
            if (d < closestDist && enemy.alive) closestDist = d;

            // Bomber beep
            if (enemy.type === 'bomber' && enemy.bomberActive && enemy.alive) {
                enemy.beepTimer += dt;
                if (enemy.beepTimer >= enemy.beepInterval) {
                    enemy.beepTimer = 0;
                    this.sound.playBomberBeep();
                }
            }

            // Footstep sounds (throttled per enemy type)
            if (enemy.alive && this.phase.isDimOrDarker() && enemy.type !== 'stealth') {
                const key = enemy.type;
                if (!this.footstepTimers[key]) this.footstepTimers[key] = 0;
                this.footstepTimers[key] += dt;
                const interval = enemy.type === 'fast' ? 0.3 : enemy.type === 'heavy' ? 0.8 : 0.5;
                if (this.footstepTimers[key] >= interval) {
                    this.footstepTimers[key] = 0;
                    const pan = (enemy.x - CONFIG.TURRET_X) / (CONFIG.CANVAS_WIDTH / 2);
                    this.sound.playFootstep(enemy.type, pan);
                }
            }

            // Enemy reaches base
            if (enemy.alive && enemy.reachedBase()) {
                enemy.alive = false;

                // Bomber = instant game over
                if (enemy.type === 'bomber') {
                    this.sound.playBaseDestroy();
                    this.hud.addScreenShake(15, 0.5);
                    this.hud.addScreenFlash('rgba(255,0,0,0.6)', 0.4);
                    this.lives = 0;
                } else if (this.powerups.useShield()) {
                    this.hud.addFloatingText(CONFIG.TURRET_X, CONFIG.TURRET_Y - 30, '护盾!', '#4488FF', 18);
                    this.hud.addScreenFlash('rgba(68,136,255,0.3)', 0.2);
                    this.sound.playHit();
                } else {
                    this.lives--;
                    this.hud.addScreenShake(8, 0.3);
                    if (this.lives <= 0) {
                        this.sound.playBaseDestroy();
                        this.hud.addScreenFlash('rgba(255,0,0,0.5)', 0.5);
                    } else {
                        this.sound.playBaseHit();
                        this.hud.addScreenFlash('rgba(255,0,0,0.3)', 0.2);
                    }
                }

                if (this.lives <= 0) {
                    this._endRound(false);
                    return;
                }
            }
        }

        // Update bullets
        for (const bullet of this.bullets) {
            bullet.update(dt);
        }

        // Bullet-enemy collision
        for (const bullet of this.bullets) {
            if (!bullet.alive) continue;
            for (const enemy of this.enemies) {
                if (!enemy.alive) continue;
                // Stealth: only hittable if illuminated or flare/sonar/nightvision active
                if (enemy.type === 'stealth' && !enemy.illuminated &&
                    !this.powerups.isFlareActive() && !this.powerups.isSonarActive() &&
                    !this.powerups.isNightVisionActive() && this.phase.isDimOrDarker()) {
                    continue;
                }
                const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
                if (dist < enemy.radius + CONFIG.BULLET_RADIUS) {
                    bullet.alive = false;
                    const killed = enemy.hit();
                    if (killed) {
                        this._onKill(enemy);
                    } else {
                        this.sound.playHit();
                        this.hud.addFloatingText(enemy.x, enemy.y - 20, '!', '#FF8800', 14);
                    }
                    this.hitFeedback = 0.3;
                    break;
                }
            }
        }

        // Cleanup
        this.bullets = this.bullets.filter(b => b.alive);
        this.enemies = this.enemies.filter(e => e.alive || e.illuminateTimer > 0);

        // Illumination timers
        for (const ill of this.illuminations) {
            ill.timer -= dt;
        }
        this.illuminations = this.illuminations.filter(i => i.timer > 0);

        // Particles
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 100 * dt;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // Hit feedback decay
        if (this.hitFeedback > 0) this.hitFeedback = Math.max(0, this.hitFeedback - dt * 3);

        // Radar
        this.radar.update(dt, this.enemies, this.elapsed);

        // Powerups
        this.powerups.update(dt);

        // HUD
        this.hud.update(dt, closestDist);

        // Tutorial
        this.tutorial.update(dt);

        // Heartbeat
        if (this.phase.isDark()) {
            this.heartbeatTimer += dt;
            const rate = 1 - timeLeft / CONFIG.ROUND_DURATION;
            if (this.heartbeatTimer > (1.2 - rate * 0.6)) {
                this.sound.playHeartbeat(rate);
                this.heartbeatTimer = 0;
            }
        }

        // Wind
        if (this.phase.current === Phase.DIM) {
            this.windTimer += dt;
            if (this.windTimer > 3) { this.sound.playWind(); this.windTimer = 0; }
        }

        // Time up check
        if (timeLeft <= 0) {
            const target = getTargetScore(this.level);
            this._endRound(this.score >= target);
        }
    }

    _onKill(enemy) {
        this.score += enemy.points;
        this.sound.playKill(enemy.type);

        // Floating score
        this.hud.addFloatingText(enemy.x, enemy.y - 20, `+${enemy.points}`, '#FFD700', 16);
        this.hud.addScreenFlash('rgba(255,255,255,0.15)', 0.1);

        // Kill illumination
        this.illuminations.push({ x: enemy.x, y: enemy.y, timer: CONFIG.ILLUMINATE_DURATION });
        this.sound.playIlluminate();

        // Illuminate nearby enemies
        for (const other of this.enemies) {
            if (!other.alive || other === enemy) continue;
            const dist = Math.hypot(other.x - enemy.x, other.y - enemy.y);
            if (dist < CONFIG.ILLUMINATE_RADIUS) {
                other.illuminate();
            }
        }

        // Particles
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            this.particles.push({
                x: enemy.x, y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                color: enemy.particleColor,
                size: 2 + Math.random() * 3,
                life: 0.4 + Math.random() * 0.4,
                maxLife: 0.8,
                alpha: 1,
            });
        }

        // Light ring
        this.particles.push({
            x: enemy.x, y: enemy.y, vx: 0, vy: 0,
            color: 'rgba(255,200,100,0.3)',
            size: 5, life: 0.3, maxLife: 0.3, alpha: 1,
            isRing: true,
        });

        // Powerup drop
        this.powerups.tryDrop(enemy.x, enemy.y, enemy.dropRate);
    }

    _endRound(won) {
        const target = getTargetScore(this.level);
        if (won) {
            this.state = GameState.LEVEL_UP;
            this.sound.playLevelUp();
            this.endTitle.textContent = '防线守住了！';
            this.endScore.textContent = `得分: ${this.score} / ${target}`;
            this.endBtn.textContent = '下一关';
        } else {
            this.state = GameState.GAME_OVER;
            this.sound.playGameOver();
            this.endTitle.textContent = this.lives <= 0 ? '基地沦陷！' : '时间到！';
            this.endScore.textContent = `得分: ${this.score} / ${target}`;
            this.endBtn.textContent = this.level > 1 ? `重试第${this.level}关` : '再来一局';
        }
        this.endDiv.style.display = 'flex';
        if (this.tutorial.active) this.tutorial.complete();
    }

    draw() {
        const ctx = this.renderer.ctx;
        const shake = this.hud.getShakeOffset();

        ctx.save();
        ctx.translate(shake.x, shake.y);

        this.renderer.clear();
        this.renderer.drawBackground();

        // Draw enemies (visible in bright phase or when illuminated)
        const flareActive = this.powerups.isFlareActive();
        const nvActive = this.powerups.isNightVisionActive();
        const sonarActive = this.powerups.isSonarActive();

        if (!this.phase.isDimOrDarker() || flareActive) {
            // Full visibility
            for (const enemy of this.enemies) {
                if (enemy.alive) enemy.draw(ctx);
            }
        }

        // Turret (always visible)
        this.turret.draw(ctx);

        // Bullets (always visible - they're glowing projectiles)
        for (const bullet of this.bullets) {
            bullet.draw(ctx);
        }

        // Darkness overlay
        let darknessAlpha = this.phase.darknessAlpha;
        if (flareActive) darknessAlpha = 0;
        this.renderer.drawDarknessOverlay(darknessAlpha);

        // In dark: draw illuminated enemies as silhouettes
        if (this.phase.isDimOrDarker() && !flareActive) {
            // Illumination circles
            for (const ill of this.illuminations) {
                const alpha = ill.timer / CONFIG.ILLUMINATE_DURATION;
                this.renderer.drawIllumination(ctx, ill.x, ill.y, alpha);
            }

            // Illuminated enemy silhouettes
            for (const enemy of this.enemies) {
                if (enemy.alive && enemy.illuminated) {
                    enemy.drawSilhouette(ctx);
                }
            }

            // Night vision outlines
            if (nvActive) {
                for (const enemy of this.enemies) {
                    if (enemy.alive) enemy.drawNightVision(ctx);
                }
            }

            // Sonar reveals
            if (sonarActive) {
                for (const enemy of this.enemies) {
                    if (enemy.alive) enemy.drawSilhouette(ctx);
                }
            }
        }

        // Particles (always visible - they glow)
        this.renderer.drawParticles(this.particles);

        // Powerup drops
        this.powerups.drawDrops(ctx);
        this.powerups.drawSonarWaves(ctx);

        ctx.restore();

        // HUD (no shake)
        const timeLeft = Math.max(0, CONFIG.ROUND_DURATION - this.elapsed);
        this.hud.draw(ctx, this.score, getTargetScore(this.level), timeLeft, this.level, this.lives, {
            ammo: this.turret.ammo,
            magazineSize: CONFIG.MAGAZINE_SIZE,
            reloading: this.turret.reloading,
            reloadProgress: this.turret.getReloadProgress(),
        });

        // Radar (always visible, drawn on top)
        this.radar.draw(ctx, this.enemies, this.powerups.isRadarBoostActive(), this.elapsed);

        // Powerup inventory
        this.powerups.drawInventory(ctx);

        // Crosshair (always visible)
        this.renderer.drawCrosshair(ctx, this.input.mouseX, this.input.mouseY, this.hitFeedback);

        // Tutorial
        this.tutorial.draw(ctx, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
