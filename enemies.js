let enemies = [];

class Enemy {
  static hurtSoundIndex = 0;
  static currentlyPlayingHurtSounds = 0;
    constructor() {
        this.baseSpeed = 24;
        this.radius = 10;
        this.speedEffects = [];
        this.resetEnemy();
        this.damageIndicators = [];
        this.isDying = false;
		this.isPlayingHitAnimation = false;
		
    }

    resetEnemy() {
        this.hp = this.getInitialHP();
        this.maxHp = this.hp;
        this.position = this.getRandomPosition();
        this.lastDamageTime = 0;
        if (this.element) {
            this.element.remove();
        }
        this.element = this.createEnemyElement();
        this.hpElement = this.createHpElement();
        this.damageIndicator = this.createDamageIndicator();
        this.isDying = false;
		this.isPlayingHitAnimation = false;
    }

    getInitialHP() {
        const baseHP = 10;
        const waveIncrease = 1 + (gameState.currentWave - 1) * 0.04;
        const stageMultiplier = Math.pow(1.9, gameState.currentStage - 1);
        return Math.floor(baseHP * waveIncrease * stageMultiplier);
    }

    getRandomPosition() {
        const side = Math.floor(Math.random() * 4);
        const x = side % 2 === 0 ? Math.random() * 800 : (side === 1 ? 800 : 0);
        const y = side % 2 === 1 ? Math.random() * 600 : (side === 2 ? 600 : 0);
        return { x, y };
    }




  createEnemyElement() {
    const gameArea = document.getElementById('game-area');
    const enemyElement = document.createElement('div');
    
    // All enemy types now use sprite animation
    enemyElement.className = 'enemy sprite';
    
    if (this instanceof EliteEnemy) {
        enemyElement.classList.add('elite');
    }
    if (this instanceof Boss) {
        enemyElement.classList.add('boss');
    }
    
    enemyElement.style.left = `${this.position.x}px`;
    enemyElement.style.top = `${this.position.y}px`;
    gameArea.appendChild(enemyElement);
    return enemyElement;
   }
    
    createHpElement() {
        const hpElement = document.createElement('div');
        hpElement.className = 'enemy-hp';
        this.element.appendChild(hpElement);
        return hpElement;
    }

    createDamageIndicator() {
        const damageIndicator = document.createElement('div');
        damageIndicator.className = 'damage-indicator';
        this.element.appendChild(damageIndicator);
        return damageIndicator;
    }

    updateHpText() {
        this.hpElement.textContent = `${Math.max(0, Math.ceil(this.hp))}/${this.maxHp} HP`;
    }

    applySpeedEffect(factor, duration) {
        const effect = { factor, endTime: Date.now() + duration };
        this.speedEffects.push(effect);
        
        this.element.classList.toggle('slowed', factor < 1);
        this.element.classList.toggle('sped-up', factor > 1);
        setTimeout(() => {
            this.speedEffects = this.speedEffects.filter(e => e !== effect);
            this.element.classList.remove('slowed', 'sped-up');
        }, duration);
    }

    getCurrentSpeed() {
        const now = Date.now();
        this.speedEffects = this.speedEffects.filter(effect => effect.endTime > now);
        const speedFactor = this.speedEffects.reduce((factor, effect) => factor * effect.factor, 1);
        return this.baseSpeed * speedFactor;
    }

    move(deltaTime) {
    const currentSpeed = this.getCurrentSpeed();
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        // Flip sprite based on movement direction
        if (dx < 0) {
            this.element.classList.add('facing-left');
        } else {
            this.element.classList.remove('facing-left');
        }
        
        let vx = (dx / distance) * currentSpeed * deltaTime;
        let vy = (dy / distance) * currentSpeed * deltaTime;
        
        // Check for collisions with other enemies
        enemies.forEach(otherEnemy => {
            if (otherEnemy !== this) {
                const sepX = this.position.x - otherEnemy.position.x;
                const sepY = this.position.y - otherEnemy.position.y;
                const sepDistance = Math.sqrt(sepX * sepX + sepY * sepY);
                
                if (sepDistance < this.radius + otherEnemy.radius) {
                    const overlap = (this.radius + otherEnemy.radius - sepDistance) / 2;
                    const pushX = (sepX / sepDistance) * overlap;
                    const pushY = (sepY / sepDistance) * overlap;
                    
                    this.position.x += pushX;
                    this.position.y += pushY;
                    otherEnemy.position.x -= pushX;
                    otherEnemy.position.y -= pushY;
                    
                    // Adjust velocity to move around other enemies
                    vx += pushX * 0.1;
                    vy += pushY * 0.1;
                }
            }
        });
        
        // Apply the adjusted velocity
        this.position.x += vx;
        this.position.y += vy;
        
        // Keep enemies within the game area
        this.position.x = Math.max(0, Math.min(this.position.x, 800 - this.radius * 2));
        this.position.y = Math.max(0, Math.min(this.position.y, 600 - this.radius * 2));
        
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
        this.updateHpText();
    }
}

    takeDamage(amount, isCritical = false) {
 
    if (this.hp <= 0 || this.isDying) return;

    const actualDamage = Math.max(0, amount);
    const willDie = this.hp - actualDamage <= 0;
    this.hp = Math.max(0, this.hp - actualDamage);

    this.updateHpText();
    this.showDamageIndicator(actualDamage, isCritical);
    this.createHitSprite();

    // Play hurt sound only if enemy doesn't die and less than 3 sounds playing
    if (!willDie && Enemy.currentlyPlayingHurtSounds < 3) {
        Enemy.hurtSoundIndex = (Enemy.hurtSoundIndex % 3) + 1;
        const hurtAudio = document.getElementById(`skelehurtmu${Enemy.hurtSoundIndex}`);
        if (hurtAudio) {
            hurtAudio.currentTime = 0;
            hurtAudio.volume = 0.3;
            // Keep normal playback speed (no playbackRate adjustment)
            
            Enemy.currentlyPlayingHurtSounds++;
            hurtAudio.onended = () => Enemy.currentlyPlayingHurtSounds--;
            
            hurtAudio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    if (this.hp <= 0 && !this.isDying) {
        this.die(isCritical);
    }
}

showDamageIndicator(amount, isCritical) {
    const damageIndicator = document.createElement('div');
    damageIndicator.className = 'damage-indicator';
    damageIndicator.textContent = Math.round(amount);
    
    if (isCritical) {
        damageIndicator.style.color = 'orange';
        damageIndicator.style.fontSize = '25px';
    } else {
        damageIndicator.style.color = 'yellow';
        damageIndicator.style.fontSize = '16px';
    }
    
    const offset = this.damageIndicators.length * 20;
    damageIndicator.style.top = `-${20 + offset}px`;
    damageIndicator.style.right = `${offset}px`;
    
    this.element.appendChild(damageIndicator);
    this.damageIndicators.push(damageIndicator);

    // Use separate properties instead of transform
    setTimeout(() => {
        damageIndicator.style.opacity = 1;
        damageIndicator.style.top = `-${40 + offset}px`;
    }, 0);

    setTimeout(() => {
        damageIndicator.style.opacity = 0;
        damageIndicator.style.top = `-${60 + offset}px`;
    }, 500);

    setTimeout(() => {
        this.element.removeChild(damageIndicator);
        this.damageIndicators = this.damageIndicators.filter(di => di !== damageIndicator);
    }, 1000);
}


createHitSprite() {
    const sprite = document.createElement("div");
    sprite.className = "hit-sprite";

    // center of enemy (no upward movement)
    sprite.style.left = `50%`;
    sprite.style.top = `50%`;

    this.element.appendChild(sprite);

    // remove after animation ends
    setTimeout(() => {
        if (sprite.parentNode) sprite.remove();
    }, 450); // matches animation duration
}



    getExpMultiplier() {
        const multiplier = 1 + (gameState.currentStage - 1) * 0.5;
        return multiplier;
    }

 die(isCritical = false) {
    if (this.isDying) return;
    this.isDying = true;
    
    // Play death sound based on crit
    const deathSound = isCritical ? 'skelediemu2' : 'skelediemu1';
    const audio = document.getElementById(deathSound);
    if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.3;
        // Match playback speed to player's attack speed
        audio.playbackRate = Math.min(player.attacksPerSecond / 1.0, 3.0);
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    const soulsGained = Math.floor(this.maxHp * 0.1);
    player.gainSouls(soulsGained); 
    const expMultiplier = this.getExpMultiplier();
    const expGain = 10 * expMultiplier;
    player.gainExp(expGain);
    
    // Add death animation for all enemy types
    this.element.classList.add('dying');
    
    setTimeout(() => {
        this.element.remove();
        enemies = enemies.filter(e => e !== this);
    }, 1000);
 }
}

class EliteEnemy extends Enemy {
    constructor() {
        super();
        this.radius = 35;
        this.activeEffects = [];
        this.resetEliteEnemy();
    }

    resetEliteEnemy() {
        this.hp *= 2;
        this.maxHp = this.hp;
        this.baseSpeed *= 0.9;
        this.element.classList.add('elite');
        this.abilities = this.selectAbilities();
        this.updateHpText();
    }

    selectAbilities() {
        const allAbilities = ['Weakness', 'Mind Freeze', 'Rally'];
        if (gameState.currentStage <= 2) {
            return [this.getRandomAbility(allAbilities)];
        } else if (gameState.currentStage <= 4) {
            return this.getRandomAbilities(allAbilities, 2);
        } else {
            return allAbilities;
        }
    }

    getRandomAbility(abilities) {
        return abilities[Math.floor(Math.random() * abilities.length)];
    }

    getRandomAbilities(abilities, count) {
        const shuffled = [...abilities].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    useAbilities() {
        this.abilities.forEach(ability => {
            switch(ability) {
                case 'Weakness':
                    this.useWeakness();
                    break;
                case 'Mind Freeze':
                    this.useMindFreeze();
                    break;
                case 'Rally':
                    this.useRally();
                    break;
            }
        });
        this.abilities = [];
    }

    useWeakness() {
        const originalDamage = player.weapon.damage;
        player.weapon.damage *= 0.75;
        console.log('Elite used Weakness: Player damage reduced by 25% for 5 seconds');
        
        const playerElement = document.getElementById('player');
        playerElement.classList.add('weakened');
        
        const timer = setTimeout(() => {
            this.endWeakness(originalDamage, playerElement);
        }, 10000);
        
        this.activeEffects.push({ name: 'Weakness', timer, playerElement });
    }

    endWeakness(originalDamage, playerElement) {
        player.weapon.damage = originalDamage;
        console.log('Weakness effect ended: Player damage restored');
        playerElement.classList.remove('weakened');
        this.activeEffects = this.activeEffects.filter(effect => effect.name !== 'Weakness');
    }

    useMindFreeze() {
        const originalAttackSpeed = player.attacksPerSecond;
        player.attacksPerSecond *= 0.75;
        console.log('Elite used Mind Freeze: Player attack speed reduced by 25% for 5 seconds');
        
        const overlay = document.createElement('div');
        overlay.className = 'mind-freeze-overlay';
        document.getElementById('game-area').appendChild(overlay);
        
        const timer = setTimeout(() => {
            this.endMindFreeze(originalAttackSpeed, overlay);
        }, 10000);
        
        this.activeEffects.push({ name: 'MindFreeze', timer, overlay });
    }

    endMindFreeze(originalAttackSpeed, overlay) {
        player.attacksPerSecond = originalAttackSpeed;
        console.log('Mind Freeze effect ended: Player attack speed restored');
        if (document.getElementById('game-area').contains(overlay)) {
            document.getElementById('game-area').removeChild(overlay);
        }
        this.activeEffects = this.activeEffects.filter(effect => effect.name !== 'MindFreeze');
    }

    useRally() {
    const rallyDuration = 4000; 
    enemies.forEach(enemy => enemy.applySpeedEffect(1.25, rallyDuration));
    console.log(`Elite used Rally: Enemy speed increased by 25% for ${rallyDuration / 1000} seconds`);
    
    const indicator = document.createElement('div');
    indicator.className = 'elite-rally-indicator';
    this.element.appendChild(indicator);
    setTimeout(() => this.element.removeChild(indicator), rallyDuration);
    }

    // EliteEnemy die method
die(isCritical = false) {
    if (this.isDying) return;
    this.isDying = true;
    
    // Play death sound based on crit
    const deathSound = isCritical ? 'skelediemu2' : 'skelediemu1';
    const audio = document.getElementById(deathSound);
    if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.3;
        audio.playbackRate = Math.min(player.attacksPerSecond / 1.0, 3.0);
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    const soulsGained = Math.floor(this.maxHp * 0.2);
    player.gainSouls(soulsGained);
    this.activeEffects.forEach(effect => {
        clearTimeout(effect.timer);
        switch (effect.name) {
            case 'Rally':
                this.endRally(1.2, effect.indicator);
                break;
            case 'MindFreeze':
                this.endMindFreeze(player.attacksPerSecond / 0.75, effect.overlay);
                break;
            case 'Weakness':
                this.endWeakness(player.weapon.damage / 0.75, effect.playerElement);
                break;
        }
    });
    
    this.activeEffects = [];
    
    player.gainExp(30 * this.getExpMultiplier());
    
    // Add death animation
    this.element.classList.add('dying');
    
    setTimeout(() => {
        this.element.remove();
        enemies = enemies.filter(e => e !== this);
    }, 1300);
 }
}

class Boss extends Enemy {
    constructor() {
        super();
        this.radius = 45;
        this.resetBoss();
    }

    resetBoss() {
        this.hp = this.getInitialHP() * 20;
        this.maxHp = this.hp;
        this.baseSpeed *= 0.4;
        this.element.classList.add('boss');
        this.updateHpText();
    }

    takeDamage(amount, isCritical = false) {
        const bossDamageBonus = player.getBossDamageBonus();
        const totalDamage = amount * (1 + bossDamageBonus);
        console.log(`Base damage: ${amount}, Boss bonus: ${bossDamageBonus}, Total damage: ${totalDamage}`);
        super.takeDamage(totalDamage, isCritical);
    }


    die() {
    if (this.isDying) return;
    this.isDying = true;

    const soulsGained = Math.floor(this.maxHp * 0.2);
    player.gainSouls(soulsGained);
    player.gainExp(100 * this.getExpMultiplier());

    if (!gameState.amuletDropped) {
        gameState.amuletDropped = true;
        player.equipAmulet();
        updateInventoryUI();
        showAmuletFoundText();
    }

    // Add death animation
    this.element.classList.add('dying');

    setTimeout(() => {
        this.element.remove();
        enemies = enemies.filter(e => e !== this);
    }, 600); // Match the animation duration (0.6s from CSS)
}
}

function spawnEnemies() {
    enemies = []; // Clear the enemies array before spawning new ones
    const enemyCount = 5 + gameState.currentWave - 1;

    // Spawn boss at the start of each stage from stage 2 onwards
    if (gameState.currentStage >= 2 && gameState.currentWave === 1) {
        let boss = new Boss();
        enemies.push(boss);
        showBossSpawnedText();
    }

    for (let i = 0; i < enemyCount; i++) {
        let newEnemy = new Enemy();
        let attempts = 0;
        while (attempts < 100) {
            let overlap = false;
            for (let j = 0; j < enemies.length; j++) {
                const dx = newEnemy.position.x - enemies[j].position.x;
                const dy = newEnemy.position.y - enemies[j].position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < newEnemy.radius + enemies[j].radius) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) {
                break;
            }
            newEnemy.position = newEnemy.getRandomPosition();
            attempts++;
        }
        enemies.push(newEnemy);
    }

    if (gameState.currentWave % 5 === 0) {
        let eliteEnemy = new EliteEnemy();
        let attempts = 0;
        while (attempts < 100) {
            let overlap = false;
            for (let j = 0; j < enemies.length; j++) {
                const dx = eliteEnemy.position.x - enemies[j].position.x;
                const dy = eliteEnemy.position.y - enemies[j].position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < eliteEnemy.radius + enemies[j].radius) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) {
                break;
            }
            eliteEnemy.position = eliteEnemy.getRandomPosition();
            attempts++;
        }
        enemies.push(eliteEnemy);
        eliteEnemy.useAbilities(); // Trigger abilities immediately upon spawn		
    }
}

function showBossSpawnedText() {
    const gameArea = document.getElementById('game-area');
    const bossText = document.createElement('div');
    bossText.textContent = "Boss Spawned";
    bossText.style.position = 'absolute';
    bossText.style.top = '40%';
    bossText.style.left = '50%';
    bossText.style.transform = 'translate(-50%, -50%)';
    bossText.style.fontSize = '30px';
    bossText.style.color = 'red';
    bossText.style.fontWeight = 'bold';
    gameArea.appendChild(bossText);

    setTimeout(() => {
        bossText.remove();
    }, 3000);
}

function showAmuletFoundText() {
    const gameArea = document.getElementById('game-area');
    const amuletText = document.createElement('div');
    amuletText.textContent = "Amulet Found!";
    amuletText.style.position = 'absolute';
    amuletText.style.top = '60%';
    amuletText.style.left = '50%';
    amuletText.style.transform = 'translate(-50%, -50%)';
    amuletText.style.fontSize = '30px';
    amuletText.style.color = 'blue';
    amuletText.style.fontWeight = 'bold';
    gameArea.appendChild(amuletText);

    setTimeout(() => {
        amuletText.remove();
    }, 3500);
}

function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        if (!enemy.isDying) {
            enemy.move(deltaTime);
        }
        if (enemy instanceof EliteEnemy && !enemy.isDying) {
            enemy.useAbilities();
        }
    });
}