//Full documentation in docIR
function getRarityValue(rarity, legendary, epic, magic, normal) {
    return (rarity === 'Legendary' || rarity === 'Epic') ? legendary : (rarity === 'Magic' ? magic : normal);
}

function applySecondary(rarity, secondaryUpgrade, secondaryRarity) {
    if (rarity === 'Legendary' && secondaryUpgrade) {
        if (secondaryUpgrade.condition && !secondaryUpgrade.condition()) return;
        secondaryUpgrade.effect(secondaryRarity);
    }
}

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
        _hasEternity: () => player instanceof DivineKnight
            && typeof dkAlloc !== 'undefined' && dkAlloc['oath_of_eternity'] >= 1
            && player.weapon instanceof SmiteShield,
        _hasAegis: () => player instanceof DivineKnight
            && typeof dkAlloc !== 'undefined' && dkAlloc['oath_of_aegis'] >= 1
            && player.weapon instanceof SmiteShield,
        effect(rarity, secondaryUpgrade, secondaryRarity) {
            const mult = this._hasEternity() ? 3 : 1;
            const val  = this._val(rarity) * mult;
            if (this._hasEternity()) {
                
                player.hpRegen = player.hpRegen + val;
            } else if (this._hasAegis()) {
                
                player.hpRegen = Math.min(1.5, player.hpRegen + val);
            } else {
                player.hpRegen = Math.min(1, player.hpRegen + val);
            }
            applySecondary(rarity, secondaryUpgrade, secondaryRarity);
        },
        getValue(rarity) {
            const mult = this._hasEternity ? this._hasEternity() ? 3 : 1 : 1;
            return `+${(this._val(rarity) * mult).toFixed(2)}/s`;
        },
        condition: () => {
            
            if (player instanceof DivineKnight
                && typeof dkAlloc !== 'undefined' && dkAlloc['oath_of_judgement'] >= 1
                && player.weapon instanceof BlessedShield) return false;
            
            if (player instanceof DivineKnight
                && typeof dkAlloc !== 'undefined' && dkAlloc['oath_of_eternity'] >= 1
                && player.weapon instanceof SmiteShield) return true;
            
            if (player instanceof DivineKnight
                && typeof dkAlloc !== 'undefined' && dkAlloc['oath_of_aegis'] >= 1
                && player.weapon instanceof SmiteShield) return player.hpRegen < 1.5;
            return player.hpRegen < 1;
        },
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
        condition: () => player.totalCooldownReduction < 0.75,
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
        condition: () => {
            if (player instanceof DivineKnight && !player.critUpgradesEnabled) return false;
            return player.critChance < 0.80;
        },
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

function getRarity() {
    const rarityUpgrade = soulsUpgrades.find(u => u.name === 'Rarity+');
    const rarityBonus = (gameState.rarityUpgrades || 0) * rarityUpgrade.valuePerUpgrade;
    const roll = Math.random();
    if (roll < 0.01 + rarityBonus * 0.5) return 'Legendary';
    if (roll < 0.11 + rarityBonus)        return 'Epic';
    if (roll < 0.41 + rarityBonus * 2)    return 'Magic';
    return 'Normal';
}

const BASE_WEAPON_NAMES = new Set(['Basic Staff', 'Basic Wand', 'Basic Shield']);

function getRandomUpgrades(count) {
    // Trigger weapon evolution once, at or after level 10, if still on base weapon
    if (player.level >= 10 && player.weapon && BASE_WEAPON_NAMES.has(player.weapon.name)) {
        showWeaponEvolutionScreen();
        return [];
    }

    // Trigger class upgrade once, at or after level 20, if not yet chosen
    if (player.level >= 20 && !gameState.classUpgradeChosen) {
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
            attackSpeedIncrease: 0.35, bossDamagePenalty: true,
            effect() {
                player.attacksPerSecond += this.attackSpeedIncrease;
                const sheRanks = (typeof sorcAlloc !== 'undefined' ? sorcAlloc['stormheart_excellence'] : 0) || 0;
                
                const penaltyNegated = Math.min(sheRanks, 5) * 0.20;
                const bonusBossDmg   = Math.max(0, sheRanks - 5) * 0.20;
                
                const effectivePenalty = Math.max(0, 1.0 - penaltyNegated) - bonusBossDmg;
                player.additionalBossDamage = (player.additionalBossDamage || 0) - effectivePenalty;
                player.classUpgradeChosen = this.shardName;
                gameState.classUpgradeChosen = this.shardName;
                saveGameState();
            },
            description() {
                const sheRanks = (typeof sorcAlloc !== 'undefined' ? sorcAlloc['stormheart_excellence'] : 0) || 0;
                const penaltyNegated = Math.min(sheRanks, 5) * 0.20;
                const bonusBossDmg   = Math.max(0, sheRanks - 5) * 0.20;
                const effectivePenalty = 1.0 - penaltyNegated - bonusBossDmg;
                const bossDmgLine = effectivePenalty > 0
                    ? `Boss Damage -${pct(effectivePenalty)}%`
                    : effectivePenalty < 0 ? `Boss Damage +${pct(-effectivePenalty)}%` : '';
                return classDesc(this.flavorText,
                    [`Attack Speed +${pct(this.attackSpeedIncrease)}%`],
                    [bossDmgLine].filter(Boolean));
            }
        },
        {
            name: "Spellweaver's Sigil", shardName: "Spellweaver's",
            flavorText: "Each strike finds its mark, though the storm's fury wanes in precision.",
            critChanceIncrease: 0.2, critDamageDecrease: 0.6,
            effect() {
                const sweRanks = (typeof sorcAlloc !== 'undefined' ? sorcAlloc['spellweavers_excellence'] : 0) || 0;
                
                const penaltyNegated = Math.min(sweRanks, 5) * 0.12;
                const bonusCritDmg   = Math.max(0, sweRanks - 5) * 0.12;
                const effectiveLoss  = Math.max(0, this.critDamageDecrease - penaltyNegated) - bonusCritDmg;
                const stats = Object.assign({}, this, {
                    critDamageDecrease: Math.max(0, effectiveLoss),
                    critDamageIncrease: (this.critDamageIncrease || 0) + (effectiveLoss < 0 ? -effectiveLoss : 0)
                });
                classEffect(player, gameState, stats);
            },
            description() {
                const sweRanks = (typeof sorcAlloc !== 'undefined' ? sorcAlloc['spellweavers_excellence'] : 0) || 0;
                const penaltyNegated = Math.min(sweRanks, 5) * 0.12;
                const bonusCritDmg   = Math.max(0, sweRanks - 5) * 0.12;
                const effectiveLoss  = this.critDamageDecrease - penaltyNegated - bonusCritDmg;
                const critDmgLine = effectiveLoss > 0
                    ? `Crit Damage -${pct(effectiveLoss)}%`
                    : effectiveLoss < 0 ? `Crit Damage +${pct(-effectiveLoss)}%` : '';
                return classDesc(this.flavorText,
                    [`Crit Chance +${pct(this.critChanceIncrease)}%`],
                    [critDmgLine].filter(Boolean));
            }
        },
        {
            name: 'Nexus Crystal', shardName: 'Nexus',
            flavorText: 'At the center of the arcane current, strikes resonate with devastating precision, though the tempo slows.',
            attackSpeedDecrease: 0.40, chainCountBonus: 1,
            effect() {
                const neRanks = (typeof sorcAlloc !== 'undefined' ? sorcAlloc['nexus_excellence'] : 0) || 0;
                
                const penaltyNegated = Math.min(neRanks, 5) * 0.08;
                const bonusSpeed     = Math.max(0, neRanks - 5) * 0.08;
                const effectiveLoss  = Math.max(0, this.attackSpeedDecrease - penaltyNegated) - bonusSpeed;
                player.attacksPerSecond -= effectiveLoss;
                if (effectiveLoss < 0) player.attacksPerSecond += (-effectiveLoss); 
                if (player.weapon?.chainCount !== undefined) player.weapon.chainCount += this.chainCountBonus;
                player.classUpgradeChosen = this.shardName;
                gameState.classUpgradeChosen = this.shardName;
                saveGameState();
            },
            description() {
                const neRanks = (typeof sorcAlloc !== 'undefined' ? sorcAlloc['nexus_excellence'] : 0) || 0;
                const penaltyNegated = Math.min(neRanks, 5) * 0.08;
                const bonusSpeed     = Math.max(0, neRanks - 5) * 0.08;
                const effectiveLoss  = this.attackSpeedDecrease - penaltyNegated - bonusSpeed;
                const speedLine = effectiveLoss > 0
                    ? `Attack Speed -${pct(effectiveLoss)}%`
                    : effectiveLoss < 0 ? `Attack Speed +${pct(-effectiveLoss)}%` : '';
                return classDesc(this.flavorText,
                    ['Chains: +1 target'],
                    [speedLine].filter(Boolean));
            }
        }
    ],
    'Divine Knight': [
        {
            name: 'Vigilant Crest', shardName: 'Vigilant',
            flavorText: 'The Light quickens your resolve, you strike swiftly and endlessly, though each blow carries less might.',
            attackSpeedIncrease: 1.00, damageLoss: 0.20,
            effect() {
                const veRanks = (typeof dkAlloc !== 'undefined' ? dkAlloc['vigilant_excellence'] : 0) || 0;
                
                const penaltyNegated = Math.min(veRanks, 5) * 0.04;
                const bonusDmg = Math.max(0, veRanks - 5) * 0.04;
                const effectiveLoss = Math.max(0, this.damageLoss - penaltyNegated) - bonusDmg;
                const stats = Object.assign({}, this, {
                    damageLoss: Math.max(0, effectiveLoss),
                    damageIncrease: (this.damageIncrease || 0) + (effectiveLoss < 0 ? -effectiveLoss : 0)
                });
                classEffect(player, gameState, stats);
            },
            description() {
                const veRanks = (typeof dkAlloc !== 'undefined' ? dkAlloc['vigilant_excellence'] : 0) || 0;
                const penaltyNegated = Math.min(veRanks, 5) * 0.04;
                const bonusDmg = Math.max(0, veRanks - 5) * 0.04;
                const effectiveLoss = this.damageLoss - penaltyNegated - bonusDmg;
                const dmgLine = effectiveLoss > 0
                    ? `Damage -${pct(effectiveLoss)}%`
                    : effectiveLoss < 0 ? `Damage +${pct(-effectiveLoss)}%` : '';
                return classDesc(this.flavorText,
                    [`Attack Speed +${pct(this.attackSpeedIncrease)}%`],
                    [dmgLine].filter(Boolean));
            }
        },
        {
            name: 'Sanctified Oath', shardName: 'Sanctified',
            flavorText: 'Divine judgment sharpens your strikes, but the weight of faith slows your hand.',
            damageLoss: 0.25, attackSpeedDecrease: 0.15, cooldownIncrease: 0.15, enablesCritUpgrades: true,
            effect() {
                const seRanks = (typeof dkAlloc !== 'undefined' ? dkAlloc['sanctified_excellence'] : 0) || 0;
                
                const dmgNegated  = Math.min(seRanks, 5) * 0.05;
                const spdNegated  = Math.min(seRanks, 5) * 0.03;
                const cdNegated   = Math.min(seRanks, 5) * 0.03;
                const bonusDmg    = Math.max(0, seRanks - 5) * 0.05;
                const bonusSpd    = Math.max(0, seRanks - 5) * 0.03;
                const bonusCdRedux= Math.max(0, seRanks - 5) * 0.03;
                const effDmgLoss  = Math.max(0, this.damageLoss - dmgNegated) - bonusDmg;
                const effSpdLoss  = Math.max(0, this.attackSpeedDecrease - spdNegated) - bonusSpd;
                const effCdInc    = Math.max(0, this.cooldownIncrease - cdNegated) - bonusCdRedux;
                const stats = Object.assign({}, this, {
                    damageLoss: Math.max(0, effDmgLoss),
                    damageIncrease: (this.damageIncrease || 0) + (effDmgLoss < 0 ? -effDmgLoss : 0),
                    attackSpeedDecrease: Math.max(0, effSpdLoss),
                    attackSpeedIncrease: (this.attackSpeedIncrease || 0) + (effSpdLoss < 0 ? -effSpdLoss : 0),
                    cooldownIncrease: Math.max(0, effCdInc),
                    cooldownReduction: (this.cooldownReduction || 0) + (effCdInc < 0 ? -effCdInc : 0),
                });
                classEffect(player, gameState, stats);
                player.critUpgradesEnabled = true;
                gameState.critUpgradesEnabled = true;
                const retro = (gameState.critChanceUpgrades || 0) * 0.01;
                if (retro > 0) player.adjustCritChance(retro);
            },
            description() {
                const seRanks = (typeof dkAlloc !== 'undefined' ? dkAlloc['sanctified_excellence'] : 0) || 0;
                const dmgNegated = Math.min(seRanks, 5) * 0.05;
                const spdNegated = Math.min(seRanks, 5) * 0.03;
                const cdNegated  = Math.min(seRanks, 5) * 0.03;
                const bonusDmg   = Math.max(0, seRanks - 5) * 0.05;
                const bonusSpd   = Math.max(0, seRanks - 5) * 0.03;
                const bonusCd    = Math.max(0, seRanks - 5) * 0.03;
                const effDmg = this.damageLoss - dmgNegated - bonusDmg;
                const effSpd = this.attackSpeedDecrease - spdNegated - bonusSpd;
                const effCd  = this.cooldownIncrease - cdNegated - bonusCd;
                const dmgLine = effDmg > 0 ? `Damage -${pct(effDmg)}%`   : effDmg < 0 ? `Damage +${pct(-effDmg)}%` : '';
                const spdLine = effSpd > 0 ? `Attack Speed -${pct(effSpd)}%` : effSpd < 0 ? `Attack Speed +${pct(-effSpd)}%` : '';
                const cdLine  = effCd  > 0 ? `Cooldown +${pct(effCd)}%`  : effCd  < 0 ? `Cooldown -${pct(-effCd)}%`  : '';
                return classDesc(this.flavorText,
                    ['Enables Crit Globally'],
                    [dmgLine, spdLine, cdLine].filter(Boolean));
            }
        },
        {
            name: 'Eternal Bastion', shardName: 'Eternal',
            flavorText: 'The eternal flame dwells within you — your form unyielding, your strength resounding through ages.',
            healthIncrease: 10, damageIncrease: 0.25, cooldownIncrease: 1.0,
            effect() {
                const eeRanks = (typeof dkAlloc !== 'undefined' ? dkAlloc['eternal_excellence'] : 0) || 0;
                
                const cdNegated = Math.min(eeRanks, 5) * 0.20;
                const bonusCdRedux = Math.max(0, eeRanks - 5) * 0.20;
                const effCdInc = Math.max(0, this.cooldownIncrease - cdNegated) - bonusCdRedux;
                const stats = Object.assign({}, this, {
                    cooldownIncrease: Math.max(0, effCdInc),
                    cooldownReduction: (this.cooldownReduction || 0) + (effCdInc < 0 ? -effCdInc : 0),
                });
                classEffect(player, gameState, stats);
            },
            description() {
                const eeRanks = (typeof dkAlloc !== 'undefined' ? dkAlloc['eternal_excellence'] : 0) || 0;
                const cdNegated = Math.min(eeRanks, 5) * 0.20;
                const bonusCd   = Math.max(0, eeRanks - 5) * 0.20;
                const effCd = this.cooldownIncrease - cdNegated - bonusCd;
                const cdLine = effCd > 0
                    ? `Cooldown +${pct(effCd)}%`
                    : effCd < 0 ? `Cooldown -${pct(-effCd)}%` : '';
                return classDesc(this.flavorText,
                    [`Health +${this.healthIncrease}`, `Damage +${pct(this.damageIncrease)}%`],
                    [cdLine].filter(Boolean));
            }
        }
    ]
};

function _sfClassPlaque(upgrade) {
    const pClass = player.class;
    const colorCls = pClass === 'Acolyte' ? 'sp' : pClass === 'Sorceress' ? 'sb' : 'sg';
    const descHtml = upgrade.description.call(upgrade);
    const tmp = document.createElement('div'); tmp.innerHTML = descHtml;
    const lines = [];
    tmp.querySelectorAll('.stat-positive, .stat-negative').forEach(el => {
        const neg = el.classList.contains('stat-negative');
        lines.push(`<div class="sf-stat ${neg ? 'sn' : colorCls}"><span class="sf-bullet">✦</span><span class="sf-stat-text">${el.textContent.trim()}</span></div>`);
    });
    if (!lines.length) {
        const f = tmp.querySelector('.upgrade-flavor');
        if (f) { const t = f.textContent.trim(); lines.push(`<div class="sf-stat ${colorCls}"><span class="sf-bullet">✦</span><span class="sf-stat-text" style="font-style:italic;font-size:10px;">${t.length>60?t.slice(0,57)+'…':t}</span></div>`); }
    }
    return lines.join('');
}

function showLevelUpScreen() {
    gameState.isPaused = true;

    const levelUpAudio = document.getElementById('levelupmu');
    if (levelUpAudio) { levelUpAudio.currentTime = 0; levelUpAudio.volume = 0.2; levelUpAudio.play().catch(() => {}); }

    
    const availableUpgrades = getRandomUpgrades(3);
    if (!availableUpgrades.length) return;

    
    document.getElementById('level-up')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'level-up';
    overlay.className = 'sf-overlay';
    const gameArea = document.getElementById('game-area') || document.body;
    gameArea.appendChild(overlay);

    const isClassScreen = !!availableUpgrades[0]?.isClassUpgrade;
    const isAutoClass = gameState.autoClassEnabled && isClassScreen;
    const isAutoCard  = gameState.autoCardEnabled  && !isClassScreen;

    const title = document.createElement('h1');
    const classSlug = player.class === 'Divine Knight' ? 'divine-knight' : player.class.toLowerCase();
    title.className = isClassScreen ? `sf-screen-title ascension ${classSlug}` : 'sf-screen-title';
    title.textContent = isClassScreen ? 'Class Ascension' : 'Level Up!';
    overlay.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'sf-screen-sub';
    sub.textContent = isClassScreen ? 'Choose your path of power' : 'Choose a soul fragment to absorb';
    overlay.appendChild(sub);

    const row = document.createElement('div');
    row.className = 'sf-row';
    overlay.appendChild(row);

    if (isClassScreen) {
        availableUpgrades.forEach((upgrade, index) => {
            const {hexClass, svg} = _sfClassHexSVG(upgrade);
            const plaqueLines = _sfClassPlaque(upgrade);
            const wrap = document.createElement('div');
            wrap.className = 'sf-wrap' + (isAutoClass ? ' sf-disabled' : '');
            wrap.dataset.index = index;
            wrap.innerHTML = `
              <div class="sf-hex-shell ${hexClass}">${svg}</div>
              <div class="sf-plaque">
                <span class="sf-plaque-rule"></span>${plaqueLines}<span class="sf-plaque-rule-b"></span>
              </div>`;
            if (!isAutoClass) {
                wrap.addEventListener('click', () => {
                    
                    row.querySelectorAll('.sf-wrap').forEach(w => w.style.pointerEvents = 'none');
                    const sfSound = document.getElementById('soulfragmentcrack');
                    if (sfSound) { sfSound.currentTime = 0; sfSound.volume = 0.5; sfSound.play().catch(()=>{}); }
                    _sfShatter(wrap.querySelector('.sf-hex-shell'), () => selectUpgrade(upgrade, index));
                });
            }
            row.appendChild(wrap);
        });
        if (isAutoClass) {
            const auto = selectAutoClassUpgrade(availableUpgrades);
            const idx  = availableUpgrades.indexOf(auto);
            row.querySelector(`[data-index="${idx}"]`)?.classList.add('sf-auto-glow');
            setTimeout(() => selectUpgrade(auto, idx), 3000);
        }
    } else {
        availableUpgrades.forEach((upgrade, index) => {
            const rarity = upgrade.rarity || 'Normal';
            const {shellClass, width, height, svg} = _sfFragSVG(upgrade);
            const nameCls = {Normal:'name-normal',Magic:'name-magic',Epic:'name-epic',Legendary:'name-legendary'}[rarity] || 'name-normal';
            
            let dmgTypeHtml = '';
            if (rarity === 'Legendary') {
                dmgTypeHtml = `<span style="color:#5a4820;font-size:10.5px;">Legendary · Dual Blessing</span>`;
            } else if (upgrade.description) {
                const desc = upgrade.description.toLowerCase();
                if (desc.includes('multiplicative')) {
                    dmgTypeHtml = `Type: <span class="tag-multiplicative">Multiplicative</span>`;
                } else if (desc.includes('additive')) {
                    dmgTypeHtml = `Type: <span class="tag-additive">Additive</span>`;
                } else {
                    dmgTypeHtml = upgrade.name;
                }
            } else {
                dmgTypeHtml = upgrade.name;
            }
            const wrap = document.createElement('div');
            wrap.className = 'sf-wrap' + (isAutoCard ? ' sf-disabled' : '');
            wrap.dataset.index = index;
            wrap.innerHTML = `
              <div class="sf-shell ${shellClass}" style="width:${width}px;height:${height}px;">${svg}</div>
              <div class="sf-text">
                <div class="sf-name ${nameCls}">${rarity}</div>
                <div class="sf-dmgtype">${dmgTypeHtml}</div>
              </div>`;
            if (!isAutoCard) {
                wrap.addEventListener('click', () => {
                    
                    row.querySelectorAll('.sf-wrap').forEach(w => w.style.pointerEvents = 'none');
                    const sfSound = document.getElementById('soulfragmentcrack');
                    if (sfSound) { sfSound.currentTime = 0; sfSound.volume = 0.5; sfSound.play().catch(()=>{}); }
                    _sfShatter(wrap.querySelector('.sf-shell'), () => selectUpgrade(upgrade, index));
                });
            }
            row.appendChild(wrap);
        });
        if (isAutoCard) {
            const priority = gameState.upgradePriority || DEFAULT_UPGRADE_PRIORITY;
            const auto = priority.reduce((found, name) => found || availableUpgrades.find(u => u.name === name), null) || availableUpgrades[0];
            const idx  = availableUpgrades.indexOf(auto);
            row.querySelector(`[data-index="${idx}"]`)?.classList.add('sf-auto-glow');
            setTimeout(() => selectUpgrade(auto, idx), 3000);
        }
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
    document.getElementById('level-up')?.remove();
    levelUpScreenOpen = false;
}

function calculateSoulUpgradeCost(baseCost, currentLevel) {
    let cost = baseCost;
    for (let i = 1; i <= currentLevel; i++) {
        cost *= i <= 5 ? 1.95 : i <= 10 ? 1.70 : i <= 15 ? 1.30 : 1.20;
    }
    return Math.floor(cost);
}

const BASIC_UPGRADE_KEYS = new Set(['healthUpgrades','regenUpgrades','critChanceUpgrades','critDamageUpgrades','attackSpeedUpgrades','cooldownUpgrades']);

function _ascMaxPurchases(gameState, upgradeKey) {
    const asc = gameState.ascensionLevel || 0;
    if (BASIC_UPGRADE_KEYS.has(upgradeKey)) {
        return asc >= 1 ? 10 : 5;
    }
    const a = Math.min(asc, ASCENSION_MAX_PURCHASES.length - 1);
    return ASCENSION_MAX_PURCHASES[a];
}

const soulsUpgrades = [
    {
        name: 'Health+', baseCost: 125, valuePerUpgrade: 0.5,
        effect(gameState) {
            gameState.healthUpgrades = (gameState.healthUpgrades || 0) + 1;
            if (player) { player.maxHp = player.getInitialHP(); player.hp += this.valuePerUpgrade; }
        },
        canPurchase(gameState) { return (gameState.healthUpgrades || 0) < _ascMaxPurchases(gameState, 'healthUpgrades'); }
    },
    {
        name: 'Regen+', baseCost: 150, valuePerUpgrade: 0.02,
        effect(gameState) {
            gameState.regenUpgrades = (gameState.regenUpgrades || 0) + 1;
            if (player) player.hpRegen = Math.min(1, gameState.regenUpgrades * this.valuePerUpgrade);
        },
        canPurchase(gameState) {
            return (gameState.regenUpgrades || 0) < _ascMaxPurchases(gameState, 'regenUpgrades');
        }
    },
    {
        name: 'Crit Chance+', baseCost: 250, valuePerUpgrade: 0.01,
        effect(gameState) {
            gameState.critChanceUpgrades = (gameState.critChanceUpgrades || 0) + 1;
            if (player && (!(player instanceof DivineKnight) || player.critUpgradesEnabled))
                player.adjustCritChance(this.valuePerUpgrade);
        },
        canPurchase(gameState) {
            
            
            if (player && !(player instanceof DivineKnight) && player.critChance >= 0.80) return false;
            return (gameState.critChanceUpgrades || 0) < _ascMaxPurchases(gameState, 'critChanceUpgrades');
        }
    },
    {
        name: 'Critical Damage+', baseCost: 225, valuePerUpgrade: 0.1,
        effect(gameState) {
            gameState.critDamageUpgrades = (gameState.critDamageUpgrades || 0) + 1;
            if (player) player.critDamage += this.valuePerUpgrade;
        },
        canPurchase(gameState) { return (gameState.critDamageUpgrades || 0) < _ascMaxPurchases(gameState, 'critDamageUpgrades'); }
    },
    {
        name: 'Attack Speed+', baseCost: 225, valuePerUpgrade: 0.05,
        effect(gameState) {
            gameState.attackSpeedUpgrades = (gameState.attackSpeedUpgrades || 0) + 1;
            if (player) player.attacksPerSecond += this.valuePerUpgrade;
        },
        canPurchase(gameState) { return (gameState.attackSpeedUpgrades || 0) < _ascMaxPurchases(gameState, 'attackSpeedUpgrades'); }
    },
    {
        name: 'Cooldown+', baseCost: 225, valuePerUpgrade: 0.02,
        effect(gameState) {
            gameState.cooldownUpgrades = (gameState.cooldownUpgrades || 0) + 1;
            if (player) player.updateCooldownReduction();
        },
        canPurchase(gameState) { return (gameState.cooldownUpgrades || 0) < _ascMaxPurchases(gameState, 'cooldownUpgrades'); }
    },
    {
        name: 'Exp+', baseCost: 500, valuePerUpgrade: 0.15,
        effect(gameState) { gameState.expUpgrades = (gameState.expUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.expUpgrades || 0) < _ascMaxPurchases(gameState, 'expUpgrades');
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 1; }
    },
    {
        name: 'Boss Damage+', baseCost: 500, valuePerUpgrade: 0.1,
        effect(gameState) { gameState.bossDamageUpgrades = (gameState.bossDamageUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.bossDamageUpgrades || 0) < _ascMaxPurchases(gameState, 'bossDamageUpgrades');
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 1; }
    },
    {
        name: 'Rarity+', baseCost: 750, valuePerUpgrade: 0.01,
        effect(gameState) { gameState.rarityUpgrades = (gameState.rarityUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.rarityUpgrades || 0) < _ascMaxPurchases(gameState, 'rarityUpgrades');
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 2; }
    },
    {
        name: 'Starting Wave+', baseCost: 750, valuePerUpgrade: 1,
        effect(gameState) { gameState.startingWaveUpgrades = (gameState.startingWaveUpgrades || 0) + 1; },
        canPurchase(gameState) {
            return (gameState.startingWaveUpgrades || 0) < _ascMaxPurchases(gameState, 'startingWaveUpgrades');
        },
        isVisible(gameState) { return gameState.ascensionLevel >= 3; }
    }
];

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