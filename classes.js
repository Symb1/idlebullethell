const classDescriptions = {
    'Acolyte': `
        <p>Void caster with slower base attack speed but heavy single-target damage. Starts with lower critical chance but far higher critical damage.</p>
        <p><em>Ability:</em> Void Blast automatically launches into elites and bosses for instant elimination.</p>
        <p><em>Weapon Evolutions: (Level 10)</em></p>
        <ul>
            <li>Single target path: Guaranteed crits with Void Blast.</li>
            <li>Splash variant: Removes crit with Void Blast, adds area effect at <b>50% power</b>.</li>
        </ul>
        <p><em>Class Evolutions: (Level 20)</em> Focus either on speed, crit, or cooldown mastery.</p>
    `,
    'Sorceress': `
    <p>Spellcaster with swift attacks and high base critical chance. Attacks chain to nearby enemies, dealing <b>25% less</b> damage and reducing crit chance by <b>30% per jump</b>.</p>
    <p><em>Ability:</em> Lightning Storm calls down sky strikes on all enemies simultaneously.</p>
    <p><em>Weapon Evolutions: (Level 10)</em></p>
    <ul>
        <li>Chain path: More chain targets, higher chain damage retention, and a guaranteed crit ability.</li>
        <li>Spark path: Removes chaining, hits all enemies at once at reduced damage. Each attack has a <b>25% chance</b> to apply <b>Shock</b>, increasing damage taken by <b>10% per stack</b>. Replaces Lightning Storm with Flash Freeze, freezing enemies in place.</li>
    </ul>
    <p><em>Class Evolutions: (Level 20)</em> Focus on raw attack speed, crit stacking, or adding an extra chain target.</p>
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
    desc: p => `Current bonus: +${p.toFixed(1)} Base Damage`,
    per:'+1 Base Damage to Acolyte per rank' },
  { id:'dark_precision',  label:'Dark Precision',       abbr:'DP', cx:300, cy:540, max:5,
    req:'void_rupture', reqPts:2,
    desc: p => p >= 5 ? `Current bonus: +${p*2}% Critical Chance` : `Current bonus: +${p}% Critical Chance`,
    per:'+1% Critical Chance per rank', bonus:true },
  { id:'eternal_torment', label:'Eternal Torment',      abbr:'ET', cx:85,  cy:570, max:3,
    req:'abyssal_core', reqPts:3,
    desc: p => `Current bonus: +${p*10}% Chance to reset ability cooldown on elite hit`,
    per:'+10% chance per rank to reset cooldown on elite hit',
    bonus:'100% chance to reset if damage dealt is ≤25% of current elite HP.' },
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

// ============================================================
//  TALENT TREE — Sorceress Storm Mastery
// ============================================================
// Layout mirrors Acolyte but Abyssal Core / Eternal Torment
// equivalents (arcane_voltage / tempest_echo) are on the RIGHT side.

const SORC_NODES = [
  // ── Row 1 (bottom) ──────────────────────────────────────────────
  { id:'storm_precision',    label:'Storm Precision',       abbr:'SP', cx:300, cy:690, max:5,
    req:null, reqPts:0,
    desc: p => p >= 5 ? `Current bonus: +${(p*1.5*2).toFixed(1)}% Critical Chance` : `Current bonus: +${(p*1.5).toFixed(1)}% Critical Chance`,
    per:'+1.5% Critical Chance per rank', bonus:true },

  // Arcane Voltage — mirrored to RIGHT (Abyssal Core was left)
  { id:'arcane_voltage',     label:'Arcane Voltage',        abbr:'AV', cx:395, cy:650, max:3,
    req:'storm_precision', reqPts:3,
    desc: p => `Current bonus: +${p.toFixed(1)} Base Damage`,
    per:'+1 Base Damage to Sorceress per rank' },

  // ── Row 2 ────────────────────────────────────────────────────────
  { id:'static_acceleration',label:'Static Acceleration',   abbr:'SA', cx:300, cy:540, max:5,
    req:'storm_precision', reqPts:2,
    desc: p => p >= 5 ? `Current bonus: +${p*4*2}% Attack Speed` : `Current bonus: +${p*4}% Attack Speed`,
    per:'+4% Attack Speed per rank', bonus:true },

  // Tempest Echo — mirrored to RIGHT (Eternal Torment was left)
  { id:'tempest_echo',       label:'Tempest Echo',          abbr:'TE', cx:515, cy:570, max:3,
    req:'arcane_voltage', reqPts:3,
    desc: p => `Current bonus: ${p*10}% chance to recast ability after 1 sec`,
    per:'+10% chance per rank to recast Lightning Storm or Flash Freeze after 1s',
    bonus:'Lightning Storm does double damage on 2nd cast.<br>Flash Freeze duration is doubled on 2nd cast.' },

  // ── Row 3 ────────────────────────────────────────────────────────
  { id:'chain_reverb',       label:'Chain Reverb',          abbr:'CR', cx:170, cy:420, max:5,
    req:'static_acceleration', reqPts:2,
    desc: p => `Each chain has a <b>${p*8}%</b> chance to hit the same target again.<br>If no enemies to chain to, it has a <b>${p*8}%</b> chance to return to the first target.`,
    per:'Double hit chance on chains is increased by 8% per rank.<br>Fallback chance is increased by 8% per rank.' },

  { id:'charged_dominance',  label:'Charged Dominance',     abbr:'CD', cx:430, cy:420, max:5,
    req:'static_acceleration', reqPts:2,
    desc: p => `Current bonus: +${p*5}% Shock apply chance (+${p*15}% vs bosses)`,
    per:'+5% Shock chance per rank (+15% vs bosses per rank)' },

  // ── Row 4 ────────────────────────────────────────────────────────
  { id:'lethal_current',     label:'Lethal Current',        abbr:'LC', cx:300, cy:210, max:5,
    req:'static_acceleration', reqPts:3,
    desc: p => p >= 5 ? `Current bonus: +${p*10*2}% Critical Damage` : `Current bonus: +${p*10}% Critical Damage`,
    per:'+10% Critical Damage per rank', bonus:true },

  // Binding Vow singles under chain_reverb
  { id:'conductors_oath',    label:"Conductor's Oath",      abbr:'CO', cx:115, cy:285, max:1, bvow:true, tgroup:'s1',
    req:'chain_reverb', reqPts:3, reqAscension:1, desc:()=>'',
    per:"Chain Wand: No crit penalty on chained enemies, Chain Reverb rolls crit separately each proc",
    ascNote:'Requires 1 Ascension' },
  { id:'unbroken_current',   label:'Unbroken Current',      abbr:'UC', cx:225, cy:285, max:1, bvow:true, tgroup:'s1',
    req:'chain_reverb', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Chain Wand: No chain damage penalty and +2 extra chained enemies.',
    ascNote:'Requires 1 Ascension' },

  // Binding Vow singles under charged_dominance
  { id:'shock_infusion',     label:'Shock Infusion',        abbr:'SI', cx:370, cy:285, max:1, bvow:true, tgroup:'s2',
    req:'charged_dominance', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Spark Wand: Flash Freeze now automatically applies 12 stacks of Shock to every enemy.',
    ascNote:'Requires 1 Ascension' },
  { id:'overcharge',         label:'Overcharge',            abbr:'OC', cx:480, cy:285, max:1, bvow:true, tgroup:'s2',
    req:'charged_dominance', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Spark Wand: Shock damage bonus increased to 15% per stack.',
    ascNote:'Requires 1 Ascension' },

  // ── Row 5 (top) — Excellence nodes ──────────────────────────────
  { id:'spellweavers_excellence', label:"Spellweaver's Excellence", abbr:'SE', cx:170, cy:50, max:5, bvow:true, tgroup:'s3',
    req:'lethal_current', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Current bonus: -${p*12}% Spellweaver's Sigil crit damage penalty` : '',
    per:"-12% Spellweaver's Sigil crit damage penalty per rank (gone at rank 5)",
    ascNote:'Requires 2 Ascensions' },
  { id:'nexus_excellence',        label:'Nexus Excellence',         abbr:'NE',  cx:300, cy:50, max:5, bvow:true, tgroup:'s3',
    req:'lethal_current', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Current bonus: -${p*8}% Nexus Crystal attack speed penalty` : '',
    per:'-8% Nexus Crystal attack speed penalty per rank (gone at rank 5)',
    ascNote:'Requires 2 Ascensions' },
  { id:'stormheart_excellence',   label:'Stormheart Excellence',    abbr:'SH', cx:430, cy:50, max:5, bvow:true, tgroup:'s3',
    req:'lethal_current', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Current bonus: -${p*20}% Stormheart Crystal boss damage penalty` : '',
    per:'-20% Stormheart Crystal boss damage penalty per rank (gone at rank 5)',
    ascNote:'Requires 2 Ascensions' },
];

const SORC_GROUPS  = {
  s1:['conductors_oath','unbroken_current'],
  s2:['shock_infusion','overcharge'],
  s3:['spellweavers_excellence','nexus_excellence','stormheart_excellence']
};
const sorcNodeMap = Object.fromEntries(SORC_NODES.map(n => [n.id, n]));
const sorcAlloc   = Object.fromEntries(SORC_NODES.map(n => [n.id, 0]));
let sorcTalentPoints = 0;

// ============================================================
//  SHARED TALENT TREE LOGIC
//  Each tree passes a "config" object so all the logic below
//  can be reused without duplication.
// ============================================================

// --- predicate helpers (per-tree) ---

function makeTreeHelpers(nodes, allocObj, groupsObj) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));

  const unlocked    = n => !n.req || allocObj[n.req] >= n.reqPts;
  const ascUnlocked = n => !n.reqAscension || (typeof gameState !== 'undefined' && gameState.ascensionLevel >= n.reqAscension);
  const rivalFree   = n => !n.tgroup || !groupsObj[n.tgroup].filter(id => id !== n.id).some(id => allocObj[id] > 0);
  const canInvest   = (n, pts) => unlocked(n) && ascUnlocked(n) && allocObj[n.id] < n.max && pts > 0 && rivalFree(n);
  const canRefund   = n => allocObj[n.id] > 0 && nodes.filter(d => d.req === n.id && allocObj[d.id] > 0).every(d => allocObj[n.id] - 1 >= d.reqPts);

  return { map, unlocked, ascUnlocked, canInvest, canRefund };
}

const acoHelpers  = makeTreeHelpers(NODES,      alloc,     GROUPS);
const sorcHelpers = makeTreeHelpers(SORC_NODES, sorcAlloc, SORC_GROUPS);

// Expose the old globals still needed externally (saveGameState etc. may reference them)
const unlocked    = acoHelpers.unlocked;
const ascUnlocked = acoHelpers.ascUnlocked;

// --- blocked message ---

let refundMsgTimer = null;
function showBlockedMsg(nodeEl) {
  const el = document.getElementById('refund-msg');
  if (!el) return;
  el.textContent = 'Other talents may rely on this, cannot unlearn.';
  const r = nodeEl.getBoundingClientRect();
  el.style.left = (r.left + r.width / 2) + 'px';
  el.style.top  = (r.top - 50) + 'px';
  el.classList.add('show');
  clearTimeout(refundMsgTimer);
  refundMsgTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// --- invest / refund / reset (Acolyte) ---

function invest(id) {
  const n = acoHelpers.map[id];
  if (acoHelpers.canInvest(n, talentPoints)) { alloc[id]++; talentPoints--; renderTalents(); saveGameState(); }
}
function refund(id) {
  const n = acoHelpers.map[id];
  if (acoHelpers.canRefund(n)) { alloc[id]--; talentPoints++; renderTalents(); saveGameState(); }
  else if (alloc[id] > 0) showBlockedMsg(document.getElementById('node-' + id));
}
function resetTalents() {
  let spent = 0;
  NODES.forEach(n => { spent += alloc[n.id]; alloc[n.id] = 0; });
  talentPoints += spent;
  hideTT();
  renderTalents();
  saveGameState();
}

// --- invest / refund / reset (Sorceress) ---

function sorcInvest(id) {
  const n = sorcHelpers.map[id];
  if (sorcHelpers.canInvest(n, sorcTalentPoints)) { sorcAlloc[id]++; sorcTalentPoints--; renderSorcTalents(); saveGameState(); }
}
function sorcRefund(id) {
  const n = sorcHelpers.map[id];
  if (sorcHelpers.canRefund(n)) { sorcAlloc[id]--; sorcTalentPoints++; renderSorcTalents(); saveGameState(); }
  else if (sorcAlloc[id] > 0) showBlockedMsg(document.getElementById('sorc-node-' + id));
}
function sorcResetTalents() {
  let spent = 0;
  SORC_NODES.forEach(n => { spent += sorcAlloc[n.id]; sorcAlloc[n.id] = 0; });
  sorcTalentPoints += spent;
  hideTT();
  renderSorcTalents();
  saveGameState();
}

// --- shared tree builder ---

function buildTalentTree(cfg) {
  const { canvasId, barSelector, nodes, prefix, investFn, refundFn, showTTFn, hideTTFn, renderFn } = cfg;

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  [...canvas.querySelectorAll('.nwrap')].forEach(el => el.remove());

  // Insert info text once
  const bar = document.querySelector(barSelector);
  if (bar && !bar.querySelector('.talent-info-text')) {
    const info = document.createElement('div');
    info.className = 'talent-info-text';
    info.textContent = 'Talent points are awarded at waves 10 and 20 of each stage, but cannot be earned again by replaying stages.';
    bar.appendChild(info);
  }

  nodes.forEach(n => {
    const half = n.bvow ? 28 : 30;
    const wrap = document.createElement('div');
    wrap.className = 'nwrap';
    wrap.id = `${prefix}wrap-${n.id}`;
    wrap.style.cssText = `left:${n.cx - half}px;top:${n.cy - half}px;position:absolute`;

    const isAco = prefix === '';
    const node = document.createElement('div');
    node.className = 'node' + (isAco ? '' : ' sorc-node') + (n.bvow ? ' bvow' + (isAco ? '' : ' sorc-bvow') : '');
    node.id = `${prefix}node-${n.id}`;
    node.innerHTML = `<span class="node-label">${n.abbr}</span><div class="fill"><div class="fill-inner${isAco ? '' : ' sorc-fill-inner'}" id="${prefix}fi-${n.id}"></div></div>`;
    node.addEventListener('click',       e => { e.preventDefault(); investFn(n.id); showTTFn(e, n); });
    node.addEventListener('contextmenu', e => { e.preventDefault(); refundFn(n.id); showTTFn(e, n); });
    node.addEventListener('mouseenter',  e => showTTFn(e, n));
    node.addEventListener('mouseleave',  hideTTFn);

    const counter = document.createElement('div');
    counter.className = 'node-counter' + (isAco ? '' : ' sorc-counter');
    counter.id = `${prefix}ctr-${n.id}`;

    wrap.append(node, counter);
    canvas.appendChild(wrap);
  });
  renderFn();
}

function buildTree() {
  buildTalentTree({
    canvasId: 'canvas', barSelector: '.tw-bar',
    nodes: NODES, prefix: '',
    investFn: invest, refundFn: refund,
    showTTFn: showTT, hideTTFn: hideTT,
    renderFn: renderTalents,
  });
}

function buildSorcTree() {
  buildTalentTree({
    canvasId: 'sorc-canvas', barSelector: '#stw .tw-bar',
    nodes: SORC_NODES, prefix: 'sorc-',
    investFn: sorcInvest, refundFn: sorcRefund,
    showTTFn: showSorcTT, hideTTFn: hideSorcTT,
    renderFn: renderSorcTalents,
  });
}

// --- shared render helpers ---

function renderTalentNodes(nodes, allocObj, prefix, maxColor, getNodeEl) {
  nodes.forEach(n => {
    const p    = allocObj[n.id];
    const node = document.getElementById(`${prefix}node-${n.id}`);
    const fi   = document.getElementById(`${prefix}fi-${n.id}`);
    const ctr  = document.getElementById(`${prefix}ctr-${n.id}`);
    if (!node || !fi || !ctr) return;
    const { unlocked: isUnlocked } = prefix === '' ? acoHelpers : sorcHelpers;
    node.classList.toggle('locked',  !isUnlocked(n));
    node.classList.toggle('maxed',   p === n.max);
    node.classList.toggle('partial', p > 0 && p < n.max);
    fi.style.height = (p / n.max * 100) + '%';
    ctr.textContent = `${p}/${n.max}`;
    ctr.style.color = p === n.max ? (n.bvow ? maxColor.bvow : maxColor.normal) : '';
  });
}

function renderTalents() {
  const ptsEl = document.getElementById('pts');
  if (ptsEl) ptsEl.textContent = talentPoints;

  const plusBtn = document.getElementById('aco-plus');
  if (plusBtn) plusBtn.classList.toggle('pulse', talentPoints > 0);

  renderTalentNodes(NODES, alloc, '', { bvow: '#c8aaff', normal: 'var(--acolyte-max)' });
  renderConnectors();
}

function renderSorcTalents() {
  const ptsEl = document.getElementById('sorc-pts');
  if (ptsEl) ptsEl.textContent = sorcTalentPoints;

  const plusBtn = document.getElementById('sorc-plus');
  if (plusBtn) plusBtn.classList.toggle('sorc-pulse', sorcTalentPoints > 0 && !plusBtn.classList.contains('plus-btn-locked'));

  renderTalentNodes(SORC_NODES, sorcAlloc, 'sorc-', { bvow: '#aaccff', normal: 'var(--sorceress-max)' });
  renderSorcConnectors();
}

// --- shared connector renderer ---

function renderConnectorsSVG(svgId, nodes, allocObj, groupsObj, activeColor) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  svg.innerHTML = '';

  const map = Object.fromEntries(nodes.map(n => [n.id, n]));

  nodes.forEach(n => {
    if (!n.req) return;
    const parent      = map[n.req];
    const active      = allocObj[n.req] >= n.reqPts;
    const rivalChosen = n.tgroup && groupsObj[n.tgroup].filter(id => id !== n.id).some(id => allocObj[id] > 0);
    const broken      = n.bvow && rivalChosen && !allocObj[n.id];

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    Object.entries({
      x1: parent.cx, y1: parent.cy, x2: n.cx, y2: n.cy,
      stroke:             n.bvow ? '#ffffff' : (active ? activeColor : (activeColor === '#9370DB' ? '#4a3530' : '#2a3050')),
      'stroke-width':     n.bvow ? (broken ? '1.5' : '2') : '2.5',
      'stroke-dasharray': n.bvow ? (broken ? '3 14' : '7 5') : '10 6',
      opacity:            n.bvow ? (broken ? '0.18' : active ? '0.8' : '0.25') : (active ? '1' : '0.4'),
      'stroke-linecap':   'round',
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

function renderConnectors()     { renderConnectorsSVG('svg',      NODES,      alloc,     GROUPS,      '#9370DB'); }
function renderSorcConnectors() { renderConnectorsSVG('sorc-svg', SORC_NODES, sorcAlloc, SORC_GROUPS, '#4169E1'); }

// --- shared tooltip ---

// Single active tooltip node — null means tooltip hidden
let activeTTNode = null;

function showTooltip(e, n, allocObj, nodeMapObj, isUnlocked, isAscUnlocked) {
  const p = allocObj[n.id];
  document.getElementById('tt-name').textContent = `${n.label}  ${p}/${n.max}`;
  document.getElementById('tt-bv').style.display    = n.bvow ? 'block' : 'none';
  document.getElementById('tt-bvsub').style.display = n.bvow ? 'block' : 'none';

  const desc   = n.desc(p);
  const descEl = document.getElementById('tt-desc');
  descEl.innerHTML     = desc;
  descEl.style.display = desc ? 'block' : 'none';

  document.getElementById('tt-per').innerHTML = n.per;

  const bonusEl  = document.getElementById('tt-bonus');
  const bonusTxt = document.getElementById('tt-bonus-txt');
  if (n.bonus) {
    bonusTxt.innerHTML    = typeof n.bonus === 'string' ? n.bonus : 'Bonus is doubled';
    bonusEl.style.display = 'block';
  } else {
    bonusEl.style.display = 'none';
  }

  const lockEl    = document.getElementById('tt-lock');
  const lockLines = [];
  if (!isUnlocked(n) && n.req) {
    lockLines.push(`⚠ Requires ${nodeMapObj[n.req].label} ${n.reqPts}/${nodeMapObj[n.req].max}`);
  }
  if (n.reqAscension && !isAscUnlocked(n)) {
    lockLines.push(`⚠ ${n.ascNote || ('Requires ' + n.reqAscension + ' Ascension(s)')}`);
  }
  if (lockLines.length) {
    lockEl.innerHTML     = lockLines.join('<br>');
    lockEl.style.display = 'block';
  } else {
    lockEl.style.display = 'none';
  }

  document.getElementById('tt').style.display = 'block';
  activeTTNode = n;
  moveTT(e);
}

function showTT(e, n)     { showTooltip(e, n, alloc,     acoHelpers.map,  acoHelpers.unlocked,  acoHelpers.ascUnlocked); }
function showSorcTT(e, n) { showTooltip(e, n, sorcAlloc, sorcHelpers.map, sorcHelpers.unlocked, sorcHelpers.ascUnlocked); }

function hideTT() {
  const el = document.getElementById('tt');
  if (el) el.style.display = 'none';
  activeTTNode = null;
}
// Sorceress panel reuses the same tooltip element
const hideSorcTT = hideTT;

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

document.addEventListener('mousemove', e => { if (activeTTNode) moveTT(e); });

// --- open / close panels ---

function openTalents() {
  document.getElementById('backdrop').classList.add('open');
  requestAnimationFrame(() => {
    const panel = document.querySelector('#backdrop .tw-body');
    if (panel) panel.scrollTop = panel.scrollHeight;
  });
}
function closeTalents() {
  document.getElementById('backdrop').classList.remove('open');
  hideTT();
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

function openSorcTalents() {
  const btn = document.getElementById('sorc-plus');
  if (btn && btn.classList.contains('plus-btn-locked')) return;
  document.getElementById('sorc-backdrop').classList.add('open');
  if (!document.getElementById('sorc-canvas').querySelector('.nwrap')) buildSorcTree();
  requestAnimationFrame(() => {
    const panel = document.querySelector('#stw .tw-body');
    if (panel) panel.scrollTop = panel.scrollHeight;
  });
}
function closeSorcTalents() {
  document.getElementById('sorc-backdrop').classList.remove('open');
  hideTT();
}

// --- DOMContentLoaded (merged) ---

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', e => { if (e.target.id === 'backdrop') closeTalents(); });
  }

  const sorcBackdrop = document.getElementById('sorc-backdrop');
  if (sorcBackdrop) {
    sorcBackdrop.addEventListener('click', e => { if (e.target.id === 'sorc-backdrop') closeSorcTalents(); });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTalents(); closeSorcTalents(); }
  });
});

// ============================================================
//  CLASS DEFINITIONS
// ============================================================

class Acolyte extends Player {
    constructor() {
        super('Acolyte');
        this.attacksPerSecond *= 0.9;
        this.critChance += 0.02;
        this.critDamage += 0.75;
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
        this.critChance += 0.15;
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