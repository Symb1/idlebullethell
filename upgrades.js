// --- Helpers ---

function getRarityValue(rarity, legendary, epic, magic, normal) {
    return (rarity === 'Legendary' || rarity === 'Epic') ? legendary : (rarity === 'Magic' ? magic : normal);
}

function applySecondary(rarity, secondaryUpgrade, secondaryRarity) {
    if (rarity === 'Legendary' && secondaryUpgrade) {
        secondaryUpgrade.effect(secondaryRarity);
    }
}

// --- Upgrades ---

const upgrades = [
    {
        name: 'Damage Increase',
        _val: (rarity) => getRarityValue(rarity, 0.25, 0.25, 0.12, 0.08),
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            player.damageModifier *= (1 + this._val(rarity));
            player.weapon?.updateDamage();
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `x${(this._val(rarity) * 100).toFixed(0)}%`; },
        description: 'Multiplicative damage increase'
    },
    {
        name: 'Attack Speed',
        _val: (rarity) => getRarityValue(rarity, 0.25, 0.25, 0.15, 0.10),
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            player.attacksPerSecond += this._val(rarity);
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `+${(this._val(rarity) * 100).toFixed(0)}%`; },
        description: 'Additive attack speed increase'
    },
    {
        name: 'Health',
        _val: (rarity) => getRarityValue(rarity, 2.0, 2.0, 1.5, 1.0),
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            const v = this._val(rarity);
            player.maxHp += v;
            player.heal(v);
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `+${this._val(rarity).toFixed(1)}`; },
        description: 'Additive health increase'
    },
    {
        name: 'Regeneration',
        _val: (rarity) => getRarityValue(rarity, 0.1, 0.1, 0.05, 0.02),
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            player.hpRegen += this._val(rarity);
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `+${this._val(rarity).toFixed(2)}/s`; },
        description: 'Additive regeneration increase'
    },
    {
        name: 'Cooldown Reduction',
        _val: (rarity) => getRarityValue(rarity, 0.15, 0.15, 0.10, 0.05),
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            player.adjustCooldownReduction(this._val(rarity));
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `+${(this._val(rarity) * 100).toFixed(0)}%`; },
        description: 'Additive cooldown reduction'
    },
    {
        name: 'Critical Damage Increase',
        _val: (rarity) => getRarityValue(rarity, 0.40, 0.40, 0.25, 0.15),
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            player.critDamage += this._val(rarity);
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `+${(this._val(rarity) * 100).toFixed(0)}%`; },
        description: 'Additive critical damage increase'
    },
    {
        name: 'Critical Strike Chance',
        _val: (rarity) => rarity === 'Legendary' ? 0.03 : rarity === 'Epic' ? 0.03 : rarity === 'Magic' ? 0.02 : 0.01,
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            player.adjustCritChance(this._val(rarity));
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `+${(this._val(rarity) * 100).toFixed(1)}%`; },
        condition: () => !(player instanceof DivineKnight) || player.critUpgradesEnabled,
        description: 'Additive critical strike chance'
    },
    {
        name: 'Boss Damage',
        _val: (rarity) => getRarityValue(rarity, 0.50, 0.50, 0.25, 0.10),
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            player.additionalBossDamage = (player.additionalBossDamage || 0) + this._val(rarity);
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) { return `+${(this._val(rarity) * 100).toFixed(0)}%`; },
        description: 'Additive boss damage increase'
    },
];

// --- Rarity Roll ---

function getRarity() {
    const rarityUpgrade = soulsUpgrades.find(u => u.name === 'Rarity+');
    const rarityBonus = (gameState.rarityUpgrades || 0) * rarityUpgrade.valuePerUpgrade;
    const roll = Math.random();
    if (roll < 0.01 + rarityBonus * 0.5) return 'Legendary';
    if (roll < 0.11 + rarityBonus)        return 'Epic';
    if (roll < 0.41 + rarityBonus * 2)    return 'Magic';
    return 'Normal';
}

// --- Random Upgrades ---

function getRandomUpgrades(count) {
    if (player.level === 10) {
        showWeaponEvolutionScreen();
        return [];
    }

    if (player.level === 20 && !gameState.classUpgradeChosen) {
        const shuffled = [...classUpgrades[player.class]].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(u => ({ ...u, isClassUpgrade: true }));
    }

    const availableUpgrades = upgrades.filter(u => {
        if (u.name === 'Boss Damage' && !gameState.amuletEquipped) return false;
        return !u.condition || u.condition();
    });

    const shuffled = [...availableUpgrades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(upgrade => {
        const rarity = getRarity();
        const result = { ...upgrade, rarity };
        if (rarity === 'Legendary') {
            const secondaryOptions = availableUpgrades.filter(u => u.name !== upgrade.name);
            result.secondaryUpgrade = secondaryOptions[Math.floor(Math.random() * secondaryOptions.length)];
            result.secondaryRarity = 'Magic';
        }
        return result;
    });
}

// --- Class Upgrades ---

function classEffect(player, gameState, stats) {
    if (stats.attackSpeedIncrease)  player.attacksPerSecond += stats.attackSpeedIncrease;
    if (stats.attackSpeedDecrease)  player.attacksPerSecond -= stats.attackSpeedDecrease;
    if (stats.critChanceIncrease)   player.adjustCritChance(stats.critChanceIncrease);
    if (stats.critChanceDecrease)   player.adjustCritChance(-stats.critChanceDecrease);
    if (stats.critDamageIncrease)   player.critDamage += stats.critDamageIncrease;
    if (stats.critDamageDecrease)   player.critDamage -= stats.critDamageDecrease;
    if (stats.cooldownReduction)    player.adjustCooldownReduction(stats.cooldownReduction);
    if (stats.cooldownIncrease)     player.adjustCooldownReduction(-stats.cooldownIncrease);
    if (stats.damageLoss && player.weapon) player.weapon.damage *= (1 - stats.damageLoss);
    if (stats.damageIncrease && player.weapon) player.weapon.damage *= (1 + stats.damageIncrease);
    if (stats.healthIncrease)       { player.hp += stats.healthIncrease; player.maxHp += stats.healthIncrease; }
    player.classUpgradeChosen = stats.shardName;
    gameState.classUpgradeChosen = stats.shardName;
    saveGameState();
}

function pct(val) { return (val * 100).toFixed(0); }

function classDesc(flavorText, positives, negatives) {
    const pos = positives.map(s => `<div class="stat-positive">${s}</div>`).join('');
    const neg = negatives.map(s => `<div class="stat-negative">${s}</div>`).join('');
    return `<div class="upgrade-flavor">${flavorText}</div>${pos}${neg}`;
}

const classUpgrades = {
    Acolyte: [
        {
            name: 'Ravenous Shard', shardName: 'Ravenous',
            flavorText: 'The Void devours hesitation, you strike with insatiable speed, yet each blow loses its edge.',
            attackSpeedIncrease: 0.45, critChanceDecrease: 0.05, cooldownIncrease: 0.3,
            effect() {
                const reRanks = (typeof alloc !== 'undefined' ? alloc['ravenous_excellence'] : 0) || 0;
                // Each rank reduces crit chance penalty by 1% and cooldown penalty by 6%; ranks 6-10 add bonus
                const critNegated   = Math.min(reRanks, 5) * 0.01;
                const cdNegated     = Math.min(reRanks, 5) * 0.06;
                const bonusCrit     = Math.max(0, reRanks - 5) * 0.01;
                const bonusCdRedux  = Math.max(0, reRanks - 5) * 0.06;
                const stats = Object.assign({}, this, {
                    critChanceDecrease: Math.max(0, this.critChanceDecrease - critNegated) - bonusCrit,
                    cooldownIncrease:   Math.max(0, this.cooldownIncrease   - cdNegated)   - bonusCdRedux,
                });
                classEffect(player, gameState, stats);
            },
            description() {
                const reRanks = (typeof alloc !== 'undefined' ? alloc['ravenous_excellence'] : 0) || 0;
                const critNegated  = Math.min(reRanks, 5) * 0.01;
                const cdNegated    = Math.min(reRanks, 5) * 0.06;
                const bonusCrit    = Math.max(0, reRanks - 5) * 0.01;
                const bonusCd      = Math.max(0, reRanks - 5) * 0.06;
                const effCrit = Math.max(0, this.critChanceDecrease - critNegated) - bonusCrit;
                const effCd   = Math.max(0, this.cooldownIncrease   - cdNegated)   - bonusCd;
                const critLine = effCrit > 0 ? `Crit Chance -${pct(effCrit)}%` : effCrit < 0 ? `Crit Chance +${pct(-effCrit)}%` : '';
                const cdLine   = effCd   > 0 ? `Cooldown +${pct(effCd)}%`     : effCd   < 0 ? `Cooldown -${pct(-effCd)}%`     : '';
                return classDesc(this.flavorText,
                    [`Attack Speed +${pct(this.attackSpeedIncrease)}%`],
                    [critLine, cdLine].filter(Boolean));
            }
        },
        {
            name: 'Temporal Shard', shardName: 'Temporal',
            flavorText: 'Moments collapse into one another, you act faster than the world can breathe.',
            damageLoss: 0.25, cooldownReduction: 0.5,
            effect() {
                const teRanks = (typeof alloc !== 'undefined' ? alloc['temporal_excellence'] : 0) || 0;
                // Each rank negates 5% of 25% damage penalty; ranks 6-10 grant bonus damage
                const penaltyNegated = Math.min(teRanks, 5) * 0.05;
                const bonusDamage    = Math.max(0, teRanks - 5) * 0.05;
                const effectiveLoss  = Math.max(0, this.damageLoss - penaltyNegated) - bonusDamage;
                const stats = Object.assign({}, this, { damageLoss: Math.max(0, effectiveLoss), damageIncrease: effectiveLoss < 0 ? -effectiveLoss : 0 });
                classEffect(player, gameState, stats);
            },
            description() {
                const teRanks = (typeof alloc !== 'undefined' ? alloc['temporal_excellence'] : 0) || 0;
                const penaltyNegated = Math.min(teRanks, 5) * 0.05;
                const bonusDamage    = Math.max(0, teRanks - 5) * 0.05;
                const effectiveLoss  = this.damageLoss - penaltyNegated - bonusDamage;
                const dmgLine = effectiveLoss > 0
                    ? `Damage -${pct(effectiveLoss)}%`
                    : effectiveLoss < 0 ? `Damage +${pct(-effectiveLoss)}%` : '';
                return classDesc(this.flavorText,
                    [`Cooldown -${pct(this.cooldownReduction)}%`],
                    [dmgLine].filter(Boolean));
            }
        },
        {
            name: 'Abyssal Shard', shardName: 'Abyssal',
            flavorText: 'The Abyss teaches patience, each strike slow and deliberate, carrying ruin in its wake.',
            critDamageIncrease: 0.5, critChanceIncrease: 0.10, attackSpeedDecrease: 0.3,
            effect() {
                const aeRanks = (typeof alloc !== 'undefined' ? alloc['abyssal_excellence'] : 0) || 0;
                // Each rank negates 6% of 30% attack speed penalty; ranks 6-10 grant bonus speed
                const penaltyNegated = Math.min(aeRanks, 5) * 0.06;
                const bonusSpeed     = Math.max(0, aeRanks - 5) * 0.06;
                const effectiveLoss  = Math.max(0, this.attackSpeedDecrease - penaltyNegated) - bonusSpeed;
                const stats = Object.assign({}, this, {
                    attackSpeedDecrease: Math.max(0, effectiveLoss),
                    attackSpeedIncrease: (this.attackSpeedIncrease || 0) + (effectiveLoss < 0 ? -effectiveLoss : 0)
                });
                classEffect(player, gameState, stats);
            },
            description() {
                const aeRanks = (typeof alloc !== 'undefined' ? alloc['abyssal_excellence'] : 0) || 0;
                const penaltyNegated = Math.min(aeRanks, 5) * 0.06;
                const bonusSpeed     = Math.max(0, aeRanks - 5) * 0.06;
                const effectiveLoss  = this.attackSpeedDecrease - penaltyNegated - bonusSpeed;
                const speedLine = effectiveLoss > 0
                    ? `Attack Speed -${pct(effectiveLoss)}%`
                    : effectiveLoss < 0 ? `Attack Speed +${pct(-effectiveLoss)}%` : '';
                return classDesc(this.flavorText,
                    [`Crit Damage +${pct(this.critDamageIncrease)}%`, `Crit Chance +${pct(this.critChanceIncrease)}%`],
                    [speedLine].filter(Boolean));
            }
        }
    ],
    Sorceress: [
        {
            name: 'Stormheart Crystal', shardName: 'Stormheart',
            flavorText: "In storm's rhythm, spells erupt in a torrent of energy, but control slips away with every surge.",
            attackSpeedIncrease: 0.5, critChanceDecrease: 0.15,
            effect() { classEffect(player, gameState, this); },
            description() {
                return classDesc(this.flavorText,
                    [`Attack Speed +${pct(this.attackSpeedIncrease)}%`],
                    [`Crit Chance -${pct(this.critChanceDecrease)}%`]);
            }
        },
        {
            name: "Spellweaver's Sigil", shardName: "Spellweaver's",
            flavorText: "Each strike finds its mark, though the storm's fury wanes in precision.",
            critChanceIncrease: 0.2, critDamageDecrease: 0.5,
            effect() { classEffect(player, gameState, this); },
            description() {
                return classDesc(this.flavorText,
                    [`Crit Chance +${pct(this.critChanceIncrease)}%`],
                    [`Crit Damage -${pct(this.critDamageDecrease)}%`]);
            }
        },
        {
            name: 'Nexus Crystal', shardName: 'Nexus',
            flavorText: 'At the center of the arcane current, strikes resonate with devastating precision, though the tempo slows.',
            attackSpeedDecrease: 0.35, chainCountBonus: 1,
            effect() {
                player.attacksPerSecond -= this.attackSpeedDecrease;
                if (player.weapon?.chainDamageMultiplier !== undefined) player.weapon.chainDamageMultiplier = 0.90;
                if (player.weapon?.chainCount !== undefined) player.weapon.chainCount += this.chainCountBonus;
                player.classUpgradeChosen = this.shardName;
                gameState.classUpgradeChosen = this.shardName;
                saveGameState();
            },
            description() {
                return classDesc(this.flavorText,
                    ['Chains: +1 target', 'Chain Damage +5%'],
                    [`Attack Speed -${pct(this.attackSpeedDecrease)}%`]);
            }
        }
    ],
    'Divine Knight': [
        {
            name: 'Vigilant Crest', shardName: 'Vigilant',
            flavorText: 'The Light quickens your resolve, you strike swiftly and endlessly, though each blow carries less might.',
            attackSpeedIncrease: 1.25, damageLoss: 0.25,
            effect() { classEffect(player, gameState, this); },
            description() {
                return classDesc(this.flavorText,
                    [`Attack Speed +${pct(this.attackSpeedIncrease)}%`],
                    [`Damage -${pct(this.damageLoss)}%`]);
            }
        },
        {
            name: 'Sanctified Oath', shardName: 'Sanctified',
            flavorText: 'Divine judgment sharpens your strikes, but the weight of faith slows your hand.',
            damageLoss: 0.1, attackSpeedDecrease: 0.15, cooldownIncrease: 0.15, enablesCritUpgrades: true,
            effect() {
                classEffect(player, gameState, this);
                player.critUpgradesEnabled = true;
                gameState.critUpgradesEnabled = true;
                const retro = (gameState.critChanceUpgrades || 0) * 0.01;
                if (retro > 0) player.adjustCritChance(retro);
            },
            description() {
                return classDesc(this.flavorText,
                    ['Enables Crit Globally'],
                    [`Damage -${pct(this.damageLoss)}%`, `Attack Speed -${pct(this.attackSpeedDecrease)}%`, `Cooldown +${pct(this.cooldownIncrease)}%`]);
            }
        },
        {
            name: 'Eternal Bastion', shardName: 'Eternal',
            flavorText: 'The eternal flame dwells within you — your form unyielding, your strength resounding through ages.',
            healthIncrease: 10, damageIncrease: 0.25, cooldownIncrease: 1.0,
            effect() { classEffect(player, gameState, this); },
            description() {
                return classDesc(this.flavorText,
                    [`Health +${this.healthIncrease}`, `Damage +${pct(this.damageIncrease)}%`],
                    [`Cooldown +${pct(this.cooldownIncrease)}%`]);
            }
        }
    ]
};

// --- Level Up Screen ---

function showLevelUpScreen() {
    gameState.isPaused = true;

    const levelUpAudio = document.getElementById('levelupmu');
    if (levelUpAudio) {
        levelUpAudio.currentTime = 0;
        levelUpAudio.volume = 0.2;
        levelUpAudio.play().catch(() => {});
    }

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
    const isAutoClass = gameState.autoClassEnabled && availableUpgrades[0]?.isClassUpgrade;
    const isAutoCard  = gameState.autoCardEnabled  && !availableUpgrades[0]?.isClassUpgrade;

    availableUpgrades.forEach((upgrade, index) => {
        const card = document.createElement('div');
        const playerClassLower = player.class.toLowerCase().replace(/\s+/g, '-');

        card.className = upgrade.isClassUpgrade
            ? `upgrade-card class-upgrade ${playerClassLower}-upgrade`
            : `upgrade-card ${upgrade.rarity.toLowerCase()}`;
        card.dataset.index = index;

        if (upgrade.isClassUpgrade) {
            card.innerHTML = `
                <div class="upgrade-rarity-label">Class Upgrade</div>
                <hr>
                <div class="upgrade-name">${upgrade.name}</div>
                <hr>
                <div class="upgrade-description">${upgrade.description.call(upgrade)}</div>`;
        } else {
            const divider = `<div style="padding:10px 0;border-top:2px solid #8B7355;border-image:linear-gradient(90deg,transparent,#D4AF37,transparent) 1;margin-top:auto;"></div>`;
            const secondary = (upgrade.rarity === 'Legendary' && upgrade.secondaryUpgrade)
                ? `${divider}
                   <div style="font-size:14px;color:#D4AF37;margin-top:8px;font-style:italic;text-align:center;">${upgrade.secondaryUpgrade.name}</div>
                   <div class="upgrade-value" style="font-size:18px;color:#87CEEB;margin-top:5px;">${upgrade.secondaryUpgrade.getValue(upgrade.secondaryRarity)}</div>`
                : `${divider}<div class="upgrade-description">${upgrade.description || ''}</div>`;

            card.innerHTML = `
                <div class="upgrade-rarity-label">Rarity</div>
                <div class="upgrade-rarity">${upgrade.rarity}</div>
                <hr>
                <div class="upgrade-name">${upgrade.name}</div>
                <hr>
                <div class="upgrade-value">${upgrade.getValue(upgrade.rarity)}</div>
                ${secondary}`;
        }

        const autoDisabled = upgrade.isClassUpgrade ? isAutoClass : isAutoCard;
        if (autoDisabled) {
            card.classList.add('disabled');
        } else {
            card.addEventListener('click', () => selectUpgrade(upgrade, index));
        }

        upgradeOptions.appendChild(card);
    });

    levelUpScreen.style.display = 'flex';

    if (isAutoClass) {
        const auto = selectAutoClassUpgrade(availableUpgrades);
        _scheduleAutoSelect(upgradeOptions, availableUpgrades, auto);
    } else if (isAutoCard) {
        const priority = gameState.upgradePriority || DEFAULT_UPGRADE_PRIORITY;
        const auto = priority.reduce((found, name) => found || availableUpgrades.find(u => u.name === name), null) || availableUpgrades[0];
        _scheduleAutoSelect(upgradeOptions, availableUpgrades, auto);
    }
}

function _scheduleAutoSelect(container, upgrades, upgrade) {
    const idx = upgrades.indexOf(upgrade);
    const card = container.querySelector(`[data-index="${idx}"]`);
    if (card) {
        card.classList.add('auto-select-glow2');
        setTimeout(() => selectUpgrade(upgrade, idx), 3000);
    }
}

function selectAutoClassUpgrade(availableUpgrades) {
    const autoChoice = gameState.autoClassChoices?.[player.class];
    return (autoChoice && availableUpgrades.find(u => u.name === autoChoice)) || availableUpgrades[0];
}

function selectUpgrade(upgrade, index) {
    upgrade.isClassUpgrade
        ? upgrade.effect()
        : upgrade.effect(upgrade.rarity, upgrade.secondaryUpgrade, upgrade.secondaryRarity);
    hideLevelUpScreen();
    processNextLevelUp();
}

function hideLevelUpScreen() {
    const s = document.getElementById('level-up');
    if (s) s.style.display = 'none';
}

// --- Soul Upgrades Cost ---

function calculateSoulUpgradeCost(baseCost, currentLevel) {
    let cost = baseCost;
    for (let i = 1; i <= currentLevel; i++) {
        cost *= i <= 5 ? 1.75 : i <= 10 ? 1.35 : i <= 15 ? 1.25 : 1.15;
    }
    return Math.floor(cost);
}

// --- Soul Upgrades ---

function _ascMaxPurchases(gameState, base = 5) {
    const a = Math.min(gameState.ascensionLevel || 0, ASCENSION_MAX_PURCHASES.length - 1);
    return base * (ASCENSION_MAX_PURCHASES[a] / ASCENSION_MAX_PURCHASES[0]);
}

const soulsUpgrades = [
    {
        name: 'Health+', baseCost: 125, valuePerUpgrade: 0.5,
        effect(gameState) {
            gameState.healthUpgrades = (gameState.healthUpgrades || 0) + 1;
            if (player) { player.maxHp = player.getInitialHP(); player.hp += this.valuePerUpgrade; }
        },
        canPurchase(gameState) { return (gameState.healthUpgrades || 0) < _ascMaxPurchases(gameState); }
    },
    {
        name: 'Regen+', baseCost: 150, valuePerUpgrade: 0.02,
        effect(gameState) {
            gameState.regenUpgrades = (gameState.regenUpgrades || 0) + 1;
            if (player) player.hpRegen = gameState.regenUpgrades * this.valuePerUpgrade;
        },
        canPurchase(gameState) { return (gameState.regenUpgrades || 0) < _ascMaxPurchases(gameState); }
    },
    {
        name: 'Crit Chance+', baseCost: 250, valuePerUpgrade: 0.01,
        effect(gameState) {
            gameState.critChanceUpgrades = (gameState.critChanceUpgrades || 0) + 1;
            if (player && (!(player instanceof DivineKnight) || player.critUpgradesEnabled))
                player.adjustCritChance(this.valuePerUpgrade);
        },
        canPurchase(gameState) { return (gameState.critChanceUpgrades || 0) < _ascMaxPurchases(gameState); }
    },
    {
        name: 'Critical Damage+', baseCost: 225, valuePerUpgrade: 0.1,
        effect(gameState) {
            gameState.critDamageUpgrades = (gameState.critDamageUpgrades || 0) + 1;
            if (player) player.critDamage += this.valuePerUpgrade;
        },
        canPurchase(gameState) { return (gameState.critDamageUpgrades || 0) < _ascMaxPurchases(gameState); }
    },
    {
        name: 'Attack Speed+', baseCost: 225, valuePerUpgrade: 0.05,
        effect(gameState) {
            gameState.attackSpeedUpgrades = (gameState.attackSpeedUpgrades || 0) + 1;
            if (player) player.attacksPerSecond += this.valuePerUpgrade;
        },
        canPurchase(gameState) { return (gameState.attackSpeedUpgrades || 0) < _ascMaxPurchases(gameState); }
    },
    {
        name: 'Cooldown+', baseCost: 225, valuePerUpgrade: 0.02,
        effect(gameState) {
            gameState.cooldownUpgrades = (gameState.cooldownUpgrades || 0) + 1;
            if (player) player.updateCooldownReduction();
        },
        canPurchase(gameState) { return (gameState.cooldownUpgrades || 0) < _ascMaxPurchases(gameState); }
    },
    {
        name: 'Exp+', baseCost: 500, valuePerUpgrade: 0.2,
        effect(gameState) { gameState.expUpgrades = (gameState.expUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.expUpgrades || 0) < _ascMaxPurchases(gameState);
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 1; }
    },
    {
        name: 'Boss Damage+', baseCost: 500, valuePerUpgrade: 0.1,
        effect(gameState) { gameState.bossDamageUpgrades = (gameState.bossDamageUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.bossDamageUpgrades || 0) < _ascMaxPurchases(gameState);
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 1; }
    },
    {
        name: 'Rarity+', baseCost: 750, valuePerUpgrade: 0.01,
        effect(gameState) { gameState.rarityUpgrades = (gameState.rarityUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.rarityUpgrades || 0) < _ascMaxPurchases(gameState);
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 2; }
    },
    {
        name: 'Starting Wave+', baseCost: 750, valuePerUpgrade: 1,
        effect(gameState) { gameState.startingWaveUpgrades = (gameState.startingWaveUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.startingWaveUpgrades || 0) < _ascMaxPurchases(gameState);
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 3; }
    }
];

// --- Purchase Soul Upgrade ---

const UPGRADE_KEY_MAP = {
    'Health+': 'healthUpgrades', 'Regen+': 'regenUpgrades',
    'Crit Chance+': 'critChanceUpgrades', 'Critical Damage+': 'critDamageUpgrades',
    'Attack Speed+': 'attackSpeedUpgrades', 'Cooldown+': 'cooldownUpgrades',
    'Exp+': 'expUpgrades', 'Boss Damage+': 'bossDamageUpgrades',
    'Rarity+': 'rarityUpgrades', 'Starting Wave+': 'startingWaveUpgrades'
};

let lastPurchaseTime = 0;

function purchaseSoulsUpgrade(upgradeName) {
    const now = Date.now();
    if (now - lastPurchaseTime < 100) return;
    lastPurchaseTime = now;

    const upgrade = soulsUpgrades.find(u => u.name === upgradeName);
    if (!upgrade) return;
    if (upgrade.isVisible && !upgrade.isVisible(gameState)) return;

    const key = UPGRADE_KEY_MAP[upgradeName];
    const currentLevel = gameState[key] || 0;
    const cost = calculateSoulUpgradeCost(upgrade.baseCost, currentLevel);

    if (gameState.souls >= cost && upgrade.canPurchase(gameState)) {
        gameState.souls -= cost;
        upgrade.effect(gameState);
        saveGameState();
        updateSoulsUI();
    }
}