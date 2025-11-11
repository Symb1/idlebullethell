function initializeWeapon(playerClass, weaponName = null) {	
    switch (playerClass) {		
        case 'Acolyte':
            if (weaponName === 'Vortex Staff') {
                player.weapon = new VortexStaff();
            } else if (weaponName === 'Umbral Staff') {
                player.weapon = new UmbralStaff();
            } else {
                player.weapon = new BasicStaff();
            }
            break;
        case 'Sorceress':
            if (weaponName === 'Chain Wand') {
                player.weapon = new ChainWand();
            } else if (weaponName === 'Spark Wand') {
                player.weapon = new SparkWand();
            } else {
                player.weapon = new BasicWand();
            }
            break;
        case 'Divine Knight':
            if (weaponName === 'Blessed Shield') {
                player.weapon = new BlessedShield();
            } else if (weaponName === 'Smite Shield') {
                player.weapon = new SmiteShield();
            } else {
                player.weapon = new BasicShield();
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
        this.updateDamage(); // Call this to apply amulet bonus immediately
    }

    attack() {
    const now = Date.now();
    if (now - this.lastAttackTime >= 1000 / player.attacksPerSecond) {
        this.performAttack();
        this.lastAttackTime = now;
    }
   }

triggerPlayerAttackAnimation() {
    const playerElement = document.getElementById('player');
    if (!playerElement) return;
    
    // Only apply attack animation for Acolyte class
    if (player.class !== 'Acolyte') {
        return;
    }
    
    // Cycle through attack sounds (1, 2, 3, then back to 1)
    Weapon.attackSoundIndex = (Weapon.attackSoundIndex % 3) + 1;
    const attackAudio = document.getElementById(`acoattmu${Weapon.attackSoundIndex}`);
    if (attackAudio) {
        attackAudio.currentTime = 0;
        attackAudio.volume = 0.12; 
        // Adjust playback rate based on attack speed (normalized to 1.0 at base speed)
        attackAudio.playbackRate = player.attacksPerSecond / 1.0;
        attackAudio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    // Find the nearest ALIVE enemy and update facing direction FIRST
    const nearestEnemy = enemies
        .filter(enemy => !enemy.isDying) // <-- Filter out dying enemies
        .reduce((nearest, enemy) => {
            const distance = calculateDistance(player.position, enemy.position);
            if (!nearest || distance < calculateDistance(player.position, nearest.position)) {
                return enemy;
            }
            return nearest;
        }, null);
    
    // Update facing direction based on nearest enemy
    if (nearestEnemy) {
        const shouldFaceLeft = nearestEnemy.position.x < player.position.x;
        player.facingLeft = shouldFaceLeft;
        if (shouldFaceLeft) {
            playerElement.classList.add('facing-left');
        } else {
            playerElement.classList.remove('facing-left');
        }
    }
    
    // Calculate animation duration based on attack speed
    const animationDuration = (1000 / player.attacksPerSecond);
    
    // Clear any existing timeout
    if (this.attackAnimationTimeout) {
        clearTimeout(this.attackAnimationTimeout);
    }
    
    // Remove attacking class first
    playerElement.classList.remove('attacking');
    playerElement.style.animation = '';
    
    // Force reflow
    void playerElement.offsetWidth;
    
    // Add attacking class
    playerElement.classList.add('attacking');
    
    // Set animation
    playerElement.style.animation = `playerAttack ${animationDuration}ms steps(47) forwards`;
    
    // Store timeout reference
    this.attackAnimationTimeout = setTimeout(() => {
        playerElement.classList.remove('attacking');
        playerElement.style.animation = '';
        this.attackAnimationTimeout = null;
    }, animationDuration);
}

    calculateDamage() {
    const isCritical = Math.random() < player.critChance;
    const damage = isCritical ? this.damage * player.critDamage : this.damage;
    return { damage, isCritical };
    }
    
	updateDamage() {
        const amuletBonus = player.getAmuletDamageBonus();
        this.damage = (this.baseDamage + amuletBonus) * player.damageModifier;
    }
	
    performAttack() {
        // To be implemented by subclasses
    }

    useAbility() {
    const now = Date.now();
    const currentCooldown = player.getCurrentCooldown(this.baseCooldown);
    if (now - this.lastAbilityUseTime >= currentCooldown * 1000) {
        this.performAbility();
        this.lastAbilityUseTime = now;
        this.showAbilityCooldown();
    }
}

    showAbilityCooldown() {
        if (!(player instanceof DivineKnight)) return;

        const playerElement = document.getElementById('player');
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
                playerElement.removeChild(cooldownElement);
            }
        };
        updateCooldown();
    }

        getAbilityButtonText() {
        const now = Date.now();
        const currentCooldown = player.getCurrentCooldown(this.baseCooldown);
        const cooldownRemaining = Math.max(0, currentCooldown - (now - this.lastAbilityUseTime) / 1000);

        if (cooldownRemaining > 0) {
            return `Cooldown (${cooldownRemaining.toFixed(1)}s)`;
        } else {
            return this.abilityName;
        }
    }

    performAbility() {
        // To be implemented by subclasses
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
        this.triggerPlayerAttackAnimation(); // Remove target parameter
    }
  }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            target.takeDamage(damage * 2, isCritical);
        }
    }

    findPriorityTarget() {
    // First, look for bosses
    const bossTarget = enemies.find(enemy => enemy instanceof Boss);
    if (bossTarget) return bossTarget;

    // If no bosses, look for elite enemies
    const eliteTarget = enemies.find(enemy => enemy instanceof EliteEnemy);
    if (eliteTarget) return eliteTarget;

    // If no bosses or elite enemies, find the nearest regular enemy
    return this.findNearestEnemy();
    }

    findNearestEnemy() {
    return enemies
        .filter(e => !e.isDying && e.hp > 0)   
        .reduce((nearest, enemy) => {
            const distance = calculateDistance(player.position, enemy.position);
            // Add range check here
            if (distance <= this.globalRange && (!nearest || distance < calculateDistance(player.position, nearest.position))) {
                return enemy;
            }
            return nearest;
        }, null);
}
}


class BasicWand extends Weapon {
    constructor() {
        super('Basic Wand', 10, 20, 'Lightning Storm', 200, 275);
    }

    performAttack() {
        const target = this.findNearestEnemyInInitialRange();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            this.dealDamageWithChain(target, damage, isCritical);
        }
    }

    performAbility() {
    const abilityDamage = this.damage * player.critDamage; // Cannot crit, just apply as regular damage
    
    enemies.forEach(enemy => {
        enemy.takeDamage(abilityDamage, false); // Changed to false - cannot crit
    });

    console.log(`Lightning Storm ability used: ${abilityDamage.toFixed(2)} damage to all enemies`);
  }

    dealDamageWithChain(target, initialDamage, isCritical) {
    this.dealDamageToEnemy(target, initialDamage, isCritical);

    let remainingTargets = 3;
    let currentDamage = initialDamage;
    let lastHitEnemy = target;

    while (remainingTargets > 0 && enemies.length > 0) {
        const nextTarget = this.findRandomEnemyInChainRange(lastHitEnemy);
        if (nextTarget) {
            currentDamage *= 0.70;  
            this.dealDamageToEnemy(nextTarget, currentDamage, isCritical);
            remainingTargets--;
            lastHitEnemy = nextTarget;
        } else {
            break;
        }
      }
    }

    dealDamageToEnemy(enemy, damage, isCritical) {
        const actualDamage = Math.max(0, damage);
        enemy.takeDamage(actualDamage, isCritical);
        console.log(`Dealt ${actualDamage.toFixed(2)} damage to enemy`);
    }

    findNearestEnemyInInitialRange() {
        return enemies.reduce((nearest, enemy) => {
            const distance = calculateDistance(player.position, enemy.position);
            if (distance <= this.globalRange && (!nearest || distance < calculateDistance(player.position, nearest.position))) {
                return enemy;
            }
            return nearest;
        }, null);
    }

    findRandomEnemyInChainRange(lastHitEnemy) {
        const validEnemies = enemies.filter(enemy => 
            enemy !== lastHitEnemy && this.isInChainRange(lastHitEnemy, enemy)
        );
        if (validEnemies.length === 0) return null;
        return validEnemies[Math.floor(Math.random() * validEnemies.length)];
    }

    isInRange(enemy) {
        return calculateDistance(player.position, enemy.position) <= this.globalRange;
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

    isInRange(enemy) {
        return calculateDistance(player.position, enemy.position) < this.globalRange;
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

    weaponOptions.forEach((weapon, index) => {
        const card = document.createElement('div');
        card.className = 'upgrade-card evolution-card';
        card.dataset.index = index;

        // Super simple stat rendering
        const statsHTML = weapon.stats
            .map(stat => `<p class="stat-${stat.type}">✦ ${stat.text}</p>`)
            .join('');

        card.innerHTML = `
            <div class="evolution-name">${weapon.name}</div>
            ${weapon.flavor ? `<div class="upgrade-flavor">${weapon.flavor}</div>` : ''}
            <div class="evolution-description">${statsHTML}</div>
        `;

        if (gameState.autoWeaponEvolutionEnabled) {
            card.classList.add('disabled');
        } else {
            card.addEventListener('click', () => selectWeaponEvolution(weapon));
        }

        evolutionOptions.appendChild(card);
    });

    evolutionScreen.style.display = 'flex';

    if (gameState.autoWeaponEvolutionEnabled) {
        const selectedWeapon = autoSelectWeaponEvolution(weaponOptions);
        const selectedIndex = weaponOptions.indexOf(selectedWeapon);
        const selectedCard = evolutionOptions.querySelector(`[data-index="${selectedIndex}"]`);
        
        selectedCard.classList.add('auto-select-glow2');

        setTimeout(() => {
            selectWeaponEvolution(selectedWeapon);
        }, 3000);
    }
}

function selectWeaponEvolution(weapon) {
    initializeWeapon(player.class, weapon.name);
    hideWeaponEvolutionScreen();
    gameState.isPaused = false;
    
    // Cancel any existing animation frame and restart the loop
    cancelAnimationFrame(animationFrameId);
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
	processNextLevelUp();
}

function autoSelectWeaponEvolution(weaponOptions) {
    const autoChoice = gameState.autoWeaponEvolutionChoices[player.class];
    if (autoChoice) {
        return weaponOptions.find(weapon => weapon.name === autoChoice) || weaponOptions[0];
    }
    return weaponOptions[0]; // Default to first option if no auto-choice is set
}

function hideWeaponEvolutionScreen() {
    const evolutionScreen = document.getElementById('weapon-evolution');
    if (evolutionScreen) {
        evolutionScreen.style.display = 'none';
    }
}

function getWeaponEvolutionOptions(playerClass) {
    const weaponMap = {
        'Acolyte': [
            { 
                class: VortexStaff,
                flavor: 'Channels unstable void currents, tearing open miniature rifts that engulf everything nearby.'
            },
            { 
                class: UmbralStaff,
                flavor: 'A conduit of pure darkness, its power does not strike, it focuses void essence into a single, perfect line of annihilation.'
            }
        ],
        'Sorceress': [
            { 
                class: ChainWand,
                flavor: 'Weaves lightning through the battlefield, each strike seeking new prey with relentless hunger.'
            },
            { 
                class: SparkWand,
                flavor: 'A tempest bound in crystal, its fury knows no bounds but demands sacrifice for its power.'
            }
        ],
        'Divine Knight': [
            { 
                class: BlessedShield,
                flavor: 'Forged in sacred light, its divine protection extends far beyond mortal reach.'
            },
            { 
                class: SmiteShield,
                flavor: 'Swift as divine judgment, each strike saps the strength of those who dare approach.'
            }
        ]
    };
    
    const weapons = weaponMap[playerClass] || [];
    
    return weapons.map(w => {
        const instance = new w.class();
        return {
            name: instance.name,
            flavor: w.flavor,
            stats: instance.getEvolutionStats()
        };
    });
}

// New weapon classes
class VortexStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Vortex Staff';
        this.baseDamage = 22;
        this.baseCooldown = 20;
        this.globalRange = 350;
        this.splashRange = 75;
        this.damage = this.baseDamage;
        this.updateDamage();
    }
    
    getEvolutionStats() {
        return [
            { text: `Splash Damage: 50% (${this.splashRange} range)`, type: 'positive' },
            { text: 'Ability Power: +150%', type: 'positive' },
            { text: `Range: ${this.globalRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
            { text: 'Ability Cannot Crit', type: 'negative' }
        ];
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            // Vortex Staff can crit on basic attacks
            target.takeDamage(damage, isCritical);
            this.triggerPlayerAttackAnimation();
            this.splashDamage(target, damage, isCritical);
        }
    }

    splashDamage(centerEnemy, originalDamage, wasCrit) {
        enemies.forEach(enemy => {
            if (enemy !== centerEnemy && calculateDistance(centerEnemy.position, enemy.position) <= this.splashRange) {
                // Splash damage is 50% of original damage and CAN crit independently
                const splashBaseDamage = originalDamage * 0.5;
                const isSplashCrit = Math.random() < player.critChance;
                const finalSplashDamage = isSplashCrit ? splashBaseDamage * player.critDamage : splashBaseDamage;
                enemy.takeDamage(finalSplashDamage, isSplashCrit);
            }
        });
    }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            const abilityDamage = this.damage * 2 * 2.5;
            target.takeDamage(abilityDamage, false); // Cannot crit
        }
    }
}

class UmbralStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Umbral Staff';
        this.baseDamage = 40;
        this.baseCooldown = 25;
        this.globalRange = 450;
        this.damage = this.baseDamage;
        this.updateDamage();
    }
    
    getEvolutionStats() {
        return [
            { text: 'High Single Target Damage', type: 'positive' },
            { text: 'Ability Guaranteed Crit', type: 'positive' },
            { text: `Range: ${this.globalRange}`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' }
        ];
    }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            const criticalDamage = this.damage * 2 * player.critDamage;
            target.takeDamage(criticalDamage, true);
        }
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
    
    dealDamageWithChain(target, initialDamage, isCritical) {
        this.dealDamageToEnemy(target, initialDamage, isCritical);

        let remainingTargets = this.chainCount;
        let currentDamage = initialDamage;
        let lastHitEnemy = target;

        while (remainingTargets > 0 && enemies.length > 0) {
            const nextTarget = this.findRandomEnemyInChainRange(lastHitEnemy);
            if (nextTarget) {
                currentDamage *= this.chainDamageMultiplier;
                this.dealDamageToEnemy(nextTarget, currentDamage, isCritical);
                remainingTargets--;
                lastHitEnemy = nextTarget;
            } else {
                break;
            }
        }
    }
  
  performAbility() {
    const abilityDamage = this.damage * player.critDamage * 0.75; // Guaranteed crit with 25% damage reduction
    
    enemies.forEach(enemy => {
        enemy.takeDamage(abilityDamage, true); // Always crit
    });

    console.log(`Lightning Storm ability used: ${abilityDamage.toFixed(2)} damage to all enemies (guaranteed crit, -25% damage)`);
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
        const target = this.findNearestEnemyInInitialRange();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            this.dealDamageToAllEnemies(damage, isCritical);
        }
    }

    dealDamageToAllEnemies(initialDamage, isCritical) {
        enemies.forEach((enemy) => {
            this.dealDamageToEnemy(enemy, initialDamage, isCritical);
        });
    }

    performAbility() {
        enemies.forEach(enemy => {
            this.stunEnemy(enemy);
        });
        console.log('Spark Wand ability used: All enemies stunned for 2.5 seconds');
    }

    stunEnemy(enemy) {
        const originalSpeed = enemy.baseSpeed;
        enemy.applySpeedEffect(0, this.freezeDuration * 1000);
        enemy.element.classList.add('stunned');

        setTimeout(() => {
            enemy.speed = originalSpeed; 
            enemy.element.classList.remove('stunned');
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
            { text: `Ability Cooldown: ${this.baseCooldown}s, duration ${this.abilityDuration/1000}s`, type: 'neutral' },
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
        
        if (player) {
            player.attacksPerSecond += this.attackSpeedBonus;
        }
    }
    
    getEvolutionStats() {
        return [
            { text: 'Rapid Attacks', type: 'positive' },
            { text: `Slows enemies in Aura by: ${this.slowPercent}%`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s, duration ${this.abilityDuration/1000}s, freezes enemies on use`, type: 'neutral' },
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