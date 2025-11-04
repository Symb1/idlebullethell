const upgrades = [
    {
        name: 'Damage Increase',
        effect: (rarity) => {
            const increase = rarity === 'Epic' ? 0.25 : (rarity === 'Magic' ? 0.12 : 0.08);
            player.damageModifier *= (1 + increase);
	    if (player.weapon) {
            player.weapon.updateDamage();
        }
        },
        getValue: (rarity) => {
            const increase = rarity === 'Epic' ? 0.25 : (rarity === 'Magic' ? 0.12 : 0.08);
            return `x${(increase * 100).toFixed(0)}%`;
        }
    },
    {
        name: 'Attack Speed',
        effect: (rarity) => {
            const increase = rarity === 'Epic' ? 0.25 : (rarity === 'Magic' ? 0.15 : 0.10);
            player.attacksPerSecond += increase;
        },
        getValue: (rarity) => {
            const increase = rarity === 'Epic' ? 0.25 : (rarity === 'Magic' ? 0.15 : 0.10);
            return `+${(increase * 100).toFixed(0)}%`;
        }
    },
    {
    name: 'Health',
    effect: (rarity) => {
        const increase = rarity === 'Epic' ? 2.0 : (rarity === 'Magic' ? 1.5 : 1.0);
        player.maxHp += increase;
        player.heal(increase);
    },
    getValue: (rarity) => {
        const increase = rarity === 'Epic' ? 2.0 : (rarity === 'Magic' ? 1.5 : 1.0);
        return `+${increase.toFixed(1)}`;
    }
},
	{
    name: 'Regeneration',
    effect: (rarity) => {
        const increase = rarity === 'Epic' ? 0.1 : (rarity === 'Magic' ? 0.05 : 0.02);
        player.hpRegen += increase;
    },
    getValue: (rarity) => {
        const increase = rarity === 'Epic' ? 0.1 : (rarity === 'Magic' ? 0.05 : 0.02);
        return `+${increase.toFixed(2)}/s`;
    }
},
{
    name: 'Cooldown Reduction',
    effect: (rarity) => {
        const reduction = rarity === 'Epic' ? 0.15 : (rarity === 'Magic' ? 0.10 : 0.05);
        player.adjustCooldownReduction(reduction);
    },
    getValue: (rarity) => {
        const reduction = rarity === 'Epic' ? 0.15 : (rarity === 'Magic' ? 0.10 : 0.05);
        return `+${(reduction * 100).toFixed(0)}%`;
    }
},
    {
        name: 'Critical Damage Increase',
        effect: (rarity) => {
            const increase = rarity === 'Epic' ? 0.40 : (rarity === 'Magic' ? 0.25 : 0.15);
            player.critDamage += increase;
        },
        getValue: (rarity) => {
            const increase = rarity === 'Epic' ? 0.40 : (rarity === 'Magic' ? 0.25 : 0.15);
            return `+${(increase * 100).toFixed(0)}%`;
        }
    },
    {
    name: 'Critical Strike Chance',
    effect: (rarity) => {
        const increase = rarity === 'Epic' ? 0.06 : (rarity === 'Magic' ? 0.03 : 0.01);
        player.adjustCritChance(increase);
    },
    getValue: (rarity) => {
        const increase = rarity === 'Epic' ? 0.06 : (rarity === 'Magic' ? 0.03 : 0.01);
        return `+${(increase * 100).toFixed(1)}%`;
    },
    condition: () => !(player instanceof DivineKnight)
    },
{
    name: 'Boss Damage',
    effect: (rarity) => {
        const increase = rarity === 'Epic' ? 0.50 : (rarity === 'Magic' ? 0.25 : 0.10);
        player.additionalBossDamage = (player.additionalBossDamage || 0) + increase;
    },
    getValue: (rarity) => {
        const increase = rarity === 'Epic' ? 0.50 : (rarity === 'Magic' ? 0.25 : 0.10);
        return `+${(increase * 100).toFixed(0)}%`;
    }
},
];

function getRarity() {
    const rarityUpgrade = soulsUpgrades.find(u => u.name === 'Rarity+');
    const rarityBonus = (gameState.rarityUpgrades || 0) * rarityUpgrade.valuePerUpgrade;
    const roll = Math.random();
    if (roll < 0.60 - rarityBonus * 2) return 'Normal';
    if (roll < 0.90 - rarityBonus) return 'Magic';
    return 'Epic';
}

function getRandomUpgrades(count) {
    if (player.level === 10) {
        // Offer weapon evolution at level 10
        showWeaponEvolutionScreen();
        return [];
    } else if (player.level >= 15 && (player.level - 15) % 10 === 0) {
        // Offer class upgrade at level 15 and every 10 levels after that
        const classUpgradeOptions = classUpgrades[player.class];
        const shuffled = [...classUpgradeOptions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(upgrade => ({
            ...upgrade,
            isClassUpgrade: true
        }));
    } else {
        // Offer regular upgrades
        const availableUpgrades = upgrades.filter(upgrade => {
            if (upgrade.name === 'Boss Damage' && !gameState.amuletEquipped) {
                return false; // Don't offer Boss Damage upgrade if amulet is not equipped
            }
            return !upgrade.condition || upgrade.condition();
        });
        const shuffled = [...availableUpgrades].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(upgrade => ({
            ...upgrade,
            rarity: getRarity()
        }));
    }
}

const classUpgrades = {
    Acolyte: [
        {
            name: 'Frenzied Staff',
            attackSpeedIncrease: 0.5,
            critChanceDecrease: 0.02,
            cooldownIncrease: 0.1,
            effect: function() {
                player.attacksPerSecond += this.attackSpeedIncrease;
                player.adjustCritChance(-this.critChanceDecrease);
                player.adjustCooldownReduction(-this.cooldownIncrease);
            },
            description: function() {
                return `Increased Attack Speed by ${(this.attackSpeedIncrease * 100).toFixed(0)}%, but reduces Crit Chance by ${(this.critChanceDecrease * 100).toFixed(0)}% and increases Cooldown by ${(this.cooldownIncrease * 100).toFixed(0)}%`;
            }
        },
        {
            name: 'Swift Earth',
            damageLoss: 0.1,
            cooldownReduction: 0.25,
            effect: function() {
                player.weapon.damage *= (1 - this.damageLoss);
                player.adjustCooldownReduction(this.cooldownReduction);
            },
            description: function() {
                return `Reduces Cooldown by ${(this.cooldownReduction * 100).toFixed(0)}% but lowers your damage by ${(this.damageLoss * 100).toFixed(0)}%`;
            }
        },
        {
            name: 'Critical Mastery',
            critDamageIncrease: 0.5,
            damageLoss: 0.02,
            effect: function() {
                player.critDamage += this.critDamageIncrease;
                player.weapon.damage *= (1 - this.damageLoss);
            },
            description: function() {
                return `Increased Crit Damage by ${(this.critDamageIncrease * 100).toFixed(0)}%, but lowers your damage by ${(this.damageLoss * 100).toFixed(0)}%`;
            }
        }
    ],
    Sorceress: [
        {
            name: 'Arcane Velocity',
            attackSpeedIncrease: 0.5,
            critChanceDecrease: 0.10,
            effect: function() {
                player.attacksPerSecond += this.attackSpeedIncrease;
                player.adjustCritChance(-this.critChanceDecrease);
            },
            description: function() {
                return `Increased Attack Speed by ${(this.attackSpeedIncrease * 100).toFixed(0)}%, but reduces Crit Chance by ${(this.critChanceDecrease * 100).toFixed(0)}%`;
            }
        },
        {
            name: 'Precise Strikes',
            critChanceIncrease: 0.1,
            critDamageDecrease: 0.2,
            effect: function() {
                player.critChance += this.critChanceIncrease;
                player.critDamage -= this.critDamageDecrease;
            },
            description: function() {
                return `Increased Critical Chance by ${(this.critChanceIncrease * 100).toFixed(0)}%, but decreases Crit Damage by ${(this.critDamageDecrease * 100).toFixed(0)}%`;
            }
        },
        {
            name: 'Chain Mastery',
            chainIncrease: 1,
            attackSpeedDecrease: 0.2,
            effect: function() {
                player.weapon.remainingTargets += this.chainIncrease;
                player.attacksPerSecond -= this.attackSpeedDecrease;
            },
            description: function() {
                return `Increased the number of chain targets by ${this.chainIncrease}, but lowers Attack Speed by ${(this.attackSpeedDecrease * 100).toFixed(0)}%`;
            }
        }
    ],
    'Divine Knight': [
        {
            name: 'Swift Shield',
            attackSpeedIncrease: 0.5,
            damageLoss: 0.1,
            effect: function() {
                player.attacksPerSecond += this.attackSpeedIncrease;
                player.weapon.damage *= (1 - this.damageLoss);
            },
            description: function() {
                return `Increased Attack Speed by ${(this.attackSpeedIncrease * 100).toFixed(0)}%, but lowers your damage by ${(this.damageLoss * 100).toFixed(0)}%`;
            }
        },
        {
            name: 'Divine Precision',
            critChanceIncrease: 0.02,
            attackSpeedDecrease: 0.5,
            effect: function() {
                player.adjustCritChance(this.critChanceIncrease);
                player.attacksPerSecond -= this.attackSpeedDecrease;
            },
            description: function() {
                return `Critical Chance increased by ${(this.critChanceIncrease * 100).toFixed(0)}%, but lowers your Attack Speed by ${this.attackSpeedDecrease.toFixed(1)}`;
            }
        },
        {
            name: 'Holy Fortitude',
            healthIncrease: 10,
            damageLoss: 0.10,
            effect: function() {
                player.hp += this.healthIncrease;
                player.maxHp += this.healthIncrease;
                player.weapon.damage *= (1 - this.damageLoss);
            },
            description: function() {
                return `Health +${this.healthIncrease}, but damage reduced by ${(this.damageLoss * 100).toFixed(0)}%`;
            }
        }
    ]
};

function showLevelUpScreen() {
    gameState.isPaused = true;

    const gameArea = document.getElementById('game-area');
    let levelUpScreen = document.getElementById('level-up');

    if (!levelUpScreen) {
        levelUpScreen = document.createElement('div');
        levelUpScreen.id = 'level-up';
        gameArea.appendChild(levelUpScreen);
    }

    levelUpScreen.innerHTML = '<h2 class="level-up-title">Level Up!</h2>';

    const upgradeOptions = document.createElement('div');
    upgradeOptions.id = 'upgrade-options';
    levelUpScreen.appendChild(upgradeOptions);

    const availableUpgrades = getRandomUpgrades(3);

    availableUpgrades.forEach((upgrade, index) => {
        const card = document.createElement('div');
        card.className = upgrade.isClassUpgrade ? 'upgrade-card class-upgrade' : `upgrade-card ${upgrade.rarity.toLowerCase()}`;
        card.dataset.index = index;

        if (upgrade.isClassUpgrade) {
            card.innerHTML = `
                <div class="upgrade-rarity-label">Class Upgrade</div>
                <hr>
                <div class="upgrade-name">${upgrade.name}</div>
                <hr>
                <div class="upgrade-description">${upgrade.description.call(upgrade)}</div>
            `;
        } else {
            card.innerHTML = `
                <div class="upgrade-rarity-label">Rarity</div>
                <div class="upgrade-rarity">${upgrade.rarity}</div>
                <hr>
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-value">${upgrade.getValue(upgrade.rarity)}</div>
                <hr>
                <div class="upgrade-description">${upgrade.description || 'Upgrade description goes here.'}</div>
            `;
        }

        if (upgrade.isClassUpgrade) {
            if (!gameState.autoClassEnabled) {
                card.addEventListener('click', () => selectUpgrade(upgrade, index));
            } else {
                card.classList.add('disabled');
            }
        } else {
            if (!gameState.autoCardEnabled) {
                card.addEventListener('click', () => selectUpgrade(upgrade, index));
            } else {
                card.classList.add('disabled');
            }
        }

        upgradeOptions.appendChild(card);
    });

    levelUpScreen.style.display = 'flex';

    // Handle auto selection
    if (gameState.autoClassEnabled && availableUpgrades[0].isClassUpgrade) {
        const autoSelectedUpgrade = selectAutoClassUpgrade(availableUpgrades);
        const selectedIndex = availableUpgrades.indexOf(autoSelectedUpgrade);
        const selectedCard = upgradeOptions.querySelector(`[data-index="${selectedIndex}"]`);
        
        if (selectedCard) {
            selectedCard.classList.add('auto-select-glow2');
            
            setTimeout(() => {
                selectUpgrade(autoSelectedUpgrade, selectedIndex);
            }, 3000);
        }
    } else if (gameState.autoCardEnabled && !availableUpgrades[0].isClassUpgrade) {
        const priorityOrder = gameState.upgradePriority || ['Damage Increase', 'Attack Speed', 'Health', 'Regeneration', 'Cooldown Reduction', 'Critical Damage Increase', 'Critical Strike Chance'];
        
        let selectedUpgrade = null;
        for (const upgradeName of priorityOrder) {
            selectedUpgrade = availableUpgrades.find(upgrade => upgrade.name === upgradeName);
            if (selectedUpgrade) break;
        }

        if (!selectedUpgrade) {
            selectedUpgrade = availableUpgrades[0];
        }

        const selectedIndex = availableUpgrades.indexOf(selectedUpgrade);
        const selectedCard = upgradeOptions.querySelector(`[data-index="${selectedIndex}"]`);
        
        if (selectedCard) {
            selectedCard.classList.add('auto-select-glow2');
            
            setTimeout(() => {
                selectUpgrade(selectedUpgrade, selectedIndex);
            }, 3000);
        }
    }
}

function selectAutoClassUpgrade(availableUpgrades) {
    const playerClass = player.class;
    const autoChoice = gameState.autoClassChoices[playerClass];
    
    if (autoChoice) {
        const matchingUpgrade = availableUpgrades.find(upgrade => upgrade.name === autoChoice);
        if (matchingUpgrade) {
            return matchingUpgrade;
        }
    }
    
    // If no matching upgrade or no auto-choice set, return the first upgrade
    return availableUpgrades[0];
}

function selectUpgrade(upgrade, index) {
    if (upgrade.isClassUpgrade) {
        upgrade.effect();
    } else {
        upgrade.effect(upgrade.rarity);
    }
    hideLevelUpScreen();
    gameState.isPaused = false;
    
    // Cancel any existing animation frame and restart the loop
    cancelAnimationFrame(animationFrameId);
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

function hideLevelUpScreen() {
    const levelUpScreen = document.getElementById('level-up');
    if (levelUpScreen) {
        levelUpScreen.style.display = 'none';
    }
}

const soulsUpgrades = [
    {
        name: 'Health+',
        maxPurchases: 5,
        baseCost: 125,
        valuePerUpgrade: 0.5,
        effect: (gameState) => {
            gameState.healthUpgrades = (gameState.healthUpgrades || 0) + 1;
            if (player) {
                player.maxHp = player.getInitialHP();
                player.hp += this.valuePerUpgrade;
            }
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(3, gameState.healthUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 0 ? 10 : 5;
            return (gameState.healthUpgrades || 0) < maxPurchases;
        }
    },
    {
        name: 'Regen+',
        maxPurchases: 5,
        baseCost: 150,
        valuePerUpgrade: 0.02,
        effect: (gameState) => {
            gameState.regenUpgrades = (gameState.regenUpgrades || 0) + 1;
            if (player) {
                player.hpRegen = gameState.regenUpgrades * this.valuePerUpgrade;
            }
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(3, gameState.regenUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 0 ? 10 : 5;
            return (gameState.regenUpgrades || 0) < maxPurchases;
        }
    },
    {
        name: 'Crit Chance+',
        maxPurchases: 5,
        baseCost: 250,
        valuePerUpgrade: 0.01,
        effect: (gameState) => {
            gameState.critChanceUpgrades = (gameState.critChanceUpgrades || 0) + 1;
            if (player && !(player instanceof DivineKnight)) {
                player.adjustCritChance(this.valuePerUpgrade);
            }
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(3.5, gameState.critChanceUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 0 ? 10 : 5;
            return (gameState.critChanceUpgrades || 0) < maxPurchases && gameState.playerClass !== 'Divine Knight';
        }
    },
    {
        name: 'Critical Damage+',
        maxPurchases: 5,
        baseCost: 225,
        valuePerUpgrade: 0.1,
        effect: (gameState) => {
            gameState.critDamageUpgrades = (gameState.critDamageUpgrades || 0) + 1;
            if (player) {
                player.critDamage += this.valuePerUpgrade;
            }
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(3.5, gameState.critDamageUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 0 ? 10 : 5;
            return (gameState.critDamageUpgrades || 0) < maxPurchases;
        }
    },
    {
        name: 'Attack Speed+',
        maxPurchases: 5,
        baseCost: 225,
        valuePerUpgrade: 0.05,
        effect: (gameState) => {
            gameState.attackSpeedUpgrades = (gameState.attackSpeedUpgrades || 0) + 1;
            if (player) {
                player.attacksPerSecond += this.valuePerUpgrade;
            }
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(3.5, gameState.attackSpeedUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 0 ? 10 : 5;
            return (gameState.attackSpeedUpgrades || 0) < maxPurchases;
        }
    },
    {
        name: 'Cooldown+',
        maxPurchases: 5,
        baseCost: 225,
        valuePerUpgrade: 0.02,
        effect: (gameState) => {
            gameState.cooldownUpgrades = (gameState.cooldownUpgrades || 0) + 1;
            if (player) {
                player.updateCooldownReduction();
            }
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(3.5, gameState.cooldownUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 0 ? 10 : 5;
            return (gameState.cooldownUpgrades || 0) < maxPurchases;
        }
    },
    {
        name: 'Exp+',
        maxPurchases: 5,
        baseCost: 500,
        valuePerUpgrade: 0.05,
        effect: (gameState) => {
            gameState.expUpgrades = (gameState.expUpgrades || 0) + 1;
            
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(3.5, gameState.expUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 1 ? 15 : (gameState.ascensionLevel > 0 ? 10 : 5);
            return (gameState.expUpgrades || 0) < maxPurchases;
        },
        isVisible: (gameState) => gameState.ascensionLevel >= 1
    },
	{
    name: 'Boss Damage+',
    maxPurchases: 5,
    baseCost: 500,
    valuePerUpgrade: 0.1,
    effect: (gameState) => {
        gameState.bossDamageUpgrades = (gameState.bossDamageUpgrades || 0) + 1;
    },
    getCost: function(gameState) {
        return Math.floor(this.baseCost * Math.pow(2.5, gameState.bossDamageUpgrades || 0));
    },
    canPurchase: (gameState) => {
        const maxPurchases = gameState.ascensionLevel > 1 ? 15 : (gameState.ascensionLevel > 0 ? 10 : 5);
        return (gameState.bossDamageUpgrades || 0) < maxPurchases;
    },
    isVisible: (gameState) => gameState.ascensionLevel >= 1
},
    {
        name: 'Rarity+',
        maxPurchases: 5,
        baseCost: 750,
        valuePerUpgrade: 0.01,
        effect: (gameState) => {
            gameState.rarityUpgrades = (gameState.rarityUpgrades || 0) + 1;
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(2.5, gameState.rarityUpgrades || 0));
        },
        canPurchase: (gameState) => {
            const maxPurchases = gameState.ascensionLevel > 1 ? 15 : (gameState.ascensionLevel > 0 ? 10 : 5);
            return (gameState.rarityUpgrades || 0) < maxPurchases;
        },
        isVisible: (gameState) => gameState.ascensionLevel >= 2
    },
    {
        name: 'Starting Wave+',
        maxPurchases: 10,
        baseCost: 750,
        valuePerUpgrade: 1,
        effect: (gameState) => {
            gameState.startingWaveUpgrades = (gameState.startingWaveUpgrades || 0) + 1;
        },
        getCost: function(gameState) {
            return Math.floor(this.baseCost * Math.pow(2, gameState.startingWaveUpgrades || 0));
        },
        canPurchase: (gameState) => {
            return gameState.ascensionLevel > 0 && (gameState.startingWaveUpgrades || 0) < 10;
        },
        isVisible: (gameState) => gameState.ascensionLevel >= 3
    }
];

let lastPurchaseTime = 0;

function purchaseSoulsUpgrade(upgradeName) {
    const now = Date.now();
    if (now - lastPurchaseTime < 100) return; // Debounce
    lastPurchaseTime = now;

    console.log('Attempting to purchase:', upgradeName);
    const upgrade = soulsUpgrades.find(u => u.name === upgradeName);
    if (!upgrade) {
        console.log('Upgrade not found');
        return;
    }

    // Check if the upgrade should be visible
    if (upgrade.isVisible && !upgrade.isVisible(gameState)) {
        console.log('Upgrade is not visible');
        return;
    }

    const cost = upgrade.getCost(gameState);
    console.log('Upgrade cost:', cost, 'Total souls:', gameState.souls);
    if (gameState.souls >= cost && upgrade.canPurchase(gameState)) {
        gameState.souls -= cost;
        upgrade.effect(gameState);
        
        console.log('Purchase successful');
        saveGameState();
        updateSoulsUI();
    } else {
        console.log('Purchase conditions not met');
    }
}