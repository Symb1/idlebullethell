const gameState = {
    currentStage: 1,
    currentWave: 1,
    gameRunning: false,
    playerClass: null,
    unlockedClasses: ['Acolyte'],
    isPaused: false,
    highestStageReached: 1,
    ascensionLevel: 0,
    soulMultiplier: 1,
    qolMenuUnlocked: false,
    autoCastUnlocked: false,
    autoCardUnlocked: false,
    autoEvoUnlocked: false,
    autoClassUnlocked: false,
    autoCardEnabled: false,
    autoWeaponEvolutionEnabled: false,
    autoCastEnabled: false,
    autoWeaponEvolutionChoices: {Acolyte: '', Sorceress: '', 'Divine Knight': ''},
    autoClassEnabled: false,
    autoClassChoices: {Acolyte: '', Sorceress: '', 'Divine Knight': ''},
    amuletDropped: false,
    amuletEquipped: false,
    unlockedAchievements: {},
};

function saveGameState() {
    const state = {
        unlockedClasses: gameState.unlockedClasses,
        souls: gameState.souls,
        attackSpeedUpgrades: gameState.attackSpeedUpgrades || 0,
        healthUpgrades: gameState.healthUpgrades || 0,
        cooldownUpgrades: gameState.cooldownUpgrades || 0,
        critDamageUpgrades: gameState.critDamageUpgrades || 0,
        rarityUpgrades: gameState.rarityUpgrades || 0,
        expUpgrades: gameState.expUpgrades || 0,  
        regenUpgrades: gameState.regenUpgrades || 0, 
        critChanceUpgrades: gameState.critChanceUpgrades || 0,
        highestStageReached: gameState.highestStageReached,
        ascensionLevel: gameState.ascensionLevel,
        soulMultiplier: gameState.soulMultiplier,
        qolMenuUnlocked: gameState.qolMenuUnlocked,
        autoCastUnlocked: gameState.autoCastUnlocked,
        autoCardUnlocked: gameState.autoCardUnlocked,
        autoEvoUnlocked: gameState.autoEvoUnlocked,
        autoClassUnlocked: gameState.autoClassUnlocked,
        autoCastEnabled: gameState.autoCastEnabled,
        startingWaveUpgrades: gameState.startingWaveUpgrades || 0,
        autoCardEnabled: gameState.autoCardEnabled || false,
        upgradePriority: gameState.upgradePriority,
        autoWeaponEvolutionEnabled: gameState.autoWeaponEvolutionEnabled,
        autoWeaponEvolutionChoices: gameState.autoWeaponEvolutionChoices,
        autoClassEnabled: gameState.autoClassEnabled,
        autoClassChoices: gameState.autoClassChoices,
        amuletDropped: gameState.amuletDropped,
        amuletEquipped: gameState.amuletEquipped,
        unlockedAchievements: gameState.unlockedAchievements,
		bossDamageUpgrades: gameState.bossDamageUpgrades || 0,
    };
    localStorage.setItem('gameState', JSON.stringify(state));
}

function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState.souls = parsedState.souls || 0;
        gameState.unlockedClasses = parsedState.unlockedClasses || ['Acolyte'];
        gameState.attackSpeedUpgrades = parsedState.attackSpeedUpgrades || 0;
        gameState.healthUpgrades = parsedState.healthUpgrades || 0;
        gameState.cooldownUpgrades = parsedState.cooldownUpgrades || 0;
        gameState.critDamageUpgrades = parsedState.critDamageUpgrades || 0;
        gameState.rarityUpgrades = parsedState.rarityUpgrades || 0;
        gameState.expUpgrades = parsedState.expUpgrades || 0; 
        gameState.regenUpgrades = parsedState.regenUpgrades || 0; 
        gameState.critChanceUpgrades = parsedState.critChanceUpgrades || 0;
        gameState.highestStageReached = parsedState.highestStageReached || 1;
        gameState.ascensionLevel = parsedState.ascensionLevel || 0;
        gameState.soulMultiplier = parsedState.soulMultiplier || 1;
        gameState.qolMenuUnlocked = parsedState.qolMenuUnlocked || false;
        gameState.autoCastUnlocked = parsedState.autoCastUnlocked || false;
        gameState.autoCardUnlocked = parsedState.autoCardUnlocked || false;
        gameState.autoEvoUnlocked = parsedState.autoEvoUnlocked || false;
        gameState.autoClassUnlocked = parsedState.autoClassUnlocked || false;
        gameState.autoCastEnabled = parsedState.autoCastEnabled || false;
        gameState.startingWaveUpgrades = parsedState.startingWaveUpgrades || 0;
        gameState.autoCardEnabled = parsedState.autoCardEnabled || false;
        gameState.upgradePriority = parsedState.upgradePriority || ['Damage Increase', 'Attack Speed', 'Health', 'Regeneration', 'Cooldown Reduction', 'Critical Damage Increase', 'Critical Strike Chance'];
        gameState.autoWeaponEvolutionEnabled = parsedState.autoWeaponEvolutionEnabled || false;
        gameState.autoWeaponEvolutionChoices = parsedState.autoWeaponEvolutionChoices || {Acolyte: '', Sorceress: '', 'Divine Knight': ''};
        gameState.autoClassEnabled = parsedState.autoClassEnabled || false;
        gameState.autoClassChoices = parsedState.autoClassChoices || {Acolyte: '', Sorceress: '', 'Divine Knight': ''};
        gameState.amuletDropped = parsedState.amuletDropped || false;
        gameState.amuletEquipped = parsedState.amuletEquipped || false;
        gameState.unlockedAchievements = parsedState.unlockedAchievements || {};
		gameState.bossDamageUpgrades = parsedState.bossDamageUpgrades || 0;
    }
    else {
        gameState.souls = 0;
        gameState.unlockedClasses = ['Acolyte'];
        gameState.attackSpeedUpgrades = 0;
        gameState.healthUpgrades = 0;
        gameState.cooldownUpgrades = 0;
        gameState.critDamageUpgrades = 0;
        gameState.rarityUpgrades = 0;
        gameState.expUpgrades = 0;  
        gameState.regenUpgrades = 0; 
        gameState.critChanceUpgrades = 0;
        gameState.highestStageReached = 1;
        gameState.ascensionLevel = 0;
        gameState.soulMultiplier = 1;
        gameState.qolMenuUnlocked = false;
        gameState.autoCastUnlocked = false;
        gameState.autoCardUnlocked = false;
        gameState.autoEvoUnlocked = false;
        gameState.autoClassUnlocked = false;
        gameState.autoCastEnabled = false;
        gameState.startingWaveUpgrades = 0;
        gameState.autoCardEnabled = false;
        gameState.upgradePriority = ['Damage Increase', 'Attack Speed', 'Health', 'Regeneration', 'Cooldown Reduction', 'Critical Damage Increase', 'Critical Strike Chance'];
        gameState.autoWeaponEvolutionEnabled = false;
        gameState.autoWeaponEvolutionChoices = {Acolyte: '', Sorceress: '', 'Divine Knight': '' };
        gameState.autoClassEnabled = false;
        gameState.autoClassChoices = {Acolyte: '', Sorceress: '', 'Divine Knight': ''};
        gameState.amuletDropped = false;
        gameState.amuletEquipped = false;
        gameState.unlockedAchievements = {};
		gameState.bossDamageUpgrades = 0;
    }
    gameState.currentStage = 1;
    gameState.currentWave = 1 + (gameState.startingWaveUpgrades || 0);
}

function hardReset() {
    // Clear local storage
    localStorage.removeItem('gameState');

    // Reset gameState properties
    gameState.unlockedClasses = ['Acolyte'];
    gameState.currentStage = 1;
    gameState.currentWave = 1;
    gameState.souls = 0;
    gameState.attackSpeedUpgrades = 0;
    gameState.healthUpgrades = 0;
    gameState.cooldownUpgrades = 0;
    gameState.critDamageUpgrades = 0;
    gameState.rarityUpgrades = 0;
    gameState.expUpgrades = 0;
    gameState.regenUpgrades = 0;
    gameState.critChanceUpgrades = 0;
    gameState.highestStageReached = 1;
    gameState.ascensionLevel = 0;
    gameState.soulMultiplier = 1;
    gameState.qolMenuUnlocked = false;
    gameState.autoCastUnlocked = false;
    gameState.autoCardUnlocked = false;
    gameState.autoEvoUnlocked = false;
    gameState.autoClassUnlocked = false;
    gameState.startingWaveUpgrades = 0;
    gameState.autoCardEnabled = false;
    gameState.autoCastEnabled = false;
    gameState.upgradePriority = ['Damage Increase', 'Attack Speed', 'Health', 'Regeneration', 'Cooldown Reduction', 'Critical Damage Increase', 'Critical Strike Chance'];
    gameState.autoWeaponEvolutionEnabled = false;
    gameState.autoWeaponEvolutionChoices = {Acolyte: '',  Sorceress: '', 'Divine Knight': ''};
    gameState.autoClassEnabled = false;
    gameState.autoClassChoices = {Acolyte: '', Sorceress: '', 'Divine Knight': ''};
    gameState.amuletDropped = false;
    gameState.amuletEquipped = false;
    gameState.unlockedAchievements = {};
	gameState.bossDamageUpgrades = 0;

    // Reset base HP
    Player.BASE_HP = 5;
    
    // Reset player
    player = null;

    // Save the reset game state
    saveGameState();

    // Update UI
    updateSoulsUI();
    showClassSelection();
    
    // Reset auto cast toggle
    const autoCastToggle = document.getElementById('auto-cast-toggle');
    if (autoCastToggle) {
        autoCastToggle.checked = false;
    }

    // Reset auto card toggle
    const autoCardToggle = document.getElementById('auto-card-toggle');
    if (autoCardToggle) {
        autoCardToggle.checked = false;
    }
    
    // Reset auto evo toggle
    const autoWeaponEvolutionToggle = document.getElementById('auto-weapon-evolution-toggle');
    if (autoWeaponEvolutionToggle) {
        autoWeaponEvolutionToggle.checked = false;
    }
    
    // Reset weapon evolution choices in UI
    createWeaponEvolutionChoices();

    // Reset auto class toggle
    const autoClassToggle = document.getElementById('auto-class-toggle');
    if (autoClassToggle) {
        autoClassToggle.checked = false;
    }

    // Force a refresh of the QoL menu
    createQoLMenu();
    
    // Now create the weapon evolution choices and priority list
    createWeaponEvolutionChoices();
    createPriorityList();
}

// Handles Max Ascensions + Stages in which Ascension is possible - path: function showAscensionOverlay/ui.js
const MAX_ASCENSIONS = 3;
const ASCENSION_STAGES = {
    0: 4,
    1: 7,
    2: 9
};
// Additional global variables
let animationFrameId = null;
let lastTimestamp = Date.now();

function checkAscensionUnlock() {
    if (gameState.currentStage > gameState.highestStageReached) {
        gameState.highestStageReached = gameState.currentStage;
        saveGameState();
    }
}

function ascend() {
    if (gameState.ascensionLevel >= MAX_ASCENSIONS) {
        alert("You have reached the maximum ascension level!");
        return;
    }

    const requiredStage = ASCENSION_STAGES[gameState.ascensionLevel];

    if (gameState.highestStageReached >= requiredStage) {
        gameState.ascensionLevel++;
        gameState.soulMultiplier = Math.pow(2, gameState.ascensionLevel)
        
        // Unlock QoL features progressively
        if (gameState.ascensionLevel >= 1) {
            gameState.qolMenuUnlocked = true;
            gameState.autoCastUnlocked = true;
        }
        if (gameState.ascensionLevel >= 2) {
            gameState.autoCardUnlocked = true;
        }
        if (gameState.ascensionLevel >= 3) {
            gameState.autoEvoUnlocked = true;
            gameState.autoClassUnlocked = true;
        }
        
        // Reset soul upgrades
        soulsUpgrades.forEach(upgrade => {
            const upgradeName = upgrade.name.toLowerCase().replace('+', '') + 'Upgrades';
            gameState[upgradeName] = 0;
        });
        
        updateInventoryUI();
        saveGameState();
        
        const overlay = document.getElementById('ascension-overlay');
        if (overlay) {
            overlay.remove();
        }
        showClassSelection();
        checkAchievements();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
	createInventoryMenu();
    showClassSelection();
    document.getElementById('debug-level-up').addEventListener('click', debugLevelUp);
    const autoCastToggle = document.getElementById('auto-cast-toggle');
    if (autoCastToggle) {
        autoCastToggle.checked = gameState.autoCastEnabled;
        autoCastToggle.addEventListener('change', () => {
            gameState.autoCastEnabled = autoCastToggle.checked;
            saveGameState();
        });
    }
});

// Debug for lvl up
function debugLevelUp() {
    if (player) {
        player.exp = player.expToNextLevel;
        player.gainExp(0);
    }
}

function showClassSelection() {
    document.getElementById('class-selection').style.display = 'flex';
    document.getElementById('souls-menu').style.display = 'block';
	
    // Always create and show the inventory menu
    createInventoryMenu();
    const inventoryMenu = document.getElementById('inventory-menu');
    if (inventoryMenu) {
        inventoryMenu.style.display = 'block';
        updateInventoryUI();
    }

    const qolMenu = document.getElementById('qol-menu');
    if (qolMenu) {
        if (gameState.qolMenuUnlocked) {
            qolMenu.style.display = 'block';
            createQoLMenu(); // Ensure the menu content is created
        } else {
            qolMenu.style.display = 'none';
        }
    }
    
    // Hide only player stats
    const playerStats = document.getElementById('player-stats');
    if (playerStats) playerStats.style.display = 'none';
    
    const stageInfo = document.getElementById('stage-info');
    if (stageInfo) stageInfo.style.display = 'none';
    
    // Ensure ability button is hidden
    const abilityButton = document.getElementById('ability-button');
    if (abilityButton) abilityButton.style.display = 'none';
	
    const existingAscendButton = document.getElementById('ascend-button');
    if (existingAscendButton) {
        existingAscendButton.remove();
    }

    // Add Ascend button
    const ascendButton = document.createElement('button');
    ascendButton.innerHTML = 'Ascend';
    ascendButton.id = 'ascend-button';
     
    const nextAscensionStage = ASCENSION_STAGES[gameState.ascensionLevel];

    if (gameState.highestStageReached < nextAscensionStage && gameState.ascensionLevel < MAX_ASCENSIONS) {
        ascendButton.classList.add('unavailable');
        ascendButton.innerHTML = 'Ascend<br><span class="unlock-text">Unlock Stage ' + nextAscensionStage + '</span>';
    } else if (gameState.ascensionLevel < MAX_ASCENSIONS) {
        ascendButton.classList.add('available');
        ascendButton.textContent = 'Ascend';
    } else {
        ascendButton.classList.add('unavailable');
        ascendButton.textContent = 'Maxed Out';
    }
    
    ascendButton.addEventListener('click', () => {
        const requiredStage = ASCENSION_STAGES[gameState.ascensionLevel];
            if (gameState.highestStageReached >= requiredStage) {
            showAscensionOverlay();
            }
    });
    
    const hardResetButton = document.getElementById('hard-reset-btn');
    hardResetButton.parentNode.insertBefore(ascendButton, hardResetButton);
    
    const classOptions = document.querySelectorAll('.class-option');
    classOptions.forEach(option => {
        const className = option.getAttribute('data-class');
        const unlockText = option.querySelector('.unlock-text');
        
        if (gameState.unlockedClasses.includes(className)) {
            option.classList.remove('locked');
            if (unlockText) unlockText.style.display = 'none';
        } else {
            option.classList.add('locked');
            if (unlockText) unlockText.style.display = 'block';
        }
        
        option.addEventListener('click', () => {
            if (gameState.unlockedClasses.includes(className)) {
                startGame(className);
            }
        });
    });

    document.getElementById('hard-reset-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            hardReset();
        }
    });
  
    updateSoulsUI();
    updateClassButtonStates();
    updateInventoryUI();
    if (!document.getElementById('achievements-button')) {
        createAchievementsButton();
    }
    createAchievementsMenu(); // Refresh the achievements menu
    checkAchievements(); // Check for any newly unlocked achievements
}

function updateClassButtonStates() {
    const classOptions = document.querySelectorAll('.class-option');
    classOptions.forEach(option => {
        const className = option.getAttribute('data-class');
        if (gameState.unlockedClasses.includes(className)) {
            option.style.opacity = '1';
            option.style.pointerEvents = 'auto';
        }
		else {
            option.style.opacity = '0.5';
            option.style.pointerEvents = 'none';
        }
    });
}

function startGame(playerClass) {
    if (!gameState.unlockedClasses.includes(playerClass)) {
        console.error('Class not unlocked');
        return;
    }

    gameState.playerClass = playerClass;
    gameState.gameRunning = true;
    gameState.currentWave = 1 + (gameState.startingWaveUpgrades || 0);
    gameState.currentStage = 1;
    document.getElementById('class-selection').style.display = 'none';
    document.getElementById('souls-menu').style.display = 'none';
    document.getElementById('qol-menu').style.display = 'none';
    document.getElementById('inventory-menu').style.display = 'none';
    
    // Play background music when starting game
    playBackgroundMusic();
    
    // Show player stats
    const playerStats = document.getElementById('player-stats');
    if (playerStats) playerStats.style.display = 'block';
    
    document.getElementById('ability-button').style.display = 'block';
    
    // Clear existing enemies
    if (typeof enemies !== 'undefined') {
        enemies.forEach(enemy => {
            if (enemy.element) {
                enemy.element.remove();
            }
        });
    }
    
    enemies = [];
    player = null;
    
    initializePlayer(playerClass);
    initializeWeapon(playerClass);
    initializeUI();
    updateSoulsUI();
    createGameArea();
    startWave();

    // Update lastTimestamp before starting the game loop
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

function createGameArea() {
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = ''; // Clear any existing content
    gameArea.style.display = 'block'; // Ensure game area is visible
    
    // Create stage info element
    const stageInfoElement = document.createElement('div');
    stageInfoElement.id = 'stage-info';
    stageInfoElement.style.display = 'block'; // Ensure stage info is visible
    gameArea.appendChild(stageInfoElement);
	
    // Re-add the ability button
    const abilityButton = document.createElement('button');
    abilityButton.id = 'ability-button';
    abilityButton.style.display = 'block';
    abilityButton.textContent = 'Use Ability';
    gameArea.appendChild(abilityButton);

    // Add event listener to the ability button
    abilityButton.addEventListener('click', () => {
        if (player && player.weapon) {
            player.weapon.useAbility();
        }
    });

    createPlayerElement(); // This will add the player to the game area
}


function startWave() {
    cancelAnimationFrame(animationFrameId);
    spawnEnemies();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameState.gameRunning || gameState.isPaused) {
        // If we're paused, don't process game logic but still request next frame
        if (gameState.gameRunning && gameState.isPaused) {
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
    lastTimestamp = timestamp;
    
    updateEnemies(deltaTime);
    updatePlayer();
    updateWeapon();
    player.updateHp(deltaTime);
    updateUI();
    updateSoulsUI();
    checkAscensionUnlock();

    if (gameState.autoCastEnabled && player && player.weapon) {
        player.weapon.useAbility();
    }

    if (allEnemiesDefeated()) {
        gameState.currentWave++;
        if (gameState.currentWave > 20) {
            gameState.currentStage++;
            gameState.currentWave = 1;
            checkClassUnlock();
        }
        startWave();
    } else if (player.hp <= 0) {
        gameOver();
    } else {
        requestAnimationFrame(gameLoop);
    }
}

function playBackgroundMusic() {
    const bgMusic = document.getElementById('bckgloopmu');
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.volume = 0.09; // Adjust volume as needed
        bgMusic.play().catch(e => console.log('Background music play failed:', e));
    }
}

function stopBackgroundMusic() {
    const bgMusic = document.getElementById('bckgloopmu');
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

//For Debug temp only
function skipWave() {
    // Clear existing enemies
    enemies.forEach(enemy => enemy.element.remove());
    enemies = [];

    // Increment wave
    gameState.currentWave++;
    if (gameState.currentWave > 20) {
        gameState.currentStage++;
        gameState.currentWave = 1;
        checkClassUnlock();
    }

    // Start the new wave
    startWave();
    updateUI();
}

// Modify the checkClassUnlock function
function checkClassUnlock() {
    if (gameState.currentStage === 3 && !gameState.unlockedClasses.includes('Sorceress')) {
        gameState.unlockedClasses.push('Sorceress');
        saveGameState();
    }
	else if (gameState.currentStage === 5 && !gameState.unlockedClasses.includes('Divine Knight')) {
        gameState.unlockedClasses.push('Divine Knight');
        saveGameState();
    }
}

function gameOver() {
    gameState.gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameState.currentWave = 1;
    gameState.currentStage = 1;
    
	// Stop background music on game over
    stopBackgroundMusic();
	
    // Hide the ability button
    const abilityButton = document.getElementById('ability-button');
    if (abilityButton) abilityButton.style.display = 'none';
    
    // Save the current souls count to gameState
    if (player) {
        gameState.souls += player.currentRunSouls;
        player.currentRunSouls = 0;
    }
    
    // Clear existing enemies
    enemies.forEach(enemy => {
        if (enemy.element) enemy.element.remove();
    });
    enemies = [];
    
    // Hide player element
    const playerElement = document.getElementById('player');
    if (playerElement) playerElement.style.display = 'none';
    
    // Hide player stats
    const playerStats = document.getElementById('player-stats');
    if (playerStats) playerStats.style.display = 'none';
    
    // Hide stage info
    const stageInfo = document.getElementById('stage-info');
    if (stageInfo) stageInfo.style.display = 'none';
    
    // Hide game area - ADD THIS LINE
    const gameArea = document.getElementById('game-area');
    if (gameArea) gameArea.style.display = 'none';
   
    // Always show inventory menu, regardless of QoL menu status
    const inventoryMenu = document.getElementById('inventory-menu');
    if (inventoryMenu) {
        inventoryMenu.style.display = 'block';
        updateInventoryUI();
    }
	
    saveGameState();
    showClassSelection();
    updateSoulsUI();
}

// Helper functions
function allEnemiesDefeated() {
    return enemies.length === 0;
}