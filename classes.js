const classDescriptions = {
    'Acolyte': `
        <p>Void caster with slower base attack speed but heavy single-target damage. Starts with lower critical chance but far higher critical damage.</p>
        <p><em>Ability:</em> Void Blast automatically launches into elites and bosses for instant elimination.</p>
        <p><em>Weapon Evolutions: (Level 10)</em></p>
        <ul>
            <li>Single target path: Guaranteed crits with Void Blast.</li>
            <li>Splash variant: Removes crit with Void Blast, adds area effect at 50% power.</li>
        </ul>
        <p><em>Class Evolutions: (Level 20)</em> Focus either on speed, crit, or cooldown mastery.</p>
    `,
    'Sorceress': `
    <p>Spellcaster with swift attacks and the high base critical chance. Moderate single target damage, but strikes chain to nearby enemies on every hit.</p>
    <p><em>Ability:</em> Lightning Storm calls down sky strikes on all enemies simultaneously.</p>
    <p><em>Weapon Evolutions: (Level 10)</em></p>
    <ul>
        <li>Chain path: More chain targets, higher chain damage retention, and a guaranteed crit ability.</li>
        <li>Spark path: Removes chaining, hits all enemies at once at reduced damage. Replaces Lightning Storm with Flash Freeze, freezing them in place.</li>
    </ul>
    <p><em>Class Evolutions: (Level 20)</em> Focus on raw attack speed, crit stacking, or adding an extra chain target with improved bounce damage.</p>
`,
'Divine Knight': `
    <p>Paladin who damages every enemy inside an aura. Has zero critical chance by default, but it can be later on modified.</p>
    <p><em>Ability:</em> Holy Radiance temporarily expands the aura's reach.</p>
    <p><em>Weapon Evolutions: (Level 10)</em></p>
    <ul>
        <li>Blessed Shield: Longer ability duration and increased damage.</li>
        <li>Smite Shield: Faster attacks and a permanent slow on all enemies inside the aura, also briefly freezes the extended area.</li>
    </ul>
    <p><em>Class Evolutions: (Level 20)</em> Increase your attack speed, unlock critical hits globally via Sanctified Oath, or get massive health and damage at the cost of a heavy cooldown penalty.</p>
`,
};

// ============================================================
//  TALENT TREE — Acolyte Void Mastery
// ============================================================

const NODES = [
  { id:'void_rupture',    label:'Void Rupture',        abbr:'VR', cx:300, cy:690, max:5,
    req:null, reqPts:0,
    desc: p => p >= 5 ? `Current bonus: +${p*10*2}% Critical Damage` : `Current bonus: +${p*10}% Critical Damage`,
    per:'+10% Critical Damage per rank', bonus:true },
  { id:'abyssal_core',    label:'Abyssal Core',         abbr:'AC', cx:205, cy:650, max:3,
    req:'void_rupture', reqPts:3,
    desc: p => `Current bonus: +${(p*1).toFixed(1)} Base Damage`,
    per:'+1 Base Damage to Acolyte per rank' },
  { id:'dark_precision',  label:'Dark Precision',       abbr:'DP', cx:300, cy:540, max:5,
    req:'void_rupture', reqPts:2,
    desc: p => p >= 5 ? `Current bonus: +${p*2}% Critical Chance` : `Current bonus: +${p}% Critical Chance`,
    per:'+1% Critical Chance per rank', bonus:true },
  { id:'eternal_torment', label:'Eternal Torment',      abbr:'ET', cx:85,  cy:570, max:3,
    req:'abyssal_core', reqPts:3,
    desc: p => `Current bonus: +${p*10}% Chance to reset ability cooldown on elite hit`,
    per:'+10% chance per rank to reset cooldown on elite hit',
    bonus:'Max rank: 100% reset chance if damage dealt is ≤25% of elite\'s current HP.' },
  { id:'void_overflow',   label:'Void Overflow',        abbr:'VO', cx:170, cy:420, max:5,
    req:'dark_precision', reqPts:2,
    desc: p => `Current bonus: +${p*5}% Vortex Staff splash damage`,
    per:'+5% Vortex Staff splash damage per rank' },
  { id:'umbral_zenith',   label:'Umbral Zenith',        abbr:'UZ', cx:430, cy:420, max:5,
    req:'dark_precision', reqPts:2,
    desc: p => `Current bonus: -${p} sec Umbral Staff ability cooldown`,
    per:'-1s Umbral Staff cooldown per rank' },
  { id:'siphon_vitality', label:'Siphon Vitality',      abbr:'SV', cx:300, cy:210, max:5,
    req:'dark_precision', reqPts:3,
    desc: p => p >= 5 ? `Current bonus: +${(p*0.05*2).toFixed(2)} HP regen` : `Current bonus: +${(p*0.05).toFixed(2)} HP regen`,
    per:'+0.05 HP Regen per rank', bonus:true },
  { id:'rift_crit',       label:'Rift Crit',            abbr:'RC', cx:115, cy:285, max:1, bvow:true, tgroup:'a',
    req:'void_overflow', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Vortex Staff abilities gain critical strike capability',
    ascNote:'Requires 1 Ascension' },
  { id:'abyssal_reach',   label:'Abyssal Reach',        abbr:'AR', cx:225, cy:285, max:1, bvow:true, tgroup:'a',
    req:'void_overflow', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Vortex Staff splash radius increased to 110',
    ascNote:'Requires 1 Ascension' },
  { id:'umbral_collapse', label:'Umbral Collapse',      abbr:'UC', cx:370, cy:285, max:1, bvow:true, tgroup:'b',
    req:'umbral_zenith', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Umbral Staff boss damage increased by +100% and +10% Critical Chance',
    ascNote:'Requires 1 Ascension' },
  { id:'void_ascension',  label:'Void Ascension',       abbr:'VA', cx:480, cy:285, max:1, bvow:true, tgroup:'b',
    req:'umbral_zenith', reqPts:3, reqAscension:1, desc:()=>'',
    per:"Umbral Staff's ability now fires thrice, targeting random enemies",
    ascNote:'Requires 1 Ascension' },
  { id:'temporal_excellence', label:'Temporal Excellence', abbr:'TE', cx:170, cy:50, max:5, bvow:true, tgroup:'c',
    req:'siphon_vitality', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Current bonus: -${p*5}% Temporal Shard damage penalty` : '',
    per:'-5% Temporal Shard damage penalty per rank',
    ascNote:'Requires 2 Ascensions' },
  { id:'abyssal_excellence',  label:'Abyssal Excellence',  abbr:'AE', cx:300, cy:50, max:5, bvow:true, tgroup:'c',
    req:'siphon_vitality', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Current bonus: -${p*6}% Abyssal Shard attack speed penalty` : '',
    per:'-6% Abyssal Shard attack speed penalty per rank',
    ascNote:'Requires 2 Ascensions' },
  { id:'ravenous_excellence', label:'Ravenous Excellence', abbr:'RE', cx:430, cy:50, max:5, bvow:true, tgroup:'c',
    req:'siphon_vitality', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Current bonus: -${p}% crit chance penalty, -${p*6}% cooldown penalty` : '',
    per:'-1% Ravenous crit chance penalty and -6% cooldown penalty per rank',
    ascNote:'Requires 2 Ascensions' },
];

const GROUPS  = { a:['rift_crit','abyssal_reach'], b:['umbral_collapse','void_ascension'], c:['temporal_excellence','abyssal_excellence','ravenous_excellence'] };
const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));
const alloc   = Object.fromEntries(NODES.map(n => [n.id, 0]));
let talentPoints = 0;

const unlocked     = n => !n.req || alloc[n.req] >= n.reqPts;
const ascUnlocked  = n => !n.reqAscension || (typeof gameState !== 'undefined' && gameState.ascensionLevel >= n.reqAscension);
const rivalFree    = n => !n.tgroup || !GROUPS[n.tgroup].filter(id => id !== n.id).some(id => alloc[id] > 0);
const canInvest    = n => unlocked(n) && ascUnlocked(n) && alloc[n.id] < n.max && talentPoints > 0 && rivalFree(n);
const canRefund = n => alloc[n.id] > 0 && NODES.filter(d => d.req === n.id && alloc[d.id] > 0).every(d => alloc[n.id] - 1 >= d.reqPts);

let refundMsgTimer = null;
function showBlocked(n) {
  const el = document.getElementById('refund-msg');
  if (!el) return;
  el.textContent = 'Other talents may rely on this, cannot unlearn.';
  const r = document.getElementById('node-' + n.id).getBoundingClientRect();
  el.style.left = (r.left + r.width / 2) + 'px';
  el.style.top  = (r.top - 50) + 'px';
  el.classList.add('show');
  clearTimeout(refundMsgTimer);
  refundMsgTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function invest(id) {
  const n = nodeMap[id];
  if (canInvest(n)) { alloc[id]++; talentPoints--; renderTalents(); saveGameState(); }
}
function refund(id) {
  const n = nodeMap[id];
  if (canRefund(n)) { alloc[id]--; talentPoints++; renderTalents(); saveGameState(); }
  else if (alloc[id] > 0) showBlocked(n);
}

function resetTalents() {
  let spent = 0;
  NODES.forEach(n => { spent += alloc[n.id]; alloc[n.id] = 0; });
  talentPoints += spent;
  hideTT();
  renderTalents();
  saveGameState();
}

function buildTree() {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  // Clear any previously built nodes
  [...canvas.querySelectorAll('.nwrap')].forEach(el => el.remove());

  // Add info text once (inside .tw-bar, as a second line below points/reset)
  const bar = document.querySelector('.tw-bar');
  if (bar && !bar.querySelector('.talent-info-text')) {
    const info = document.createElement('div');
    info.className = 'talent-info-text';
    info.textContent = 'Talent points are awarded at waves 10 and 20 of each stage, but cannot be earned again by replaying stages.';
    bar.appendChild(info);
  }

  NODES.forEach(n => {
    const half = n.bvow ? 28 : 30;
    const wrap = document.createElement('div');
    wrap.className = 'nwrap';
    wrap.id = 'wrap-' + n.id;
    wrap.style.cssText = `left:${n.cx - half}px;top:${n.cy - half}px;position:absolute`;

    const node = document.createElement('div');
    node.className = 'node' + (n.bvow ? ' bvow' : '');
    node.id = 'node-' + n.id;
    node.innerHTML = `<span class="node-label">${n.abbr}</span><div class="fill"><div class="fill-inner" id="fi-${n.id}"></div></div>`;
    node.addEventListener('click',       e => { e.preventDefault(); invest(n.id); showTT(e, n); });
    node.addEventListener('contextmenu', e => { e.preventDefault(); refund(n.id); showTT(e, n); });
    node.addEventListener('mouseenter',  e => showTT(e, n));
    node.addEventListener('mouseleave',  hideTT);

    const counter = document.createElement('div');
    counter.className = 'node-counter';
    counter.id = 'ctr-' + n.id;

    wrap.append(node, counter);
    canvas.appendChild(wrap);
  });
  renderTalents();
}

function renderTalents() {
  const ptsEl = document.getElementById('pts');
  if (ptsEl) ptsEl.textContent = talentPoints;

  const plusBtn = document.getElementById('aco-plus');
  if (plusBtn) plusBtn.classList.toggle('pulse', talentPoints > 0);

  NODES.forEach(n => {
    const p    = alloc[n.id];
    const node = document.getElementById('node-' + n.id);
    const fi   = document.getElementById('fi-'   + n.id);
    const ctr  = document.getElementById('ctr-'  + n.id);
    if (!node || !fi || !ctr) return;
    node.classList.toggle('locked',  !unlocked(n));
    node.classList.toggle('maxed',   p === n.max);
    node.classList.toggle('partial', p > 0 && p < n.max);
    fi.style.height = (p / n.max * 100) + '%';
    ctr.textContent = p + '/' + n.max;
    ctr.style.color = p === n.max ? (n.bvow ? '#c8aaff' : 'var(--acolyte-max)') : '';
  });
  renderConnectors();
}

function renderConnectors() {
  const svg = document.getElementById('svg');
  if (!svg) return;
  svg.innerHTML = '';
  NODES.forEach(n => {
    if (!n.req) return;
    const parent      = nodeMap[n.req];
    const active      = alloc[n.req] >= n.reqPts;
    const rivalChosen = n.tgroup && GROUPS[n.tgroup].filter(id => id !== n.id).some(id => alloc[id] > 0);
    const broken      = n.bvow && rivalChosen && !alloc[n.id];

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    Object.entries({
      x1: parent.cx, y1: parent.cy, x2: n.cx, y2: n.cy,
      stroke:             n.bvow ? '#ffffff' : (active ? '#9370DB' : '#4a3530'),
      'stroke-width':     n.bvow ? (broken ? '1.5' : '2') : '2.5',
      'stroke-dasharray': n.bvow ? (broken ? '3 14' : '7 5') : '10 6',
      opacity:            n.bvow ? (broken ? '0.18' : active ? '0.8' : '0.25') : (active ? '1' : '0.4'),
      'stroke-linecap':   'round'
    }).forEach(([k, v]) => line.setAttribute(k, v));

    if (active && !broken) {
      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      Object.entries({ attributeName:'stroke-dashoffset', from:'24', to:'0', dur: n.bvow ? '1.1s' : '0.9s', repeatCount:'indefinite' })
        .forEach(([k, v]) => anim.setAttribute(k, v));
      line.appendChild(anim);
    }
    svg.appendChild(line);
  });
}

let ttNode = null;
function showTT(e, n) {
  const p = alloc[n.id];
  document.getElementById('tt-name').textContent = n.label + '  ' + p + '/' + n.max;
  document.getElementById('tt-bv').style.display    = n.bvow ? 'block' : 'none';
  document.getElementById('tt-bvsub').style.display = n.bvow ? 'block' : 'none';
  const desc = n.desc(p);
  const descEl = document.getElementById('tt-desc');
  descEl.textContent = desc;
  descEl.style.display = desc ? 'block' : 'none';
  document.getElementById('tt-per').textContent = n.per;

  const bonusEl  = document.getElementById('tt-bonus');
  const bonusTxt = document.getElementById('tt-bonus-txt');
  if (n.bonus) {
    bonusTxt.textContent = typeof n.bonus === 'string' ? n.bonus : 'Bonus is doubled';
    bonusEl.style.display = 'block';
  } else {
    bonusEl.style.display = 'none';
  }

  const lockEl = document.getElementById('tt-lock');
  const lockLines = [];
  if (!unlocked(n) && n.req) {
    lockLines.push('⚠ Requires ' + nodeMap[n.req].label + ' ' + n.reqPts + '/' + nodeMap[n.req].max);
  }
  if (n.reqAscension && !ascUnlocked(n)) {
    lockLines.push('⚠ ' + (n.ascNote || ('Requires ' + n.reqAscension + ' Ascension(s)')));
  }
  if (lockLines.length) {
    lockEl.innerHTML = lockLines.join('<br>');
    lockEl.style.display = 'block';
  } else {
    lockEl.style.display = 'none';
  }
  document.getElementById('tt').style.display = 'block';
  ttNode = n;
  moveTT(e);
}
function hideTT() {
  const el = document.getElementById('tt');
  if (el) el.style.display = 'none';
  ttNode = null;
}
function moveTT(e) {
  const tt = document.getElementById('tt');
  if (!tt) return;
  const w = tt.offsetWidth || 240, h = tt.offsetHeight || 160;
  let x = e.clientX + 16, y = e.clientY - 20;
  if (y + h > innerHeight - 10) y = e.clientY - h - 12;
  if (x + w > innerWidth  -  8) x = e.clientX - w - 16;
  tt.style.left = Math.max(x, 8) + 'px';
  tt.style.top  = Math.max(y, 8) + 'px';
}
document.addEventListener('mousemove', e => { if (ttNode) moveTT(e); });

function openTalents()  {
  document.getElementById('backdrop').classList.add('open');
  requestAnimationFrame(() => {
    const panel = document.querySelector('.tw-panel');
    if (panel) panel.scrollTop = panel.scrollHeight;
  });
}

let notImplMsgTimer = null;
function openTalentsNotImplemented(btn) {
  if (btn.classList.contains('plus-btn-locked')) return;
  const el = document.getElementById('not-implemented-msg');
  if (!el) return;
  el.textContent = 'Not yet implemented.';
  const r = btn.getBoundingClientRect();
  el.style.left = (r.left + r.width / 2) + 'px';
  el.style.top  = (r.top - 50) + 'px';
  el.classList.add('show');
  clearTimeout(notImplMsgTimer);
  notImplMsgTimer = setTimeout(() => el.classList.remove('show'), 2000);
}
function closeTalents() {
  document.getElementById('backdrop').classList.remove('open');
  hideTT();
}

// Close on backdrop click (outside the panel)
document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', e => { if (e.target.id === 'backdrop') closeTalents(); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTalents(); });
});

// ============================================================
//  CLASS DEFINITIONS
// ============================================================

class Acolyte extends Player {
    constructor() {
        super('Acolyte');
        this.attacksPerSecond *= 0.9;
        this.critChance += 0.04;
        this.critDamage += 1;
        this.amuletDamage = 4;
        this.bossDamageBonus = 0.1;
        this.image = 'acoatt.png';
        this.classColor = '#9370DB';

        this.maxHp = this.getInitialHP();
        this.hp = this.maxHp;
    }

    static getDescription() { return classDescriptions['Acolyte']; }

    getDisplayName() {
        return this.classUpgradeChosen ? `${this.classUpgradeChosen} Acolyte` : 'Acolyte';
    }

    getInitialHP() { return super.getInitialHP() + 3; }
}

class Sorceress extends Player {
    constructor() {
        super('Sorceress');
        this.attacksPerSecond += 0.2;
        this.critChance += 0.24;
        this.critDamage += 0.05;
        this.amuletDamage = 3;
        this.bossDamageBonus = 0.3;
        this.image = 'sorc.png';
        this.classColor = '#4169E1';

        this.maxHp = this.getInitialHP();
        this.hp = this.maxHp;
    }

    getDisplayName() {
        return this.classUpgradeChosen ? `${this.classUpgradeChosen} Sorceress` : 'Sorceress';
    }

    getInitialHP() { return super.getInitialHP() + 1; }
}

class DivineKnight extends Player {
    constructor() {
        super('Divine Knight');
        this.attacksPerSecond += 1.5;
        this.critChance = 0;
        this.critDamage += 0;
        this.amuletDamage = 2;
        this.bossDamageBonus = 0.5;
        this.image = 'divi.png';
        this.classColor = '#FFD700';

        this.maxHp = this.getInitialHP();
        this.hp = this.maxHp;
        this.showAura();
    }

    getDisplayName() {
        return this.classUpgradeChosen ? `${this.classUpgradeChosen} Divine Knight` : 'Divine Knight';
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
        if (!aura || !this.weapon) return;
        const size = this.weapon.globalRange * 1.93;
        const gameAreaRect = document.getElementById('game-area').getBoundingClientRect();
        aura.style.width  = `${size}px`;
        aura.style.height = `${size}px`;
        aura.style.left   = `${gameAreaRect.left + this.position.x - size / 2}px`;
        aura.style.top    = `${gameAreaRect.top  + this.position.y - size / 2}px`;
    }

    getInitialHP() { return super.getInitialHP() + 5; }
}