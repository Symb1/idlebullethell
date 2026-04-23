//Full documentation in docIR
let player;

class Player {
    static BASE_HP = 5;

    constructor(playerClass) {
        this.class = playerClass;
        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = 100;
        this.maxHp = this.getInitialHP();
        this.hp = this.maxHp;
        this.hpRegen = 0;
        this.weapon = null;
        this.position = { x: 400, y: 300 };
        this.currentRunSouls = 0;
        this.attackSpeedUpgrades = 0;
        this.healthUpgrades = 0;
        this.attacksPerSecond = 1;
        this.critChance = 0.01;
        this.critDamage = 1;
        this.damageModifier = 1;
        this.baseCooldownReduction = 0;
        this.totalCooldownReduction = 0;
        this.amuletDamage = 0;
        this.bossDamageBonus = 0;
        this.facingLeft = false;
        this.classUpgradeChosen = null;
        this.updateCooldownReduction();
    }

    getDisplayName() { return this.class; }

    getSoulsUpgrade(name) {
        return soulsUpgrades.find(u => u.name === name);
    }

    gainExp(amount) {
        const mult = 1 + ((gameState.expUpgrades || 0) * this.getSoulsUpgrade('Exp+').valuePerUpgrade);
        this.exp += amount * mult;
        if (this.exp >= this.expToNextLevel) scheduleLevelUp();
    }

    gainSouls(amount) {
        const total = amount * gameState.soulMultiplier;
        gameState.souls = (gameState.souls || 0) + total;
        this.currentRunSouls += total;
        saveGameState();
        updateSoulsUI();
    }

    equipAmulet() {
        if (gameState.amuletEquipped) return;
        gameState.amuletEquipped = true;
        if (this.weapon) this.weapon.updateDamage();
        updatePlayerStats();
        updateInventoryUI();
    }

    _ascensionMult() {
        return Math.max(1, gameState.ascensionLevel + 1);
    }

    getAmuletDamageBonus() {
        if (!gameState.amuletEquipped) return 0;
        let bonus = this.amuletDamage * this._ascensionMult();
        const checks = [
            [DivineKnight, 'Acolyte Master'],
            [Acolyte,      'Sorceress Master'],
            [Sorceress,    'Divine Knight Master'],
        ];
        for (const [cls, key] of checks) {
            if (this instanceof cls && gameState.unlockedAchievements[key])
                bonus += achievements[key].amuletDamageIncrease;
        }
        return bonus;
    }

    getBossDamageBonus() {
        if (!gameState.amuletEquipped) return 0;
        let bonus = (this.bossDamageBonus * this._ascensionMult())
            + (this.additionalBossDamage || 0)
            + ((gameState.bossDamageUpgrades || 0) * this.getSoulsUpgrade('Boss Damage+').valuePerUpgrade);

        if (this.weapon?.name === 'Umbral Staff' && alloc['umbral_collapse'] >= 1) {
            bonus += 1.0;
        }
        if (this instanceof DivineKnight && typeof dkAlloc !== 'undefined') {

            const efRanks = dkAlloc['executioners_faith'] || 0;
            bonus += efRanks >= 5 ? efRanks * 0.25 * 2 : efRanks * 0.25;

            if (dkAlloc['oath_of_dominion'] >= 1 && this.weapon instanceof BlessedShield) bonus += 1.0;
        }
        return bonus;
    }

    getEliteDamageBonus() {

        return 0;
    }

    adjustCritChance(amount) {
        this.critChance = Math.min(1, this.critChance + amount);
    }

    updateCooldownReduction() {
        const perm = (gameState.cooldownUpgrades || 0) * this.getSoulsUpgrade('Cooldown+').valuePerUpgrade;

        let dkCDR = 0;
        if (this instanceof DivineKnight && typeof dkAlloc !== 'undefined') {
            const stRanks = dkAlloc['sacred_tempo'] || 0;
            dkCDR = stRanks >= 5 ? stRanks * 0.03 * 2 : stRanks * 0.03;
        }
        this.totalCooldownReduction = Math.min(0.75, perm + this.baseCooldownReduction + dkCDR);
    }

    adjustCooldownReduction(amount) {
        const perm = (gameState.cooldownUpgrades || 0) * this.getSoulsUpgrade('Cooldown+').valuePerUpgrade;
        this.baseCooldownReduction = Math.min(0.75 - perm, this.baseCooldownReduction + amount);
        this.updateCooldownReduction();
    }

    getCurrentCooldown(baseCooldown) {
        return baseCooldown * (1 - this.totalCooldownReduction);
    }

    getInitialHP() {
        return Player.BASE_HP + ((gameState.healthUpgrades || 0) * this.getSoulsUpgrade('Health+').valuePerUpgrade);
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    updateHp(deltaTime) {
        if (this instanceof DivineKnight && typeof dkAlloc !== 'undefined') {
            const hasBlessedShield = this.weapon instanceof BlessedShield;
            const hasSmiteShield   = this.weapon instanceof SmiteShield;

            if (dkAlloc['oath_of_judgement'] >= 1 && hasBlessedShield) return;
            if (dkAlloc['oath_of_dominion']  >= 1 && hasBlessedShield) return;

            if (dkAlloc['oath_of_eternity'] >= 1 && hasSmiteShield) {
                this.hp = Math.min(this.hp + this.hpRegen * deltaTime, this.maxHp);
                return;
            }

            if (dkAlloc['oath_of_aegis'] >= 1 && hasSmiteShield) {
                const regenCapped = Math.min(this.hpRegen, 1.5);
                this.hp = Math.min(this.hp + regenCapped * deltaTime, this.maxHp);
                return;
            }
        }
        this.heal(this.hpRegen * deltaTime);
    }

    takeDamage(amount, isFromBoss = false) {

        if (this instanceof DivineKnight && typeof dkAlloc !== 'undefined' && dkAlloc['oath_of_aegis'] >= 1) {
            const missChance = isFromBoss ? 0.66 : 0.33;
            if (Math.random() < missChance) return;
        }
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) gameOver();
    }
}

function talentBonus(ranks, value) {
    return ranks * value * (ranks >= 5 ? 2 : 1);
}

function initializePlayer(playerClass) {
    const classMap = { 'Acolyte': Acolyte, 'Sorceress': Sorceress, 'Divine Knight': DivineKnight };
    if (!classMap[playerClass]) return;
    player = new classMap[playerClass]();
    player.class = playerClass;

    const savedUpgrade = gameState.classUpgradeChosen || null;
    const classUpgradeNames = (typeof classUpgrades !== 'undefined' && classUpgrades[playerClass])
        ? classUpgrades[playerClass].map(u => u.shardName)
        : [];
    player.classUpgradeChosen = (savedUpgrade && classUpgradeNames.includes(savedUpgrade)) ? savedUpgrade : null;
    gameState.currentWave = 1 + (gameState.startingWaveUpgrades || 0);

    player.maxHp = player.getInitialHP();
    player.hpRegen = (gameState.regenUpgrades || 0) * player.getSoulsUpgrade('Regen+').valuePerUpgrade;
    console.log('Initial hpRegen:', player.hpRegen);
    player.attacksPerSecond += (gameState.attackSpeedUpgrades || 0) * player.getSoulsUpgrade('Attack Speed+').valuePerUpgrade;
    player.critDamage += (gameState.critDamageUpgrades || 0) * player.getSoulsUpgrade('Critical Damage+').valuePerUpgrade;
    if (!(player instanceof DivineKnight))
        player.adjustCritChance((gameState.critChanceUpgrades || 0) * player.getSoulsUpgrade('Crit Chance+').valuePerUpgrade);

    if (player instanceof Acolyte) {
        player.critDamage += talentBonus(alloc['void_rupture'], 0.10);
        player.adjustCritChance(talentBonus(alloc['dark_precision'], 0.01));
        player.hpRegen += talentBonus(alloc['siphon_vitality'], 0.05);
    }

    if (player instanceof Sorceress) {
        player.adjustCritChance(talentBonus(sorcAlloc['storm_precision'], 0.015));
        player.attacksPerSecond += talentBonus(sorcAlloc['static_acceleration'], 0.04);
        player.critDamage += talentBonus(sorcAlloc['lethal_current'], 0.10);
    }

    if (player instanceof DivineKnight) {

        player.critDamage += talentBonus(dkAlloc['divine_wrath'], 0.10);

    }

    player.updateCooldownReduction();
    player.getAmuletDamageBonus();
    if (player.weapon) player.weapon.updateDamage();
    updatePlayerStats();
}

function createPlayerElement() {
    const el = document.createElement('div');
    el.id = 'player';
    el.style.cssText = `left:${player.position.x}px;top:${player.position.y}px;background-image:url('img/${player.image}');background-size:cover`;
    el.classList.add(player.class.toLowerCase().replace(/\s+/g, '-'));
    document.getElementById('game-area').appendChild(el);
}

function updatePlayer() {
    if (!player?.position) return;

    const now = Date.now();
    enemies.forEach(enemy => {
        if (!enemy?.position) return;
        if (calculateDistance(player.position, enemy.position) >= 30 + enemy.radius) return;

        const [dmg, cd, animDur] =
            enemy instanceof Boss       ? [5, 2000, 800]  :
            enemy instanceof EliteEnemy ? [3, 4000, 1000] :
                       [1, 2000, 500];

        if ((!enemy.lastDamageTime || now - enemy.lastDamageTime >= cd) && !enemy.element.classList.contains('frozen')) {
            player.takeDamage(dmg, enemy instanceof Boss);
            enemy.lastDamageTime = now;
            const audio = document.getElementById('skeleattmu');
            if (audio) { audio.currentTime = 0; audio.volume = 0.3; audio.play().catch(() => {}); }
            enemy.element.classList.add('attacking');
            setTimeout(() => enemy.element.classList.remove('attacking'), animDur);
        }
    });

    const el = document.getElementById('player');
    if (el) {
        el.style.left = `${player.position.x}px`;
        el.style.top  = `${player.position.y}px`;
        el.classList.toggle('facing-left', player.facingLeft);
    }

    if (player instanceof DivineKnight) { player.showAura(); player.updateAuraVisual(); }
}

function calculateDistance(pos1, pos2) {
    return Math.hypot(pos1.x - pos2.x, pos1.y - pos2.y);
}