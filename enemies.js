//Full documentation in docIR
let enemies = [];

class Enemy {
    static hurtSoundIndex = 0;
    static currentlyPlayingHurtSounds = 0;
    static deathSoundIndex = 0;

    constructor() {
        this.baseSpeed = 26;
        this.radius = 10;
        this.speedEffects = [];
        this.damageIndicators = [];
        this.isDying = false;
        this.isPlayingHitAnimation = false;
        this.spawnWave = gameState.currentWave;
        this.resetEnemy();
    }

    resetEnemy() {
        this.hp = this.getInitialHP();
        this.maxHp = this.hp;
        this.position = this.getRandomPosition();
        this.lastDamageTime = 0;
        this.element?.remove();
        this.element = this.createEnemyElement();
        this.hpElement = this.createHpElement();
        this.damageIndicator = this.createDamageIndicator();
        this.isDying = false;
        this.isPlayingHitAnimation = false;
    }

    getInitialHP() {
        const waveIncrease = 1 + (gameState.currentWave - 1) * 0.04;
        const stageMultiplier = Math.pow(1.9, gameState.currentStage - 1);
        return Math.floor(10 * waveIncrease * stageMultiplier);
    }

    getRandomPosition() {
        const r = this.radius || 10;
        const maxX = 800 - r * 2;
        const maxY = 600 - r * 2;
        const side = Math.floor(Math.random() * 4);

        const x = side === 0 ? Math.random() * maxX :
                  side === 1 ? maxX                 :
                  side === 2 ? Math.random() * maxX :
                               0;
        const y = side === 0 ? 0                    :
                  side === 1 ? Math.random() * maxY :
                  side === 2 ? maxY                 :
                               Math.random() * maxY;
        return { x, y };
    }

    createEnemyElement() {
        const el = document.createElement('div');
        el.className = 'enemy sprite';
        if (this instanceof EliteEnemy) el.classList.add('elite');
        if (this instanceof Boss) el.classList.add('boss');
        el.style.left = `${this.position.x}px`;
        el.style.top  = `${this.position.y}px`;
        document.getElementById('game-area').appendChild(el);
        return el;
    }

    createHpElement() {
        const el = document.createElement('div');
        el.className = 'enemy-hp';
        this.element.appendChild(el);
        return el;
    }

    createDamageIndicator() {
        const el = document.createElement('div');
        el.className = 'damage-indicator';
        this.element.appendChild(el);
        return el;
    }

    updateHpText() {
        this.hpElement.textContent = `${Math.max(0, Math.ceil(this.hp))}/${this.maxHp} HP`;
    }

    applySpeedEffect(factor, duration) {
        const effect = { factor, endTime: Date.now() + duration };
        this.speedEffects.push(effect);
        this.element.classList.toggle('slowed', factor < 1);
        this.element.classList.toggle('sped-up', factor > 1);
        setTimeout(() => {
            this.speedEffects = this.speedEffects.filter(e => e !== effect);
            this.element.classList.remove('slowed', 'sped-up');
        }, duration);
    }

    getCurrentSpeed() {
        const now = Date.now();
        this.speedEffects = this.speedEffects.filter(e => e.endTime > now);
        return this.baseSpeed * this.speedEffects.reduce((f, e) => f * e.factor, 1);
    }

    move(deltaTime) {
        const speed = this.getCurrentSpeed();
        const dx = player.position.x - this.position.x;
        const dy = player.position.y - this.position.y;
        const distance = Math.hypot(dx, dy);
        if (distance === 0) return;

        this.element.classList.toggle('facing-left', dx < 0);

        let vx = (dx / distance) * speed * deltaTime;
        let vy = (dy / distance) * speed * deltaTime;

        enemies.forEach(other => {
            if (other === this) return;
            const sx = this.position.x - other.position.x;
            const sy = this.position.y - other.position.y;
            const dist = Math.hypot(sx, sy);

            if (dist === 0) {
                this.position.x += (Math.random() - 0.5) * 2;
                this.position.y += (Math.random() - 0.5) * 2;
                return;
            }
            if (dist < this.radius + other.radius) {
                const overlap = (this.radius + other.radius - dist) / 2;
                const px = (sx / dist) * overlap;
                const py = (sy / dist) * overlap;
                this.position.x  += px;
                this.position.y  += py;
                other.position.x -= px;
                other.position.y -= py;

                other.position.x = Math.max(0, Math.min(other.position.x, 800 - other.radius * 2));
                other.position.y = Math.max(0, Math.min(other.position.y, 600 - other.radius * 2));
                vx += px * 0.1;
                vy += py * 0.1;
            }
        });

        this.position.x = Math.max(0, Math.min(this.position.x + vx, 800 - this.radius * 2));
        this.position.y = Math.max(0, Math.min(this.position.y + vy, 600 - this.radius * 2));
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top  = `${this.position.y}px`;
        this.updateHpText();
    }

    takeDamage(amount, isCritical = false) {
        if (this.hp <= 0 || this.isDying) return;

        const dmg = Math.max(0, amount);
        const willDie = this.hp - dmg <= 0;
        this.hp = Math.max(0, this.hp - dmg);

        this.updateHpText();
        this.showDamageIndicator(dmg, isCritical);
        this.createHitSprite();

        if (!willDie && Enemy.currentlyPlayingHurtSounds < 3) {
            Enemy.hurtSoundIndex = (Enemy.hurtSoundIndex % 3) + 1;
            const audio = document.getElementById(`skelehurtmu${Enemy.hurtSoundIndex}`);
            if (audio) {
                audio.currentTime = 0;
                audio.volume = 0.3;
                Enemy.currentlyPlayingHurtSounds++;
                audio.onended = () => Enemy.currentlyPlayingHurtSounds--;
                audio.play().catch(() => {});
            }
        }

        if (this.hp <= 0) this.die(isCritical);
    }

    showDamageIndicator(amount, isCritical) {
        const el = document.createElement('div');
        el.className = 'damage-indicator';
        el.textContent = Math.round(amount);
        el.style.color    = isCritical ? 'orange' : 'yellow';
        el.style.fontSize = isCritical ? '25px'   : '16px';

        const offset = this.damageIndicators.length * 20;
        el.style.top   = `-${20 + offset}px`;
        el.style.right = `${offset}px`;

        this.element.appendChild(el);
        this.damageIndicators.push(el);

        setTimeout(() => { el.style.opacity = 1; el.style.top = `-${40 + offset}px`; }, 0);
        setTimeout(() => { el.style.opacity = 0; el.style.top = `-${60 + offset}px`; }, 500);
        setTimeout(() => {
            el.remove();
            this.damageIndicators = this.damageIndicators.filter(d => d !== el);
        }, 1000);
    }

    createHitSprite() {
		if (!(player instanceof Acolyte)) return;
        const sprite = document.createElement('div');
        sprite.className = 'hit-sprite';
        sprite.style.left = '50%';
        sprite.style.top  = '50%';
        this.element.appendChild(sprite);
        setTimeout(() => sprite.remove(), 450);
    }

    getExpMultiplier() {
        return 1 + (gameState.currentStage - 1) * 0.5;
    }

    playDeathSound(isCritical, volume = 0.17) {
        const soundId = isCritical
            ? 'skelediecritmu'
            : `skeledieamu${(Enemy.deathSoundIndex = (Enemy.deathSoundIndex % 3) + 1)}`;
        const audio = document.getElementById(soundId);
        if (audio) { audio.currentTime = 0; audio.volume = volume; audio.play().catch(() => {}); }
    }

    die(isCritical = false) {
        if (this.isDying) return;
        this.isDying = true;
        this.playDeathSound(isCritical);
        recordWaveKill(this.spawnWave);
        player.gainSouls(Math.floor(this.maxHp * 0.1));
        player.gainExp(10 * this.getExpMultiplier());
        this.element.classList.add('dying');

        if (nextWaveEnemyDebt > 0) {
            nextWaveEnemyDebt--;
            if (nextWaveEnemyDebt <= 0) {
                nextWaveEnemyDebt = 0;
                nextWaveUses = 0;
                updateNextWaveButton();
            }
        }

        setTimeout(() => {
            this.element.remove();
            enemies = enemies.filter(e => e !== this);
        }, 1000);
    }
}

class EliteEnemy extends Enemy {
    constructor() {
        super();
        this.radius = 35;
        this.activeEffects = [];
        this.resetEliteEnemy();
    }

    resetEliteEnemy() {
        this.hp *= 2;
        this.maxHp = this.hp;
        this.baseSpeed *= 0.9;
        this.element.classList.add('elite');
        this.abilities = this.selectAbilities();
        this.updateHpText();
    }

    selectAbilities() {
        const all = ['Weakness', 'Mind Freeze', 'Rally'];
        if (gameState.currentStage <= 2) return [all[Math.floor(Math.random() * all.length)]];
        if (gameState.currentStage <= 4) return [...all].sort(() => 0.5 - Math.random()).slice(0, 2);
        return all;
    }

    takeDamage(amount, isCritical = false) {
        const bonus = player.getEliteDamageBonus ? player.getEliteDamageBonus() : 0;
        super.takeDamage(amount * (1 + bonus), isCritical);
    }

    useAbilities() {
        this.abilities.forEach(ability => {
            if (ability === 'Weakness')    this.useWeakness();
            if (ability === 'Mind Freeze') this.useMindFreeze();
            if (ability === 'Rally')       this.useRally();
        });
        this.abilities = [];
    }

    useWeakness() {
        player.weaknessDebuffFactor = 0.75;
        player.weapon.updateDamage();
        const playerEl = document.getElementById('player');
        playerEl.classList.add('weakened');
        const effectId = Symbol('Weakness');
        const effect = { id: effectId, name: 'Weakness', playerElement: playerEl };
        const timer = setTimeout(() => this.endWeakness(effect), 10000);
        effect.timer = timer;
        this.activeEffects.push(effect);
        if (typeof updatePlayerStats === 'function') updatePlayerStats();
    }

    endWeakness(effect) {
        delete player.weaknessDebuffFactor;
        player.weapon.updateDamage();
        effect.playerElement.classList.remove('weakened');
        this.activeEffects = this.activeEffects.filter(e => e.id !== effect.id);
        if (typeof updatePlayerStats === 'function') updatePlayerStats();
    }

    useMindFreeze() {
        const preDebuffSpeed = player.attacksPerSecond;
        const debuffFactor = 0.75;
        player.attacksPerSecond *= debuffFactor;
        const overlay = document.createElement('div');
        overlay.className = 'mind-freeze-overlay';
        document.getElementById('game-area').appendChild(overlay);
        const effectId = Symbol('MindFreeze');
        const effect = { id: effectId, name: 'MindFreeze', overlay, preDebuffSpeed, debuffFactor };
        const timer = setTimeout(() => this.endMindFreeze(effect), 10000);
        effect.timer = timer;
        this.activeEffects.push(effect);
        if (typeof updatePlayerStats === 'function') updatePlayerStats();
    }

    endMindFreeze(effect) {
        // Attack speed is additive, so calculate any flat additions made during
        // the debuff window and apply them on top of the original pre-debuff value.
        const debuffedBase = effect.preDebuffSpeed * effect.debuffFactor;
        const addedDuringDebuff = player.attacksPerSecond - debuffedBase;
        player.attacksPerSecond = effect.preDebuffSpeed + addedDuringDebuff;
        effect.overlay.remove();
        this.activeEffects = this.activeEffects.filter(e => e.id !== effect.id);
        if (typeof updatePlayerStats === 'function') updatePlayerStats();
    }

    useRally() {
        const duration = 4000;
        enemies.forEach(e => e.applySpeedEffect(1.25, duration));
        const indicator = document.createElement('div');
        indicator.className = 'elite-rally-indicator';
        this.element.appendChild(indicator);
        setTimeout(() => indicator.remove(), duration);
    }

    die(isCritical = false) {
        if (this.isDying) return;
        this.isDying = true;
        this.playDeathSound(isCritical, 0.3);
        recordWaveKill(this.spawnWave);
        player.gainSouls(Math.floor(this.maxHp * 0.15));

        this.activeEffects.forEach(effect => {
            clearTimeout(effect.timer);
            if (effect.name === 'MindFreeze') this.endMindFreeze(effect);
            if (effect.name === 'Weakness')   this.endWeakness(effect);
        });
        this.activeEffects = [];

        player.gainExp(30 * this.getExpMultiplier());
        this.element.classList.add('dying');
        setTimeout(() => {
            this.element.remove();
            enemies = enemies.filter(e => e !== this);
        }, 1300);
    }
}

class Boss extends Enemy {
    constructor() {
        super();
        this.radius = 45;
        this.resetBoss();
    }

    resetBoss() {
        this.hp = this.getInitialHP() * 20;
        this.maxHp = this.hp;
        this.baseSpeed *= 0.4;
        this.element.classList.add('boss');
        this.updateHpText();
    }

    takeDamage(amount, isCritical = false) {
        const bonus = player.getBossDamageBonus();
        super.takeDamage(amount * (1 + bonus), isCritical);
    }

    die() {
        if (this.isDying) return;
        this.isDying = true;
        recordWaveKill(this.spawnWave);
        player.gainSouls(Math.floor(this.maxHp * 0.2));
        player.gainExp(100 * this.getExpMultiplier());
        if (!gameState.amuletDropped) {
            gameState.amuletDropped = true;
            player.equipAmulet();
            updateInventoryUI();
            showAmuletFoundText();
        }
        this.element.classList.add('dying');
        setTimeout(() => {
            this.element.remove();
            enemies = enemies.filter(e => e !== this);
        }, 600);
    }
}

function hasOverlap(candidate, placedEnemies) {
    return placedEnemies.some(e => {
        return Math.hypot(candidate.position.x - e.position.x, candidate.position.y - e.position.y)
             < candidate.radius + e.radius;
    });
}

function placeWithoutOverlap(enemy) {
    for (let i = 0; i < 100; i++) {
        if (!hasOverlap(enemy, enemies)) break;
        enemy.position = enemy.getRandomPosition();
    }
}

function recordWaveSpawn(wave, count) {
    const wp = gameState.waveProgress;
    wp[wave] = wp[wave] || { spawned: 0, killed: 0 };
    wp[wave].spawned += count;
}

function recordWaveKill(wave) {
    const wp = gameState.waveProgress;
    if (!wp[wave]) return;
    wp[wave].killed++;
    if (wp[wave].killed >= wp[wave].spawned)
        gameState.highestKillWave = Math.max(gameState.highestKillWave || 0, wave);
}

function spawnEnemies() {
    enemies = [];

    if (gameState.currentStage >= 2 && gameState.currentWave === 1) {
        enemies.push(new Boss());
        showBossSpawnedText();
    }

    const count = 4 + gameState.currentWave;
    for (let i = 0; i < count; i++) {
        const enemy = new Enemy();
        placeWithoutOverlap(enemy);
        enemies.push(enemy);
    }

    if (gameState.currentWave % 5 === 0) {
        const elite = new EliteEnemy();
        placeWithoutOverlap(elite);
        enemies.push(elite);
    }
    recordWaveSpawn(gameState.currentWave, enemies.length);
}

function spawnEnemiesAdditive() {
    if (gameState.currentStage >= 2 && gameState.currentWave === 1) {
        const boss = new Boss();
        placeWithoutOverlap(boss);
        enemies.push(boss);
        showBossSpawnedText();
    }

    const count = 4 + gameState.currentWave;
    for (let i = 0; i < count; i++) {
        const enemy = new Enemy();
        placeWithoutOverlap(enemy);
        enemies.push(enemy);
    }

    if (gameState.currentWave % 5 === 0) {
        const elite = new EliteEnemy();
        placeWithoutOverlap(elite);
        enemies.push(elite);
    }
    const wave = gameState.currentWave;
    recordWaveSpawn(wave, enemies.filter(e => e.spawnWave === wave && !e.isDying).length);
}

function spawnGameText(className, text, duration) {
    const el = document.createElement('div');
    el.className = className;
    el.textContent = text;
    document.getElementById('game-area').appendChild(el);
    setTimeout(() => el.remove(), duration);
}

function showBossSpawnedText()  { spawnGameText('boss-spawned-text',  'Boss Spawned',  3000); }
function showAmuletFoundText()  { spawnGameText('amulet-found-text',  'Amulet Found!', 3500); }

function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        if (enemy.isDying) return;
        enemy.move(deltaTime);
        if (enemy instanceof EliteEnemy) enemy.useAbilities();
    });
}