//Full documentation in docIR
function initializeWeapon(playerClass, weaponName = null) {
    
    switch (playerClass) {
        case 'Acolyte':
            player.weapon = weaponName === 'Vortex Staff' ? new VortexStaff()
                          : weaponName === 'Umbral Staff'  ? new UmbralStaff()
                          : new BasicStaff();
            break;
        case 'Sorceress':
            player.weapon = weaponName === 'Chain Wand' ? new ChainWand()
                          : weaponName === 'Spark Wand'  ? new SparkWand()
                          : new BasicWand();
            break;
        case 'Divine Knight':
            player.weapon = weaponName === 'Blessed Shield' ? new BlessedShield()
                          : weaponName === 'Smite Shield'   ? new SmiteShield()
                          : new BasicShield();
            
            if (weaponName === 'Blessed Shield') {
                const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
                const mcRanks = (dAlloc && dAlloc['martyrs_conviction']) || 0;
                const odBonus = (dAlloc && dAlloc['oath_of_dominion'] >= 1) ? 15 : 0;
                const bsHpBonus = 5 + (mcRanks * 3) + odBonus;
                player.maxHp += bsHpBonus;
                player.hp = Math.min(player.hp + bsHpBonus, player.maxHp);
                updatePlayerStats();
            }
            break;
    }
    
    if (player instanceof Acolyte) {
        const aAlloc = typeof alloc !== 'undefined' ? alloc : null;
        
        if (aAlloc && aAlloc['abyssal_core'] > 0) {
            player.weapon.baseDamage += aAlloc['abyssal_core'] * 1.0;
            player.weapon.damage = player.weapon.baseDamage;
        }
        
        if (aAlloc && aAlloc['umbral_collapse'] >= 1 && player.weapon && player.weapon.name === 'Umbral Staff') {
            player.adjustCritChance(0.10);
        }
        
        const chosen = player.classUpgradeChosen;
        if (chosen && aAlloc) {
            
            
            player.weapon.temporalExcellenceRanks    = aAlloc['temporal_excellence']    || 0;
            player.weapon.abyssalExcellenceRanks     = aAlloc['abyssal_excellence']     || 0;
            player.weapon.ravenousExcellenceRanks    = aAlloc['ravenous_excellence']    || 0;
        }
    }

    
    if (player instanceof Sorceress) {
        const sAlloc = typeof sorcAlloc !== 'undefined' ? sorcAlloc : null;
        
        if (sAlloc && sAlloc['arcane_voltage'] > 0) {
            player.weapon.baseDamage += sAlloc['arcane_voltage'] * 1.0;
            player.weapon.damage = player.weapon.baseDamage;
        }
        
        if (sAlloc && sAlloc['unbroken_current'] >= 1 && player.weapon instanceof ChainWand) {
            player.weapon.chainDamageMultiplier = 1.0;
            player.weapon.chainCount += 1;
        }
        
        player.weapon.spellweaversExcellenceRanks = (sAlloc && sAlloc['spellweavers_excellence']) || 0;
        player.weapon.nexusExcellenceRanks        = (sAlloc && sAlloc['nexus_excellence'])        || 0;
        player.weapon.stormheartExcellenceRanks   = (sAlloc && sAlloc['stormheart_excellence'])   || 0;
    }

    
    if (player instanceof DivineKnight) {
        const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
        
        if (dAlloc && dAlloc['consecrated_steel'] > 0) {
            player.weapon.baseDamage += dAlloc['consecrated_steel'] * 1.0;
            player.weapon.damage = player.weapon.baseDamage;
        }
        
        player.weapon.sanctifiedExcellenceRanks = (dAlloc && dAlloc['sanctified_excellence']) || 0;
        player.weapon.vigilantExcellenceRanks   = (dAlloc && dAlloc['vigilant_excellence'])   || 0;
        player.weapon.eternalExcellenceRanks    = (dAlloc && dAlloc['eternal_excellence'])    || 0;
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
    }

    attack() {
        const now = Date.now();
        const aps = this.getAttackSpeed();
        if (now - this.lastAttackTime >= 1000 / aps) {
            this.performAttack();
            this.lastAttackTime = now;
        }
    }

    getAttackSpeed() {
        return player.attacksPerSecond;
    }

    triggerPlayerAttackAnimation() {
        const playerElement = document.getElementById('player');
        if (!playerElement) return;

        
        const nearestForFacing = enemies
            .filter(e => !e.isDying)
            .reduce((nearest, enemy) => {
                const dist = calculateDistance(player.position, enemy.position);
                return !nearest || dist < calculateDistance(player.position, nearest.position) ? enemy : nearest;
            }, null);
        if (nearestForFacing) {
            player.facingLeft = nearestForFacing.position.x < player.position.x;
            playerElement.classList.toggle('facing-left', player.facingLeft);
        }

        if (player.class === 'Sorceress') {
            playerElement.classList.remove('sorc-attacking');
            void playerElement.offsetWidth;
            playerElement.classList.add('sorc-attacking');
            if (this.attackAnimationTimeout) clearTimeout(this.attackAnimationTimeout);
            this.attackAnimationTimeout = setTimeout(() => {
                playerElement.classList.remove('sorc-attacking');
                this.attackAnimationTimeout = null;
            }, 200);
            return;
        }

        if (player.class !== 'Acolyte') return;

        
        Weapon.attackSoundIndex = (Weapon.attackSoundIndex % 3) + 1;
        const attackAudio = document.getElementById(`acoattmu${Weapon.attackSoundIndex}`);
        if (attackAudio) {
            attackAudio.currentTime = 0;
            attackAudio.volume = 0.12;
            attackAudio.playbackRate = player.attacksPerSecond;
            attackAudio.play().catch(e => console.log('Audio play failed:', e));
        }

        const animationDuration = 1000 / player.attacksPerSecond;

        if (this.attackAnimationTimeout) clearTimeout(this.attackAnimationTimeout);

        playerElement.classList.remove('attacking');
        playerElement.style.animation = '';
        void playerElement.offsetWidth; 

        playerElement.classList.add('attacking');
        playerElement.style.animation = `playerAttack ${animationDuration}ms steps(47) forwards`;

        this.attackAnimationTimeout = setTimeout(() => {
            playerElement.classList.remove('attacking');
            playerElement.style.animation = '';
            this.attackAnimationTimeout = null;
        }, animationDuration);
    }

    calculateDamage() {
        const isCritical = Math.random() < player.critChance;
        return { damage: isCritical ? this.damage * player.critDamage : this.damage, isCritical };
    }

    updateDamage() {
        if (!player) { this.damage = this.baseDamage; return; }
        let dmg = (this.baseDamage + player.getAmuletDamageBonus()) * player.damageModifier * (player.weaknessDebuffFactor || 1);
        
        if (player instanceof DivineKnight && typeof dkAlloc !== 'undefined') {
            const mcRanks = dkAlloc['martyrs_conviction'] || 0;
            if (mcRanks > 0 && (this instanceof BlessedShield || this.name === 'Blessed Shield')) {
                dmg *= (1 + mcRanks * 0.20 * player.maxHp / 100);
            }
        }
        this.damage = dmg;
    }

    performAttack() {}
    performAbility() {}
    showAbilityCooldown() {}

    useAbility() {
        const now = Date.now();
        const currentCooldown = player.getCurrentCooldown(this.baseCooldown);
        if (now - this.lastAbilityUseTime >= currentCooldown * 1000) {
            this._eternalTormentReset = false;
            this.performAbility();
            
            if (!this._eternalTormentReset) {
                this.lastAbilityUseTime = now;
            }
            this.showAbilityCooldown();
        }
    }

    getAbilityButtonText() {
        const now = Date.now();
        const currentCooldown = player.getCurrentCooldown(this.baseCooldown);
        const cooldownRemaining = Math.max(0, currentCooldown - (now - this.lastAbilityUseTime) / 1000);
        return cooldownRemaining > 0 ? `Cooldown (${cooldownRemaining.toFixed(1)}s)` : this.abilityName;
    }

    findNearestEnemy() {
        let nearest = null, nearestDist = Infinity;
        for (const enemy of enemies) {
            if (enemy.isDying || enemy.hp <= 0) continue;
            const dist = calculateDistance(player.position, enemy.position);
            if (dist <= this.globalRange && dist < nearestDist) {
                nearest = enemy;
                nearestDist = dist;
            }
        }
        return nearest;
    }

    isInRange(enemy) {
        return calculateDistance(player.position, enemy.position) <= this.globalRange;
    }
}

class BasicStaff extends Weapon {
    constructor() {
        super('Basic Staff', 15, 12, 'Void Blast', 350);
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            target.takeDamage(damage, isCritical);
            this.triggerPlayerAttackAnimation();
        }
    }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            const abilityDmg = damage * 2;
            target.takeDamage(abilityDmg, isCritical);
            drawVoidBlast(target.position.x + target.radius, target.position.y + target.radius, true);
            if (target instanceof EliteEnemy) checkEternalTormentReset(this, target, abilityDmg);
        }
    }

    findPriorityTarget() {
        return enemies.find(e => e instanceof Boss)
            || enemies.find(e => e instanceof EliteEnemy)
            || this.findNearestEnemy();
    }
}

class BasicWand extends Weapon {
    constructor() {
        super('Basic Wand', 10, 20, 'Lightning Storm', 200, 100);
        this.chainCount = 2;
        this.chainDamageMultiplier = 0.75;
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            this.dealDamageWithChain(target, damage, isCritical);
        }
    }

    performAbility() {
        const abilityDamage = this.damage * player.critDamage;
        enemies.forEach(enemy => {
            enemy.takeDamage(abilityDamage, false);
            drawSkyLightning(enemy.position.x + enemy.radius, enemy.position.y + enemy.radius);
        });

        
        const echoRanks = typeof sorcAlloc !== 'undefined' ? sorcAlloc['tempest_echo'] : 0;
        if (echoRanks > 0 && Math.random() < echoRanks * 0.10) {
            setTimeout(() => {
                if (!player || !player.weapon) return;
                const echoMax = echoRanks >= 3;
                const echoDmg = echoMax ? abilityDamage * 2 : abilityDamage;
                enemies.forEach(enemy => {
                    enemy.takeDamage(echoDmg, false);
                    drawSkyLightning(enemy.position.x + enemy.radius, enemy.position.y + enemy.radius);
                });
            }, 1000);
        }
    }

    dealDamageWithChain(target, initialDamage, isCritical) {
        this.dealDamageToEnemy(target, initialDamage, isCritical);
        this.triggerPlayerAttackAnimation();

        const chainPath = [
            { x: player.position.x, y: player.position.y },
            { x: target.position.x + target.radius, y: target.position.y + target.radius }
        ];

        
        const conductorsOath = typeof sorcAlloc !== 'undefined' && sorcAlloc['conductors_oath'] >= 1;
        
        const chainReverb    = (typeof sorcAlloc !== 'undefined' && this instanceof ChainWand) ? sorcAlloc['chain_reverb'] : 0;

        let remaining = this.chainCount;
        let currentDamage = initialDamage;
        let lastHit = target;
        const hitEnemies = new Set([target]); 
        
        let chainCritChance = (conductorsOath && isCritical) ? player.critChance : player.critChance * 0.70;
        let chainStep = 1; 

        while (remaining > 0 && enemies.length > 0) {
            const next = this.findRandomEnemyInChainRange(lastHit, hitEnemies);

            
            if (!next) {
                if (chainReverb > 0) {
                    const fallbackChance = chainReverb * 0.08;
                    
                    const fallbackAttempts = Math.min(remaining, 2);
                    for (let fb = 0; fb < fallbackAttempts; fb++) {
                        if (Math.random() < fallbackChance) {
                            const fbDamage = currentDamage * Math.pow(this.chainDamageMultiplier, fb);
                            
                            const fbCritChance = (conductorsOath && isCritical) ? player.critChance : chainCritChance * Math.pow(0.70, fb);
                            const fbCrit = (conductorsOath && isCritical) ? true : Math.random() < fbCritChance;
                            const fbDmg  = fbCrit ? fbDamage * player.critDamage : fbDamage;
                            this.dealDamageToEnemy(target, fbDmg, fbCrit);
                            chainPath.push({ x: target.position.x + target.radius, y: target.position.y + target.radius });
                            drawChainReverbCollapse(target.position.x + target.radius, target.position.y + target.radius, fbCrit);
                        }
                    }
                }
                break;
            }

            currentDamage *= this.chainDamageMultiplier;
            
            const chainIsCrit = (conductorsOath && isCritical) ? true : Math.random() < chainCritChance;
            const chainDmg = chainIsCrit ? currentDamage * player.critDamage : currentDamage;
            this.dealDamageToEnemy(next, chainDmg, chainIsCrit);
            chainPath.push({ x: next.position.x + next.radius, y: next.position.y + next.radius });
            hitEnemies.add(next);

            
            if (chainReverb > 0 && Math.random() < chainReverb * 0.08) {
                
                const echoIsCrit = (conductorsOath && isCritical) ? true : Math.random() < chainCritChance;
                const echoDmg = echoIsCrit ? currentDamage * player.critDamage : currentDamage;
                this.dealDamageToEnemy(next, echoDmg, echoIsCrit);
                chainPath.push({ x: next.position.x + next.radius, y: next.position.y + next.radius });
            }

            remaining--;
            lastHit = next;
            chainStep++;
            if (!(conductorsOath && isCritical)) {
                chainCritChance *= 0.70; 
            }
        }

        drawLightningChain(chainPath, isCritical);
    }

    dealDamageToEnemy(enemy, damage, isCritical) {
        enemy.takeDamage(Math.max(0, damage), isCritical);
    }

    findRandomEnemyInChainRange(lastHitEnemy, hitEnemies = new Set([lastHitEnemy])) {
        const valid = enemies.filter(e => !hitEnemies.has(e) && this.isInChainRange(lastHitEnemy, e));
        return valid.length ? valid[Math.floor(Math.random() * valid.length)] : null;
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
        
        let newRange = originalRange * 1.5;
        
        const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
        const aoRanks = (dAlloc && dAlloc['aura_overflow']) || 0;
        let auraOverflowActive = false;
        if (aoRanks > 0 && Math.random() < aoRanks * 0.15) {
            auraOverflowActive = true;
            newRange *= 1.25;
        }
        this.globalRange = newRange;
        player.updateAuraVisual();
        setTimeout(() => {
            
            if (auraOverflowActive && aoRanks >= 3) {
                showAuraOverflowLinger(3);
                setTimeout(() => { showAuraOverflowLinger(2); }, 1000);
                setTimeout(() => { showAuraOverflowLinger(1); }, 2000);
                setTimeout(() => {
                    this.globalRange = originalRange;
                    player.updateAuraVisual();
                }, 3000);
            } else {
                this.globalRange = originalRange;
                player.updateAuraVisual();
            }
        }, this.abilityDuration);
    }

    showAbilityCooldown() {
        const playerElement = document.getElementById('player');
        if (!playerElement) return;
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
                cooldownElement.remove();
            }
        };
        updateCooldown();
    }
}

function checkEternalTormentReset(weapon, eliteTarget, damageDealt) {
    if (!(player instanceof Acolyte)) return;
    const ranks = (typeof alloc !== 'undefined' ? alloc['eternal_torment'] : 0) || 0;
    if (ranks === 0) return;

    const chance = ranks * 0.10;
    
    
    const preHitHp = eliteTarget.hp + damageDealt;
    const bonusTrigger = ranks >= 3 && damageDealt <= preHitHp * 0.25;

    if (bonusTrigger || Math.random() < chance) {
        weapon._eternalTormentReset = true;
        weapon.lastAbilityUseTime = 0;
        const btn = document.getElementById('ability-button');
        if (btn) {
            btn.style.boxShadow = '0 0 18px #9370DB, 0 0 36px #6a0dad';
            setTimeout(() => { btn.style.boxShadow = ''; }, 600);
        }
    }
}

function showAuraOverflowLinger(seconds) {
    const playerEl = document.getElementById('player');
    if (!playerEl) return;
    playerEl.querySelectorAll('.aura-overflow-linger').forEach(el => el.remove());
    const el = document.createElement('div');
    el.className = 'ability-cooldown aura-overflow-linger';
    el.textContent = '+' + seconds;
    playerEl.appendChild(el);
    setTimeout(() => el.remove(), 950);
}

function updateWeapon() {
    if (player && player.weapon) {
        player.weapon.attack();
    }
}

function showWeaponEvolutionScreen() {
    gameState.isPaused = true;

    document.getElementById('weapon-evolution')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'weapon-evolution';
    overlay.className = 'sf-overlay';
    const gameArea = document.getElementById('game-area') || document.body;
    gameArea.appendChild(overlay);

    const title = document.createElement('h1');
    title.className = 'sf-wevo-title';
    title.textContent = 'Weapon Evolution';
    overlay.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'sf-wevo-sub';
    sub.textContent = 'Choose the path of your weapon\'s ascension';
    overlay.appendChild(sub);

    const row = document.createElement('div');
    row.className = 'sf-row';
    overlay.appendChild(row);

    const weaponOptions = getWeaponEvolutionOptions(player.class);
    const isAuto = gameState.autoWeaponEvolutionEnabled;
    const classKey = player.class === 'Acolyte' ? 'aco' : player.class === 'Sorceress' ? 'sorc' : 'dk';

    const bgImgMap   = { aco:'img/weapons/weapBcgAco.png', sorc:'img/weapons/weapBcgSor.png', dk:'img/weapons/weapBcgDK.png' };
    const weapImgMap = {
        'Vortex Staff':'img/weapons/acoVortexStaff.png', 'Umbral Staff':'img/weapons/acoUmbralStaff.png',
        'Chain Wand':'img/weapons/sorcChainWand.png',    'Spark Wand':'img/weapons/sorcSparkWand.png',
        'Blessed Shield':'img/weapons/dkBlessedShield.png','Smite Shield':'img/weapons/dkSmiteShield.png',
    };

    weaponOptions.forEach((weapon, index) => {
        const wrap = document.createElement('div');
        wrap.className = `sf-wrap ${classKey}${isAuto ? ' wevo-disabled' : ''}`;
        wrap.dataset.index = index;

        const bgSrc   = bgImgMap[classKey]    || '';
        const weapSrc = weapImgMap[weapon.name] || '';
        const imgHtml = `
          <img class="wevo-bg"     src="${bgSrc}"   alt="" onerror="this.style.display='none'">
          <img class="wevo-weapon" src="${weapSrc}" alt="${weapon.name}" onerror="this.style.display='none'">`;

        const statsHtml = weapon.stats.map(s =>
            `<div class="sf-stat ${s.type === 'positive' ? 'green' : s.type === 'negative' ? 'sn' : 'sg'}">` +
            `<span class="sf-bullet">✦</span><span class="sf-stat-text">${s.text}</span></div>`
        ).join('');

        wrap.innerHTML = `
          <div class="wevo-shell">${imgHtml}</div>
          <div class="wevo-name ${classKey}">${weapon.name}</div>
          <div class="sf-plaque">
            <span class="sf-plaque-rule"></span>
            ${statsHtml}
            <span class="sf-plaque-rule-b"></span>
          </div>`;

        if (!isAuto) {
            wrap.addEventListener('click', () => {
                
                row.querySelectorAll('.sf-wrap').forEach(w => w.style.pointerEvents = 'none');
                
                const wepLvlUpSound = document.getElementById('weaponLvlUpSnd');
                if (wepLvlUpSound) { wepLvlUpSound.currentTime = 0; wepLvlUpSound.volume = 0.5; wepLvlUpSound.play().catch(()=>{}); }
                
                wrap.style.transition = 'opacity 0.25s, transform 0.25s';
                wrap.style.opacity = '0';
                wrap.style.transform = 'scale(0.92) translateY(-8px)';
                setTimeout(() => selectWeaponEvolution(weapon), 280);
            });
        }
        row.appendChild(wrap);
    });

    if (isAuto) {
        const selectedWeapon = autoSelectWeaponEvolution(weaponOptions);
        const selectedIndex  = weaponOptions.indexOf(selectedWeapon);
        row.querySelector(`[data-index="${selectedIndex}"]`)?.classList.add('sf-auto-glow');
        setTimeout(() => selectWeaponEvolution(selectedWeapon), 3000);
    }
}

function selectWeaponEvolution(weapon) {
    initializeWeapon(player.class, weapon.name);
    hideWeaponEvolutionScreen();
    gameState.isPaused = false;
    cancelAnimationFrame(animationFrameId);
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
    processNextLevelUp();
}

function autoSelectWeaponEvolution(weaponOptions) {
    const autoChoice = gameState.autoWeaponEvolutionChoices[player.class];
    return (autoChoice && weaponOptions.find(w => w.name === autoChoice)) || weaponOptions[0];
}

function hideWeaponEvolutionScreen() {
    document.getElementById('weapon-evolution')?.remove();
}

function getWeaponEvolutionOptions(playerClass) {
    const weaponMap = {
        'Acolyte': [
            { class: VortexStaff, flavor: 'Channels unstable void currents, tearing open miniature rifts that engulf everything nearby.' },
            { class: UmbralStaff, flavor: 'A conduit of pure darkness, its power does not strike, it focuses void essence into a single, perfect line of annihilation.' }
        ],
        'Sorceress': [
            { class: ChainWand, flavor: 'Weaves lightning through the battlefield, each strike seeking new prey with relentless hunger.' },
            { class: SparkWand, flavor: 'A tempest bound in crystal, its fury knows no bounds but demands sacrifice for its power.' }
        ],
        'Divine Knight': [
            { class: BlessedShield, flavor: 'Forged in sacred light, its divine protection extends far beyond mortal reach.' },
            { class: SmiteShield, flavor: 'Swift as divine judgment, each strike saps the strength of those who dare approach.' }
        ]
    };

    return (weaponMap[playerClass] || []).map(w => {
        const instance = new w.class();
        return { name: instance.name, flavor: w.flavor, stats: instance.getEvolutionStats() };
    });
}

class VortexStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Vortex Staff';
        this.baseDamage = 20;
        this.baseCooldown = 20;
        this.globalRange = 350;
        this.splashRange = 65;
        this.splashMultiplier = 0.5;
        
        if (typeof alloc !== 'undefined') {
            this.splashMultiplier += alloc['void_overflow'] * 0.05;
            
            if (alloc['abyssal_reach'] >= 1) {
                this.splashRange = 110;
            }
        }
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getEvolutionStats() {
        const splashPct = Math.round(this.splashMultiplier * 100);
        const hasRiftCrit = typeof alloc !== 'undefined' && alloc['rift_crit'] >= 1;
        const stats = [
            { text: `Splash Damage: ${splashPct}% (${this.splashRange} range)`, type: 'positive' },
            { text: 'Ability Power: +100%', type: 'positive' },
            { text: `Range: ${this.globalRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
        ];
        if (!hasRiftCrit) {
            stats.push({ text: 'Ability Cannot Crit', type: 'negative' });
        } else {
            stats.push({ text: 'Ability Can Crit (Rift Crit)', type: 'positive' });
        }
        return stats;
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            const { damage, isCritical } = this.calculateDamage();
            target.takeDamage(damage, isCritical);
            this.triggerPlayerAttackAnimation();
            this.splashDamage(target, damage);
        }
    }

    splashDamage(centerEnemy, originalDamage) {
        const splashBase = originalDamage * this.splashMultiplier;
        enemies.forEach(enemy => {
            if (enemy !== centerEnemy && calculateDistance(centerEnemy.position, enemy.position) <= this.splashRange) {
                const isSplashCrit = Math.random() < player.critChance;
                enemy.takeDamage(isSplashCrit ? splashBase * player.critDamage : splashBase, isSplashCrit);
            }
        });
    }

    performAbility() {
        const target = this.findPriorityTarget();
        if (target) {
            
            const canCrit = typeof alloc !== 'undefined' && alloc['rift_crit'] >= 1;
            const isCrit = canCrit && Math.random() < player.critChance;
            const dmg = isCrit ? this.damage * 2 * 2 * player.critDamage : this.damage * 2 * 2;
            target.takeDamage(dmg, isCrit);
            drawVoidBlast(target.position.x + target.radius, target.position.y + target.radius, true);
            
            if (target instanceof EliteEnemy) {
                checkEternalTormentReset(this, target, dmg);
            }
        }
    }
}

class UmbralStaff extends BasicStaff {
    constructor() {
        super();
        this.name = 'Umbral Staff';
        this.baseDamage = 36;
        this.baseCooldown = 25;
        this.globalRange = 450;
        
        if (typeof alloc !== 'undefined') {
            this.baseCooldown = Math.max(5, this.baseCooldown - alloc['umbral_zenith']);
        }
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getEvolutionStats() {
        const hasUmbralCollapse = typeof alloc !== 'undefined' && alloc['umbral_collapse'] >= 1;
        const hasVoidAscension  = typeof alloc !== 'undefined' && alloc['void_ascension']  >= 1;
        const stats = [
            { text: 'High Single Target Damage', type: 'positive' },
            { text: 'Ability Always Crits, -50% Dmg', type: 'positive' },
            { text: `Range: ${this.globalRange}`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
        ];
        if (hasUmbralCollapse) {
            stats.push({ text: 'Umbral Collapse: +100% Boss Damage, +10% Crit Chance', type: 'positive' });
        }
        if (hasVoidAscension) {
            stats.push({ text: 'Void Ascension: Ability fires thrice on random targets', type: 'positive' });
        }
        return stats;
    }

    performAbility() {
        const fireShot = () => {
            
            const isAscension = typeof alloc !== 'undefined' && alloc['void_ascension'] >= 1;
            const target = isAscension ? this.findRandomTarget() : this.findPriorityTarget();
            if (target) {
                const shotDmg = this.damage * 2 * player.critDamage;
                target.takeDamage(shotDmg, true);
                drawVoidBlast(target.position.x + target.radius, target.position.y + target.radius, true);
                if (target instanceof EliteEnemy) checkEternalTormentReset(this, target, shotDmg);
            }
        };

        const shotCount = (typeof alloc !== 'undefined' && alloc['void_ascension'] >= 1) ? 3 : 1;
        for (let i = 0; i < shotCount; i++) fireShot();
    }

    findRandomTarget() {
        const alive = enemies.filter(e => !e.isDying && e.hp > 0);
        if (!alive.length) return null;
        return alive[Math.floor(Math.random() * alive.length)];
    }
}

class ChainWand extends BasicWand {
    constructor() {
        super();
        this.name = 'Chain Wand';
        this.baseDamage = 16;
        this.baseCooldown = 30;
        this.globalRange = 220;
        this.chainRange = 150;
        this.chainCount = 4; 
        this.chainDamageMultiplier = 0.85;
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getEvolutionStats() {
        const chainReverbRanks = typeof sorcAlloc !== 'undefined' ? sorcAlloc['chain_reverb'] : 0;
        const stats = [
            { text: `Chains: +2 targets`, type: 'positive' },
            { text: `Chain Damage: +10% increase`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
            { text: 'Ability Always Crits, -50% Dmg', type: 'neutral' },
            { text: `Range: ${this.globalRange} / Chain ${this.chainRange}`, type: 'neutral' }
        ];
        if (chainReverbRanks >= 1) {
            stats.push({ text: 'Chain Reverb: Active', type: 'positive' });
        }
        return stats;
    }

    performAbility() {
        const abilityDamage = this.damage * player.critDamage * 0.50;
        enemies.forEach(enemy => {
            enemy.takeDamage(abilityDamage, true);
            drawSkyLightning(enemy.position.x + enemy.radius, enemy.position.y + enemy.radius);
        });
    }
}

class SparkWand extends BasicWand {
    constructor() {
        super();
        this.name = 'Spark Wand';
        this.baseDamage = 1;
        this.baseCooldown = 25;
        this.globalRange = 1000;
        this.chainRange = 0;
        this.chainCount = 0;
        this.freezeDuration = 2;
        this.damage = this.baseDamage;
        this.abilityName = 'Flash Freeze';
        this.shockInfusionStacks = 6;
        this.shockStackBonus = 0.10;
        this.shockStackBonusOvercharge = 0.20;
        this.updateDamage();
    }

    getEvolutionStats() {
        const cdRanks = typeof sorcAlloc !== 'undefined' ? sorcAlloc['charged_dominance'] : 0;
        const shockChance = Math.round((0.25 + cdRanks * 0.05) * 100);
        return [
            { text: 'Hits All Enemies', type: 'positive' },
            { text: 'Damage drastically lowered', type: 'negative' },
            { text: 'Ability: Flash Freeze', type: 'positive' },
            { text: `Freeze Duration: ${this.freezeDuration}s`, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
            { text: `Chance to apply Shock: ${shockChance}%`, type: 'positive' }
        ];
    }

    applyShock(enemy, isBoss = false) {
        
        const cdRanks = typeof sorcAlloc !== 'undefined' ? sorcAlloc['charged_dominance'] : 0;
        const baseChance = 0.25 + (cdRanks * 0.05) + (isBoss ? cdRanks * 0.15 : 0);
        if (Math.random() < baseChance) {
            enemy.shockStacks = (enemy.shockStacks || 0) + 1;
        }
    }

    getShockDamageMultiplier(enemy) {
        const stacks = enemy.shockStacks || 0;
        
        const overcharge = typeof sorcAlloc !== 'undefined' && sorcAlloc['overcharge'] >= 1;
        return 1 + stacks * (overcharge ? this.shockStackBonusOvercharge : this.shockStackBonus);
    }

    performAttack() {
        const target = this.findNearestEnemy();
        if (target) {
            this.triggerPlayerAttackAnimation();
            enemies.forEach(enemy => {
                
                const { damage, isCritical } = this.calculateDamage();
                const isBoss = typeof Boss !== 'undefined' && enemy instanceof Boss;
                const shockMult = this.getShockDamageMultiplier(enemy);
                this.dealDamageToEnemy(enemy, damage * shockMult, isCritical);
                this.applyShock(enemy, isBoss);
                drawSparkAttackLightning(
                    enemy.position.x + enemy.radius,
                    enemy.position.y + enemy.radius,
                    isCritical
                );
            });
        }
    }

    performAbility() {
        const shockInfusion = typeof sorcAlloc !== 'undefined' && sorcAlloc['shock_infusion'] >= 1;
        console.log(`[Flash Freeze] shockInfusionStacks: ${this.shockInfusionStacks} | shockStackBonus: ${this.shockStackBonus} | shockStackBonusOvercharge: ${this.shockStackBonusOvercharge}`);
        enemies.forEach(enemy => {
            this.stunEnemy(enemy);
            
            if (shockInfusion) {
                enemy.shockStacks = (enemy.shockStacks || 0) + this.shockInfusionStacks;
                console.log(`[Shock Infusion] Applied ${this.shockInfusionStacks} stacks to enemy. Total stacks: ${enemy.shockStacks}`);
            }
        });

        
        const echoRanks = typeof sorcAlloc !== 'undefined' ? sorcAlloc['tempest_echo'] : 0;
        if (echoRanks > 0 && Math.random() < echoRanks * 0.10) {
            setTimeout(() => {
                if (!player || !player.weapon) return;
                const echoMax = echoRanks >= 3;
                enemies.forEach(enemy => {
                    const dur = echoMax ? this.freezeDuration * 2 : this.freezeDuration;
                    this._stunEnemyDuration(enemy, dur);
                    if (shockInfusion) {
                        enemy.shockStacks = (enemy.shockStacks || 0) + this.shockInfusionStacks;
                        console.log(`[Shock Infusion - Tempest Echo recast] Applied ${this.shockInfusionStacks} stacks to enemy. Total stacks: ${enemy.shockStacks}`);
                    }
                });
            }, 1000);
        }
    }

    _stunEnemyDuration(enemy, dur) {
        enemy.applySpeedEffect(0, dur * 1000);
        enemy.element.classList.add('frozen');
        setTimeout(() => {
            enemy.speed = enemy.baseSpeed;
            enemy.element.classList.remove('frozen');
        }, dur * 1000);
    }

    stunEnemy(enemy) {
        this._stunEnemyDuration(enemy, this.freezeDuration);
    }
}

class BlessedShield extends BasicShield {
    constructor() {
        super();
        this.name = 'Blessed Shield';
        this.baseDamage = 7;
        this.baseCooldown = 45;
        this.globalRange = 200;
        this.abilityDuration = 10000;   
        this.abilityName = 'Holy Fire';
        this.damage = this.baseDamage;
        this._judgementInterval = null;
        this._holyFireActive = false;
        this.updateDamage();
    }

    getEvolutionStats() {
        const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
        const oathJudgement = dAlloc && dAlloc['oath_of_judgement'] >= 1;
        const judgementText = oathJudgement
            ? 'Judgement deals 33% of your damage (66% vs bosses)'
            : 'Judgement deals 25% of your damage';
        const stats = [
            { text: 'Increased Damage', type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
            { text: `Holy Fire duration 10s`, type: 'neutral' },
            { text: judgementText, type: 'positive' },
            { text: 'HP increased by 5', type: 'positive' },
        ];
        if (oathJudgement) stats.push({ text: 'HP regen disabled', type: 'negative' });
        stats.push({ text: `Range: ${this.globalRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' });
        return stats;
    }

    performAbility() {
        
        this._clearHolyFire();

        this._holyFireActive = true;

        
        const aura = document.getElementById('holy-shield-aura');
        if (aura) aura.classList.add('holy-fire-active');

        const originalRange = this.globalRange;
        
        let newRange = originalRange * 1.5;
        
        const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
        const aoRanks = (dAlloc && dAlloc['aura_overflow']) || 0;
        let auraOverflowActive = false;
        let auraOverflowRange = newRange;
        if (aoRanks > 0 && Math.random() < aoRanks * 0.15) {
            auraOverflowActive = true;
            auraOverflowRange = newRange * 1.25;
            this.globalRange = auraOverflowRange;
        } else {
            this.globalRange = newRange;
        }
        player.updateAuraVisual();

        
        const oathJudgement = dAlloc && dAlloc['oath_of_judgement'] >= 1;

        
        this._judgementInterval = setInterval(() => {
            enemies.forEach(enemy => {
                if (!this.isInRange(enemy)) return;
                if (enemy.hasJudgement) {
                    
                    let dmgMult;
                    if (oathJudgement) {
                        dmgMult = enemy instanceof Boss ? 0.66 : 0.33;
                    } else {
                        dmgMult = 0.25;
                    }
                    
                    const baseDmg = this.damage * dmgMult;
                    
                    const hasSanctified = player.classUpgradeChosen === 'Sanctified';
                    let finalDmg = baseDmg;
                    let isCrit = false;
                    if (hasSanctified && Math.random() < player.critChance) {
                        finalDmg = baseDmg * player.critDamage;
                        isCrit = true;
                    }
                    enemy.takeDamage(finalDmg, false);
                    this._showJudgementNumber(enemy, finalDmg, isCrit);
                } else {
                    
                    enemy.hasJudgement = true;
                }
            });
        }, 200);

        setTimeout(() => {
            this._clearHolyFire();
            
            if (auraOverflowActive && aoRanks >= 3) {
                showAuraOverflowLinger(3);
                setTimeout(() => { showAuraOverflowLinger(2); }, 1000);
                setTimeout(() => { showAuraOverflowLinger(1); }, 2000);
                setTimeout(() => {
                    this.globalRange = originalRange;
                    player.updateAuraVisual();
                }, 3000);
            } else {
                this.globalRange = originalRange;
                player.updateAuraVisual();
            }
        }, this.abilityDuration);
    }

    _clearHolyFire() {
        if (this._judgementInterval) {
            clearInterval(this._judgementInterval);
            this._judgementInterval = null;
        }
        this._holyFireActive = false;

        
        enemies.forEach(e => { e.hasJudgement = false; });

        
        const aura = document.getElementById('holy-shield-aura');
        if (aura) aura.classList.remove('holy-fire-active');
    }

    _showJudgementNumber(enemy, amount, isCrit) {
        if (!enemy.element) return;
        const el = document.createElement('div');
        el.className = 'damage-indicator judgement-indicator';
        el.textContent = Math.round(amount);
        el.style.color    = isCrit ? '#ff6600' : '#ff3333';
        el.style.fontSize = isCrit ? '22px' : '14px';
        el.style.textShadow = '0 0 6px #ff0000, 0 0 12px #aa0000';

        const offset = (enemy.damageIndicators ? enemy.damageIndicators.length : 0) * 20;
        el.style.top   = `-${20 + offset}px`;
        el.style.right = `${-25 + offset}px`;   

        enemy.element.appendChild(el);

        setTimeout(() => { el.style.opacity = 1; el.style.top = `-${40 + offset}px`; }, 0);
        setTimeout(() => { el.style.opacity = 0; el.style.top = `-${60 + offset}px`; }, 500);
        setTimeout(() => { el.remove(); }, 1000);
    }
}

class SmiteShield extends BasicShield {
    constructor() {
        super();
        this.name = 'Smite Shield';
        this.baseDamage = 4;
        this.baseCooldown = 25;
        this.globalRange = 130;
        this.abilityDuration = 2000;
        this.slowPercent = 25;
        this.attackSpeedBonus = 1.0;
        this.damage = this.baseDamage;
        this.updateDamage();
    }

    getAttackSpeed() {
        return player.attacksPerSecond + this.attackSpeedBonus;
    }

    getEvolutionStats() {
        const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
        const hasAegis    = dAlloc && dAlloc['oath_of_aegis'] >= 1;
        const hasEternity = dAlloc && dAlloc['oath_of_eternity'] >= 1;
        const sdRanks     = (dAlloc && dAlloc['sanctified_domain']) || 0;
        const slowPct     = 25 + sdRanks * 5;
        const slowLine    = sdRanks > 0
            ? `Slows enemies by ${slowPct}%, -${sdRanks * 12}% enemy attack speed`
            : `Slows enemies by ${slowPct}%`;
        const stats = [
            { text: 'Rapid Aura ticks', type: 'positive' },
            { text: slowLine, type: 'positive' },
            { text: `Ability Cooldown: ${this.baseCooldown}s`, type: 'neutral' },
            { text: 'Ability freezes enemies for 2s', type: 'neutral' },
        ];
        if (hasEternity) {
            stats.push({ text: 'HP regen cap removed', type: 'positive' });
        }
        if (hasAegis) {
            stats.push({ text: 'Enemies have 33% chance to miss (66% vs bosses)', type: 'positive' });
        }
        stats.push({ text: `Range: ${this.globalRange}`, type: this.globalRange < 200 ? 'negative' : this.globalRange <= 400 ? 'neutral' : 'positive' });
        return stats;
    }

    performAttack() {
        const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
        const sdRanks = (dAlloc && dAlloc['sanctified_domain']) || 0;
        enemies.forEach(enemy => {
            if (this.isInRange(enemy)) {
                const { damage, isCritical } = this.calculateDamage();
                enemy.takeDamage(damage, isCritical);
                
                let totalSlowPct = this.slowPercent;
                
                if (sdRanks > 0) totalSlowPct += sdRanks * 5;
                enemy.applySpeedEffect(1 - (totalSlowPct / 100), 1000);
                
                if (sdRanks > 0) {
                    enemy.sanctifiedDomainDebuff = sdRanks * 0.12;
                }
            } else {
                
                if (enemy.sanctifiedDomainDebuff) enemy.sanctifiedDomainDebuff = 0;
            }
        });
    }

    performAbility() {
        const originalRange = this.globalRange;
        
        let newRange = originalRange * 2.5;
        
        const dAlloc = typeof dkAlloc !== 'undefined' ? dkAlloc : null;
        const aoRanks = (dAlloc && dAlloc['aura_overflow']) || 0;
        let auraOverflowActive = false;
        if (aoRanks > 0 && Math.random() < aoRanks * 0.15) {
            auraOverflowActive = true;
            newRange *= 1.25;
        }
        this.globalRange = newRange;
        player.updateAuraVisual();
        enemies.forEach(enemy => {
            if (this.isInRange(enemy)) {
                enemy.applySpeedEffect(0.2, 5000);
            }
        });
        setTimeout(() => {
            if (auraOverflowActive && aoRanks >= 3) {
                showAuraOverflowLinger(3);
                setTimeout(() => { showAuraOverflowLinger(2); }, 1000);
                setTimeout(() => { showAuraOverflowLinger(1); }, 2000);
                setTimeout(() => {
                    this.globalRange = originalRange;
                    player.updateAuraVisual();
                }, 3000);
            } else {
                this.globalRange = originalRange;
                player.updateAuraVisual();
            }
        }, this.abilityDuration);
    }
}