// Class descriptions - accessible globally
const classDescriptions = {
    'Acolyte': `
        <p>Void caster with slower base attack speed but heavy single-target damage. Starts with lower critical chance but far higher critical damage.</p>
        <p><em>Ability:</em> Void Blast automatically launches into elites and bosses for instant elimination.</p>
        <p><em>Weapon Evolutions: (Level 10)</em></p>
        <ul>
            <li>Single target path: Guaranteed crits with Void Blast.</li>
            <li>Splash variant: Removes crit with Void Blast, adds area effect at 50% power.</li>
        </ul>
        <p><em>Class Evolutions: (Level 15)</em> Focus either on speed, crit, or cooldown mastery.</p>
    `,
    'Sorceress': `
        <p>A versatile spellcaster with balanced offensive capabilities.</p>
        <p>Swift attacks and magical prowess.</p>
    `,
    'Divine Knight': `
        <p>A holy warrior combining defensive prowess with righteous fury.</p>
        <p>Unmatched endurance and divine power.</p>
    `
};
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
        this.classColor = '#9370DB'; // Purple for Acolyte
        this.classUpgradeChosen = gameState.classUpgradeChosen || null;
    }
    
    static getDescription() {
        return classDescriptions['Acolyte'];
    }
    
    getDisplayName() {
        if (this.classUpgradeChosen) {
            return `${this.classUpgradeChosen} Acolyte`;
        }
        return 'Acolyte';
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
        this.classColor = '#4169E1'; // Blue for Sorceress
        this.classUpgradeChosen = gameState.classUpgradeChosen || null;
    }
    
    getDisplayName() {
        if (this.classUpgradeChosen) {
            return `${this.classUpgradeChosen} Sorceress`;
        }
        return 'Sorceress';
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
        this.classColor = '#FFD700'; // Gold for Divine Knight
        this.classUpgradeChosen = gameState.classUpgradeChosen || null;
        this.showAura();
    }
    
    getDisplayName() {
        if (this.classUpgradeChosen) {
            return `${this.classUpgradeChosen} Divine Knight`;
        }
        return 'Divine Knight';
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
