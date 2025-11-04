function initializeUI() {
    // Create stage info element
    const gameArea = document.getElementById('game-area');
    let stageInfoElement = document.getElementById('stage-info');
    if (!stageInfoElement) {
        stageInfoElement = document.createElement('div');
        stageInfoElement.id = 'stage-info';
        gameArea.appendChild(stageInfoElement);
    }
	
    const abilityButton = document.getElementById('ability-button');
    if (abilityButton) {
        abilityButton.addEventListener('click', () => {
            if (player && player.weapon) {
                player.weapon.useAbility();
            }
        });
    }	
    updateUI();
    createQoLMenu();
	createInventoryMenu();
	createAchievementsMenu();
	createAchievementsButton();

    // Add event listener for debug skip wave button
    //document.getElementById('debug-skip-wave').addEventListener('click', skipWave);
}

function updateUI() {
    // Ensure stage info is updated even if player or weapon is not initialized
    const stageInfoElement = document.getElementById('stage-info');
    if (stageInfoElement) {
        stageInfoElement.textContent = `Stage ${gameState.currentStage} / Wave ${gameState.currentWave} / Enemies: ${enemies.length}`;
    }
	updatePlayerStats();
    updateAbilityButton();
	checkAchievements();
}

function updatePlayerStats() {
    const playerStatsElement = document.getElementById('player-stats');
    
    if (player && player.weapon) {
        let rangeText = `${player.weapon.globalRange.toFixed(0)}`;
        if (player.weapon instanceof ChainWand || player.weapon instanceof BasicWand) {
            rangeText += ` / Chain ${player.weapon.chainRange}`;
        } else if (player.weapon instanceof ShatterStaff) {
            rangeText += ` / Splash ${player.weapon.splashRange}`;
        }
        
        // Calculate total cooldown reduction
        const totalCDReduction = player.totalCooldownReduction;
        const cdReductionText = totalCDReduction >= 0.75 
            ? '75% CAP' 
            : `${(totalCDReduction * 100).toFixed(1)}%`;

        // Cap crit chance at 100%
        const cappedCritChance = Math.min(player.critChance, 1);
        const critChanceText = cappedCritChance >= 1 
            ? '100% CAP' 
            : `${(cappedCritChance * 100).toFixed(1)}%`;
        
        // Calculate total boss damage bonus
        const amuletBonus = gameState.amuletEquipped ? player.bossDamageBonus * Math.max(1, gameState.ascensionLevel + 1) : 0;
        const cardBonus = player.additionalBossDamage || 0;
        const bossDamageUpgrade = soulsUpgrades.find(u => u.name === 'Boss Damage+');
        const upgradeBonus = (gameState.bossDamageUpgrades || 0) * bossDamageUpgrade.valuePerUpgrade;
        const totalBonus = player.getBossDamageBonus();

        let statsHTML = `
            <h3>${player.class}</h3>
            <div><span class="stat-name">Level:</span> <span class="stat-value">${player.level}</span></div>
            <div><span class="stat-name">Exp:</span> <span class="stat-value">${player.exp.toFixed(0)} / ${player.expToNextLevel.toFixed(0)}</span></div>
            <div><span class="stat-name">Souls:</span> <span class="stat-value">${player.currentRunSouls}</span></div>
            <div class="divider"><span class="stat-name">HP:</span> <span class="stat-value">${player.hp.toFixed(1)} / ${player.maxHp.toFixed(1)}</span></div>
            <div><span class="stat-name">HP Regen:</span> <span class="stat-value">${player.hpRegen.toFixed(2)}/s</span></div>
            <div class="weapon-stat"><span class="stat-name">Weapon:</span> <span class="stat-value">${player.weapon.name}</span></div>
            <div><span class="stat-name">Damage:</span> <span class="stat-value">${player.weapon.damage.toFixed(1)}</span></div>
            <div><span class="stat-name">Range:</span> <span class="stat-value">${rangeText}</span></div>
            <div><span class="stat-name">Attacks/Sec:</span> <span class="stat-value">${player.attacksPerSecond.toFixed(2)}</span></div>
            <div><span class="stat-name">CD Reduction:</span> <span class="stat-value">${cdReductionText}</span></div>
            <div><span class="stat-name">Crit Chance:</span> <span class="stat-value">${critChanceText}</span></div>
            <div><span class="stat-name">Crit Damage:</span> <span class="stat-value">${(player.critDamage * 100 - 100).toFixed(1)}%</span></div>
        `;

        // Only add boss damage stat if amulet is equipped
        if (gameState.amuletEquipped) {
            statsHTML += `<div><span class="stat-name">Boss Damage:</span> <span class="stat-value">+${(totalBonus * 100).toFixed(1)}%</span></div>`;
        }

        playerStatsElement.innerHTML = statsHTML;
    }
}

function updateEnemyUI() {
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';

    enemies.forEach((enemy, index) => {
        const enemyElement = document.createElement('div');
        enemyElement.className = `enemy ${enemy instanceof EliteEnemy ? 'elite' : ''}`;
        enemyElement.style.left = `${enemy.position.x}px`;
        enemyElement.style.top = `${enemy.position.y}px`;

        const hpText = document.createElement('div');
        hpText.className = 'hp-text';
        hpText.textContent = enemy.hp.toFixed(0);

        enemyElement.appendChild(hpText);
        gameArea.appendChild(enemyElement);
    });
}

function updateAbilityButton() {
    const abilityButton = document.getElementById('ability-button');
    if (abilityButton && player && player.weapon) {
        abilityButton.textContent = player.weapon.getAbilityButtonText();
        abilityButton.disabled = player.weapon.getAbilityButtonText().startsWith('Cooldown');
    }
}

function showAscensionOverlay() {
    if (gameState.ascensionLevel >= MAX_ASCENSIONS) {
        return;
    }

    const requiredStage = ASCENSION_STAGES[gameState.ascensionLevel];

    if (gameState.highestStageReached < requiredStage) {
        return;
    }

    let maxUpgradesText;
    let unlockText;
    let qolUnlockText;
    let amuletUpgradeText = "";

    switch (gameState.ascensionLevel) {
        case 0:
            maxUpgradesText = "Max upgrades for all Soul upgrades: +5";
            unlockText = "Unlocks Exp+ / Boss Damage+ upgrades";
            qolUnlockText = "Unlocks Automation";
            amuletUpgradeText = "Upgrades Amulet";
            break;
        case 1:
            maxUpgradesText = "Max upgrades for Exp+: +5";
            unlockText = "Unlocks Rarity+ upgrade";
            qolUnlockText = "Unlocks Auto Card in QoL menu";
            amuletUpgradeText = "Additional Amulet upgrade";
            break;
        case 2:
            maxUpgradesText = "Max upgrades for Exp+ / Rarity+: +5";
            unlockText = "Unlocks Starting Wave+ upgrade";
            qolUnlockText = "Unlocks Auto Evo / Auto Class in QoL menu";
            amuletUpgradeText = "Additional Amulet upgrade";
            break;
    }

    const acolyteBonus = new Acolyte().getBossDamageBonus() * 100;
    const sorceressBonus = new Sorceress().getBossDamageBonus() * 100;
    const divineKnightBonus = new DivineKnight().getBossDamageBonus() * 100;

    const overlay = document.createElement('div');
    overlay.id = 'ascension-overlay';
    
    const content = document.createElement('div');
    content.id = 'ascension-content';
    
    content.innerHTML = `
        <h2>Ascension ${gameState.ascensionLevel + 1}</h2>
        <p>Resetting everything except unlocked classes.</p>
        <p>${amuletUpgradeText}</p>
        <p>Soul gain multiplier: x${Math.pow(2, gameState.ascensionLevel + 1)}</p>
        <p>${maxUpgradesText}</p>
        <p>${unlockText}</p>
        <p>${qolUnlockText}</p>  
        <button onclick="ascend()">Confirm Ascension</button>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
}

function showGameOverScreen() {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over';
    gameOverScreen.innerHTML = `
        <h2>Game Over</h2>
        <p>You reached Stage ${gameState.currentStage}, Wave ${gameState.currentWave}</p>
        <button id="restart-button">Restart</button>
    `;

    document.body.appendChild(gameOverScreen);
    document.getElementById('restart-button').addEventListener('click', () => {
        document.body.removeChild(gameOverScreen);
        showClassSelection();
    });
}

function updateSoulsUI() {
    const soulsMenu = document.getElementById('souls-menu');
    const souls = gameState.souls;
    
    let upgradesHTML = `
        <h3 style="color: white; padding-bottom: 10px; border-bottom: 2px solid #4CAF50; margin-bottom: 15px;">Total Souls: ${souls}</h3>
        <h4>Total Ascensions: ${gameState.ascensionLevel} 
            <span style="color: yellow;">(x${gameState.soulMultiplier} Multiplier)</span>
        </h4>
        <div id="souls-upgrades-container">`;

    soulsUpgrades.forEach(upgrade => {
        // Check if the upgrade should be visible
        if (upgrade.isVisible && !upgrade.isVisible(gameState)) {
            return; // Skip this upgrade if it's not visible
        }

        let upgradeName, currentValue, increaseText;
        switch(upgrade.name) {
            case 'Health+':
                upgradeName = 'healthUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * 0.5).toFixed(1)} HP`;
                increaseText = 'Health Increase';
                break;
            case 'Regen+':
                upgradeName = 'regenUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * 0.02).toFixed(2)}/s`;
                increaseText = 'HP Regeneration';
                break;
            case 'Crit Chance+':
                upgradeName = 'critChanceUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * 1)}%`;
                increaseText = 'Critical Strike Chance';
                break;
            case 'Critical Damage+':
                upgradeName = 'critDamageUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * 10)}%`;
                increaseText = 'Critical Damage';
                break;
            case 'Attack Speed+':
                upgradeName = 'attackSpeedUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * 5)}%`;
                increaseText = 'Attack Speed Increase';
                break;
            case 'Cooldown+':
                upgradeName = 'cooldownUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * 2)}%`;
                increaseText = 'Cooldown Reduction';
                break;
            case 'Exp+':
                upgradeName = 'expUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * upgrade.valuePerUpgrade * 100).toFixed(0)}%`;
                increaseText = 'Experience Gain';
                break;
			case 'Boss Damage+':
                upgradeName = 'bossDamageUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * 10)}%`;
                increaseText = 'Boss Damage';
                break;
            case 'Rarity+':
                upgradeName = 'rarityUpgrades';
                currentValue = `+${((gameState[upgradeName] || 0) * upgrade.valuePerUpgrade * 100).toFixed(0)}%`;
                increaseText = 'Higher Rarity Chance';
                break;
            case 'Starting Wave+':
                upgradeName = 'startingWaveUpgrades';
                currentValue = `+${(gameState[upgradeName] || 0)}`;
                increaseText = 'Starting Wave';
                break;
            default:
                upgradeName = '';
                currentValue = '';
                increaseText = '';
        }

        const purchased = gameState[upgradeName] || 0;       
        let maxPurchases;
        if (upgrade.name === 'Exp+' || upgrade.name === 'Rarity+' || upgrade.name === 'Starting Wave+' || upgrade.name === 'Boss Damage+') {
            maxPurchases = gameState.ascensionLevel > 2 ? 20 : (gameState.ascensionLevel > 1 ? 15 : (gameState.ascensionLevel > 0 ? 10 : 5));
        }
		else {
            maxPurchases = gameState.ascensionLevel > 0 ? 10 : 5;
        }

        upgradesHTML += `
            <div class="souls-upgrade">
                <h4>${upgrade.name}</h4>
                <hr>
                <p>${increaseText}  ${currentValue}</p>
                <p>Required Souls: ${upgrade.getCost(gameState)}</p>
                <p>Upgrades: ${purchased}/${maxPurchases}</p>
                <button onclick="purchaseSoulsUpgrade('${upgrade.name}')" 
                    ${(!upgrade.canPurchase(gameState) || souls < upgrade.getCost(gameState)) ? 'disabled' : ''}>
                    Purchase
                </button>
            </div>
        `;
    });

    upgradesHTML += '</div>';
    soulsMenu.innerHTML = upgradesHTML;
}

function createQoLMenu() {
    let qolMenu = document.getElementById('qol-menu');
    if (!qolMenu) {
        qolMenu = document.createElement('div');
        qolMenu.id = 'qol-menu';
        document.body.appendChild(qolMenu);
    }

    let menuHTML = `<h3>Quality of Life</h3>`;

    if (gameState.autoCastUnlocked) {
        menuHTML += `
            <div class="toggle-container">
                <span>Auto Cast Ability</span>
                <label class="switch">
                    <input type="checkbox" id="auto-cast-toggle">
                    <span class="slider round"></span>
                </label>
            </div>`;
    }

    if (gameState.autoCardUnlocked) {
        menuHTML += `
            <div class="toggle-container">
                <span>Auto Card</span>
                <label class="switch">
                    <input type="checkbox" id="auto-card-toggle">
                    <span class="slider round"></span>
                </label>
                <button id="auto-card-settings" class="cog-button">⚙️</button>
            </div>
            <div id="auto-card-priority" style="display: none;">
                <h4>Auto Card Priority</h4>
                <ul id="priority-list"></ul>
            </div>`;
    }

    if (gameState.autoEvoUnlocked) {
        menuHTML += `
            <div class="toggle-container">
                <span>Auto Evo</span>
                <label class="switch">
                    <input type="checkbox" id="auto-weapon-evolution-toggle">
                    <span class="slider round"></span>
                </label>
                <button id="auto-weapon-evolution-settings" class="cog-button">⚙️</button>
            </div>
            <div id="auto-weapon-evolution-options" style="display: none;">
                <h4>Auto Evo</h4>
                <div id="weapon-evolution-choices"></div>
            </div>`;
    }

    if (gameState.autoClassUnlocked) {
        menuHTML += `
            <div class="toggle-container">
                <span>Auto Class</span>
                <label class="switch">
                    <input type="checkbox" id="auto-class-toggle">
                    <span class="slider round"></span>
                </label>
                <button id="auto-class-settings" class="cog-button">⚙️</button>
            </div>
            <div id="auto-class-options" style="display: none;">
                <h4>Auto Class Upgrade</h4>
                <div id="class-upgrade-choices"></div>
            </div>`;
    }

    qolMenu.innerHTML = menuHTML;

    const autoCastToggle = document.getElementById('auto-cast-toggle');
    if (autoCastToggle) {
        autoCastToggle.checked = gameState.autoCastEnabled || false;
        autoCastToggle.addEventListener('change', () => {
            gameState.autoCastEnabled = autoCastToggle.checked;
            saveGameState();
        });
    }

    if (gameState.autoCardUnlocked) {
        const autoCardToggle = document.getElementById('auto-card-toggle');
        if (autoCardToggle) {
            autoCardToggle.checked = gameState.autoCardEnabled || false;
            autoCardToggle.addEventListener('change', () => {
                gameState.autoCardEnabled = autoCardToggle.checked;
                saveGameState();
                console.log("Auto card " + (gameState.autoCardEnabled ? "enabled" : "disabled"));
            });
        }

        const autoCardSettings = document.getElementById('auto-card-settings');
        autoCardSettings.addEventListener('click', toggleAutoPriorityMenu);
        createPriorityList();
    }

    if (gameState.autoEvoUnlocked) {
        const autoWeaponEvolutionToggle = document.getElementById('auto-weapon-evolution-toggle');
        if (autoWeaponEvolutionToggle) {
            autoWeaponEvolutionToggle.checked = gameState.autoWeaponEvolutionEnabled || false;
            autoWeaponEvolutionToggle.addEventListener('change', () => {
                gameState.autoWeaponEvolutionEnabled = autoWeaponEvolutionToggle.checked;
                saveGameState();
                console.log("Auto weapon evolution " + (gameState.autoWeaponEvolutionEnabled ? "enabled" : "disabled"));
            });
        }

        const autoWeaponEvolutionSettings = document.getElementById('auto-weapon-evolution-settings');
        autoWeaponEvolutionSettings.addEventListener('click', toggleAutoWeaponEvolutionMenu);
        createWeaponEvolutionChoices();
    }

    if (gameState.autoClassUnlocked) {
        const autoClassToggle = document.getElementById('auto-class-toggle');
        if (autoClassToggle) {
            autoClassToggle.checked = gameState.autoClassEnabled || false;
            autoClassToggle.addEventListener('change', () => {
                gameState.autoClassEnabled = autoClassToggle.checked;
                saveGameState();
                console.log("Auto class " + (gameState.autoClassEnabled ? "enabled" : "disabled"));
            });
        }

        const autoClassSettings = document.getElementById('auto-class-settings');
        autoClassSettings.addEventListener('click', toggleAutoClassMenu);
        createClassUpgradeChoices();
    }
}

function toggleAutoWeaponEvolutionMenu() {
    const optionsMenu = document.getElementById('auto-weapon-evolution-options');
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
}

function createWeaponEvolutionChoices() {
    const qolMenu = document.getElementById('qol-menu');
    if (!qolMenu) {
        console.warn('QoL menu not found');
        return;
    }
    let choicesContainer = document.getElementById('weapon-evolution-choices');
    if (!choicesContainer) {
        choicesContainer = document.createElement('div');
        choicesContainer.id = 'weapon-evolution-choices';
        qolMenu.appendChild(choicesContainer);
    }
    choicesContainer.innerHTML = ''; // Clear existing choices
    const classes = ['Acolyte', 'Sorceress', 'Divine Knight'];

    classes.forEach(className => {
        const classChoices = document.createElement('div');
        classChoices.innerHTML = `
            <h5>${className}</h5>
            <select id="${className.toLowerCase()}-weapon-choice">
                <option value="">Random</option>
                ${getWeaponEvolutionOptions(className).map(weapon => 
                    `<option value="${weapon.name}" ${gameState.autoWeaponEvolutionChoices[className] === weapon.name ? 'selected' : ''}>${weapon.name}</option>`
                ).join('')}
            </select>
        `;
        choicesContainer.appendChild(classChoices);

        const select = classChoices.querySelector('select');
        select.addEventListener('change', (event) => {
            gameState.autoWeaponEvolutionChoices[className] = event.target.value;
            saveGameState();
        });
    });
}

function toggleAutoClassMenu() {
    const optionsMenu = document.getElementById('auto-class-options');
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
}

function createClassUpgradeChoices() {
    const choicesContainer = document.getElementById('class-upgrade-choices');
    const classes = ['Acolyte', 'Sorceress', 'Divine Knight'];

    classes.forEach(className => {
        const classChoices = document.createElement('div');
        classChoices.innerHTML = `
            <h5>${className}</h5>
            <select id="${className.toLowerCase()}-class-choice">
                <option value="">Random</option>
                ${getClassUpgradeOptions(className).map(upgrade => 
                    `<option value="${upgrade.name}" ${gameState.autoClassChoices[className] === upgrade.name ? 'selected' : ''}>${upgrade.name}</option>`
                ).join('')}
            </select>
        `;
        choicesContainer.appendChild(classChoices);

        const select = classChoices.querySelector('select');
        select.addEventListener('change', (event) => {
            gameState.autoClassChoices[className] = event.target.value;
            saveGameState();
        });
    });
}

function getClassUpgradeOptions(className) {
    // Return the class upgrades for the given class
    return classUpgrades[className] || [];
}

function toggleAutoPriorityMenu() {
    const priorityMenu = document.getElementById('auto-card-priority');
    priorityMenu.style.display = priorityMenu.style.display === 'none' ? 'block' : 'none';
}

function createPriorityList() {
    const qolMenu = document.getElementById('qol-menu');

    let autoCardPriority = document.getElementById('auto-card-priority');
    if (!autoCardPriority) {
        autoCardPriority = document.createElement('div');
        autoCardPriority.id = 'auto-card-priority';
        autoCardPriority.style.display = 'none';
        qolMenu.appendChild(autoCardPriority);
    }

    let priorityList = document.getElementById('priority-list');
    if (!priorityList) {
        priorityList = document.createElement('ul');
        priorityList.id = 'priority-list';
        autoCardPriority.appendChild(priorityList);
    }

    priorityList.innerHTML = ''; // Clear existing list items

    const defaultPriority = ['Damage Increase', 'Attack Speed', 'Health', 'Regeneration', 'Cooldown Reduction', 'Critical Damage Increase', 'Critical Strike Chance'];
    const upgrades = gameState.upgradePriority || defaultPriority;
    
    upgrades.forEach((upgrade, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${upgrade}</span>
            <div class="priority-buttons">
                <button class="priority-up" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="priority-down" ${index === upgrades.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
        `;
        priorityList.appendChild(li);
    });

    priorityList.addEventListener('click', handlePriorityChange);
}

function handlePriorityChange(event) {
    if (!event.target.matches('button')) return;

    const li = event.target.closest('li');
    const list = li.parentNode;
    const isUp = event.target.classList.contains('priority-up');

    if (isUp && li.previousElementSibling) {
        list.insertBefore(li, li.previousElementSibling);
    }
	else if (!isUp && li.nextElementSibling) {
        list.insertBefore(li.nextElementSibling, li);
    }

    updatePriorityButtons();
    savePriorityOrder();
}

function updatePriorityButtons() {
    const list = document.getElementById('priority-list');
    const items = list.getElementsByTagName('li');

    Array.from(items).forEach((item, index) => {
        const upButton = item.querySelector('.priority-up');
        const downButton = item.querySelector('.priority-down');

        upButton.disabled = index === 0;
        downButton.disabled = index === items.length - 1;
    });
}

function savePriorityOrder() {
    const list = document.getElementById('priority-list');
    const priorityOrder = Array.from(list.getElementsByTagName('li')).map(li => li.querySelector('span').textContent);
    gameState.upgradePriority = priorityOrder;
    saveGameState();
}

function createInventoryMenu() {
    const inventoryMenu = document.getElementById('inventory-menu');

    inventoryMenu.innerHTML = `
        <h3>Inventory</h3>
        <div class="inventory-container">
            <div class="amulet-slot">
                <div class="empty-slot"></div>
            </div>
            <p id="amulet-name">Amulet slot</p>
        </div>
    `;
}

function updateInventoryUI() {
    const amuletSlot = document.querySelector('.amulet-slot');
    const amuletName = document.getElementById('amulet-name');

    if (gameState.amuletEquipped) {
        amuletSlot.innerHTML = '<img src="img/neck.png" alt="Amulet" class="amulet-icon">';
        amuletName.textContent = 'Magic Amulet';
        amuletName.style.color = '#00bfff'; // Blue color
    
        const ascensionMultiplier = Math.max(1, gameState.ascensionLevel + 1);
        
        const acolyte = new Acolyte();
        const sorceress = new Sorceress();
        const divineKnight = new DivineKnight();
        
        let acolyteDamage = acolyte.amuletDamage;
        let sorceressDamage = sorceress.amuletDamage;
        let divineKnightDamage = divineKnight.amuletDamage;

        // Apply achievement bonuses
        if (gameState.unlockedAchievements['Sorceress Master']) {
            acolyteDamage += achievements['Sorceress Master'].amuletDamageIncrease;
        }
        if (gameState.unlockedAchievements['Divine Knight Master']) {
            sorceressDamage += achievements['Divine Knight Master'].amuletDamageIncrease;
        }
        if (gameState.unlockedAchievements['Acolyte Master']) {
            divineKnightDamage += achievements['Acolyte Master'].amuletDamageIncrease;
        }

        const acolyteDamageDisplay = (acolyteDamage * ascensionMultiplier).toFixed(1);
        const sorceressDamageDisplay = (sorceressDamage * ascensionMultiplier).toFixed(1);
        const divineKnightDamageDisplay = (divineKnightDamage * ascensionMultiplier).toFixed(1);
        
        const acolyteBossDamage = (acolyte.bossDamageBonus * 100 * ascensionMultiplier).toFixed(0);
        const sorceressBossDamage = (sorceress.bossDamageBonus * 100 * ascensionMultiplier).toFixed(0);
        const divineKnightBossDamage = (divineKnight.bossDamageBonus * 100 * ascensionMultiplier).toFixed(0);

        const tooltip = `Acolyte:\nDamage +${acolyteDamageDisplay}\nBoss Damage +${acolyteBossDamage}%\n\n` +
                        `Sorceress:\nDamage +${sorceressDamageDisplay}\nBoss Damage +${sorceressBossDamage}%\n\n` +
                        `Divine Knight:\nDamage +${divineKnightDamageDisplay}\nBoss Damage +${divineKnightBossDamage}%`;
    
        amuletSlot.setAttribute('data-tooltip', tooltip);
    } else {
        amuletSlot.innerHTML = '<div class="empty-slot"></div>';
        amuletName.textContent = 'Amulet slot';
        amuletName.style.color = 'white';
        amuletSlot.setAttribute('data-tooltip', 'Boss drops the Amulet');
    }
}

const achievements = {
	'Beat Stage 2': {
        description: 'Stage 3 reached',
        condition: () => gameState.highestStageReached >= 3
    },
	'Beat Stage 4': {
        description: 'Stage 5 reached',
        condition: () => gameState.highestStageReached >= 5
    },
	'Beat Stage 6': {
        description: 'Stage 7 reached',
        condition: () => gameState.highestStageReached >= 7
    },
    'Ascension': {
        description: 'And so it begins...',
        condition: () => gameState.ascensionLevel >= 1
    },
    'Ascend Novice': {
        description: 'Ascend 2 Times',
        condition: () => gameState.ascensionLevel >= 3
    },
	    'Acolyte Master': {
        description: 'Divine Knight Base Amulet Damage +0.2',
        condition: () => gameState.highestStageReached >= 6 && player instanceof Acolyte,
        amuletDamageIncrease: 0.2,
        affectedClass: 'Divine Knight'
    },
    'Sorceress Master': {
        description: 'Acolyte Base Amulet Damage +0.6',
        condition: () => gameState.highestStageReached >= 7 && player instanceof Sorceress,
        amuletDamageIncrease: 0.6,
        affectedClass: 'Acolyte'
    },
    'Divine Knight Master': {
        description: 'Sorceress Base Amulet Damage +0.4',
        condition: () => gameState.highestStageReached >= 8 && player instanceof DivineKnight,
        amuletDamageIncrease: 0.4,
        affectedClass: 'Sorceress'
    }
};

// Add this function to create the achievements menu
function createAchievementsMenu() {
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';

    for (const [key, value] of Object.entries(achievements)) {
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement ${gameState.unlockedAchievements[key] ? 'unlocked' : ''}`;
        achievementElement.textContent = gameState.unlockedAchievements[key] ? key : '???';
        achievementElement.title = gameState.unlockedAchievements[key] ? value.description : 'Achievement locked';
        achievementsList.appendChild(achievementElement);
    }

    // Add event listener for the close button
    const closeButton = document.querySelector('#achievements-menu .close-btn');
    closeButton.addEventListener('click', () => {
        document.getElementById('achievements-menu').style.display = 'none';
    });
}

// Add this function to check and unlock achievements
function checkAchievements() {
    for (const [key, value] of Object.entries(achievements)) {
        if (!gameState.unlockedAchievements[key] && value.condition()) {
            unlockAchievement(key);
            if (value.effect) {
                value.effect();
            }
        }
    }
}

// Add this function to unlock an achievement
function unlockAchievement(achievementKey) {
    if (!gameState.unlockedAchievements[achievementKey]) {
        gameState.unlockedAchievements[achievementKey] = true;
        saveGameState();
        showAchievementPopup(achievementKey);
        createAchievementsMenu(); // Refresh the achievements menu
		updateInventoryUI();
    }
}

// Add this function to show the achievement popup
function showAchievementPopup(achievementKey) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.textContent = `Achievement: ${achievementKey}`;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 3000);
}

function createAchievementsButton() {
    const existingButton = document.getElementById('achievements-button');
    if (existingButton) {
        return; // Button already exists, no need to create it again
    }

    const achievementsButton = document.createElement('button');
    achievementsButton.id = 'achievements-button';
    achievementsButton.textContent = 'Achievements';
    achievementsButton.addEventListener('click', () => {
        document.getElementById('achievements-menu').style.display = 'block';
    });

    const hardResetButton = document.getElementById('hard-reset-btn');
    hardResetButton.parentNode.insertBefore(achievementsButton, hardResetButton);
}

function flashScreen(color) {
    const gameArea = document.getElementById('game-area');
    gameArea.style.backgroundColor = color;
    setTimeout(() => {
        gameArea.style.backgroundColor = '';
        setTimeout(() => {
            gameArea.style.backgroundColor = color;
            setTimeout(() => {
                gameArea.style.backgroundColor = '';
            }, 100);
        }, 100);
    }, 100);
}