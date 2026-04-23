//Full documentation in docIR
function initializeUI() {

    document.getElementById('ability-button')?.addEventListener('click', () => {
        if (!gameState.gameRunning || gameState.isPaused) return;
        player?.weapon?.useAbility();
    });

    document.getElementById('debug-skip-wave').addEventListener('click', skipWave);

    updateUI();
    createQoLMenu();
    createInventoryMenu();
    createAchievementsMenu();
    createAchievementsButton();
    createLeaderboardButton();
}

function updateUI() {
    const stageInfo = document.getElementById('stage-info');
    if (stageInfo) {
        stageInfo.textContent = `Stage ${gameState.currentStage} | Wave ${gameState.currentWave}/20 | Enemies: ${enemies.length}`;
    }
    updatePlayerStats();
    updateAbilityButton();
    checkAchievements();
}

function updatePlayerStats() {
    if (!player?.weapon) return;

    const el = document.getElementById('player-stats');
    const w = player.weapon;

    let rangeText = w.globalRange.toFixed(0);
    if ((w instanceof ChainWand || w instanceof BasicWand) && w.chainRange)
        rangeText += ` / Chain ${w.chainRange}`;
    else if (w instanceof VortexStaff && w.splashRange)
        rangeText += ` / Splash ${w.splashRange}`;

    const CDR = player.totalCooldownReduction;
    const cdrCapped = CDR >= 0.75;
    const cdrText = cdrCapped ? '75% CAP' : `${(CDR * 100).toFixed(1)}%`;
    const cdrStyle = cdrCapped ? 'color:#4A6741' : CDR < 0 ? 'color:#DC143C' : '';

    const crit = Math.min(player.critChance, 1);
    const critCapped = player.critChance >= 0.80;
    const critText = critCapped ? '80% CAP' : `${(crit * 100).toFixed(1)}%`;
    const critStyle = critCapped ? 'color:#4A6741' : player.critChance < 0 ? 'color:#DC143C' : '';

    const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
    const hasBlessedShield = player.weapon instanceof BlessedShield;
    const hasSmiteShield   = player.weapon instanceof SmiteShield;
    const oathJudgement = dAlloc && (dAlloc['oath_of_judgement'] >= 1 || dAlloc['oath_of_dominion'] >= 1) && hasBlessedShield;
    const oathEternity  = dAlloc && dAlloc['oath_of_eternity']  >= 1 && hasSmiteShield;
    const oathAegis     = dAlloc && dAlloc['oath_of_aegis']     >= 1 && hasSmiteShield;
    let regenText, regenStyle;
    if (oathJudgement) {
        regenText  = 'DISABLED';
        regenStyle = 'color:#DC143C';
    } else if (oathEternity) {
        regenText  = `${player.hpRegen.toFixed(2)}/s`;
        regenStyle = '';
    } else {
        const regenCapVal   = oathAegis ? 1.5 : 1.00;
        const regenCapped   = player.hpRegen >= regenCapVal;
        const regenCapLabel = oathAegis ? '1.50/s CAP' : '1.00/s CAP';
        regenText  = regenCapped ? regenCapLabel : `${player.hpRegen.toFixed(2)}/s`;
        regenStyle = regenCapped ? 'color:#4A6741' : '';
    }

    const critDmgPct = player.critDamage * 100 - 100;
    const critDmgStyle = critDmgPct < 0 ? 'color:#DC143C' : '';

    const isWeakened = document.getElementById('player')?.classList.contains('weakened');
    const isMindFrozen = enemies?.some(e => e instanceof EliteEnemy && e.activeEffects?.some(ef => ef.name === 'MindFreeze'));
    const damageStyle = isWeakened ? 'color:#DC143C' : '';
    const attackSpeedStyle = isMindFrozen ? 'color:#DC143C' : '';

    const classColor = player.classColor || '#FFD700';

    const stat = (name, value, style = '') =>
        `<div><span class="stat-name">${name}:</span> <span class="stat-value"${style ? ` style="${style}"` : ''}>${value}</span></div>`;

    let html = `
        <h3 style="color:${classColor};">${player.getDisplayName()}</h3>
        ${stat('Level', player.level)}
        ${stat('Exp', `${player.exp.toFixed(0)} / ${player.expToNextLevel.toFixed(0)}`)}
        ${stat('Souls', player.currentRunSouls)}
        <div class="stat-row divider"><span class="stat-name">HP:</span> <span class="stat-value">${player.hp.toFixed(1)} / ${player.maxHp.toFixed(1)}</span></div>
        ${stat('HP Regen', regenText, regenStyle)}
        <div class="stat-row weapon-stat"><span class="stat-name">Weapon:</span> <span class="stat-value">${w.name}</span></div>
        ${stat('Damage', w.chainCount !== undefined && w.chainCount > 0
            ? `${w.damage.toFixed(1)} +${w.chainCount} chains`
            : w.damage.toFixed(1), damageStyle)}
        ${stat('Range', rangeText)}
        ${stat('Attacks/Sec', (w.getAttackSpeed ? w.getAttackSpeed() : player.attacksPerSecond).toFixed(2), attackSpeedStyle)}
        ${stat('CD Reduction', cdrText, cdrStyle)}
        ${stat('Crit Chance', critText, critStyle)}
        ${stat('Crit Damage', `${critDmgPct.toFixed(1)}%`, critDmgStyle)}
    `;

    if (gameState.amuletEquipped) {
        const bossDmgPct = player.getBossDamageBonus() * 100;
        const bossDmgText = `${bossDmgPct >= 0 ? '+' : ''}${bossDmgPct.toFixed(1)}%`;
        const bossDmgStyle = bossDmgPct < 0 ? 'color:#DC143C' : '';
        html += stat('Boss Damage', bossDmgText, bossDmgStyle);
    }

    el.innerHTML = html;
}

function updateAbilityButton() {
    const btn = document.getElementById('ability-button');
    if (!btn || !player?.weapon) return;
    const text = player.weapon.getAbilityButtonText();
    btn.innerHTML = text;
    btn.disabled = text.startsWith('Cooldown');
}

function showAscensionOverlay() {
    if (gameState.ascensionLevel >= MAX_ASCENSIONS) return;
    if (gameState.highestStageReached < ASCENSION_STAGES[gameState.ascensionLevel]) return;

    const configs = [
        {
            maxUpgradesText: 'Max upgrades for all Soul upgrades: +5',
            unlockText: 'Unlocks Exp+ / Boss Damage+ upgrades',
            qolUnlockText: 'Unlocks Automation',
            amuletUpgradeText: 'Upgrades Amulet'
        },
        {
            maxUpgradesText: 'Max upgrades for Exp+: +5',
            unlockText: 'Unlocks Rarity+ upgrade',
            qolUnlockText: 'Unlocks Auto Card in QoL menu',
            amuletUpgradeText: 'Additional Amulet upgrade'
        },
        {
            maxUpgradesText: 'Max upgrades for Exp+ / Rarity+: +5',
            unlockText: 'Unlocks Starting Wave+ upgrade',
            qolUnlockText: 'Unlocks Auto Evo / Auto Class in QoL menu',
            amuletUpgradeText: 'Additional Amulet upgrade'
        }
    ];

    const { maxUpgradesText, unlockText, qolUnlockText, amuletUpgradeText } = configs[gameState.ascensionLevel];

    const overlay = document.createElement('div');
    overlay.id = 'ascension-overlay';
    overlay.innerHTML = `
        <div id="ascension-content">
            <h2>Ascension ${gameState.ascensionLevel + 1}</h2>
            <p>Resetting everything except unlocked classes.</p>
            <p>${amuletUpgradeText}</p>
            <p>Soul gain multiplier: x${SOUL_MULTIPLIERS[gameState.ascensionLevel + 1] ?? SOUL_MULTIPLIERS.at(-1)}</strong></p>
            <p>${maxUpgradesText}</p>
            <p>${unlockText}</p>
            <p>${qolUnlockText}</p>
            <p>Talent points and talent tree are reset.</p>
            ${gameState.ascensionLevel === 0 ? '<p>Adds a Skip Wave button <b>[E]</b>, spawns up to 3 consecutive waves at once</p>' : ''}
            <button onclick="ascend()">Confirm Ascension</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

function showGameOverScreen() {
    const screen = document.createElement('div');
    screen.id = 'game-over';
    screen.innerHTML = `
        <h2>Game Over</h2>
        <p>You reached Stage ${gameState.currentStage}, Wave ${gameState.currentWave}</p>
        <button id="restart-button">Restart</button>
    `;
    document.body.appendChild(screen);
    document.getElementById('restart-button').addEventListener('click', () => {
        screen.remove();
        showClassSelection();
    });
}

function updateSoulsUI() {
    const soulsMenu = document.getElementById('souls-menu');
    const souls = gameState.souls ?? 0;

    const upgradeConfig = {
        'Health+':          { key: 'healthUpgrades',      display: v => `+${(v * 0.5).toFixed(1)} HP`,        label: 'Health Increase' },
        'Regen+':           { key: 'regenUpgrades',       display: v => `+${(v * 0.02).toFixed(2)}/s`,        label: 'HP Regeneration' },
        'Crit Chance+':     { key: 'critChanceUpgrades',  display: v => `+${v * 1}%`,                         label: 'Critical Strike Chance' },
        'Critical Damage+': { key: 'critDamageUpgrades',  display: v => `+${v * 10}%`,                        label: 'Critical Damage' },
        'Attack Speed+':    { key: 'attackSpeedUpgrades', display: v => `+${v * 5}%`,                         label: 'Attack Speed Increase' },
        'Cooldown+':        { key: 'cooldownUpgrades',    display: v => `+${v * 2}%`,                         label: 'Cooldown Reduction' },
        'Exp+':             { key: 'expUpgrades',         display: (v, u) => `+${(v * u.valuePerUpgrade * 100).toFixed(0)}%`, label: 'Experience Gain' },
        'Boss Damage+':     { key: 'bossDamageUpgrades',  display: v => `+${v * 10}%`,                        label: 'Boss Damage' },
        'Rarity+':          { key: 'rarityUpgrades',      display: (v, u) => `+${(v * u.valuePerUpgrade * 100).toFixed(0)}%`, label: 'Higher Rarity Chance' },
        'Starting Wave+':   { key: 'startingWaveUpgrades',display: v => `+${v}`,                              label: 'Starting Wave' },
    };

    const asc = gameState.ascensionLevel;

    const tieredUpgrades = new Set(['Exp+', 'Boss Damage+', 'Rarity+', 'Starting Wave+']);
    const getMaxPurchases = name => {
        if (!tieredUpgrades.has(name)) return asc >= 1 ? 10 : 5;
        return asc >= 3 ? 20 : asc >= 2 ? 15 : asc >= 1 ? 10 : 5;
    };

    let html = `
        <h3>Total Souls: ${souls}</h3>
        <h4>Total Ascensions: ${asc} <span style="color:yellow;">(x${gameState.soulMultiplier} Multiplier)</span></h4>
        <div id="souls-upgrades-container">
    `;

    soulsUpgrades.forEach(upgrade => {
        if (upgrade.isVisible && !upgrade.isVisible(gameState)) return;

        const cfg = upgradeConfig[upgrade.name];
        if (!cfg) return;

        const purchased = gameState[cfg.key] || 0;
        const currentValue = cfg.display(purchased, upgrade);
        const maxPurchases = getMaxPurchases(upgrade.name);
        const cost = calculateSoulUpgradeCost(upgrade.baseCost, purchased);
        const disabled = !upgrade.canPurchase(gameState) || souls < cost;

        html += `
            <div class="souls-upgrade">
                <h4>${upgrade.name}</h4>
                <hr>
                <p>${cfg.label} ${currentValue}</p>
                <p>Required Souls: ${cost}</p>
                <p>Upgrades: ${purchased}/${maxPurchases}</p>
                <button onclick="purchaseSoulsUpgrade('${upgrade.name}')" ${disabled ? 'disabled' : ''}>Purchase</button>
            </div>
        `;
    });

    html += '</div>';
    soulsMenu.innerHTML = html;
}

function createQoLMenu() {
    let qolMenu = document.getElementById('qol-menu');
    if (!qolMenu) {
        qolMenu = document.createElement('div');
        qolMenu.id = 'qol-menu';
        document.body.appendChild(qolMenu);
    }

    const toggle = (id, label, subId = null) => `
        <div class="toggle-container">
            <span>${label}</span>
            <label class="switch">
                <input type="checkbox" id="${id}">
                <span class="slider round"></span>
            </label>
        </div>
        ${subId ? `<div id="${subId}" style="display:none;"></div>` : ''}
    `;

    const cogToggle = (id, label, cogId, panelId) => `
        <div class="toggle-container">
            <span>${label}</span>
            <label class="switch">
                <input type="checkbox" id="${id}">
                <span class="slider round"></span>
            </label>
            <button id="${cogId}" class="cog-button">⚙️</button>
        </div>
        <div id="${panelId}" style="display:none;"></div>
    `;

    let html = '<h3>Quality of Life</h3>';

    if (gameState.autoCastUnlocked) html += `
        <div class="toggle-container">
            <span>Auto Cast Ability</span>
            <label class="switch"><input type="checkbox" id="auto-cast-toggle"><span class="slider round"></span></label>
        </div>
        <div id="auto-cast-elite-boss-container" style="display:none; margin-left:20px; font-size:13px;">
            ${toggle('auto-cast-elite-boss-toggle', 'Elite/Boss Only')}
        </div>
    `;

    if (gameState.autoCardUnlocked) html += cogToggle('auto-card-toggle', 'Auto Card', 'auto-card-settings', 'auto-card-priority');

    if (gameState.autoEvoUnlocked) html += cogToggle('auto-weapon-evolution-toggle', 'Auto Evo', 'auto-weapon-evolution-settings', 'auto-weapon-evolution-options');
    if (gameState.autoClassUnlocked) html += cogToggle('auto-class-toggle', 'Auto Class', 'auto-class-settings', 'auto-class-options');

    qolMenu.innerHTML = html;

    const wire = (id, stateKey, onChange) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.checked = gameState[stateKey] || false;
        onChange?.(el.checked);  
        el.addEventListener('change', () => {
            gameState[stateKey] = el.checked;
            saveGameState();
            onChange?.(el.checked);
        });
    };

    wire('auto-cast-toggle', 'autoCastEnabled', checked => {
        const c = document.getElementById('auto-cast-elite-boss-container');
        if (c) c.style.display = checked ? 'block' : 'none';
    });

    wire('auto-cast-elite-boss-toggle', 'autoCastEliteBossOnly');

    if (gameState.autoCardUnlocked) {
        wire('auto-card-toggle', 'autoCardEnabled');
        document.getElementById('auto-card-settings').addEventListener('click', () => toggleMenuPanel('auto-card-priority'));
        createPriorityList();
    }

    if (gameState.autoEvoUnlocked) {
        wire('auto-weapon-evolution-toggle', 'autoWeaponEvolutionEnabled');
        document.getElementById('auto-weapon-evolution-settings').addEventListener('click', () => toggleMenuPanel('auto-weapon-evolution-options'));
        createWeaponEvolutionChoices();
    }

    if (gameState.autoClassUnlocked) {
        wire('auto-class-toggle', 'autoClassEnabled');
        document.getElementById('auto-class-settings').addEventListener('click', () => toggleMenuPanel('auto-class-options'));
        createClassUpgradeChoices();
    }
}

function toggleMenuPanel(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function createClassSelectChoices(containerId, getOptions, stateChoices, selectIdSuffix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    ['Acolyte', 'Sorceress', 'Divine Knight'].forEach(className => {
        const div = document.createElement('div');
        const options = getOptions(className)
            .map(item => `<option value="${item.name}" ${stateChoices[className] === item.name ? 'selected' : ''}>${item.name}</option>`)
            .join('');

        div.innerHTML = `
            <h5>${className}</h5>
            <select id="${className.toLowerCase()}-${selectIdSuffix}">
                <option value="">Random</option>${options}
            </select>
        `;
        container.appendChild(div);

        div.querySelector('select').addEventListener('change', e => {
            stateChoices[className] = e.target.value;
            saveGameState();
        });
    });
}

function createWeaponEvolutionChoices() {
    createClassSelectChoices(
        'auto-weapon-evolution-options',
        className => getWeaponEvolutionOptions(className),
        gameState.autoWeaponEvolutionChoices,
        'weapon-choice'
    );
}

function createClassUpgradeChoices() {
    createClassSelectChoices(
        'auto-class-options',
        className => classUpgrades[className] || [],
        gameState.autoClassChoices,
        'class-choice'
    );
}

function createPriorityList() {
    const autoCardPriority = document.getElementById('auto-card-priority');
    if (!autoCardPriority) return;

    let priorityList = document.getElementById('priority-list');
    if (!priorityList) {
        priorityList = document.createElement('ul');
        priorityList.id = 'priority-list';
        autoCardPriority.appendChild(priorityList);
    }

    const upgrades = gameState.upgradePriority || DEFAULT_UPGRADE_PRIORITY;

    priorityList.innerHTML = upgrades.map((upgrade, i) => `
        <li>
            <span>${upgrade}</span>
            <div class="priority-buttons">
                <button class="priority-up" ${i === 0 ? 'disabled' : ''}>▲</button>
                <button class="priority-down" ${i === upgrades.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
        </li>
    `).join('');

    priorityList.addEventListener('click', handlePriorityChange);
}

function handlePriorityChange(e) {
    if (!e.target.matches('button')) return;
    const li = e.target.closest('li');
    const isUp = e.target.classList.contains('priority-up');
    if (isUp && li.previousElementSibling) li.parentNode.insertBefore(li, li.previousElementSibling);
    else if (!isUp && li.nextElementSibling) li.parentNode.insertBefore(li.nextElementSibling, li);
    updatePriorityButtons();
    savePriorityOrder();
}

function updatePriorityButtons() {
    const items = [...document.getElementById('priority-list').getElementsByTagName('li')];
    items.forEach((item, i) => {
        item.querySelector('.priority-up').disabled = i === 0;
        item.querySelector('.priority-down').disabled = i === items.length - 1;
    });
}

function savePriorityOrder() {
    gameState.upgradePriority = [...document.getElementById('priority-list').getElementsByTagName('li')]
        .map(li => li.querySelector('span').textContent);
    saveGameState();
}

function createInventoryMenu() {
    document.getElementById('inventory-menu').innerHTML = `
        <h3>Inventory</h3>
        <div class="inventory-container">
            <div class="amulet-slot"><div class="empty-slot"></div></div>
            <p id="amulet-name">Amulet slot</p>
        </div>
    `;
}

function updateInventoryUI() {
    const amuletSlot = document.querySelector('.amulet-slot');
    const amuletName = document.getElementById('amulet-name');

    if (!gameState.amuletEquipped) {
        amuletSlot.innerHTML = '<div class="empty-slot"></div>';
        amuletName.textContent = 'Amulet Slot';
        amuletName.removeAttribute('style');
        amuletName.className = '';
        amuletSlot.setAttribute('data-tooltip', 'Boss drops the Amulet');
		amuletSlot.classList.remove('equipped');
        return;
    }

    const asc = Math.max(1, gameState.ascensionLevel + 1);
    const classes = [
        { name: 'Acolyte',      instance: new Acolyte(),      achievementKey: 'Sorceress Master' },
        { name: 'Sorceress',    instance: new Sorceress(),    achievementKey: 'Divine Knight Master' },
        { name: 'Divine Knight',instance: new DivineKnight(), achievementKey: 'Acolyte Master' },
    ];

    const lines = classes.map(({ name, instance, achievementKey }) => {
        let dmg = instance.amuletDamage * asc;
        if (gameState.unlockedAchievements[achievementKey])
            dmg += achievements[achievementKey].amuletDamageIncrease;
        const bossDmg = (instance.bossDamageBonus * 100 * asc).toFixed(0);
        return `${name}:\nDamage +${dmg.toFixed(1)}\nBoss Damage +${bossDmg}%`;
    });

    const amuImgIndex = Math.min(gameState.ascensionLevel + 1, 4);
    amuletSlot.innerHTML = `<img src="img/amuE${amuImgIndex}.png" alt="Amulet" class="amulet-icon">`;
    const amuletNames = ['Magic Amulet', 'Corrupted Amulet', 'Void Corrupted Amulet', 'Demonic Corrupted Amulet'];
    amuletName.textContent = amuletNames[Math.min(gameState.ascensionLevel, 3)];
    amuletSlot.setAttribute('data-tooltip', lines.join('\n\n'));
    const nameColors = ['#00bfff', '#FFD700', '#bf00ff', '#ff2020'];
    const ascClamped = Math.min(gameState.ascensionLevel, 3);
    amuletSlot.classList.add('equipped');
    amuletSlot.dataset.asc = ascClamped;
    amuletName.removeAttribute('style');
    amuletName.className = `amulet-name-asc-${ascClamped}`;
}

const achievements = {
    'Beat Stage 2':       { description: 'Stage 3 reached',              condition: () => gameState.highestStageReached >= 3 },
    'Beat Stage 4':       { description: 'Stage 5 reached',              condition: () => gameState.highestStageReached >= 5 },
    'Beat Stage 6':       { description: 'Stage 7 reached',              condition: () => gameState.highestStageReached >= 7 },
    'Ascension':          { description: 'And so it begins...',           condition: () => gameState.ascensionLevel >= 1 },
    'Ascend Novice':      { description: 'Ascend 3 Times',               condition: () => gameState.ascensionLevel >= 3 },
    'Acolyte Master':     { description: 'Divine Knight Base Amulet Damage +1', condition: () => (gameState.highestStagePerClass['Acolyte'] || 1) >= 6,      amuletDamageIncrease: 1, affectedClass: 'Divine Knight' },
    'Sorceress Master':   { description: 'Acolyte Base Amulet Damage +3',      condition: () => (gameState.highestStagePerClass['Sorceress'] || 1) >= 7,    amuletDamageIncrease: 3, affectedClass: 'Acolyte' },
    'Divine Knight Master':{ description: 'Sorceress Base Amulet Damage +2',   condition: () => (gameState.highestStagePerClass['Divine Knight'] || 1) >= 8, amuletDamageIncrease: 2, affectedClass: 'Sorceress' },
};

function createAchievementsMenu() {
    const list = document.getElementById('achievements-list');
    list.innerHTML = Object.entries(achievements).map(([key, val]) => {
        const unlocked = gameState.unlockedAchievements[key];
        return `<div class="achievement ${unlocked ? 'unlocked' : ''}" title="${unlocked ? val.description : 'Achievement locked'}">${unlocked ? key : '???'}</div>`;
    }).join('');
}

function checkAchievements() {
    Object.entries(achievements).forEach(([key, val]) => {
        if (!gameState.unlockedAchievements[key] && val.condition()) {
            unlockAchievement(key);
            val.effect?.();
        }
    });
}

function unlockAchievement(key) {
    if (gameState.unlockedAchievements[key]) return;
    gameState.unlockedAchievements[key] = true;
    saveGameState();
    showAchievementPopup(key);
    createAchievementsMenu();
    updateInventoryUI();
}

function showAchievementPopup(key) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.textContent = `Achievement: ${key}`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

function ensureActionsPanel() {
    let panel = document.getElementById('actions-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'actions-panel';
        
        const hardReset = document.getElementById('hard-reset-btn');
        if (hardReset) {
            hardReset.parentNode.insertBefore(panel, hardReset);
            panel.appendChild(hardReset);
        } else {
            document.body.appendChild(panel);
        }
    }
    return panel;
}

function createAchievementsButton() {
    if (document.getElementById('achievements-button')) return;
    const btn = document.createElement('button');
    btn.id = 'achievements-button';
    btn.textContent = 'Achievements';
    const menu = document.getElementById('achievements-menu');
    btn.addEventListener('click', () => { menu.style.display = 'block'; });
    menu.querySelector('.close-btn').addEventListener('click', () => { menu.style.display = 'none'; });
    ensureActionsPanel().appendChild(btn);
}

function flashScreen(color) {
    const gameArea = document.getElementById('game-area');
    const flash = () => {
        gameArea.style.backgroundColor = color;
        setTimeout(() => { gameArea.style.backgroundColor = ''; }, 100);
    };
    flash();
    setTimeout(flash, 200);
}

const LB_KEY = 'rpgLeaderboard';
const LB_MAX = 3;

const LB_WEAPON_KEYS = {
    
    'Vortex Staff':   'vortex',
    'Umbral Staff':   'umbral',
    'Chain Wand':     'chain',
    'Spark Wand':     'spark',
    'Blessed Shield': 'blessed',
    'Smite Shield':   'smite',
    
    'Basic Staff':    'basic_staff',
    'Basic Wand':     'basic_wand',
    'Basic Shield':   'basic_shield',
};

const LB_WEAPON_NAMES = {
    vortex:  'Vortex Staff',
    umbral:  'Umbral Staff',
    chain:   'Chain Wand',
    spark:   'Spark Wand',
    blessed: 'Blessed Shield',
    smite:   'Smite Shield',
};

function loadLeaderboard() {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || {}; }
    catch { return {}; }
}

function saveLeaderboard(lb) {
    localStorage.setItem(LB_KEY, JSON.stringify(lb));
}

function clearLeaderboard() {
    localStorage.removeItem(LB_KEY);
}

function getActiveVowAbbrs(playerClass) {
    const vowNodes = playerClass === 'Acolyte'       ? NODES.filter(n => n.bvow)
                   : playerClass === 'Sorceress'     ? SORC_NODES.filter(n => n.bvow)
                   : playerClass === 'Divine Knight' ? DK_NODES.filter(n => n.bvow)
                   : [];
    const allocObj = playerClass === 'Acolyte'       ? alloc
                   : playerClass === 'Sorceress'     ? sorcAlloc
                   : playerClass === 'Divine Knight' ? dkAlloc
                   : {};
    return vowNodes.filter(n => (allocObj[n.id] || 0) >= 1).map(n => n.abbr);
}

function recordLeaderboardEntry(stage, wave, level, weaponName, classUpgrade, playerClass, vows = []) {
    const weapKey = LB_WEAPON_KEYS[weaponName];
    if (!weapKey) return; 

    const lb  = loadLeaderboard();
    const key = `${playerClass}_${weapKey}`;

    if (!lb[key]) lb[key] = [];

    const entry = { stage, wave, level, evo: classUpgrade || '', vows };

    lb[key].push(entry);
    lb[key].sort((a, b) => b.stage !== a.stage ? b.stage - a.stage : b.wave - a.wave);
    lb[key] = lb[key].slice(0, LB_MAX);

    saveLeaderboard(lb);
}

function lbRankLabel(i) {
    if (i === 0) return '<span class="lb-rank lb-gold">①</span>';
    if (i === 1) return '<span class="lb-rank lb-silver">②</span>';
    if (i === 2) return '<span class="lb-rank lb-bronze">③</span>';
    return `<span class="lb-rank">${i + 1}</span>`;
}

function lbRenderList(containerId, entries, colorClass) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!entries || !entries.length) {
        el.innerHTML = '<div class="lb-empty">No runs recorded yet</div>';
        return;
    }
    
    const baseClass = colorClass === 'lb-acolyte-col' ? 'Acolyte'
                    : colorClass === 'lb-sorc-col'    ? 'Sorceress'
                    : 'Divine Knight';
    el.innerHTML = entries.slice(0, LB_MAX).map((e, i) => {
        
        const displayName = e.evo ? `${e.evo} ${baseClass}` : baseClass;
        const vows = (e.vows && e.vows.length)
            ? e.vows.map(v => `<span class="lb-vow-tag">${v}</span>`).join('')
            : '<span class="lb-vow-tag lb-vow-none">—</span>';
        return `<div class="lb-entry-row">
            ${lbRankLabel(i)}
            <div class="lb-entry-name ${colorClass}">${displayName}</div>
            <div class="lb-entry-lvl">${e.level}</div>
            <div class="lb-entry-stage">
                <span class="lb-stage-num">Stage ${e.stage}</span>
                <span class="lb-wave-sep">/</span>
                <span class="lb-wave-num">Wave ${e.wave}</span>
            </div>
            <div class="lb-entry-vows">${vows}</div>
        </div>`;
    }).join('');
}

function lbBuildWeaponSection(weapKey, weaponDisplayName, containerId, colorClass) {
    return `
        <div class="lb-weapon-section">
            <div class="lb-weapon-header">
                <div class="lb-weapon-name">${weaponDisplayName}</div>
            </div>
            <div class="lb-col-headers">
                <div class="lb-col-hdr lb-center">#</div>
                <div class="lb-col-hdr">Name</div>
                <div class="lb-col-hdr lb-center">Lvl</div>
                <div class="lb-col-hdr">Stage / Wave</div>
                <div class="lb-col-hdr lb-right lb-vows-col">Vows</div>
            </div>
            <div class="lb-entry-list" id="${containerId}"></div>
        </div>`;
}

function renderLeaderboardModal() {
    const lb = loadLeaderboard();

    function buildPanel(panelId, accentClass, sections) {
        let html = `<div class="lb-accent-strip ${accentClass}"></div>`;
        const lists = [];
        for (const { lbKey, displayName, listId, colorClass } of sections) {
            const entries = lb[lbKey] || [];
            
            const isBasic = lbKey.includes('basic');
            if (isBasic && !entries.length) continue;
            html += lbBuildWeaponSection(lbKey, displayName, listId, colorClass);
            lists.push({ listId, entries, colorClass });
        }
        document.getElementById(panelId).innerHTML = html;
        for (const { listId, entries, colorClass } of lists) {
            lbRenderList(listId, entries, colorClass);
        }
    }

    buildPanel('lb-panel-acolyte', 'lb-accent-acolyte', [
        { lbKey: 'Acolyte_vortex',      displayName: 'Vortex Staff',          listId: 'lb-list-vortex',       colorClass: 'lb-acolyte-col' },
        { lbKey: 'Acolyte_umbral',       displayName: 'Umbral Staff',          listId: 'lb-list-umbral',       colorClass: 'lb-acolyte-col' },
        { lbKey: 'Acolyte_basic_staff',  displayName: 'Basic Staff', listId: 'lb-list-basic-staff',  colorClass: 'lb-acolyte-col' },
    ]);

    buildPanel('lb-panel-sorceress', 'lb-accent-sorc', [
        { lbKey: 'Sorceress_chain',      displayName: 'Chain Wand',            listId: 'lb-list-chain',        colorClass: 'lb-sorc-col' },
        { lbKey: 'Sorceress_spark',      displayName: 'Spark Wand',            listId: 'lb-list-spark',        colorClass: 'lb-sorc-col' },
        { lbKey: 'Sorceress_basic_wand', displayName: 'Basic Wand',  listId: 'lb-list-basic-wand',   colorClass: 'lb-sorc-col' },
    ]);

    buildPanel('lb-panel-divine', 'lb-accent-divine', [
        { lbKey: 'Divine Knight_blessed',       displayName: 'Blessed Shield',          listId: 'lb-list-blessed',       colorClass: 'lb-divine-col' },
        { lbKey: 'Divine Knight_smite',         displayName: 'Smite Shield',            listId: 'lb-list-smite',         colorClass: 'lb-divine-col' },
        { lbKey: 'Divine Knight_basic_shield',  displayName: 'Basic Shield',  listId: 'lb-list-basic-shield',  colorClass: 'lb-divine-col' },
    ]);
}

function lbSwitchTab(cls) {
    document.querySelectorAll('.lb-panel').forEach(p => p.classList.remove('lb-active'));
    document.querySelectorAll('.lb-tab-btn').forEach(b => b.classList.remove('lb-tab-active'));
    const panel = document.getElementById('lb-panel-' + cls);
    const btn   = document.getElementById('lb-tab-' + cls);
    if (panel) panel.classList.add('lb-active');
    if (btn)   btn.classList.add('lb-tab-active');
}

function getSoundEnabled() {
    return localStorage.getItem('soundEnabled') !== 'false';
}

function setSoundEnabled(val) {
    localStorage.setItem('soundEnabled', val ? 'true' : 'false');
    applyGlobalSound(val);
}

function applyGlobalSound(enabled) {
    document.querySelectorAll('audio').forEach(a => { a.muted = !enabled; });
}

function openLeaderboard() {
    renderLeaderboardModal();
    lbSwitchTab('acolyte');
    document.getElementById('leaderboard-menu').style.display = 'flex';
    updateSoundToggleBtn();
}

function createSoundButton() {
    if (document.getElementById('sound-toggle-button')) return;
    const btn = document.createElement('button');
    btn.id = 'sound-toggle-button';
    btn.addEventListener('click', () => {
        setSoundEnabled(!getSoundEnabled());
        updateSoundToggleBtn();
    });
    ensureActionsPanel().appendChild(btn);
    updateSoundToggleBtn();
}

function updateSoundToggleBtn() {
    const on = getSoundEnabled();
    const btn = document.getElementById('sound-toggle-button');
    if (btn) {
        btn.textContent = on ? 'Sound: ON' : 'Sound: OFF';
        btn.classList.toggle('lb-sound-off', !on);
    }
    const lbBtn = document.getElementById('lb-sound-toggle');
    if (lbBtn) {
        lbBtn.textContent = on ? 'Sound: ON' : 'Sound: OFF';
        lbBtn.classList.toggle('lb-sound-off', !on);
    }
}

function closeLeaderboard() {
    document.getElementById('leaderboard-menu').style.display = 'none';
}

function createLeaderboardButton() {
    if (document.getElementById('leaderboard-button')) return;
    const btn = document.createElement('button');
    btn.id = 'leaderboard-button';
    btn.textContent = 'Leaderboard';
    btn.addEventListener('click', openLeaderboard);

    const closeBtn = document.getElementById('lb-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeLeaderboard);

    ensureActionsPanel().appendChild(btn);
}