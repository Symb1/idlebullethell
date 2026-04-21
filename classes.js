//Full documentation in docIR
const classDescriptions = {
    'Acolyte': `
        <p>Void caster with slower base attack speed but heavy single-target damage. Starts with lower critical chance but far higher critical damage.</p>
        <p><em>Ability:</em> Void Blast automatically launches into elites and bosses for instant elimination.</p>
        <p><em>Weapon Evolutions: (Level 10)</em></p>
        <ul>
            <li>Single target path: <b>Guaranteed crits</b> with Void Blast.</li>
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
        <li>Blessed Shield: Replaces Holy Radiance with Holy Fire, on use applying Judgement to all enemies within range. Judgement ticks every <b>0.2s</b> dealing <b>25%</b> of your damage.</li>
        <li>Smite Shield: Rapid Aura ticks, slows enemies inside the aura by <b>25%</b>, while freezes the extended area for <b>2 sec</b> on use.</li>
    </ul>
    <p><em>Class Evolutions: (Level 20)</em> Increase your attack speed, unlock critical hits globally or get massive health and damage at the cost of a heavy cooldown recovery.</p>
`,
};

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

const SORC_NODES = [

  { id:'storm_precision',    label:'Storm Precision',       abbr:'SP', cx:300, cy:690, max:5,
    req:null, reqPts:0,
    desc: p => p >= 5 ? `Current bonus: +${(p*1.5*2).toFixed(1)}% Critical Chance` : `Current bonus: +${(p*1.5).toFixed(1)}% Critical Chance`,
    per:'+1.5% Critical Chance per rank', bonus:true },

  { id:'arcane_voltage',     label:'Arcane Voltage',        abbr:'AV', cx:395, cy:650, max:3,
    req:'storm_precision', reqPts:3,
    desc: p => `Current bonus: +${p.toFixed(1)} Base Damage`,
    per:'+1 Base Damage to Sorceress per rank' },

  { id:'static_acceleration',label:'Static Acceleration',   abbr:'SA', cx:300, cy:540, max:5,
    req:'storm_precision', reqPts:2,
    desc: p => p >= 5 ? `Current bonus: +${p*4*2}% Attack Speed` : `Current bonus: +${p*4}% Attack Speed`,
    per:'+4% Attack Speed per rank', bonus:true },

  { id:'tempest_echo',       label:'Tempest Echo',          abbr:'TE', cx:515, cy:570, max:3,
    req:'arcane_voltage', reqPts:3,
    desc: p => `Current bonus: ${p*10}% chance to recast ability after 1 sec`,
    per:'+10% chance per rank to recast Lightning Storm or Flash Freeze after 1s',
    bonus:'Lightning Storm does double damage on 2nd cast.<br>Flash Freeze duration is doubled on 2nd cast.' },

  { id:'chain_reverb',       label:'Chain Reverb',          abbr:'CR', cx:170, cy:420, max:5,
    req:'static_acceleration', reqPts:2,
    desc: p => `Each chain has a <b>${p*8}%</b> chance to hit the same target again.<br>If no enemies to chain to, <b>${p*8}%</b> chance to fall back to the first target, max <b>2</b> chains.`,
    per:'Double hit chance on chains is increased by 8% per rank.<br>Fallback return chance is increased by 8% per rank, max 2 chains.' },

  { id:'charged_dominance',  label:'Charged Dominance',     abbr:'CD', cx:430, cy:420, max:5,
    req:'static_acceleration', reqPts:2,
    desc: p => `Current bonus: +${p*5}% Shock apply chance (+${p*15}% vs bosses)`,
    per:'+5% Shock chance per rank (+15% vs bosses per rank)' },

  { id:'lethal_current',     label:'Lethal Current',        abbr:'LC', cx:300, cy:210, max:5,
    req:'static_acceleration', reqPts:3,
    desc: p => p >= 5 ? `Current bonus: +${p*10*2}% Critical Damage` : `Current bonus: +${p*10}% Critical Damage`,
    per:'+10% Critical Damage per rank', bonus:true },

  { id:'conductors_oath',    label:"Conductor's Oath",      abbr:'CO', cx:115, cy:285, max:1, bvow:true, tgroup:'s1',
    req:'chain_reverb', reqPts:3, reqAscension:1, desc:()=>'',
    per:"Chain Wand: No crit penalty on chained enemies, Chain Reverb rolls crit separately each proc",
    ascNote:'Requires 1 Ascension' },
  { id:'unbroken_current',   label:'Unbroken Current',      abbr:'UC', cx:225, cy:285, max:1, bvow:true, tgroup:'s1',
    req:'chain_reverb', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Chain Wand: No chain damage penalty, return chains from fallback have no cap',
    ascNote:'Requires 1 Ascension' },

  { id:'shock_infusion',     label:'Shock Infusion',        abbr:'SI', cx:370, cy:285, max:1, bvow:true, tgroup:'s2',
    req:'charged_dominance', reqPts:3, reqAscension:1, desc:()=>'',
    per: () => { const w = new SparkWand(); return `Spark Wand: Flash Freeze now automatically applies ${w.shockInfusionStacks} stacks of Shock to every enemy.`; },
    ascNote:'Requires 1 Ascension' },
  { id:'overcharge',         label:'Overcharge',            abbr:'OC', cx:480, cy:285, max:1, bvow:true, tgroup:'s2',
    req:'charged_dominance', reqPts:3, reqAscension:1, desc:()=>'',
    per: () => { const w = new SparkWand(); return `Spark Wand: Shock damage bonus increased to ${w.shockStackBonusOvercharge * 100}% per stack.`; },
    ascNote:'Requires 1 Ascension' },

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

const DK_NODES = [

  { id:'sacred_tempo',      label:'Sacred Tempo',        abbr:'ST', cx:300, cy:690, max:5,
    req:null, reqPts:0,
    desc: p => p >= 5 ? `Current bonus: +${p*3*2}% Cooldown Reduction` : `Current bonus: +${p*3}% Cooldown Reduction`,
    per:'+3% Cooldown Reduction per rank', bonus:true },

  { id:'consecrated_steel', label:'Consecrated Steel',   abbr:'CS', cx:205, cy:650, max:3,
    req:'sacred_tempo', reqPts:3,
    desc: p => `Current bonus: +${p.toFixed(0)} Base Damage`,
    per:'+1 Base Damage to Divine Knight per rank' },

  { id:'divine_wrath',      label:'Divine Wrath',         abbr:'DW', cx:300, cy:540, max:5,
    req:'sacred_tempo', reqPts:2,
    desc: p => p >= 5 ? `Current bonus: +${p*10*2}% Critical Damage` : `Current bonus: +${p*10}% Critical Damage`,
    per:'+10% Critical Damage per rank', bonus:true },

  { id:'aura_overflow',     label:'Aura Overflow',        abbr:'AO', cx:85,  cy:570, max:3,
    req:'consecrated_steel', reqPts:3,
    desc: p => `${p*15}% chance per use to expand aura range by an additional 25%`,
    per:'+15% chance per rank to expand range by an additional 25% on Holy Radiance/Holy Fire use',
    bonus:'Max rank: expanded range lingers 3 seconds after the ability ends' },

  { id:'martyrs_conviction',label:"Martyr's Conviction",  abbr:'MC', cx:170, cy:420, max:5,
    req:'divine_wrath', reqPts:2,
    desc: p => `Adds +${p*3} Max HP. HP converts +${p*20}% to damage`,
    per:'Blessed Shield: +3 HP per rank. HP converts +20% to damage per rank' },

  { id:'executioners_faith',label:"Executioner's Faith",  abbr:'EF', cx:300, cy:210, max:5,
    req:'divine_wrath', reqPts:2,
    desc: p => p >= 5 ? `Current bonus: +${p*25*2}% Boss Damage` : `Current bonus: +${p*25}% Boss Damage`,
    per:'+25% Boss Damage per rank', bonus:true },

  { id:'sanctified_domain', label:'Sanctified Domain',   abbr:'SD', cx:430, cy:420, max:5,
    req:'divine_wrath', reqPts:3, ssOnly:true,
    desc: p => `Enemies in aura range: attack speed -${p*12}%, movement speed -${p*5}%`,
    per:'Smite Shield: -12% enemy attack speed per rank, -5% enemy move speed reduction per rank in aura' },

  { id:'oath_of_judgement', label:'Oath of Judgement',   abbr:'OJ', cx:115, cy:285, max:1, bvow:true, tgroup:'dk1', bsOnly:true,
    req:'martyrs_conviction', reqPts:3, reqAscension:1, desc:()=>'',
    per:'<span style="color:#c084fc">Blessed Shield</span>: HP regen is disabled. Judgement deals 33% of your damage and 66% vs bosses.',
    ascNote:'Requires 1 Ascension' },
  { id:'oath_of_dominion',  label:'Oath of Dominion',    abbr:'OD', cx:225, cy:285, max:1, bvow:true, tgroup:'dk1', bsOnly:true,
    req:'martyrs_conviction', reqPts:3, reqAscension:1, desc:()=>'',
    per:'<span style="color:#c084fc">Blessed Shield</span>: +15 HP and +150% Boss Damage.',
    ascNote:'Requires 1 Ascension' },

  { id:'oath_of_eternity',  label:'Oath of Eternity',    abbr:'OE', cx:370, cy:285, max:1, bvow:true, tgroup:'dk2', ssOnly:true,
    req:'sanctified_domain', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Smite Shield: Regen cap is removed. Regeneration upgrades tripled from soul fragments.',
    ascNote:'Requires 1 Ascension' },
  { id:'oath_of_aegis',     label:'Oath of Aegis',        abbr:'OA', cx:480, cy:285, max:1, bvow:true, tgroup:'dk2', ssOnly:true,
    req:'sanctified_domain', reqPts:3, reqAscension:1, desc:()=>'',
    per:'Smite Shield: HP regen cap increased to 1.5/s. Enemies have 33% chance to miss each hit (bosses 66%).',
    ascNote:'Requires 1 Ascension' },

  { id:'sanctified_excellence', label:'Sanctified Excellence', abbr:'SE', cx:170, cy:50, max:5, bvow:true, tgroup:'dk3',
    req:'executioners_faith', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Removes -${p*5}% dmg, -${p*3}% atk spd, -${p*3}% cooldown penalties on Sanctified Oath` : '',
    per:'-5% damage penalty, -3% attack speed penalty, -3% cooldown penalty per rank (Sanctified Oath)',
    ascNote:'Requires 2 Ascensions' },
  { id:'vigilant_excellence',   label:'Vigilant Excellence',   abbr:'VE', cx:300, cy:50, max:5, bvow:true, tgroup:'dk3',
    req:'executioners_faith', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Removes -${p*4}% damage penalty on Vigilant Crest` : '',
    per:'-4% damage penalty per rank (Vigilant Crest)',
    ascNote:'Requires 2 Ascensions' },
  { id:'eternal_excellence',    label:'Eternal Excellence',    abbr:'EE', cx:430, cy:50, max:5, bvow:true, tgroup:'dk3',
    req:'executioners_faith', reqPts:3, reqAscension:2,
    desc: p => p > 0 ? `Removes -${p*20}% cooldown penalty on Eternal Bastion` : '',
    per:'-20% cooldown penalty per rank (Eternal Bastion)',
    ascNote:'Requires 2 Ascensions' },
];

const DK_GROUPS  = {
  dk1:['oath_of_judgement','oath_of_dominion'],
  dk2:['oath_of_eternity','oath_of_aegis'],
  dk3:['sanctified_excellence','vigilant_excellence','eternal_excellence']
};
const dkNodeMap = Object.fromEntries(DK_NODES.map(n => [n.id, n]));
const dkAlloc   = Object.fromEntries(DK_NODES.map(n => [n.id, 0]));
let dkTalentPoints = 0;

function makeTreeHelpers(nodes, allocObj, groupsObj) {
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));

  const unlocked    = n => !n.req || allocObj[n.req] >= n.reqPts;
  const ascUnlocked = n => !n.reqAscension || (typeof gameState !== 'undefined' && gameState.ascensionLevel >= n.reqAscension);
  const rivalFree   = n => !n.tgroup || !groupsObj[n.tgroup].filter(id => id !== n.id).some(id => allocObj[id] > 0);
  const weaponOk    = n => {
    if (n.bsOnly && typeof player !== 'undefined' && player?.weapon) return player.weapon instanceof BlessedShield;
    if (n.ssOnly && typeof player !== 'undefined' && player?.weapon) return player.weapon instanceof SmiteShield;
    return true;
  };
  const canInvest   = (n, pts) => unlocked(n) && ascUnlocked(n) && allocObj[n.id] < n.max && pts > 0 && rivalFree(n) && weaponOk(n);
  const canRefund   = n => allocObj[n.id] > 0 && nodes.filter(d => d.req === n.id && allocObj[d.id] > 0).every(d => allocObj[n.id] - 1 >= d.reqPts);

  return { map, unlocked, ascUnlocked, canInvest, canRefund };
}

const acoHelpers  = makeTreeHelpers(NODES,      alloc,     GROUPS);
const sorcHelpers = makeTreeHelpers(SORC_NODES, sorcAlloc, SORC_GROUPS);
const dkHelpers   = makeTreeHelpers(DK_NODES,   dkAlloc,   DK_GROUPS);

const unlocked    = acoHelpers.unlocked;
const ascUnlocked = acoHelpers.ascUnlocked;

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

function dkInvest(id) {
  const n = dkHelpers.map[id];
  if (dkHelpers.canInvest(n, dkTalentPoints)) { dkAlloc[id]++; dkTalentPoints--; renderDKTalents(); saveGameState(); }
}
function dkRefund(id) {
  const n = dkHelpers.map[id];
  if (dkHelpers.canRefund(n)) { dkAlloc[id]--; dkTalentPoints++; renderDKTalents(); saveGameState(); }
  else if (dkAlloc[id] > 0) showBlockedMsg(document.getElementById('dk-node-' + id));
}
function dkResetTalents() {
  let spent = 0;
  DK_NODES.forEach(n => { spent += dkAlloc[n.id]; dkAlloc[n.id] = 0; });
  dkTalentPoints += spent;
  hideTT();
  renderDKTalents();
  saveGameState();
}

function buildTalentTree(cfg) {
  const { canvasId, barSelector, nodes, prefix, investFn, refundFn, showTTFn, hideTTFn, renderFn } = cfg;

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  [...canvas.querySelectorAll('.nwrap')].forEach(el => el.remove());

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
    const isDK  = prefix === 'dk-';
    const node = document.createElement('div');
    node.className = 'node' + (isAco ? '' : isDK ? ' dk-node' : ' sorc-node') + (n.bvow ? ' bvow' + (isAco ? '' : isDK ? ' dk-bvow' : ' sorc-bvow') : '');
    node.id = `${prefix}node-${n.id}`;
    node.innerHTML = `<span class="node-label">${n.abbr}</span><div class="fill"><div class="fill-inner${isAco ? '' : isDK ? ' dk-fill-inner' : ' sorc-fill-inner'}" id="${prefix}fi-${n.id}"></div></div>`;
    node.addEventListener('click',       e => { e.preventDefault(); investFn(n.id); showTTFn(e, n); });
    node.addEventListener('contextmenu', e => { e.preventDefault(); refundFn(n.id); showTTFn(e, n); });
    node.addEventListener('mouseenter',  e => showTTFn(e, n));
    node.addEventListener('mouseleave',  hideTTFn);

    const counter = document.createElement('div');
    counter.className = 'node-counter' + (isAco ? '' : isDK ? ' dk-counter' : ' sorc-counter');
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

function buildDKTree() {

  if (!document.getElementById('dk-backdrop')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'dk-backdrop';
    backdrop.innerHTML = `
      <div id="dktw">
        <div class="tw-head dk-tw-head">
          <div>
            <div class="tw-title">Divine Knight Talents</div>
            <div class="tw-sub dk-tw-sub">Holy Mastery Tree</div>
          </div>
          <button class="tw-close" onclick="closeDKTalents()">✕</button>
        </div>
        <div class="tw-bar">
          <div class="tw-pts">Unspent Points: <span id="dk-pts" class="dk-pts-val">0</span> &nbsp;·&nbsp; <span style="font-size:10px;color:var(--brown);">Hover a talent for details</span></div>
          <button class="reset-btn" onclick="dkResetTalents()">↺ Reset All</button>
        </div>
        <div class="tw-body">
          <div class="canvas" id="dk-canvas">
            <svg id="dk-svg" class="conn-svg" viewBox="0 0 600 760" preserveAspectRatio="none"></svg>
          </div>
        </div>
      </div>`;
    const root = document.getElementById('game-scale-root') || document.body;
    root.appendChild(backdrop);
    backdrop.addEventListener('click', e => { if (e.target.id === 'dk-backdrop') closeDKTalents(); });
  }
  buildTalentTree({
    canvasId: 'dk-canvas', barSelector: '#dktw .tw-bar',
    nodes: DK_NODES, prefix: 'dk-',
    investFn: dkInvest, refundFn: dkRefund,
    showTTFn: showDKTT, hideTTFn: hideDKTT,
    renderFn: renderDKTalents,
  });
}

function renderTalentNodes(nodes, allocObj, prefix, maxColor, getNodeEl) {
  nodes.forEach(n => {
    const p    = allocObj[n.id];
    const node = document.getElementById(`${prefix}node-${n.id}`);
    const fi   = document.getElementById(`${prefix}fi-${n.id}`);
    const ctr  = document.getElementById(`${prefix}ctr-${n.id}`);
    if (!node || !fi || !ctr) return;
    const { unlocked: isUnlocked } = prefix === '' ? acoHelpers : prefix === 'dk-' ? dkHelpers : sorcHelpers;
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

function renderDKTalents() {
  const ptsEl = document.getElementById('dk-pts');
  if (ptsEl) ptsEl.textContent = dkTalentPoints;

  const plusBtn = document.getElementById('divi-plus');
  if (plusBtn) plusBtn.classList.toggle('dk-pulse', dkTalentPoints > 0 && !plusBtn.classList.contains('plus-btn-locked'));

  renderTalentNodes(DK_NODES, dkAlloc, 'dk-', { bvow: '#ffe899', normal: 'var(--dk-max)' });
  renderDKConnectors();
}

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
      stroke:             n.bvow ? '#ffffff' : (active ? activeColor : (activeColor === '#9370DB' ? '#4a3530' : activeColor === '#D4AF37' ? '#3a2e0a' : '#2a3050')),
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
function renderDKConnectors()   { renderConnectorsSVG('dk-svg',   DK_NODES,   dkAlloc,   DK_GROUPS,   '#D4AF37'); }

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

  document.getElementById('tt-per').innerHTML = typeof n.per === 'function' ? n.per() : n.per;

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
function showDKTT(e, n)   { showTooltip(e, n, dkAlloc,   dkHelpers.map,   dkHelpers.unlocked,   dkHelpers.ascUnlocked); }

function hideTT() {
  const el = document.getElementById('tt');
  if (el) el.style.display = 'none';
  activeTTNode = null;
}

const hideSorcTT = hideTT;
const hideDKTT   = hideTT;

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
  openDKTalents();
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

function openDKTalents() {
  const btn = document.getElementById('divi-plus');
  if (btn && btn.classList.contains('plus-btn-locked')) return;

  if (!document.getElementById('dk-backdrop') || !document.getElementById('dk-canvas')?.querySelector('.nwrap')) {
    buildDKTree();
  }
  document.getElementById('dk-backdrop').classList.add('open');
  requestAnimationFrame(() => {
    const panel = document.querySelector('#dktw .tw-body');
    if (panel) panel.scrollTop = panel.scrollHeight;
  });
}
function closeDKTalents() {
  document.getElementById('dk-backdrop')?.classList.remove('open');
  hideTT();
}

document.addEventListener('DOMContentLoaded', () => {
  const backdrop = document.getElementById('backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', e => { if (e.target.id === 'backdrop') closeTalents(); });
  }

  const sorcBackdrop = document.getElementById('sorc-backdrop');
  if (sorcBackdrop) {
    sorcBackdrop.addEventListener('click', e => { if (e.target.id === 'sorc-backdrop') closeSorcTalents(); });
  }

  const dkBackdrop = document.getElementById('dk-backdrop');
  if (dkBackdrop) {
    dkBackdrop.addEventListener('click', e => { if (e.target.id === 'dk-backdrop') closeDKTalents(); });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTalents(); closeSorcTalents(); closeDKTalents(); }
  });
});

class Acolyte extends Player {
    constructor() {
        super('Acolyte');
        this.attacksPerSecond *= 0.85;
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
        if (aura) aura.style.display = 'none';
        this.updateAuraVisual();
    }

    updateAuraVisual() {
        if (!this.weapon) return;
        const radius   = this.weapon.globalRange;
        const fireMode = document.getElementById('holy-shield-aura')?.classList.contains('holy-fire-active') ?? false;
        if (typeof updateDivineAuraPulse === 'function') {
            updateDivineAuraPulse(this.position.x, this.position.y, radius, fireMode);
        }
    }

    getInitialHP() { return super.getInitialHP() + 5; }
}