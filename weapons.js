function initializeWeapon(playerClass, weaponName = null) {	
    switch (playerClass) {		
        case 'Acolyte':
            if (weaponName === 'Shatter Staff') {
                player.weapon = new ShatterStaff();
            } else if (weaponName === 'Earth Staff') {
                player.weapon = new EarthStaff();
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
        attackAudio.volume = 0.08; 
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
        super('Basic Staff', 15, 12, 'Earth Blast', 475);
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
            if (!nearest || distance < calculateDistance(player.position, nearest.position)) {
                return enemy;
            }
            return nearest;
        }, null);
}
}


class BasicWand extends Weapon {
    constructor() {
        super('Basic Wand', 10, 20, 'Lightning Storm', 225, 325);
    }

    performAttack() {
        const target = this.findNearestEnemyInInitialRange();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            this.dealDamageWithChain(target, damage, isCritical);
        }
    }

    performAbility() {
        const critDamage = this.damage * player.critDamage;
        
        enemies.forEach(enemy => {
            enemy.takeDamage(critDamage, true); // Always crit
        });

        console.log(`Storm Wand ability used: ${critDamage.toFixed(2)} damage to all enemies`);
    }

    dealDamageWithChain(target, initialDamage, isCritical) {
    this.dealDamageToEnemy(target, initialDamage, isCritical);

    let remainingTargets = 3;
    let currentDamage = initialDamage;
    let lastHitEnemy = target;

    while (remainingTargets > 0 && enemies.length > 0) {
        const nextTarget = this.findRandomEnemyInChainRange(lastHitEnemy);
        if (nextTarget) {
            currentDamage *= 0.60;  
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

        card.innerHTML = `
            <div class="evolution-name">${weapon.name}</div>
            <hr>
            <div class="evolution-description">${weapon.description}</div>
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
    switch (playerClass) {
        case 'Acolyte':
            return [
                { 
                    name: 'Shatter Staff', 
                    description: '<p><strong>Splash Damage</strong></p><p><strong>Increased Ability Power</strong></p><p><strong>Medium Ability Cooldown</strong></p><p><strong>Shorter Range</strong></p>'
                },
                { 
                    name: 'Earth Staff', 
                    description: '<p><strong>High Single Target Damage</strong></p><p><strong>Ability Guaranteed to Crit</strong></p><p><strong>Longer Ability Cooldown</strong></p><p><strong>Max Range</strong></p>'
                }
            ];
        case 'Sorceress':
            return [
                { 
                    name: 'Chain Wand', 
                    description: '<p><strong>More Chained Enemies</strong></p><p><strong>Lower Chain Damage Penalty</strong></p><p><strong>Longer Ability Cooldown</strong></p><p><strong>Medium Range And Chain</strong></p>'
                },
                { 
                    name: 'Spark Wand', 
                    description: '<p><strong>Hits All Enemies</strong></p><p><strong>Significant Damage Penalty</strong></p><p><strong>Ability Freezes Enemies</strong></p><p><strong>Medium Ability Cooldown</p><p><strong>Max Range No Chain</strong></p>'
                }
            ];
        case 'Divine Knight':
            return [
                { 
                    name: 'Blessed Shield', 
                    description: '<p><strong>Increased Damage</strong></p><p><strong>Extended Range</strong></p>'
                },
                { 
                    name: 'Smite Shield', 
                    description: '<p><strong>Rapid Attacks</strong></p><p><strong>Enemy Slowdown</strong></p>'
                }
            ];
    }
}

// New weapon classes
class ShatterStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Shatter Staff';
        this.baseDamage = 22;
        this.damage = this.baseDamage;
        this.baseCooldown = 20;
        this.globalRange = 400;
        this.splashRange = 50;
        this.updateDamage();
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            target.takeDamage(damage, isCritical);
            this.splashDamage(target, damage);
        }
    }

    splashDamage(centerEnemy, originalDamage) {
        enemies.forEach(enemy => {
            if (enemy !== centerEnemy && calculateDistance(centerEnemy.position, enemy.position) <= this.splashRange) {
                enemy.takeDamage(originalDamage, false);
            }
        });
    }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            target.takeDamage(damage * 2.5, isCritical);
        }
    }
}

class EarthStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Earth Staff';
        this.baseDamage = 40;
        this.damage = this.baseDamage;
        this.baseCooldown = 25;
		this.globalRange = 600;
		this.updateDamage();
		
    }

    performAbility() {
    const target = this.findPriorityTarget();
    if (target) {
        const criticalDamage = this.damage * player.critDamage * 1.5;
        target.takeDamage(criticalDamage, true); // Always crit
    }
}
}

class ChainWand extends BasicWand {
    constructor() {
        super();
        this.name = 'Chain Wand';
        this.baseDamage = 16;
        this.damage = this.baseDamage;
        this.baseCooldown = 30;
        this.globalRange = 285;
        this.chainRange = 360;
		this.updateDamage();
		
    }

    dealDamageWithChain(target, initialDamage, isCritical) {
    this.dealDamageToEnemy(target, initialDamage, isCritical);

    let remainingTargets = 6;
    let currentDamage = initialDamage;
    let lastHitEnemy = target;

    while (remainingTargets > 0 && enemies.length > 0) {
        const nextTarget = this.findRandomEnemyInChainRange(lastHitEnemy);
        if (nextTarget) {
            currentDamage *= 0.80;  // 
            this.dealDamageToEnemy(nextTarget, currentDamage, isCritical);
            remainingTargets--;
            lastHitEnemy = nextTarget;
        } else {
            break;
        }
    }
  }
}

class SparkWand extends BasicWand {
    constructor() {
        super();
        this.name = 'Spark Wand';
        this.baseDamage = 3;
        this.damage = this.baseDamage;
        this.baseCooldown = 20;
        this.globalRange = 1000;
        this.updateDamage();
        
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
        console.log('Spark Wand ability used: All enemies stunned for 2 seconds');
    }

    stunEnemy(enemy) {
        const originalSpeed = enemy.speed;
        enemy.speed = 0; // Reduce speed to 0 (100% slow)
        enemy.element.classList.add('stunned'); // Add a visual indicator

        setTimeout(() => {
            enemy.speed = originalSpeed; // Restore original speed after 2 seconds
            enemy.element.classList.remove('stunned'); // Remove visual indicator
        }, 2000);
    }
}

class BlessedShield extends BasicShield {
    constructor() {
        super();
        this.name = 'Blessed Shield';
        this.baseDamage = 7;
        this.damage = this.baseDamage;
        this.baseCooldown = 44;
        this.globalRange = 200;
        this.abilityDuration = 10000;
        this.updateDamage();
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
        this.baseDamage = 5;
        this.damage = this.baseDamage;
        this.baseCooldown = 15;
        this.globalRange = 130;
        this.abilityDuration = 2000;
        this.updateDamage();
    }

    performAttack() {
        enemies.forEach(enemy => {
            if (this.isInRange(enemy)) {
                const { damage, isCritical } = this.calculateDamage();
                enemy.takeDamage(damage, isCritical);
                enemy.applySpeedEffect(0.75, 1000); // 25% slow for 1 second
            }
        });
    }

    performAbility() {
        const originalRange = this.globalRange;
        this.globalRange *= 2.5;
        player.updateAuraVisual();
        enemies.forEach(enemy => {
            if (this.isInRange(enemy)) {
                enemy.applySpeedEffect(0.2, 5000); // 80% slow for 1 second
            }
        });
        setTimeout(() => {
            this.globalRange = originalRange;
            player.updateAuraVisual();
        }, this.abilityDuration);
    }
}