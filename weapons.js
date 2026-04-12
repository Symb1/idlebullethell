function initializeWeapon(playerClass, weaponName = null) {
    // Remove old weapon's attack speed bonus before replacing
    switch (playerClass) {
        case 'Acolyte':
            player.weapon = weaponName === 'Vortex Staff' ? new VortexStaff()
                          : weaponName === 'Umbral Staff'  ? new UmbralStaff()
                          : new BasicStaff();
            break;
        case 'Sorceress':
            player.weapon = weaponName === 'Chain Wand' ? new ChainWand()
                          : weaponName === 'Spark Wand'  ? new SparkWand()
                          : new BasicWand();
            break;
        case 'Divine Knight':
            player.weapon = weaponName === 'Blessed Shield' ? new BlessedShield()
                          : weaponName === 'Smite Shield'   ? new SmiteShield()
                          : new BasicShield();
            break;
    }
    // Apply Acolyte talent bonuses post-weapon init
    if (player instanceof Acolyte) {
        // abyssal_core: +0.5 base damage per rank
        if (typeof alloc !== 'undefined' && alloc['abyssal_core'] > 0) {
            player.weapon.baseDamage += alloc['abyssal_core'] * 1.0;
            player.weapon.damage = player.weapon.baseDamage;
        }
        // Umbral Collapse: +10% crit chance when Umbral Staff is equipped
        if (typeof alloc !== 'undefined' && alloc['umbral_collapse'] >= 1 && player.weapon && player.weapon.name === 'Umbral Staff') {
            player.adjustCritChance(0.10);
        }
        // Group C Binding Vow — reduce penalties of chosen class shard
        const chosen = player.classUpgradeChosen;
        if (chosen && typeof alloc !== 'undefined') {
            // These bonuses would apply to weapon-specific penalty modifiers
            // They are stored on the weapon for use in upgrade screens
            player.weapon.temporalExcellenceRanks    = alloc['temporal_excellence']    || 0;
            player.weapon.abyssalExcellenceRanks     = alloc['abyssal_excellence']     || 0;
            player.weapon.ravenousExcellenceRanks    = alloc['ravenous_excellence']    || 0;
        }
    }
    player.weapon.updateDamage();
}

class Weapon {
    static attackSoundIndex = 0;

    constructor(name, damage, cooldown, abilityName, globalRange, chainRange = 0) {
        this.name = name;
        this.baseDamage = damage;
        this.damage = damage;
        this.baseCooldown = cooldown;
        this.abilityName = abilityName;
        this.lastAttackTime = 0;
        this.lastAbilityUseTime = 0;
        this.globalRange = globalRange;
        this.chainRange = chainRange;
        
    }

    attack() {
    const now = Date.now();
    const aps = this.getAttackSpeed ? this.getAttackSpeed() : player.attacksPerSecond;
    if (now - this.lastAttackTime >= 1000 / aps) {
        this.performAttack();
        this.lastAttackTime = now;
    }
}


getAttackSpeed() {
    return player.attacksPerSecond;
}

    triggerPlayerAttackAnimation() {
        const playerElement = document.getElementById('player');
        if (!playerElement) return;

        // Update facing direction for all classes
        const nearestForFacing = enemies
            .filter(e => !e.isDying)
            .reduce((nearest, enemy) => {
                const dist = calculateDistance(player.position, enemy.position);
                return !nearest || dist < calculateDistance(player.position, nearest.position) ? enemy : nearest;
            }, null);
        if (nearestForFacing) {
            player.facingLeft = nearestForFacing.position.x < player.position.x;
            playerElement.classList.toggle('facing-left', player.facingLeft);
        }

        if (player.class === 'Sorceress') {
            playerElement.classList.remove('sorc-attacking');
            void playerElement.offsetWidth;
            playerElement.classList.add('sorc-attacking');
            if (this.attackAnimationTimeout) clearTimeout(this.attackAnimationTimeout);
            this.attackAnimationTimeout = setTimeout(() => {
                playerElement.classList.remove('sorc-attacking');
                this.attackAnimationTimeout = null;
            }, 200);
            return;
        }

        if (player.class !== 'Acolyte') return;

        // Cycle through attack sounds (1 → 2 → 3 → 1)
        Weapon.attackSoundIndex = (Weapon.attackSoundIndex % 3) + 1;
        const attackAudio = document.getElementById(`acoattmu${Weapon.attackSoundIndex}`);
        if (attackAudio) {
            attackAudio.currentTime = 0;
            attackAudio.volume = 0.12;
            attackAudio.playbackRate = player.attacksPerSecond;
            attackAudio.play().catch(e => console.log('Audio play failed:', e));
        }

        const animationDuration = 1000 / player.attacksPerSecond;

        if (this.attackAnimationTimeout) clearTimeout(this.attackAnimationTimeout);

        playerElement.classList.remove('attacking');
        playerElement.style.animation = '';
        void playerElement.offsetWidth; // Force reflow

        playerElement.classList.add('attacking');
        playerElement.style.animation = `playerAttack ${animationDuration}ms steps(47) forwards`;

        this.attackAnimationTimeout = setTimeout(() => {
            playerElement.classList.remove('attacking');
            playerElement.style.animation = '';
            this.attackAnimationTimeout = null;
        }, animationDuration);
    }

    calculateDamage() {
        const isCritical = Math.random() < player.critChance;
        return { damage: isCritical ? this.damage * player.critDamage : this.damage, isCritical };
    }

    updateDamage() {
        if (!player) { this.damage = this.baseDamage; return; }
        this.damage = (this.baseDamage + player.getAmuletDamageBonus()) * player.damageModifier;
    }

    performAttack() {}
    performAbility() {}
    showAbilityCooldown() {}

    useAbility() {
        const now = Date.now();
        const currentCooldown = player.getCurrentCooldown(this.baseCooldown);
        if (now - this.lastAbilityUseTime >= currentCooldown * 1000) {
            this._eternalTormentReset = false;
            this.performAbility();
            // Only stamp the use time if Eternal Torment did NOT reset it during performAbility
            if (!this._eternalTormentReset) {
                this.lastAbilityUseTime = now;
            }
            this._eternalTormentReset = false;
            this.showAbilityCooldown();
        }
    }

    getAbilityButtonText() {
        const now = Date.now();
        const currentCooldown = player.getCurrentCooldown(this.baseCooldown);
        const cooldownRemaining = Math.max(0, currentCooldown - (now - this.lastAbilityUseTime) / 1000);
        return cooldownRemaining > 0 ? `Cooldown (${cooldownRemaining.toFixed(1)}s)` : this.abilityName;
    }

    findNearestEnemy() {
        let nearest = null, nearestDist = Infinity;
        for (const enemy of enemies) {
            if (enemy.isDying || enemy.hp <= 0) continue;
            const dist = calculateDistance(player.position, enemy.position);
            if (dist <= this.globalRange && dist < nearestDist) {
                nearest = enemy;
                nearestDist = dist;
            }
        }
        return nearest;
    }

    isInRange(enemy) {
        return calculateDistance(player.position, enemy.position) <= this.globalRange;
    }
}

class BasicStaff extends Weapon {
    constructor() {
        super('Basic Staff', 15, 12, 'Void Blast', 350);
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            target.takeDamage(damage, isCritical);
            this.triggerPlayerAttackAnimation();
        }
    }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            const abilityDmg = damage * 2;
            target.takeDamage(abilityDmg, isCritical);
            drawVoidBlast(target.position.x + target.radius, target.position.y + target.radius, true);
            if (target instanceof EliteEnemy) checkEternalTormentReset(this, target, abilityDmg);
        }
    }

    findPriorityTarget() {
        return enemies.find(e => e instanceof Boss)
            || enemies.find(e => e instanceof EliteEnemy)
            || this.findNearestEnemy();
    }
}

class BasicWand extends Weapon {
    constructor() {
        super('Basic Wand', 10, 20, 'Lightning Storm', 200, 275);
        this.chainCount = 3;
        this.chainDamageMultiplier = 0.70;
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            this.dealDamageWithChain(target, damage, isCritical);
        }
    }

    performAbility() {
        const abilityDamage = this.damage * player.critDamage;
        enemies.forEach(enemy => {
            enemy.takeDamage(abilityDamage, false);
            drawSkyLightning(enemy.position.x + enemy.radius, enemy.position.y + enemy.radius);
        });
    }

    dealDamageWithChain(target, initialDamage, isCritical) {
        this.dealDamageToEnemy(target, initialDamage, isCritical);
        this.triggerPlayerAttackAnimation();

        const chainPath = [
            { x: player.position.x, y: player.position.y },
            { x: target.position.x + target.radius, y: target.position.y + target.radius }
        ];

        let remaining = this.chainCount;
        let currentDamage = initialDamage;
        let lastHit = target;

        while (remaining > 0 && enemies.length > 0) {
            const next = this.findRandomEnemyInChainRange(lastHit);
            if (!next) break;
            currentDamage *= this.chainDamageMultiplier;
            this.dealDamageToEnemy(next, currentDamage, isCritical);
            chainPath.push({ x: next.position.x + next.radius, y: next.position.y + next.radius });
            remaining--;
            lastHit = next;
        }

        drawLightningChain(chainPath, isCritical);
    }

    dealDamageToEnemy(enemy, damage, isCritical) {
        enemy.takeDamage(Math.max(0, damage), isCritical);
    }

    findRandomEnemyInChainRange(lastHitEnemy) {
        const valid = enemies.filter(e => e !== lastHitEnemy && this.isInChainRange(lastHitEnemy, e));
        return valid.length ? valid[Math.floor(Math.random() * valid.length)] : null;
    }

    isInChainRange(sourceEnemy, targetEnemy) {
        return calculateDistance(sourceEnemy.position, targetEnemy.position) <= this.chainRange;
    }
}

class BasicShield extends Weapon {
    constructor() {
        super('Basic Shield', 2, 20, 'Holy Radiance', 150);
        this.abilityDuration = 5000;
    }

    performAttack() {
        enemies.forEach(enemy => {
            if (this.isInRange(enemy)) {
                const { damage, isCritical } = this.calculateDamage();
                enemy.takeDamage(damage, isCritical);
            }
        });
    }

    performAbility() {
        const originalRange = this.globalRange;
        this.globalRange *= 1.5;
        player.updateAuraVisual();
        setTimeout(() => {
            this.globalRange = originalRange;
            player.updateAuraVisual();
        }, this.abilityDuration);
    }

    showAbilityCooldown() {
        const playerElement = document.getElementById('player');
        if (!playerElement) return;
        const cooldownElement = document.createElement('div');
        cooldownElement.className = 'ability-cooldown';
        playerElement.appendChild(cooldownElement);

        let remainingTime = Math.ceil(this.abilityDuration / 1000);
        const updateCooldown = () => {
            cooldownElement.textContent = remainingTime;
            if (remainingTime > 0) {
                remainingTime--;
                setTimeout(updateCooldown, 1000);
            } else {
                cooldownElement.remove();
            }
        };
        updateCooldown();
    }
}

// Eternal Torment: chance to reset ability cooldown on elite hit with ability
// damageDealt: the damage this ability hit inflicted on the elite
function checkEternalTormentReset(weapon, eliteTarget, damageDealt) {
    if (!(player instanceof Acolyte)) return;
    const ranks = (typeof alloc !== 'undefined' ? alloc['eternal_torment'] : 0) || 0;
    if (ranks === 0) return;

    const chance = ranks * 0.10;
    // Rank 3 bonus: 100% reset if damage dealt was <= 25% of the elite's HP *before* this hit
    // Second hit for 25 → now 50hp. 25 <= (50+25)*0.25=18.75 false
    const preHitHp = eliteTarget.hp + damageDealt;
    const bonusTrigger = ranks >= 3 && damageDealt <= preHitHp * 0.25;

    if (bonusTrigger || Math.random() < chance) {
        weapon._eternalTormentReset = true;
        weapon.lastAbilityUseTime = 0;
        const btn = document.getElementById('ability-button');
        if (btn) {
            btn.style.boxShadow = '0 0 18px #9370DB, 0 0 36px #6a0dad';
            setTimeout(() => { btn.style.boxShadow = ''; }, 600);
        }
    }
}

function updateWeapon() {
    if (player && player.weapon) {
        player.weapon.attack();
    }
}

function showWeaponEvolutionScreen() {
    gameState.isPaused = true;

    const gameArea = document.getElementById('game-area');
    let evolutionScreen = document.getElementById('weapon-evolution');

    if (!evolutionScreen) {
        evolutionScreen = document.createElement('div');
        evolutionScreen.id = 'weapon-evolution';
        gameArea.appendChild(evolutionScreen);
    }

    evolutionScreen.innerHTML = '<h2 class="evolution-title">Choose Your Weapon Evolution</h2>';

    const evolutionOptions = document.createElement('div');
    evolutionOptions.id = 'evolution-options';
    evolutionScreen.appendChild(evolutionOptions);

    const weaponOptions = getWeaponEvolutionOptions(player.class);
    const isAuto = gameState.autoWeaponEvolutionEnabled;

    weaponOptions.forEach((weapon, index) => {
        const card = document.createElement('div');
        card.className = 'upgrade-card evolution-card';
        card.dataset.index = index;

        const statsHTML = weapon.stats
            .map(stat => `<p class="stat-${stat.type}">✦ ${stat.text}</p>`)
            .join('');

        card.innerHTML = `
            <div class="evolution-name">${weapon.name}</div>
            ${weapon.flavor ? `<div class="upgrade-flavor">${weapon.flavor}</div>` : ''}
            <div class="evolution-description">${statsHTML}</div>
        `;

        if (isAuto) {
            card.classList.add('disabled');
        } else {
            card.addEventListener('click', () => selectWeaponEvolution(weapon));
        }

        evolutionOptions.appendChild(card);
    });

    evolutionScreen.style.display = 'flex';

    if (isAuto) {
        const selectedWeapon = autoSelectWeaponEvolution(weaponOptions);
        const selectedIndex = weaponOptions.indexOf(selectedWeapon);
        evolutionOptions.querySelector(`[data-index="${selectedIndex}"]`).classList.add('auto-select-glow2');
        setTimeout(() => selectWeaponEvolution(selectedWeapon), 3000);
    }
}

function selectWeaponEvolution(weapon) {
    initializeWeapon(player.class, weapon.name);
    hideWeaponEvolutionScreen();
    gameState.isPaused = false;
    cancelAnimationFrame(animationFrameId);
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
    processNextLevelUp();
}

function autoSelectWeaponEvolution(weaponOptions) {
    const autoChoice = gameState.autoWeaponEvolutionChoices[player.class];
    return (autoChoice && weaponOptions.find(w => w.name === autoChoice)) || weaponOptions[0];
}

function hideWeaponEvolutionScreen() {
    const el = document.getElementById('weapon-evolution');
    if (el) el.style.display = 'none';
}

function getWeaponEvolutionOptions(playerClass) {
    const weaponMap = {
        'Acolyte': [
            { class: VortexStaff, flavor: 'Channels unstable void currents, tearing open miniature rifts that engulf everything nearby.' },
            { class: UmbralStaff, flavor: 'A conduit of pure darkness, its power does not strike, it focuses void essence into a single, perfect line of annihilation.' }
        ],
        'Sorceress': [
            { class: ChainWand, flavor: 'Weaves lightning through the battlefield, each strike seeking new prey with relentless hunger.' },
            { class: SparkWand, flavor: 'A tempest bound in crystal, its fury knows no bounds but demands sacrifice for its power.' }
        ],
        'Divine Knight': [
            { class: BlessedShield, flavor: 'Forged in sacred light, its divine protection extends far beyond mortal reach.' },
            { class: SmiteShield, flavor: 'Swift as divine judgment, each strike saps the strength of those who dare approach.' }
        ]
    };

    return (weaponMap[playerClass] || []).map(w => {
        const instance = new w.class();
        return { name: instance.name, flavor: w.flavor, stats: instance.getEvolutionStats() };
    });
}

class VortexStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Vortex Staff';
        this.baseDamage = 20;
        this.baseCooldown = 20;
        this.globalRange = 350;
        this.splashRange = 65;
        this.splashMultiplier = 0.5;
        // void_overflow talent: +5% splash damage per rank
        if (typeof alloc !== 'undefined') {
            this.splashMultiplier += alloc['void_overflow'] * 0.05;
            // abyssal_reach: splash range = 110
            if (alloc['abyssal_reach'] >= 1) {
                this.splashRange = 110;
            }
        }
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getEvolutionStats() {
        const splashPct = Math.round(this.splashMultiplier * 100);
        const hasRiftCrit = typeof alloc !== 'undefined' && alloc['rift_crit'] >= 1;
        const stats = [
            { text: `Splash Damage: ${splashPct}% (${this.splashRange} range)`, type: 'positive' },
            { text: 'Ability Power: +100%', type: 'positive' },
            { text: `Range: ${this.globalRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
        ];
        if (!hasRiftCrit) {
            stats.push({ text: 'Ability Cannot Crit', type: 'negative' });
        } else {
            stats.push({ text: 'Ability Can Crit (Rift Crit)', type: 'positive' });
        }
        return stats;
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            target.takeDamage(damage, isCritical);
            this.triggerPlayerAttackAnimation();
            this.splashDamage(target, damage);
        }
    }

    splashDamage(centerEnemy, originalDamage) {
        const splashMult = (this.splashMultiplier !== undefined) ? this.splashMultiplier : 0.5;
        const splashBase = originalDamage * splashMult;
        enemies.forEach(enemy => {
            if (enemy !== centerEnemy && calculateDistance(centerEnemy.position, enemy.position) <= this.splashRange) {
                const isSplashCrit = Math.random() < player.critChance;
                enemy.takeDamage(isSplashCrit ? splashBase * player.critDamage : splashBase, isSplashCrit);
            }
        });
    }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            // rift_crit: ability can crit
            const canCrit = typeof alloc !== 'undefined' && alloc['rift_crit'] >= 1;
            const isCrit = canCrit && Math.random() < player.critChance;
            const dmg = isCrit ? this.damage * 2 * 2 * player.critDamage : this.damage * 2 * 2;
            target.takeDamage(dmg, isCrit);
            drawVoidBlast(target.position.x + target.radius, target.position.y + target.radius, true);
            // Eternal Torment: chance to reset cooldown on elite hit
            if (target instanceof EliteEnemy) {
                checkEternalTormentReset(this, target, dmg);
            }
        }
    }
}

class UmbralStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Umbral Staff';
        this.baseDamage = 35;
        this.baseCooldown = 25;
        this.globalRange = 450;
        // umbral_zenith talent: -1s cooldown per rank
        if (typeof alloc !== 'undefined') {
            this.baseCooldown = Math.max(5, this.baseCooldown - alloc['umbral_zenith']);
        }
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getEvolutionStats() {
        const hasUmbralCollapse = typeof alloc !== 'undefined' && alloc['umbral_collapse'] >= 1;
        const hasVoidAscension  = typeof alloc !== 'undefined' && alloc['void_ascension']  >= 1;
        const stats = [
            { text: 'High Single Target Damage', type: 'positive' },
            { text: 'Ability Guaranteed Crit', type: 'positive' },
            { text: `Range: ${this.globalRange}`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
        ];
        if (hasUmbralCollapse) {
            stats.push({ text: 'Umbral Collapse: +100% Boss Damage, +10% Crit Chance', type: 'positive' });
        }
        if (hasVoidAscension) {
            stats.push({ text: 'Void Ascension: Ability fires thrice on random targets', type: 'positive' });
        }
        return stats;
    }

    performAbility() {
        const fireShot = () => {
            // void_ascension fires randomly, otherwise priority target
            const isAscension = typeof alloc !== 'undefined' && alloc['void_ascension'] >= 1;
            const target = isAscension ? this.findRandomTarget() : this.findPriorityTarget();
            if (target) {
                const shotDmg = this.damage * 2 * player.critDamage;
                target.takeDamage(shotDmg, true);
                drawVoidBlast(target.position.x + target.radius, target.position.y + target.radius, true);
                if (target instanceof EliteEnemy) checkEternalTormentReset(this, target, shotDmg);
            }
            return target;
        };

        const firstTarget = fireShot();
        if (typeof alloc !== 'undefined' && alloc['void_ascension'] >= 1) {
            fireShot();
            fireShot();
        }
    }

    findRandomTarget() {
        const alive = enemies.filter(e => !e.isDying && e.hp > 0);
        if (!alive.length) return null;
        return alive[Math.floor(Math.random() * alive.length)];
    }
}

class ChainWand extends BasicWand {
    constructor() {
        super();
        this.name = 'Chain Wand';
        this.baseDamage = 16;
        this.baseCooldown = 28;
        this.globalRange = 225;
        this.chainRange = 325;
        this.chainCount = 6;
        this.chainDamageMultiplier = 0.85;
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getEvolutionStats() {
        return [
            { text: `Chains: +3 targets`, type: 'positive' },
            { text: `Chain Damage: +${((this.chainDamageMultiplier - 0.70) * 100).toFixed(0)}% Increase`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
            { text: 'Ability Guaranteed Crit, -25% Damage', type: 'neutral' },
            { text: `Range: ${this.globalRange} / Chain ${this.chainRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' }
        ];
    }

    performAbility() {
        const abilityDamage = this.damage * player.critDamage * 0.75;
        enemies.forEach(enemy => {
            enemy.takeDamage(abilityDamage, true);
            drawSkyLightning(enemy.position.x + enemy.radius, enemy.position.y + enemy.radius);
        });
    }
}

class SparkWand extends BasicWand {
    constructor() {
        super();
        this.name = 'Spark Wand';
        this.baseDamage = 3;
        this.baseCooldown = 20;
        this.globalRange = 1000;
        this.chainRange = 0;
        this.freezeDuration = 2.5;
        this.damage = this.baseDamage;
        this.abilityName = 'Flash Freeze';
        this.updateDamage();
    }

    getEvolutionStats() {
        return [
            { text: 'Hits All Enemies', type: 'positive' },
            { text: 'Damage: -70%', type: 'negative' },
            { text: 'Ability: Flash Freeze', type: 'positive' },
            { text: `Freeze Duration: ${this.freezeDuration}s`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
            { text: `Range: ${this.globalRange}`, type: 'positive' }
        ];
    }

    performAttack() {
    const target = this.findNearestEnemy();
    if (target) {
        const { damage, isCritical } = this.calculateDamage();
        this.triggerPlayerAttackAnimation();
        enemies.forEach(enemy => {
            this.dealDamageToEnemy(enemy, damage, isCritical);
            // Sky-strike bolt per enemy instead of flat chain bolt
            drawSparkAttackLightning(
                enemy.position.x + enemy.radius,
                enemy.position.y + enemy.radius,
                isCritical
            );
        });
    }
}

performAbility() {
    enemies.forEach(enemy => {
        this.stunEnemy(enemy);
    });
}

    stunEnemy(enemy) {
        enemy.applySpeedEffect(0, this.freezeDuration * 1000);
        enemy.element.classList.add('frozen');
        setTimeout(() => {
            enemy.speed = enemy.baseSpeed;
            enemy.element.classList.remove('frozen');
        }, this.freezeDuration * 1000);
    }
}

class BlessedShield extends BasicShield {
    constructor() {
        super();
        this.name = 'Blessed Shield';
        this.baseDamage = 7;
        this.baseCooldown = 45;
        this.globalRange = 200;
        this.abilityDuration = 10000;
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getEvolutionStats() {
        return [
            { text: 'Increased Damage', type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s, duration ${this.abilityDuration / 1000}s`, type: 'neutral' },
            { text: `Range: ${this.globalRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' }
        ];
    }

    performAbility() {
        const originalRange = this.globalRange;
        this.globalRange *= 1.5;
        player.updateAuraVisual();
        setTimeout(() => {
            this.globalRange = originalRange;
            player.updateAuraVisual();
        }, this.abilityDuration);
    }
}

class SmiteShield extends BasicShield {
    constructor() {
        super();
        this.name = 'Smite Shield';
        this.baseDamage = 4;
        this.baseCooldown = 20;
        this.globalRange = 130;
        this.abilityDuration = 2000;
        this.slowPercent = 25;
        this.attackSpeedBonus = 1.0;
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getAttackSpeed() {
        return player.attacksPerSecond + this.attackSpeedBonus;
    }

    updateDamage() {
        super.updateDamage();

    }

    getEvolutionStats() {
        return [
            { text: 'Rapid Attacks', type: 'positive' },
            { text: `Slows enemies in Aura by: ${this.slowPercent}%`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s, duration ${this.abilityDuration / 1000}s, freezes enemies on use`, type: 'neutral' },
            { text: `Range: ${this.globalRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' }
        ];
    }

    performAttack() {
        enemies.forEach(enemy => {
            if (this.isInRange(enemy)) {
                const { damage, isCritical } = this.calculateDamage();
                enemy.takeDamage(damage, isCritical);
                enemy.applySpeedEffect(1 - (this.slowPercent / 100), 1000);
            }
        });
    }

    performAbility() {
        const originalRange = this.globalRange;
        this.globalRange *= 2.5;
        player.updateAuraVisual();
        enemies.forEach(enemy => {
            if (this.isInRange(enemy)) {
                enemy.applySpeedEffect(0.2, 5000);
            }
        });
        setTimeout(() => {
            this.globalRange = originalRange;
            player.updateAuraVisual();
        }, this.abilityDuration);
    }
}