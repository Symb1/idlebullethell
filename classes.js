class Acolyte extends Player {
    constructor() {
        super('Acolyte');
        this.maxHp = this.getInitialHP();
        this.hp = this.maxHp;
        this.attacksPerSecond *= 0.9;
        this.critChance += 0.04;
        this.critDamage += 1.2;
		this.amuletDamage = 4;
		this.bossDamageBonus = 0.1;
		this.image = 'acoatt.png';
    }

    getInitialHP() {
        return super.getInitialHP() + 3;
    }
}

class Sorceress extends Player {
    constructor() {
        super('Sorceress');
        this.maxHp = this.getInitialHP();
        this.hp = this.maxHp;
        this.attacksPerSecond += 0.2; 
        this.critChance += 0.24;
        this.critDamage += 0.05;
		this.amuletDamage = 3;
		this.bossDamageBonus = 0.3;
		this.image = 'sorc.png';
    }

    getInitialHP() {
        return super.getInitialHP() + 1; 
    }
}

class DivineKnight extends Player {
    constructor() {
        super('Divine Knight');
        this.maxHp = this.getInitialHP();
        this.hp = this.maxHp;
        this.attacksPerSecond += 1.5;
        this.critChance = 0;
        this.critDamage += 0;
        this.image = 'divi.png';
		this.amuletDamage = 2;
		this.bossDamageBonus = 0.5;
        this.showAura();
    }

    showAura() {
        const aura = document.getElementById('holy-shield-aura');
        if (aura) {
            aura.style.display = 'block';
            this.updateAuraVisual();
        }
    }

    updateAuraVisual() {
        const aura = document.getElementById('holy-shield-aura');
        if (aura && this.weapon) {
            const size = this.weapon.globalRange * 1.93;
            aura.style.width = `${size}px`;
            aura.style.height = `${size}px`;
            
            // Get the game area's position
            const gameArea = document.getElementById('game-area');
            const gameAreaRect = gameArea.getBoundingClientRect();
            
            // Calculate the aura's position relative to the game area
            const left = gameAreaRect.left + this.position.x - size/2;
            const top = gameAreaRect.top + this.position.y - size/2;
            
            aura.style.left = `${left}px`;
            aura.style.top = `${top}px`;
        }
    }

    getInitialHP() {
        return super.getInitialHP() + 5; // Divine Knight's initial HP
    }
}
