function initializeUI() {

    document.getElementById('ability-button')?.addEventListener('click', () => {
        player?.weapon?.useAbility();
    });

    document.getElementById('debug-skip-wave').addEventListener('click', skipWave);

    updateUI();
    createQoLMenu();
    createInventoryMenu();
    createAchievementsMenu();
    createAchievementsButton();
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
    const critCapped = crit >= 1;
    const critText = critCapped ? '100% CAP' : `${(crit * 100).toFixed(1)}%`;
    const critStyle = critCapped ? 'color:#4A6741' : player.critChance < 0 ? 'color:#DC143C' : '';

    const critDmgPct = player.critDamage * 100 - 100;
    const critDmgStyle = critDmgPct < 0 ? 'color:#DC143C' : '';

    const classColor = player.classColor || '#FFD700';

    const stat = (name, value, style = '') =>
        `<div><span class="stat-name">${name}:</span> <span class="stat-value"${style ? ` style="${style}"` : ''}>${value}</span></div>`;

    let html = `
        <h3 style="color:${classColor};">${player.getDisplayName()}</h3>
        ${stat('Level', player.level)}
        ${stat('Exp', `${player.exp.toFixed(0)} / ${player.expToNextLevel.toFixed(0)}`)}
        ${stat('Souls', player.currentRunSouls)}
        <div class="stat-row divider"><span class="stat-name">HP:</span> <span class="stat-value">${player.hp.toFixed(1)} / ${player.maxHp.toFixed(1)}</span></div>
        ${stat('HP Regen', `${player.hpRegen.toFixed(2)}/s`)}
        <div class="stat-row weapon-stat"><span class="stat-name">Weapon:</span> <span class="stat-value">${w.name}</span></div>
        ${stat('Damage', w.chainCount !== undefined && w.chainCount > 0
            ? `${w.damage.toFixed(1)} +${w.chainCount} chains`
            : w.damage.toFixed(1))}
        ${stat('Range', rangeText)}
        ${stat('Attacks/Sec', (w.getAttackSpeed ? w.getAttackSpeed() : player.attacksPerSecond).toFixed(2))}
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
    btn.textContent = text;
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
            <p>Soul gain multiplier: x${SOUL_MULTIPLIERS[gameState.ascensionLevel + 1] ?? SOUL_MULTIPLIERS.at(-1)}</p>
            <p>${maxUpgradesText}</p>
            <p>${unlockText}</p>
            <p>${qolUnlockText}</p>
            <p>Talent points and talent tree are reset.</p>
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

    // Wire up toggles
    const wire = (id, stateKey, onChange) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.checked = gameState[stateKey] || false;
        onChange?.(el.checked);  // sync initial UI state
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
        amuletName.textContent = 'Amulet slot';
        amuletName.style.color = 'white';
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

    amuletSlot.innerHTML = '<img src="img/neck.png" alt="Amulet" class="amulet-icon">';
    amuletName.textContent = 'Magic Amulet';
    amuletSlot.setAttribute('data-tooltip', lines.join('\n\n'));
    const nameColors = ['#00bfff', '#FFD700', '#bf00ff', '#ff2020'];
    const ascClamped = Math.min(gameState.ascensionLevel, 3);
    amuletSlot.classList.add('equipped');
    amuletSlot.dataset.asc = ascClamped;
    amuletName.style.color = nameColors[ascClamped];
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

function createAchievementsButton() {
    if (document.getElementById('achievements-button')) return;
    const btn = document.createElement('button');
    btn.id = 'achievements-button';
    btn.textContent = 'Achievements';
    const menu = document.getElementById('achievements-menu');
    btn.addEventListener('click', () => { menu.style.display = 'block'; });
    menu.querySelector('.close-btn').addEventListener('click', () => { menu.style.display = 'none'; });
    const hardReset = document.getElementById('hard-reset-btn');
    hardReset.parentNode.insertBefore(btn, hardReset);
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