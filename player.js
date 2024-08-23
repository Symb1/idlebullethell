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
        this.canAttack = true;
		this.souls = gameState.souls || 0;
		this.currentRunSouls = 0;
        this.attackSpeedUpgrades = 0;
        this.healthUpgrades = 0;
        this.attacksPerSecond = 1; 
        this.critChance = 0.01; 
        this.critDamage = 1; 
		this.damageModifier = 1;
		this.baseCooldownReduction = 0;
        this.totalCooldownReduction = 0;
        this.updateCooldownReduction();
		this.amuletDamage = 0;
		this.bossDamageBonus = 0;	
    }

    gainExp(amount) {
        const expUpgrade = soulsUpgrades.find(u => u.name === 'Exp+');
        const expMultiplier = 1 + ((gameState.expUpgrades || 0) * expUpgrade.valuePerUpgrade);
        const finalExp = amount * expMultiplier;
        this.exp += finalExp;
            while (this.exp >= this.expToNextLevel) {
            this.levelUp();
            } 
    }

    gainSouls(amount) {
        const multipliedAmount = amount * gameState.soulMultiplier;
        this.souls += multipliedAmount;
        this.currentRunSouls += multipliedAmount;
        gameState.souls = this.souls;
        saveGameState();
        updateSoulsUI();
    }

    equipAmulet() {
        if (!gameState.amuletEquipped) {
                gameState.amuletEquipped = true;
                player.getAmuletDamageBonus();
            if (player.weapon) {
                player.weapon.updateDamage();
            }
        updatePlayerStats();
        updateInventoryUI();
        }
    }

getAmuletDamageBonus() {
    if (gameState.amuletEquipped) {
        const multiplier = Math.max(1, gameState.ascensionLevel + 1);
        let amuletDamage = this.amuletDamage;
        
       
        if (this instanceof DivineKnight && gameState.unlockedAchievements['Acolyte Master']) {
            amuletDamage += achievements['Acolyte Master'].amuletDamageIncrease;
        }
        if (this instanceof Acolyte && gameState.unlockedAchievements['Sorceress Master']) {
            amuletDamage += achievements['Sorceress Master'].amuletDamageIncrease;
        }
        if (this instanceof Sorceress && gameState.unlockedAchievements['Divine Knight Master']) {
            amuletDamage += achievements['Divine Knight Master'].amuletDamageIncrease;
        }
        
        return amuletDamage * multiplier;
    } else {
        return 0;
    }
}

    getBossDamageBonus() {
    if (!gameState.amuletEquipped) {
        return 0; 
    }

    
    const ascensionMultiplier = Math.max(1, gameState.ascensionLevel + 1);
    const amuletBonus = this.bossDamageBonus * ascensionMultiplier;

   
    const cardUpgradeBonus = this.additionalBossDamage || 0;

   
    const bossDamageUpgrade = soulsUpgrades.find(u => u.name === 'Boss Damage+');
    const soulUpgradeBonus = (gameState.bossDamageUpgrades || 0) * bossDamageUpgrade.valuePerUpgrade;

    
    const totalBonus = amuletBonus + cardUpgradeBonus + soulUpgradeBonus;

    return totalBonus;
    }


    adjustCritChance(amount) {
        this.critChance = Math.min(1, Math.max(0, this.critChance + amount));
    }

    updateCooldownReduction() {
    const cooldownUpgrade = soulsUpgrades.find(u => u.name === 'Cooldown+');
    const permanentReduction = (gameState.cooldownUpgrades || 0) * cooldownUpgrade.valuePerUpgrade;
    this.totalCooldownReduction = Math.min(0.75, Math.max(0, permanentReduction + this.baseCooldownReduction));
}

    adjustCooldownReduction(amount) {
    const cooldownUpgrade = soulsUpgrades.find(u => u.name === 'Cooldown+');
    const permanentReduction = (gameState.cooldownUpgrades || 0) * cooldownUpgrade.valuePerUpgrade;
    const oldBase = this.baseCooldownReduction;
    this.baseCooldownReduction = Math.min(0.75 - permanentReduction, Math.max(-permanentReduction, this.baseCooldownReduction + amount));
    this.updateCooldownReduction();
}

    getCurrentCooldown(baseCooldown) {
        return baseCooldown * (1 - this.totalCooldownReduction);
    }

    getInitialHP() {
    const healthUpgrade = soulsUpgrades.find(u => u.name === 'Health+');
    return Player.BASE_HP + ((gameState.healthUpgrades || 0) * healthUpgrade.valuePerUpgrade);
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    updateHp(deltaTime) {
        this.heal(this.hpRegen * deltaTime / 1000);
    }

    levelUp() {
        this.level++;
        this.exp -= this.expToNextLevel;

        
        if (this.level < 10) {
            this.expToNextLevel *= 1.35;
        }
		else if (this.level < 20) {
            this.expToNextLevel *= 1.15;
        }
        else {
            this.expToNextLevel *= 1.025;
        }

        this.expToNextLevel = Math.round(this.expToNextLevel);

        if (this.level === 10) {
        showWeaponEvolutionScreen();
        } 
	    else {
        showLevelUpScreen();
        }
    
        if (!gameState.autoCardEnabled) {
            requestAnimationFrame(gameLoop);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            gameOver();
        }
    }
}

function initializePlayer(playerClass) {
    switch (playerClass) {
        case 'Acolyte':
            player = new Acolyte();
            break;
        case 'Sorceress':
            player = new Sorceress();
            break;
        case 'Divine Knight':
            player = new DivineKnight();
            break;
        default:
            return;
    }
    player.class = playerClass;
    gameState.currentWave = 1 + (gameState.startingWaveUpgrades || 0);
    player.souls = gameState.souls || 0;
    player.gainSouls(0);

    
    player.maxHp = player.getInitialHP();
    player.hpRegen = (gameState.regenUpgrades || 0) * soulsUpgrades.find(u => u.name === 'Regen+').valuePerUpgrade;
    player.attacksPerSecond += (gameState.attackSpeedUpgrades || 0) * soulsUpgrades.find(u => u.name === 'Attack Speed+').valuePerUpgrade;
    
    
    player.critDamage += (gameState.critDamageUpgrades || 0) * soulsUpgrades.find(u => u.name === 'Critical Damage+').valuePerUpgrade;
    
    if (!(player instanceof DivineKnight)) {
        player.adjustCritChance((gameState.critChanceUpgrades || 0) * soulsUpgrades.find(u => u.name === 'Crit Chance+').valuePerUpgrade);
    }

    player.updateCooldownReduction();
    player.getAmuletDamageBonus();
    if (player.weapon) {
        player.weapon.updateDamage();
    }
    updatePlayerStats();
}

function createPlayerElement() {
    const gameArea = document.getElementById('game-area');
    const playerElement = document.createElement('div');
    playerElement.id = 'player';
    playerElement.style.left = `${player.position.x}px`;
    playerElement.style.top = `${player.position.y}px`;
    playerElement.style.backgroundImage = `url('img/${player.image}')`;
    playerElement.style.backgroundSize = 'cover';
    gameArea.appendChild(playerElement);
}

function updatePlayer() {
    if (!player || !player.position) return;

   
    enemies.forEach(enemy => {
        if (!enemy || !enemy.position) return;

        const distance = calculateDistance(player.position, enemy.position);
        if (distance < 30 + enemy.radius) { 
            if (enemy instanceof Boss) {
                if (!enemy.lastDamageTime || Date.now() - enemy.lastDamageTime >= 2000) {
                    player.takeDamage(5);
                    enemy.lastDamageTime = Date.now();
                }
            }
			else if (enemy instanceof EliteEnemy) {
                if (!enemy.lastDamageTime || Date.now() - enemy.lastDamageTime >= 4000) {
                    player.takeDamage(3);
                    enemy.lastDamageTime = Date.now();
                }
            }
			else {
                if (!enemy.lastDamageTime || Date.now() - enemy.lastDamageTime >= 2000) {
                    player.takeDamage(1);
                    enemy.lastDamageTime = Date.now();
                }
            }
        }
    });

    if (gameState.currentStage > gameState.highestStageReached) {
        gameState.highestStageReached = gameState.currentStage;
        saveGameState();
        checkAchievements(); 
    }

    
    const playerElement = document.getElementById('player');
    if (playerElement) {
        playerElement.style.left = `${player.position.x}px`;
        playerElement.style.top = `${player.position.y}px`;
    }

    if (player.weapon) {
        if (player.canAttack) {
            player.weapon.attack();
        }
    }

    if (player instanceof DivineKnight) {
        player.showAura(); 
        player.updateAuraVisual();
    }
}

function calculateDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}