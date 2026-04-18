const gameState = {
    currentStage: 1, 
	currentWave: 1, 
	gameRunning: false,
    playerClass: null, 
	unlockedClasses: ['Acolyte'], 
	isPaused: false,
    highestStageReached: 1,
    highestStagePerClass: { Acolyte: 1, Sorceress: 1, 'Divine Knight': 1 },
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
	autoCastEliteBossOnly: false,
    autoWeaponEvolutionChoices: { Acolyte: '', Sorceress: '', 'Divine Knight': '' },
    autoClassEnabled: false,
    autoClassChoices: { Acolyte: '', Sorceress: '', 'Divine Knight': '' },
    amuletDropped: false, 
	amuletEquipped: false,
    unlockedAchievements: {},
    talentPointsGranted: [], // array of "stage_wave" strings
};

const MAX_ASCENSIONS = 3;
const ASCENSION_STAGES = { 0: 4, 1: 7, 2: 9 };
const ASCENSION_MAX_PURCHASES = [5, 10, 15, 20];
const SOUL_MULTIPLIERS = [1, 2, 4, 6];

const SAVE_KEYS = [
    'unlockedClasses',
	'souls',
    ...Object.values(UPGRADE_KEY_MAP),
	'highestStageReached',
	'ascensionLevel',
    'soulMultiplier',
	'qolMenuUnlocked',
	'autoCastUnlocked',
    'autoCardUnlocked',
	'autoEvoUnlocked',
	'autoClassUnlocked',
    'autoCastEnabled',
	'autoCastEliteBossOnly',
	'autoCardEnabled',
    'upgradePriority',
	'autoWeaponEvolutionEnabled',
	'autoWeaponEvolutionChoices',
    'autoClassEnabled',
	'autoClassChoices',
	'amuletDropped',
	'amuletEquipped',
    'unlockedAchievements',
	'highestStagePerClass',
    'talentPointsGranted',
];

const DEFAULT_UPGRADE_PRIORITY = [
    'Damage Increase', 'Attack Speed', 'Health', 'Regeneration',
    'Cooldown Reduction', 'Critical Damage Increase', 'Critical Strike Chance', 'Boss Damage'
];

// Keys that hold objects/arrays/booleans and must not be coerced to 0
const NON_NUMERIC_SAVE_KEYS = new Set([
    'unlockedClasses', 'upgradePriority', 'autoWeaponEvolutionChoices',
    'autoClassChoices', 'unlockedAchievements', 'highestStagePerClass',
    'talentPointsGranted',
]);

function saveGameState() {
    const state = {};
    SAVE_KEYS.forEach(k => {
        state[k] = NON_NUMERIC_SAVE_KEYS.has(k) ? gameState[k] : (gameState[k] ?? 0);
    });
    // Save talent alloc and points
    state.talentAlloc = Object.assign({}, alloc);
    state.talentPoints = talentPoints;
    // Save Sorceress talent alloc and points
    state.sorcTalentAlloc = Object.assign({}, sorcAlloc);
    state.sorcTalentPoints = sorcTalentPoints;
    localStorage.setItem('gameState', JSON.stringify(state));
}

// Copies saved keys back into a live alloc object, skipping any keys absent in the save.
function restoreAlloc(liveAlloc, savedAlloc) {
    if (!savedAlloc) return;
    Object.keys(liveAlloc).forEach(key => {
        if (savedAlloc[key] !== undefined) liveAlloc[key] = savedAlloc[key];
    });
}

function loadGameState() {
    const saved = localStorage.getItem('gameState');
    if (!saved) return;
    try {
        const parsed = JSON.parse(saved);
        Object.assign(gameState, parsed);

        restoreAlloc(alloc, parsed.talentAlloc);
        if (parsed.talentPoints !== undefined) talentPoints = parsed.talentPoints;

        restoreAlloc(sorcAlloc, parsed.sorcTalentAlloc);
        if (parsed.sorcTalentPoints !== undefined) sorcTalentPoints = parsed.sorcTalentPoints;

        if (!Array.isArray(gameState.talentPointsGranted)) gameState.talentPointsGranted = [];

        console.log('Game Loaded Successfully');
    } catch (e) {
        console.error('Failed to parse save data', e);
    }
}

function hardReset() {
    if (!confirm('Are you sure you want to reset all progress? This cannot be undone.')) return;
    // Zero out talent alloc and points before reload
    Object.keys(alloc).forEach(k => alloc[k] = 0);
    talentPoints = 0;
    Object.keys(sorcAlloc).forEach(k => sorcAlloc[k] = 0);
    sorcTalentPoints = 0;
    localStorage.removeItem('gameState');
    location.reload();
}

function checkAscensionUnlock() {
    if (gameState.currentStage <= gameState.highestStageReached) return;
    gameState.highestStageReached = gameState.currentStage;
    if (player?.class && gameState.currentStage > (gameState.highestStagePerClass[player.class] || 1)) {
        gameState.highestStagePerClass[player.class] = gameState.currentStage;
    }
    saveGameState();
    checkAchievements();
}

function ascend() {
    if (gameState.ascensionLevel >= MAX_ASCENSIONS) {
        alert('You have reached the maximum ascension level!');
        return;
    }
    if (gameState.highestStageReached < ASCENSION_STAGES[gameState.ascensionLevel]) return;

    gameState.ascensionLevel++;
    gameState.soulMultiplier = SOUL_MULTIPLIERS[gameState.ascensionLevel] ?? SOUL_MULTIPLIERS.at(-1);
    gameState.souls = 0;

    const { ascensionLevel: lvl } = gameState;
    if (lvl >= 1) { gameState.qolMenuUnlocked = true; gameState.autoCastUnlocked = true; }
    if (lvl >= 2) gameState.autoCardUnlocked = true;
    if (lvl >= 3) { gameState.autoEvoUnlocked = true; gameState.autoClassUnlocked = true; }

    Object.values(UPGRADE_KEY_MAP).forEach(key => {
        gameState[key] = 0;
    });

    // Reset talent tree on ascension
    resetTalents();
    talentPoints = 0;
    sorcResetTalents();
    sorcTalentPoints = 0;
    gameState.talentPointsGranted = [];
    renderTalents();
    renderSorcTalents();

    updateInventoryUI();
    saveGameState();
    document.getElementById('ascension-overlay')?.remove();
    showClassSelection();
    checkAchievements();
}

function showClassSelection() {
    ['class-selection', 'souls-menu'].forEach(id =>
        document.getElementById(id).style.display = id === 'class-selection' ? 'flex' : 'block'
    );

    createInventoryMenu();
    const inventoryMenu = document.getElementById('inventory-menu');
    if (inventoryMenu) { inventoryMenu.style.display = 'block'; updateInventoryUI(); }

    const qolMenu = document.getElementById('qol-menu');
    if (qolMenu) {
        qolMenu.style.display = gameState.qolMenuUnlocked ? 'block' : 'none';
        if (gameState.qolMenuUnlocked) createQoLMenu();
    }

    ['player-stats', 'stage-info', 'ability-button'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    document.getElementById('ascend-button')?.remove();

    const ascendButton = document.createElement('button');
    ascendButton.id = 'ascend-button';
    const nextStage = ASCENSION_STAGES[gameState.ascensionLevel];
    const canAscend = gameState.highestStageReached >= nextStage;
    const maxed = gameState.ascensionLevel >= MAX_ASCENSIONS;

    ascendButton.className = (!maxed && canAscend) ? 'available' : 'unavailable';
    if (maxed) {
        ascendButton.textContent = 'Maxed Out';
    } else if (!canAscend) {
        ascendButton.innerHTML = `Ascend<br><span class="unlock-text">Unlock Stage ${nextStage}</span>`;
    } else {
        ascendButton.textContent = 'Ascend';
    }
    ascendButton.addEventListener('click', () => {
        if (canAscend) showAscensionOverlay();
    });

    const hardResetButton = document.getElementById('hard-reset-btn');
    hardResetButton.parentNode.insertBefore(ascendButton, hardResetButton);

    document.querySelectorAll('.class-option').forEach(option => {
        const className = option.getAttribute('data-class');
        const unlockText = option.querySelector('.unlock-text');
        const unlocked = gameState.unlockedClasses.includes(className);

        option.classList.toggle('locked', !unlocked);
        option.style.opacity = unlocked ? '1' : '0.5';
        option.style.pointerEvents = unlocked ? 'auto' : 'none';
        if (unlockText) unlockText.style.display = unlocked ? 'none' : 'block';

        // Update talent plus buttons for Sorceress and Divine Knight
        const btnId = className === 'Sorceress' ? 'sorc-plus' : className === 'Divine Knight' ? 'divi-plus' : null;
        if (btnId) {
            const btn = document.getElementById(btnId);
            if (btn) btn.classList.toggle('plus-btn-locked', !unlocked);
        }

        if (unlocked) {
            document.getElementById(`tooltip-${className}`)?.remove();
            const tooltip = document.createElement('div');
            tooltip.id = `tooltip-${className}`;
            tooltip.className = 'class-tooltip';
            tooltip.innerHTML = `<div class="class-tooltip-title">${className}</div>
                <div>${classDescriptions[className] || 'A mysterious warrior...'}</div>`;
            document.body.appendChild(tooltip);

            option.addEventListener('mouseenter', () => {
                const rect = option.getBoundingClientRect();
                Object.assign(tooltip.style, {
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.right + 25}px`,
                    opacity: '1', visibility: 'visible'
                });
            });
            option.addEventListener('mouseleave', () => {
                Object.assign(tooltip.style, { opacity: '0', visibility: 'hidden' });
            });
        }

        option.addEventListener('click', () => {
            if (unlocked) startGame(className);
        });
    });

    document.getElementById('hard-reset-btn').addEventListener('click', hardReset);

    updateSoulsUI();
    updateInventoryUI();
    if (!document.getElementById('achievements-button')) createAchievementsButton();
    createAchievementsMenu();
    checkAchievements();

    // Update talent pulse button state
    renderTalents();
}

function startGame(playerClass) {
    if (!gameState.unlockedClasses.includes(playerClass)) return console.error('Class not unlocked');

    Object.assign(gameState, {
        playerClass, gameRunning: true,
        currentWave: 1 + (gameState.startingWaveUpgrades || 0),
        currentStage: 1,
    });

    ['class-selection', 'souls-menu', 'qol-menu', 'inventory-menu'].forEach(id =>
        document.getElementById(id).style.display = 'none'
    );

    playBackgroundMusic();
    document.getElementById('player-stats').style.display = 'block';
    document.getElementById('ability-button').style.display = 'block';

    enemies?.forEach(e => e.element?.remove());
    enemies = [];
    player = null;

    initializePlayer(playerClass);
    initializeWeapon(playerClass);
    initializeUI();
    updateSoulsUI();
    createGameArea();
    grantSkippedWaveExperience();
    startWave();

    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

function createGameArea() {
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';
    gameArea.style.display = 'block';

    const stageInfo = document.createElement('div');
    stageInfo.id = 'stage-info';
    stageInfo.style.display = 'block';
    gameArea.appendChild(stageInfo);

    const abilityButton = document.createElement('button');
    abilityButton.id = 'ability-button';
    abilityButton.style.display = 'block';
    abilityButton.textContent = 'Use Ability';
    abilityButton.addEventListener('click', () => player?.weapon?.useAbility());
    gameArea.appendChild(abilityButton);

    createPlayerElement();
}

function startWave() {
    cancelAnimationFrame(animationFrameId);
    clearTimeout(animationFrameId);
    spawnEnemies();
    lastTimestamp = performance.now();
    if (document.hidden) {
        animationFrameId = setTimeout(backgroundLoop, 1000 / 60);
    } else {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function grantSkippedWaveExperience() {
    const skipped = gameState.startingWaveUpgrades || 0;
    if (!skipped || !player) return;

    let totalExp = 0;
    for (let wave = 1; wave <= skipped; wave++) {
        totalExp += (4 + wave) * 10; // regular enemies
        if (wave % 5 === 0) totalExp += 30; // elite bonus
    }

    const expUpgrade = soulsUpgrades.find(u => u.name === 'Exp+');
    const multiplier = 1 + ((gameState.expUpgrades || 0) * expUpgrade.valuePerUpgrade);
    player.exp += totalExp * multiplier;

    console.log(`Granted ${(totalExp * multiplier).toFixed(0)} XP for ${skipped} skipped waves`);
    processNextLevelUp();
}

function processNextLevelUp() {
    if (!player || player.exp < player.expToNextLevel) {
        gameState.isPaused = false;
        cancelAnimationFrame(animationFrameId);
        lastTimestamp = performance.now();
        if (document.hidden) {
            animationFrameId = setTimeout(backgroundLoop, 1000 / 60);
        } else {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
        return;
    }

    player.level++;
    player.exp -= player.expToNextLevel;
    const lvl = player.level;
    player.expToNextLevel = Math.round(player.expToNextLevel * (lvl < 10 ? 1.35 : lvl < 20 ? 1.15 : 1.025));

    if (lvl === 10) showWeaponEvolutionScreen();
    else showLevelUpScreen();
}

// Check and grant talent points at wave milestones (wave 10 and 20 per stage)
function checkAndGrantTalentPoints(completedWave) {
    if (completedWave !== 10 && completedWave !== 20) return;
    if (!Array.isArray(gameState.talentPointsGranted)) gameState.talentPointsGranted = [];
    const className = player instanceof Sorceress ? 'Sorceress' : (player?.class || 'Acolyte');
    const key = `${className}_${gameState.currentStage}_${completedWave}`;
    if (!gameState.talentPointsGranted.includes(key)) {
        // Grant only to the current player's class talent pool
        if (player instanceof Sorceress) {
            sorcTalentPoints++;
            renderSorcTalents();
        } else {
            // Acolyte (and any future non-Sorc classes) use the acolyte pool
            talentPoints++;
            renderTalents();
        }
        gameState.talentPointsGranted.push(key);
        saveGameState();
        // Brief notification
        const notify = document.createElement('div');
        notify.className = 'talent-point-notify';
        notify.textContent = '+1 Talent Point!';
        document.getElementById('game-area')?.appendChild(notify);
        setTimeout(() => notify.remove(), 3000);
    }
}

function gameLoop(timestamp) {
    if (!gameState.gameRunning || gameState.isPaused) return;

    const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.5);
    lastTimestamp = timestamp;

    updateEnemies(deltaTime);
    updatePlayer();
    updateWeapon();
    player.updateHp(deltaTime);
    updateUI();
    checkAscensionUnlock();

    if (gameState.autoCastEnabled && player?.weapon) {
        const isElite = gameState.currentWave % 5 === 0;
        const isBoss = gameState.currentWave === 1 && gameState.currentStage >= 2;
        if (!gameState.autoCastEliteBossOnly || isElite || isBoss)
            player.weapon.useAbility();
    }

    if (allEnemiesDefeated()) {
        const completedWave = gameState.currentWave;
        checkAndGrantTalentPoints(completedWave);
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
        if (document.hidden) {
            animationFrameId = setTimeout(backgroundLoop, 1000 / 60);
        } else {
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
}

function getBgMusic() {
    return document.getElementById('bckgloopmu');
}

function playBackgroundMusic() {
    const bgMusic = getBgMusic();
    if (!bgMusic) return;
    bgMusic.currentTime = 0;
    bgMusic.volume = 0.09;
    bgMusic.play().catch(e => console.log('Background music play failed:', e));
}

function stopBackgroundMusic() {
    const bgMusic = getBgMusic();
    if (!bgMusic) return;
    bgMusic.pause();
    bgMusic.currentTime = 0;
}

function skipWave() {
    enemies.forEach(e => e.element.remove());
    enemies = [];
    gameState.currentWave++;
    if (gameState.currentWave > 20) {
        gameState.currentStage++;
        gameState.currentWave = 1;
        checkClassUnlock();
    }
    startWave();
    updateUI();
}

function checkClassUnlock() {
    const unlocks = { 3: 'Sorceress', 5: 'Divine Knight' };
    const cls = unlocks[gameState.currentStage];
    if (cls && !gameState.unlockedClasses.includes(cls)) {
        gameState.unlockedClasses.push(cls);
        saveGameState();
    }
}

function gameOver() {
    gameState.gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    gameState.currentWave = 1;
    gameState.currentStage = 1;
    stopBackgroundMusic();

    if (player) { player.currentRunSouls = 0; }

    enemies.forEach(e => e.element?.remove());
    enemies = [];

    ['ability-button', 'player-stats', 'stage-info'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const gameArea = document.getElementById('game-area');
    const playerElement = document.getElementById('player');
    if (playerElement) playerElement.style.display = 'none';

    const youDied = document.createElement('div');
    youDied.className = 'you-died-text';
    youDied.textContent = 'You Died';
    gameArea.appendChild(youDied);

    saveGameState();
    setTimeout(() => {
        youDied.remove();
        gameArea.style.display = 'none';
        const inventoryMenu = document.getElementById('inventory-menu');
        if (inventoryMenu) { inventoryMenu.style.display = 'block'; updateInventoryUI(); }
        showClassSelection();
        updateSoulsUI();
    }, 3000);
}

function allEnemiesDefeated() { return enemies.length === 0; }

function debugLevelUp() {
    if (player) { player.exp = player.expToNextLevel; player.gainExp(0); }
}

let animationFrameId = null;
let lastTimestamp = Date.now();

document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    createInventoryMenu();
    showClassSelection();
    buildTree();
    buildSorcTree();
    document.getElementById('debug-level-up').addEventListener('click', debugLevelUp);
    // TEMP DEBUG: Add talent point button for testing
    const debugTalentBtn = document.createElement('button');
    debugTalentBtn.id = 'debug-talent-btn';
    debugTalentBtn.textContent = '+1 Talent';
    debugTalentBtn.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:9999;padding:4px 10px;background:#2a1a3e;border:1px solid #9370DB;color:#c8aaff;font-size:11px;cursor:pointer;border-radius:4px;';
    debugTalentBtn.addEventListener('click', () => { talentPoints++; sorcTalentPoints++; renderTalents(); renderSorcTalents(); saveGameState(); });
    document.body.appendChild(debugTalentBtn);
    const autoCastToggle = document.getElementById('auto-cast-toggle');
    if (autoCastToggle) {
        autoCastToggle.checked = gameState.autoCastEnabled;
        autoCastToggle.addEventListener('change', () => {
            gameState.autoCastEnabled = autoCastToggle.checked;
            saveGameState();
        });
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Switch to setTimeout so the loop keeps running in the background
        cancelAnimationFrame(animationFrameId);
        if (gameState.gameRunning && !gameState.isPaused) {
            lastTimestamp = performance.now();
            animationFrameId = setTimeout(backgroundLoop, 1000 / 60);
        }
    } else {
        // Back in focus — cancel setTimeout and resume rAF
        clearTimeout(animationFrameId);
        if (gameState.gameRunning && !gameState.isPaused) {
            lastTimestamp = performance.now();
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }
});

function backgroundLoop() {
    if (!gameState.gameRunning || gameState.isPaused || !document.hidden) return;
    const now = performance.now();
    gameLoop(now);
}