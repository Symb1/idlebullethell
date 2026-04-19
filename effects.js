// ─────────────────────────────────────────────
//  Shared SVG helpers
// ─────────────────────────────────────────────

function ensureLightningSvg() {
    var gameArea = document.getElementById('game-area');
    if (!gameArea) return null;
    var svg = document.getElementById('sorc-lightning-svg');
    if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'sorc-lightning-svg';
        svg.style.cssText = 'position:absolute;left:0;top:0;width:800px;height:600px;pointer-events:none;z-index:50;overflow:visible;';
        var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML =
            '<filter id="sorc-blur"  x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3"/></filter>' +
            '<filter id="sorc-glow"  x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>' +
            '<filter id="void-blur"  x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>';
        svg.appendChild(defs);
        gameArea.appendChild(svg);
    }
    return svg;
}

function ns(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

// Jagged lightning path between two points
function zigzagPath(x1, y1, x2, y2, jitter) {
    jitter = jitter == null ? 18 : jitter;
    var dist  = Math.hypot(x2 - x1, y2 - y1);
    var steps = Math.max(4, Math.floor(dist / 28));
    var d = 'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
    for (var i = 1; i < steps; i++) {
        var t  = i / steps;
        var mx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * jitter * 2;
        var my = y1 + (y2 - y1) * t + (Math.random() - 0.5) * jitter * 2;
        d += ' L ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    d += ' L ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
    return d;
}

// Fade-out helper
function fadeRemove(el, delayMs, durationMs) {
    setTimeout(function () {
        el.style.transition = 'opacity ' + durationMs + 'ms ease-out';
        el.style.opacity = '0';
        setTimeout(function () { el.remove(); }, durationMs);
    }, delayMs);
}

// ─────────────────────────────────────────────
//  drawLightningBolt  (single segment)
//  isMain: true  → main strike (thicker)
//  isMain: false → chain hop   (thinner)
//  isCritical → no color change, just +30% thickness
// ─────────────────────────────────────────────
function drawLightningBolt(svg, x1, y1, x2, y2, isCritical, isMain) {
    if (isMain == null) isMain = true;

    // Base widths: main is thicker than chain
    var baseGlow = isMain ? 10 : 5;
    var baseMid  = isMain ? 3.5 : 1.8;
    var baseCore = isMain ? 1.5 : 0.8;
    var sparkR   = isMain ? 6   : 3.5;

    // Crit: +30% thickness, no color change
    var critMult = isCritical ? 1.3 : 1.0;
    var gw = (baseGlow * critMult).toFixed(1);
    var mw = (baseMid  * critMult).toFixed(1);
    var cw = (baseCore * critMult).toFixed(1);
    var sr = (sparkR   * critMult).toFixed(1);

    // Same blue palette regardless of crit
    var color     = '#88ccff';
    var glowColor = '#4499ff';
    var coreColor = '#ddeeff';

    var g = ns('g');
    g.style.opacity = '1';

    // Glow layer
    var glow = ns('path');
    glow.setAttribute('d', zigzagPath(x1, y1, x2, y2, isMain ? 22 : 12));
    glow.setAttribute('stroke', glowColor);
    glow.setAttribute('stroke-width', gw);
    glow.setAttribute('stroke-linecap', 'round');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('opacity', isMain ? '0.45' : '0.3');
    glow.setAttribute('filter', 'url(#sorc-blur)');

    // Mid layer
    var mid = ns('path');
    mid.setAttribute('d', zigzagPath(x1, y1, x2, y2, isMain ? 15 : 8));
    mid.setAttribute('stroke', color);
    mid.setAttribute('stroke-width', mw);
    mid.setAttribute('stroke-linecap', 'round');
    mid.setAttribute('fill', 'none');
    mid.setAttribute('opacity', '0.9');

    // Core
    var core = ns('path');
    core.setAttribute('d', zigzagPath(x1, y1, x2, y2, isMain ? 8 : 4));
    core.setAttribute('stroke', coreColor);
    core.setAttribute('stroke-width', cw);
    core.setAttribute('stroke-linecap', 'round');
    core.setAttribute('fill', 'none');

    // Impact spark
    var spark = ns('circle');
    spark.setAttribute('cx', x2.toFixed(1));
    spark.setAttribute('cy', y2.toFixed(1));
    spark.setAttribute('r', sr);
    spark.setAttribute('fill', coreColor);
    spark.setAttribute('opacity', isMain ? '1' : '0.7');

    g.appendChild(glow);
    g.appendChild(mid);
    g.appendChild(core);
    g.appendChild(spark);
    svg.appendChild(g);

    // Main strike lingers slightly longer than chain hops
    var holdMs   = isMain ? 80  : 40;
    var fadeMs   = isMain ? 180 : 130;
    fadeRemove(g, holdMs, fadeMs);
}

// ─────────────────────────────────────────────
//  drawLightningChain
//  points[0] = player, points[1] = first target,
//  points[2..] = chain targets
// ─────────────────────────────────────────────
function drawLightningChain(points, isCritical) {
    if (!points || points.length < 2) return;
    var svg = ensureLightningSvg();
    if (!svg) return;
    for (var i = 0; i < points.length - 1; i++) {
        var isMain = (i === 0);   // first segment = main strike
        drawLightningBolt(svg, points[i].x, points[i].y, points[i+1].x, points[i+1].y, isCritical, isMain);
    }
}

// ─────────────────────────────────────────────
//  drawSkyLightning  –  ability "call lightning"
//  Strikes from the top of the game area down to
//  the target with a bright flash + afterglow.
// ─────────────────────────────────────────────
function drawSkyLightning(tx, ty) {
    var svg = ensureLightningSvg();
    if (!svg) return;

    // Start slightly above the game area, near target X
    var sx = tx + (Math.random() - 0.5) * 60;
    var sy = -20;

    var g = ns('g');
    g.style.opacity = '1';

    // Wide outer arc glow (very diffuse)
    var outerGlow = ns('path');
    outerGlow.setAttribute('d', zigzagPath(sx, sy, tx, ty, 35));
    outerGlow.setAttribute('stroke', '#aaddff');
    outerGlow.setAttribute('stroke-width', '22');
    outerGlow.setAttribute('stroke-linecap', 'round');
    outerGlow.setAttribute('fill', 'none');
    outerGlow.setAttribute('opacity', '0.25');
    outerGlow.setAttribute('filter', 'url(#sorc-glow)');

    // Inner glow
    var innerGlow = ns('path');
    innerGlow.setAttribute('d', zigzagPath(sx, sy, tx, ty, 24));
    innerGlow.setAttribute('stroke', '#66bbff');
    innerGlow.setAttribute('stroke-width', '10');
    innerGlow.setAttribute('stroke-linecap', 'round');
    innerGlow.setAttribute('fill', 'none');
    innerGlow.setAttribute('opacity', '0.55');
    innerGlow.setAttribute('filter', 'url(#sorc-blur)');

    // Main bolt
    var bolt = ns('path');
    bolt.setAttribute('d', zigzagPath(sx, sy, tx, ty, 16));
    bolt.setAttribute('stroke', '#99ddff');
    bolt.setAttribute('stroke-width', '4');
    bolt.setAttribute('stroke-linecap', 'round');
    bolt.setAttribute('fill', 'none');
    bolt.setAttribute('opacity', '1');

    // Bright core
    var core = ns('path');
    core.setAttribute('d', zigzagPath(sx, sy, tx, ty, 7));
    core.setAttribute('stroke', '#ffffff');
    core.setAttribute('stroke-width', '1.5');
    core.setAttribute('stroke-linecap', 'round');
    core.setAttribute('fill', 'none');

    // Impact burst — expanding ring
    var burst = ns('circle');
    burst.setAttribute('cx', tx.toFixed(1));
    burst.setAttribute('cy', ty.toFixed(1));
    burst.setAttribute('r', '6');
    burst.setAttribute('fill', 'none');
    burst.setAttribute('stroke', '#ffffff');
    burst.setAttribute('stroke-width', '3');
    burst.setAttribute('opacity', '1');

    // Impact fill dot
    var dot = ns('circle');
    dot.setAttribute('cx', tx.toFixed(1));
    dot.setAttribute('cy', ty.toFixed(1));
    dot.setAttribute('r', '5');
    dot.setAttribute('fill', '#cceeff');
    dot.setAttribute('opacity', '1');

    g.appendChild(outerGlow);
    g.appendChild(innerGlow);
    g.appendChild(bolt);
    g.appendChild(core);
    g.appendChild(burst);
    g.appendChild(dot);
    svg.appendChild(g);

    // Animate the burst ring expanding outward
    var startTime = null;
    function animateBurst(ts) {
        if (!startTime) startTime = ts;
        var elapsed = ts - startTime;
        var progress = Math.min(elapsed / 300, 1);
        var r = 6 + progress * 24;
        var op = (1 - progress) * 0.8;
        burst.setAttribute('r', r.toFixed(1));
        burst.setAttribute('opacity', op.toFixed(3));
        if (progress < 1) requestAnimationFrame(animateBurst);
    }
    requestAnimationFrame(animateBurst);

    // Hold briefly then fade
    fadeRemove(g, 120, 250);
}

// ─────────────────────────────────────────────
//  drawChainReverbCollapse  –  Chain Reverb fallback
//  Plays when a chain with no valid next target
//  collapses back onto the original enemy.
//  Distinct white/light-blue imploding ring effect
//  to distinguish it from normal chain hits.
// ─────────────────────────────────────────────
function drawChainReverbCollapse(tx, ty, isCritical) {
    var svg = ensureLightningSvg();
    if (!svg) return;

    var g = ns('g');
    var outerR  = isCritical ? 34 : 24;
    var numArcs = isCritical ? 6 : 4;
    // White/light-blue palette
    var col1 = isCritical ? '#aaddff' : '#88ccff';
    var col2 = '#ddf0ff';
    var col3 = '#ffffff';

    // ── Outer imploding ring (starts large, shrinks to centre) ──
    var ring = ns('circle');
    ring.setAttribute('cx', tx.toFixed(1));
    ring.setAttribute('cy', ty.toFixed(1));
    ring.setAttribute('r', outerR.toFixed(1));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', col1);
    ring.setAttribute('stroke-width', isCritical ? '3' : '2');
    ring.setAttribute('opacity', '0.8');
    ring.setAttribute('filter', 'url(#sorc-blur)');
    g.appendChild(ring);

    // ── Inward arc spokes converging on target ──
    for (var i = 0; i < numArcs; i++) {
        var angle = (i / numArcs) * Math.PI * 2;
        var sx2   = tx + Math.cos(angle) * outerR;
        var sy2   = ty + Math.sin(angle) * outerR;

        var spoke = ns('path');
        spoke.setAttribute('d', zigzagPath(sx2, sy2, tx, ty, 6));
        spoke.setAttribute('stroke', col1);
        spoke.setAttribute('stroke-width', isCritical ? '2.2' : '1.5');
        spoke.setAttribute('fill', 'none');
        spoke.setAttribute('stroke-linecap', 'round');
        spoke.setAttribute('opacity', '0.85');
        g.appendChild(spoke);

        // Bright core spoke
        var spokeCore = ns('path');
        spokeCore.setAttribute('d', zigzagPath(sx2, sy2, tx, ty, 2));
        spokeCore.setAttribute('stroke', col2);
        spokeCore.setAttribute('stroke-width', '0.8');
        spokeCore.setAttribute('fill', 'none');
        spokeCore.setAttribute('stroke-linecap', 'round');
        spokeCore.setAttribute('opacity', '0.7');
        g.appendChild(spokeCore);
    }

    // ── Central impact flash ──
    var flash = ns('circle');
    flash.setAttribute('cx', tx.toFixed(1));
    flash.setAttribute('cy', ty.toFixed(1));
    flash.setAttribute('r', isCritical ? '7' : '5');
    flash.setAttribute('fill', col2);
    flash.setAttribute('opacity', '0.9');
    flash.setAttribute('filter', 'url(#sorc-blur)');
    g.appendChild(flash);

    var dot = ns('circle');
    dot.setAttribute('cx', tx.toFixed(1));
    dot.setAttribute('cy', ty.toFixed(1));
    dot.setAttribute('r', isCritical ? '3' : '2');
    dot.setAttribute('fill', col3);
    dot.setAttribute('opacity', '1');
    g.appendChild(dot);

    svg.appendChild(g);

    // Animate: ring implodes inward while fading; hold briefly at centre then fade out
    var startT   = null;
    var impMs    = 180;   // ring shrink phase
    var holdMs   = 60;    // hold at impact
    var fadeMs   = 220;   // fade out
    var totalMs  = impMs + holdMs + fadeMs;

    function animateReverb(ts) {
        if (!startT) startT = ts;
        var elapsed = ts - startT;

        if (elapsed <= impMs) {
            // Ring shrinks from outerR toward 0
            var t = elapsed / impMs;
            var r = outerR * (1 - t);
            ring.setAttribute('r', Math.max(0, r).toFixed(1));
            ring.setAttribute('opacity', (0.8 * (1 - t * 0.5)).toFixed(3));
            g.style.opacity = '1';
        } else if (elapsed <= impMs + holdMs) {
            ring.setAttribute('r', '0');
            g.style.opacity = '1';
        } else {
            var fp = Math.min((elapsed - impMs - holdMs) / fadeMs, 1);
            g.style.opacity = (1 - fp).toFixed(3);
        }

        if (elapsed < totalMs) {
            requestAnimationFrame(animateReverb);
        } else {
            g.remove();
        }
    }
    requestAnimationFrame(animateReverb);
}

// ─────────────────────────────────────────────
//  drawVoidBlast  –  Acolyte hit effect
//  Dark purple swirl at impact point with
//  outward spiking tendrils.
// ─────────────────────────────────────────────
function drawVoidBlast(cx, cy, isCritical) {
    var svg = ensureLightningSvg();
    if (!svg) return;

    var g = ns('g');

    var numTendrils = isCritical ? 10 : 7;
    var maxLen      = isCritical ? 42 : 28;
    var colors      = ['#9b30ff', '#7a00cc', '#bf7fff', '#6600aa'];

    // ── Swirl rings (2 of them, slightly offset) ──
    for (var ring = 0; ring < 2; ring++) {
        var swirl = ns('path');
        var r0    = 4 + ring * 3;
        var r1    = 14 + ring * 6;
        var turns = isCritical ? 1.8 : 1.2;
        var pts   = '';
        var steps = 48;
        for (var i = 0; i <= steps; i++) {
            var t     = i / steps;
            var angle = t * Math.PI * 2 * turns - Math.PI / 2 + ring * 0.4;
            var r     = r0 + (r1 - r0) * t;
            var px    = cx + Math.cos(angle) * r;
            var py    = cy + Math.sin(angle) * r;
            pts += (i === 0 ? 'M ' : 'L ') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
        }
        swirl.setAttribute('d', pts);
        swirl.setAttribute('stroke', ring === 0 ? '#9b30ff' : '#6600aa');
        swirl.setAttribute('stroke-width', isCritical ? (ring === 0 ? '3' : '2') : (ring === 0 ? '2.5' : '1.5'));
        swirl.setAttribute('fill', 'none');
        swirl.setAttribute('stroke-linecap', 'round');
        swirl.setAttribute('opacity', '0.9');
        swirl.setAttribute('filter', 'url(#void-blur)');
        g.appendChild(swirl);
    }

    // ── Tendrils shooting outward ──
    for (var t2 = 0; t2 < numTendrils; t2++) {
        var baseAngle = (t2 / numTendrils) * Math.PI * 2 + Math.random() * 0.4;
        var len       = maxLen * (0.5 + Math.random() * 0.5);
        var jag       = len * 0.25;

        var ex  = cx + Math.cos(baseAngle) * len;
        var ey  = cy + Math.sin(baseAngle) * len;
        var col = colors[Math.floor(Math.random() * colors.length)];

        // Build a short jagged line from center out
        var steps2 = Math.max(2, Math.floor(len / 10));
        var td = 'M ' + cx.toFixed(1) + ' ' + cy.toFixed(1);
        for (var s = 1; s < steps2; s++) {
            var tt  = s / steps2;
            var tmx = cx + (ex - cx) * tt + (Math.random() - 0.5) * jag;
            var tmy = cy + (ey - cy) * tt + (Math.random() - 0.5) * jag;
            td += ' L ' + tmx.toFixed(1) + ' ' + tmy.toFixed(1);
        }
        td += ' L ' + ex.toFixed(1) + ' ' + ey.toFixed(1);

        // Glow copy
        var tGlow = ns('path');
        tGlow.setAttribute('d', td);
        tGlow.setAttribute('stroke', '#9b30ff');
        tGlow.setAttribute('stroke-width', isCritical ? '4' : '3');
        tGlow.setAttribute('fill', 'none');
        tGlow.setAttribute('stroke-linecap', 'round');
        tGlow.setAttribute('opacity', '0.35');
        tGlow.setAttribute('filter', 'url(#void-blur)');

        var tendril = ns('path');
        tendril.setAttribute('d', td);
        tendril.setAttribute('stroke', col);
        tendril.setAttribute('stroke-width', isCritical ? '1.8' : '1.2');
        tendril.setAttribute('fill', 'none');
        tendril.setAttribute('stroke-linecap', 'round');
        tendril.setAttribute('opacity', '0.95');

        g.appendChild(tGlow);
        g.appendChild(tendril);
    }

    // ── Central glow core ──
    var core = ns('circle');
    core.setAttribute('cx', cx.toFixed(1));
    core.setAttribute('cy', cy.toFixed(1));
    core.setAttribute('r', isCritical ? '8' : '5');
    core.setAttribute('fill', '#bf7fff');
    core.setAttribute('opacity', '0.7');
    core.setAttribute('filter', 'url(#void-blur)');

    var dot = ns('circle');
    dot.setAttribute('cx', cx.toFixed(1));
    dot.setAttribute('cy', cy.toFixed(1));
    dot.setAttribute('r', isCritical ? '3' : '2');
    dot.setAttribute('fill', '#ffffff');
    dot.setAttribute('opacity', '0.9');

    g.appendChild(core);
    g.appendChild(dot);
    svg.appendChild(g);

    // Animate: hold at full opacity briefly, then scale out and fade over ~1.4s
    var startT = null;
    var holdMs    = isCritical ? 300 : 200;   // stay bright before fading
    var duration  = isCritical ? 1100 : 900;  // fade duration after hold
    function animateVoid(ts) {
        if (!startT) startT = ts;
        var elapsed = ts - startT;
        var prog;
        if (elapsed < holdMs) {
            prog = 0; // full opacity during hold
        } else {
            prog = Math.min((elapsed - holdMs) / duration, 1);
        }
        g.style.opacity = (1 - prog).toFixed(3);
        var scale = 1 + prog * 0.5;
        g.setAttribute('transform',
            'translate(' + cx + ',' + cy + ') scale(' + scale.toFixed(3) + ') translate(' + (-cx) + ',' + (-cy) + ')');
        if (prog < 1) requestAnimationFrame(animateVoid);
        else g.remove();
    }
    requestAnimationFrame(animateVoid);
}

// ─────────────────────────────────────────────
//  drawSparkAttackLightning  –  SparkWand attack
//  Called once per attack; fires a sky-strike-
//  style bolt from above down to every enemy.
// ─────────────────────────────────────────────
function drawSparkAttackLightning(tx, ty, isCritical) {
    var svg = ensureLightningSvg();
    if (!svg) return;

    // Origin: directly above the target with slight horizontal scatter
    var sx = tx + (Math.random() - 0.5) * 40;
    var sy = -20;

    var g = ns('g');
    g.style.opacity = '1';

    // Outer diffuse glow
    var outerGlow = ns('path');
    outerGlow.setAttribute('d', zigzagPath(sx, sy, tx, ty, 30));
    outerGlow.setAttribute('stroke', isCritical ? '#ccaaff' : '#aaddff');
    outerGlow.setAttribute('stroke-width', isCritical ? '18' : '14');
    outerGlow.setAttribute('stroke-linecap', 'round');
    outerGlow.setAttribute('fill', 'none');
    outerGlow.setAttribute('opacity', '0.20');
    outerGlow.setAttribute('filter', 'url(#sorc-glow)');

    // Inner glow
    var innerGlow = ns('path');
    innerGlow.setAttribute('d', zigzagPath(sx, sy, tx, ty, 20));
    innerGlow.setAttribute('stroke', isCritical ? '#bb88ff' : '#66bbff');
    innerGlow.setAttribute('stroke-width', isCritical ? '8' : '6');
    innerGlow.setAttribute('stroke-linecap', 'round');
    innerGlow.setAttribute('fill', 'none');
    innerGlow.setAttribute('opacity', '0.50');
    innerGlow.setAttribute('filter', 'url(#sorc-blur)');

    // Main bolt
    var bolt = ns('path');
    bolt.setAttribute('d', zigzagPath(sx, sy, tx, ty, 13));
    bolt.setAttribute('stroke', isCritical ? '#ddaaff' : '#99ddff');
    bolt.setAttribute('stroke-width', isCritical ? '3.5' : '2.5');
    bolt.setAttribute('stroke-linecap', 'round');
    bolt.setAttribute('fill', 'none');
    bolt.setAttribute('opacity', '1');

    // Bright core
    var core = ns('path');
    core.setAttribute('d', zigzagPath(sx, sy, tx, ty, 5));
    core.setAttribute('stroke', '#ffffff');
    core.setAttribute('stroke-width', '1');
    core.setAttribute('stroke-linecap', 'round');
    core.setAttribute('fill', 'none');

    // Impact ring
    var burst = ns('circle');
    burst.setAttribute('cx', tx.toFixed(1));
    burst.setAttribute('cy', ty.toFixed(1));
    burst.setAttribute('r', '5');
    burst.setAttribute('fill', 'none');
    burst.setAttribute('stroke', isCritical ? '#cc99ff' : '#ffffff');
    burst.setAttribute('stroke-width', '2.5');
    burst.setAttribute('opacity', '1');

    // Impact dot
    var dot = ns('circle');
    dot.setAttribute('cx', tx.toFixed(1));
    dot.setAttribute('cy', ty.toFixed(1));
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', isCritical ? '#ddbbff' : '#cceeff');
    dot.setAttribute('opacity', '1');

    g.appendChild(outerGlow);
    g.appendChild(innerGlow);
    g.appendChild(bolt);
    g.appendChild(core);
    g.appendChild(burst);
    g.appendChild(dot);
    svg.appendChild(g);

    // Animate burst ring expanding
    var startTime = null;
    function animateBurst(ts) {
        if (!startTime) startTime = ts;
        var elapsed = ts - startTime;
        var progress = Math.min(elapsed / 250, 1);
        var r = 5 + progress * 18;
        var op = (1 - progress) * 0.75;
        burst.setAttribute('r', r.toFixed(1));
        burst.setAttribute('opacity', op.toFixed(3));
        if (progress < 1) requestAnimationFrame(animateBurst);
    }
    requestAnimationFrame(animateBurst);

    // Slightly shorter hold than the ability version — it fires every attack
    fadeRemove(g, 80, 180);
}
// ─────────────────────────────────────────────
//  SOUL FRAGMENT / CLASS HEX  –  visual helpers
//  (moved from upgrades.js)
// ─────────────────────────────────────────────

function _sfRand(a, b) { return a + Math.random() * (b - a); }

function _sfConvexHull(pts) {
    if (pts.length < 3) return pts;
    pts = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length-2], lo[lo.length-1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length-2], up[up.length-1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
}

function _sfBuildVoronoi(W, H, seeds) {
    const n = seeds.length, sc = 2;
    const sw = Math.ceil(W / sc), sh = Math.ceil(H / sc);
    const cell = new Int16Array(sw * sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        let best = 0, bestD = Infinity;
        const px = x * sc, py = y * sc;
        for (let i = 0; i < n; i++) { const dx = px - seeds[i].x, dy = py - seeds[i].y, d = dx*dx+dy*dy; if (d < bestD) { bestD = d; best = i; } }
        cell[y * sw + x] = best;
    }
    const cp = Array.from({length: n}, () => []);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const c = cell[y*sw+x];
        if ((x>0&&cell[y*sw+x-1]!==c)||(x<sw-1&&cell[y*sw+x+1]!==c)||(y>0&&cell[(y-1)*sw+x]!==c)||(y<sh-1&&cell[(y+1)*sw+x]!==c))
            cp[c].push({x:x*sc, y:y*sc});
    }
    return seeds.map((s, i) => ({ polygon: _sfConvexHull(cp[i]), cx: s.x, cy: s.y }));
}

async function _sfSvgToBitmap(svgEl, w, h) {
    const cl = svgEl.cloneNode(true);
    cl.setAttribute('width', w); cl.setAttribute('height', h);
    const xml = new XMLSerializer().serializeToString(cl);
    const blob = new Blob([xml], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    URL.revokeObjectURL(url);
    return createImageBitmap(img, {resizeWidth: w, resizeHeight: h});
}

const _SF_GLOW = {
    'normal-shell':    'rgba(180,180,200,0.9)',
    'magic-shell':     'rgba(80,160,255,0.9)',
    'epic-shell':      'rgba(180,80,255,0.9)',
    'legendary-shell': 'rgba(255,210,60,0.9)',
    'purple-hex':      'rgba(160,80,255,0.9)',
    'blue-hex':        'rgba(60,140,255,0.9)',
    'gold-hex':        'rgba(255,200,50,0.9)',
};

// Shatter the card visually, then call onComplete after shards fly
async function _sfShatter(shellEl, onComplete) {
    const rect = shellEl.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    if (W < 4 || H < 4) { onComplete(); return; }
    const cx = rect.left + W / 2, cy = rect.top + H / 2;

    const svgEl = shellEl.querySelector('svg');
    if (!svgEl) { onComplete(); return; }

    const bmp = await _sfSvgToBitmap(svgEl, W, H);
    shellEl.style.visibility = 'hidden';

    let glowColor = 'rgba(255,255,255,0.8)';
    for (const [cls, g] of Object.entries(_SF_GLOW)) if (shellEl.classList.contains(cls)) { glowColor = g; break; }

    // Voronoi seeds
    const cols = 5, rows = 7, seeds = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
        seeds.push({x:(c+0.5)/cols*W+_sfRand(-W*0.06,W*0.06), y:(r+0.5)/rows*H+_sfRand(-H*0.04,H*0.04)});
    seeds.push({x:_sfRand(0,W), y:_sfRand(0,H*0.15)}, {x:_sfRand(0,W), y:_sfRand(H*0.85,H)},
               {x:_sfRand(0,W*0.15), y:_sfRand(0,H)}, {x:_sfRand(W*0.85,W), y:_sfRand(0,H)});
    const cells = _sfBuildVoronoi(W, H, seeds);

    // Burst flash
    const burst = document.createElement('div');
    burst.style.cssText = `position:fixed;pointer-events:none;z-index:9998;left:${cx}px;top:${cy}px;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:radial-gradient(circle,${glowColor} 0%,transparent 70%);animation:sfBurstExpand 0.4s ease-out forwards;`;
    document.body.appendChild(burst);
    burst.addEventListener('animationend', () => burst.remove());

    cells.forEach(({polygon, cx: scx, cy: scy}) => {
        if (polygon.length < 3) return;
        const xs = polygon.map(p=>p.x), ys = polygon.map(p=>p.y);
        const minX = Math.max(0, Math.floor(Math.min(...xs))), minY = Math.max(0, Math.floor(Math.min(...ys)));
        const maxX = Math.min(W, Math.ceil(Math.max(...xs))),  maxY = Math.min(H, Math.ceil(Math.max(...ys)));
        const pw = maxX-minX, ph = maxY-minY;
        if (pw < 2 || ph < 2) return;
        const c = document.createElement('canvas'); c.width = pw; c.height = ph;
        const ctx = c.getContext('2d');
        ctx.beginPath(); polygon.forEach((p,i) => i===0 ? ctx.moveTo(p.x-minX,p.y-minY) : ctx.lineTo(p.x-minX,p.y-minY));
        ctx.closePath(); ctx.clip();
        ctx.drawImage(bmp, -minX, -minY, W, H);
        ctx.strokeStyle = glowColor; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7; ctx.stroke();
        const el = document.createElement('canvas'); el.width = pw; el.height = ph;
        el.getContext('2d').drawImage(c, 0, 0);
        const angle = Math.atan2(scy-H/2, scx-W/2) + _sfRand(-0.5, 0.5);
        const speed = _sfRand(90, 280), grav = _sfRand(150, 320);
        const tx = Math.cos(angle)*speed, ty = Math.sin(angle)*speed+grav;
        const rot = _sfRand(-200, 200), dur = _sfRand(0.6, 1.1), delay = _sfRand(0, 0.05);
        el.style.cssText = `position:fixed;pointer-events:none;z-index:9999;left:${rect.left+minX}px;top:${rect.top+minY}px;--tx:translate(${tx}px,${ty}px);--rot:${rot}deg;--dur:${dur}s;animation:sfShardFly var(--dur) cubic-bezier(0.22,0.61,0.36,1) ${delay}s forwards;`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    });

    // Trigger callback after most shards are flying (~650ms)
    setTimeout(onComplete, 650);
}

// ── SVG text helper ───────────────────────────────────────────────────────────
// Renders upgrade name as SVG text. For 3-word names, splits the 3rd word onto a new line.
function _sfNameSVG(name, x, y, fs, fill) {
    const words = name.split(' ');
    if (words.length === 3) {
        const line1 = words.slice(0, 2).join(' ');
        const line2 = words[2];
        const dy = fs * 1.1;
        return `<text x="${x}" y="${y - dy * 0.5}" text-anchor="middle" dominant-baseline="central" font-family="'Georgia',serif" font-style="italic" font-size="${fs}" fill="${fill}">${line1}</text>` +
               `<text x="${x}" y="${y + dy * 0.5}" text-anchor="middle" dominant-baseline="central" font-family="'Georgia',serif" font-style="italic" font-size="${fs}" fill="${fill}">${line2}</text>`;
    }
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="'Georgia',serif" font-style="italic" font-size="${fs}" fill="${fill}">${name}</text>`;
}

// ── Fragment card SVG builder ─────────────────────────────────────────────────
function _sfFragSVG(upgrade) {
    const r = (upgrade.rarity || 'Normal').toLowerCase();
    const val  = upgrade.getValue ? upgrade.getValue(upgrade.rarity || 'Normal') : '';
    const id   = (upgrade.name || '').replace(/[^a-z0-9]/gi, '');
    const secVal  = (r === 'legendary' && upgrade.secondaryUpgrade) ? upgrade.secondaryUpgrade.getValue(upgrade.secondaryRarity) : '';
    const secName = (r === 'legendary' && upgrade.secondaryUpgrade) ? upgrade.secondaryUpgrade.name : '';

    const T = {
        normal: ['normal-shell','sfn','#3a3a42','#22222a','#5a5a6a','1.5','#4a4a58','#2a2a34',
            '22,8 126,4 142,28 144,166 130,186 18,188 4,170 6,24',
            '28,16 120,12 134,32 136,160 122,178 26,180 12,164 14,30',
            '22,8 36,4 30,20 14,24','#18181e','130,186 144,180 140,166 128,174','#18181e',
            '#c0c0cc','#6a6a78','',
            '<circle cx="74" cy="160" r="3" fill="#5a5a68"/>',
            `<line x1="74" y1="4" x2="68" y2="38" stroke="%c" stroke-width="1.5"/>
        <line x1="68" y1="38" x2="72" y2="70" stroke="%c" stroke-width="1.1" opacity="0.9"/>
        <line x1="140" y1="60" x2="105" y2="72" stroke="%c" stroke-width="1.3" opacity="0.9"/>
        <line x1="4" y1="90" x2="38" y2="80" stroke="%c" stroke-width="1.2" opacity="0.8"/>`],
        magic: ['magic-shell','sfm','#1a2d4a','#0e1d32','url(#sfme%id)','1.8','#2a5a9a','#0e1d32',
            '20,6 128,2 144,30 146,164 132,188 16,190 2,172 4,26',
            '28,14 120,10 136,34 138,160 124,182 24,184 10,166 12,32',
            '20,6 38,2 32,18 14,22','#0a1626','132,188 146,182 142,166 130,176','#0a1626',
            '#7ab8ef','#4a7ab8','',
            '<circle cx="68" cy="160" r="3.5" fill="#2a5aaf"/><circle cx="80" cy="160" r="3.5" fill="#4a8adf"/>',
            `<line x1="74" y1="2" x2="80" y2="44" stroke="%c" stroke-width="1.4"/>
        <line x1="6" y1="110" x2="40" y2="98" stroke="%c" stroke-width="1" opacity="0.8"/>
        <line x1="144" y1="75" x2="112" y2="85" stroke="%c" stroke-width="1.1" opacity="0.8"/>`],
        epic: ['epic-shell','sfe','#2c1044','#1a0a2e','url(#sfee%id)','2','#8040cc','#1a0a2e',
            '18,10 130,4 144,32 146,162 128,190 14,188 2,170 4,28',
            '26,18 122,12 136,36 138,158 120,182 22,180 10,164 12,36',
            '18,10 36,4 28,22 12,26','#100820','128,190 146,184 140,168 126,178','#100820',
            '#c080f0','#7040b0',
            '<text x="74" y="52" text-anchor="middle" fill="#5020a0" font-size="9" font-family="serif" opacity="0.7">⬡ ✦ ⬡</text>',
            '<circle cx="62" cy="162" r="3.5" fill="#6030aa"/><circle cx="74" cy="162" r="3.5" fill="#a060e0"/><circle cx="86" cy="162" r="3.5" fill="#6030aa"/>',
            `<polyline points="74,4 70,30 78,52 72,80" fill="none" stroke="%c" stroke-width="1.5"/>
        <line x1="144" y1="80" x2="110" y2="92" stroke="%c" stroke-width="1.2" opacity="0.9"/>`],
    };
    const t = T[r];
    if (t) {
        const [sc,gp,gA,gB,es,ew,is,ck,op,ip,c1p,c1c,c2p,c2c,vf,nf,accent,dots,cracks] = t;
        const edgeGrad = es.startsWith('url') ? (r==='magic'
            ? `<linearGradient id="sfme${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4a8adf" stop-opacity="0.8"/><stop offset="100%" stop-color="#2a5aaf" stop-opacity="0.4"/></linearGradient>`
            : `<linearGradient id="sfee${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b060ee" stop-opacity="0.9"/><stop offset="100%" stop-color="#6030aa" stop-opacity="0.5"/></linearGradient>`) : '';
        const stroke = es.replace('%id', id);
        return {shellClass:sc, width:148, height:192, svg:`
      <svg viewBox="0 0 148 192" xmlns="http://www.w3.org/2000/svg" style="width:148px;height:192px;">
        <defs><linearGradient id="${gp}${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${gA}"/><stop offset="100%" stop-color="${gB}"/></linearGradient>${edgeGrad}</defs>
        <polygon points="${op}" fill="url(#${gp}${id})" stroke="${stroke}" stroke-width="${ew}"/>
        <polygon points="${ip}" fill="none" stroke="${is}" stroke-width="0.8" opacity="0.6"/>
        ${cracks.replaceAll('%c', ck)}
        <polygon points="${c1p}" fill="${c1c}" stroke="${is}" stroke-width="0.8"/>
        <polygon points="${c2p}" fill="${c2c}" stroke="${is}" stroke-width="0.8"/>
        ${accent}
        <text x="74" y="90" text-anchor="middle" dominant-baseline="central" font-family="'Cinzel','Georgia',serif" font-weight="700" font-size="29" fill="${vf}">${val}</text>
        ${_sfNameSVG(upgrade.name, 74, accent ? 130 : 128, 12.5, nf)}
        ${dots}
      </svg>`};
    }

    // legendary
    return {shellClass:'legendary-shell', width:148, height:220, svg:`
      <svg viewBox="0 0 148 220" xmlns="http://www.w3.org/2000/svg" style="width:148px;height:220px;overflow:visible;">
        <defs>
          <linearGradient id="sfl${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3a2800"/><stop offset="60%" stop-color="#2c1e00"/><stop offset="100%" stop-color="#1e1400"/></linearGradient>
          <linearGradient id="sfle${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd840" stop-opacity="1"/><stop offset="50%" stop-color="#e0a020" stop-opacity="0.8"/><stop offset="100%" stop-color="#c07010" stop-opacity="0.6"/></linearGradient>
          <linearGradient id="sfli${id}" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#ffd840" stop-opacity="0.08"/><stop offset="100%" stop-color="#ffd840" stop-opacity="0"/></linearGradient>
          <radialGradient id="sflg${id}" cx="50%" cy="45%" r="45%"><stop offset="0%" stop-color="#e0a820" stop-opacity="0.18"/><stop offset="100%" stop-color="#e0a820" stop-opacity="0"/></radialGradient>
          <linearGradient id="sflr${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity="0"/><stop offset="40%" stop-color="#ffeea0" stop-opacity="0.28"/><stop offset="60%" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
          <clipPath id="sflc${id}"><polygon points="18,10 130,4 146,32 148,192 130,214 16,212 2,194 4,28"/></clipPath>
        </defs>
        <polygon class="sf-leg-glow" points="16,12 132,6 146,34 148,194 130,216 14,214 2,196 4,30" fill="url(#sflg${id})" stroke="none"/>
        <polygon points="18,10 130,4 146,32 148,192 130,214 16,212 2,194 4,28" fill="url(#sfl${id})" stroke="url(#sfle${id})" stroke-width="2.2"/>
        <polygon points="26,18 122,12 138,36 140,186 122,206 24,204 10,186 12,36" fill="url(#sfli${id})" stroke="#c08020" stroke-width="1" opacity="0.6"/>
        <polyline points="74,4 70,22 76,40" fill="none" stroke="#1e1400" stroke-width="1.4" opacity="0.8"/>
        <polygon points="18,10 40,4 32,22 10,26" fill="#140e00" stroke="#d09020" stroke-width="1"/>
        <polygon points="130,4 148,16 140,32 124,20" fill="#140e00" stroke="#d09020" stroke-width="1"/>
        <polygon points="130,214 148,206 142,190 128,202" fill="#140e00" stroke="#d09020" stroke-width="1"/>
        <polygon points="16,212 2,202 8,186 22,198" fill="#140e00" stroke="#d09020" stroke-width="1"/>
        <g clip-path="url(#sflc${id})"><rect class="sf-leg-ref" x="-80" y="0" width="80" height="220" fill="url(#sflr${id})" opacity="1"/></g>
        <line x1="28" y1="142" x2="120" y2="142" stroke="#c08020" stroke-width="0.8" opacity="0.5" stroke-dasharray="4 3"/>
        <text x="74" y="44" text-anchor="middle" fill="#6a4800" font-size="10" font-family="serif" opacity="0.8">✦ ◆ ✦</text>
        <text x="74" y="90" text-anchor="middle" dominant-baseline="central" font-family="'Cinzel','Georgia',serif" font-weight="700" font-size="29" fill="#f0d060">${val}</text>
        ${_sfNameSVG(upgrade.name, 74, 126, 12.5, '#a07030')}
        ${secVal ? `<text x="74" y="155" text-anchor="middle" dominant-baseline="central" font-family="'Cinzel','Georgia',serif" font-weight="700" font-size="24" fill="#e8c080">${secVal}</text>
        ${_sfNameSVG(secName, 74, 182, 12.5, '#a07030')}` : ''}
        <line x1="18" y1="12" x2="50" y2="6" stroke="#ffd840" stroke-width="1.2" opacity="0.5"/>
      </svg>`};
}

// ── Class hex card SVG builder ────────────────────────────────────────────────
function _sfClassHexSVG(upgrade) {
    const pClass = player.class;
    let gradA, gradB, edgeA, edgeB, glowA, textFill, hexClass, crackColor, crackLines;
    if (pClass === 'Acolyte') {
        gradA='#3a1860'; gradB='#160830'; edgeA='#c070ff'; edgeB='#5020a0'; glowA='#a050ff'; textFill='#d09aff'; hexClass='purple-hex';
        crackColor='#110820';
        crackLines=`
        <polyline points="80,4 77,32 82,56 75,82 80,110" fill="none" stroke="${crackColor}" stroke-width="1.6" opacity="0.95"/>
        <polyline points="77,58 60,72 48,68" fill="none" stroke="${crackColor}" stroke-width="1.1" opacity="0.85"/>
        <polyline points="82,40 102,50 118,44 130,52" fill="none" stroke="${crackColor}" stroke-width="1.2" opacity="0.8"/>
        <polyline points="60,72 55,95 44,110 32,118" fill="none" stroke="${crackColor}" stroke-width="0.9" opacity="0.7"/>
        <polyline points="80,110 96,122 112,118 128,130" fill="none" stroke="${crackColor}" stroke-width="1" opacity="0.75"/>
        <line x1="48" y1="68" x2="40" y2="58" stroke="${crackColor}" stroke-width="0.7" opacity="0.6"/>
        <line x1="118" y1="44" x2="124" y2="34" stroke="${crackColor}" stroke-width="0.7" opacity="0.55"/>
        <line x1="75" y1="82" x2="62" y2="88" stroke="${crackColor}" stroke-width="0.7" opacity="0.65"/>
        <line x1="96" y1="122" x2="100" y2="140" stroke="${crackColor}" stroke-width="0.8" opacity="0.6"/>`;
    } else if (pClass === 'Sorceress') {
        gradA='#0c1e48'; gradB='#040e20'; edgeA='#70b8ff'; edgeB='#1040a0'; glowA='#3080ff'; textFill='#80c0ff'; hexClass='blue-hex';
        crackColor='#040e20';
        crackLines=`
        <polyline points="80,4 84,28 78,50 85,78" fill="none" stroke="${crackColor}" stroke-width="1.5" opacity="0.9"/>
        <polyline points="84,28 108,38 124,32 144,44" fill="none" stroke="${crackColor}" stroke-width="1.2" opacity="0.8"/>
        <polyline points="78,50 58,62 36,56" fill="none" stroke="${crackColor}" stroke-width="1" opacity="0.75"/>
        <polyline points="85,78 100,92 116,88 134,96" fill="none" stroke="${crackColor}" stroke-width="0.9" opacity="0.7"/>
        <polyline points="58,62 50,82 36,90" fill="none" stroke="${crackColor}" stroke-width="0.8" opacity="0.65"/>
        <line x1="108" y1="38" x2="112" y2="24" stroke="${crackColor}" stroke-width="0.7" opacity="0.55"/>
        <line x1="36" y1="56" x2="26" y2="64" stroke="${crackColor}" stroke-width="0.6" opacity="0.5"/>
        <line x1="85" y1="78" x2="80" y2="108" stroke="${crackColor}" stroke-width="0.8" opacity="0.6"/>`;
    } else {
        gradA='#3a2800'; gradB='#1a1000'; edgeA='#ffd840'; edgeB='#a06010'; glowA='#e0a820'; textFill='#f0d060'; hexClass='gold-hex';
        crackColor='#1a1000';
        crackLines=`
        <polyline points="80,4 76,36 82,62" fill="none" stroke="${crackColor}" stroke-width="1.4" opacity="0.88"/>
        <polyline points="76,36 104,46 132,40" fill="none" stroke="${crackColor}" stroke-width="1.2" opacity="0.78"/>
        <polyline points="82,62 62,76 44,70" fill="none" stroke="${crackColor}" stroke-width="1" opacity="0.72"/>
        <polyline points="82,62 90,86 86,108 94,130" fill="none" stroke="${crackColor}" stroke-width="0.9" opacity="0.68"/>
        <polyline points="62,76 55,98 42,108" fill="none" stroke="${crackColor}" stroke-width="0.8" opacity="0.62"/>
        <line x1="104" y1="46" x2="110" y2="32" stroke="${crackColor}" stroke-width="0.7" opacity="0.55"/>
        <line x1="44" y1="70" x2="34" y2="78" stroke="${crackColor}" stroke-width="0.6" opacity="0.5"/>
        <line x1="90" y1="86" x2="106" y2="82" stroke="${crackColor}" stroke-width="0.7" opacity="0.58"/>`;
    }
    const id = upgrade.name.replace(/[^a-z0-9]/gi, '');
    const words = upgrade.name.split(' ');
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' '), line2 = words.slice(mid).join(' ');
    const fs = upgrade.name.length > 14 ? 13 : 15;
    const y1 = line2 ? 82 : 92, y2 = 102;
    return {hexClass, svg:`
      <svg width="160" height="184" viewBox="0 0 160 184" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
        <defs>
          <linearGradient id="sfhg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${gradA}" stop-opacity="0.85"/><stop offset="100%" stop-color="${gradB}" stop-opacity="0.93"/></linearGradient>
          <linearGradient id="sfhe${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${edgeA}" stop-opacity="0.95"/><stop offset="100%" stop-color="${edgeB}" stop-opacity="0.55"/></linearGradient>
          <radialGradient id="sfhglow${id}" cx="50%" cy="45%" r="50%"><stop offset="0%" stop-color="${glowA}" stop-opacity="0.22"/><stop offset="100%" stop-color="${glowA}" stop-opacity="0"/></radialGradient>
          <linearGradient id="sfhref${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="35%" stop-color="${edgeA}" stop-opacity="0.3"/><stop offset="55%" stop-color="#fff" stop-opacity="0.2"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <clipPath id="sfhclip${id}"><polygon points="80,4 152,44 152,140 80,180 8,140 8,44"/></clipPath>
        </defs>
        <polygon class="sf-hex-glow-anim" points="80,0 158,42 158,142 80,184 2,142 2,42" fill="url(#sfhglow${id})" stroke="none"/>
        <polygon points="80,4 152,44 152,140 80,180 8,140 8,44" fill="url(#sfhg${id})" stroke="url(#sfhe${id})" stroke-width="2"/>
        <polygon points="80,12 144,48 144,136 80,172 16,136 16,48" fill="none" stroke="${edgeB}" stroke-width="1" opacity="0.5"/>
        ${crackLines}
        <g clip-path="url(#sfhclip${id})"><rect class="sf-hex-reflect" x="-70" y="0" width="70" height="184" fill="url(#sfhref${id})" opacity="1"/></g>
        <text x="80" y="${y1}" text-anchor="middle" font-family="'Cinzel','Georgia',serif" font-size="${fs}" font-weight="700" fill="${textFill}" opacity="0.97">${line1}</text>
        ${line2 ? `<text x="80" y="${y2}" text-anchor="middle" font-family="'Cinzel','Georgia',serif" font-size="${fs}" font-weight="700" fill="${textFill}" opacity="0.97">${line2}</text>` : ''}
      </svg>`};
}
// ─────────────────────────────────────────────
//  drawDivineAura  –  Divine Knight pulsing aura
//
//  Spawns gradient rings that radiate outward
//  from the aura boundary with staggered timing,
//  giving a "breathing holy energy" feel.
//  Called every frame from updateAuraVisual().
// ─────────────────────────────────────────────

(function () {
    let _auraRafId  = null;
    let _auraActive = false;

    // Two overlapping pulses staggered by half a cycle so the glow is
    // always present — one blooming while the other fades.
    const PULSE_DUR   = 3600;  // ms per expand cycle
    const PULSE_COUNT = 2;

    function ensureAuraCanvas() {
        let cvs = document.getElementById('divine-aura-canvas');
        if (!cvs) {
            cvs = document.createElement('canvas');
            cvs.id = 'divine-aura-canvas';
            cvs.style.cssText = 'position:absolute;left:0;top:0;width:800px;height:600px;pointer-events:none;z-index:2;';
            cvs.width  = 800;
            cvs.height = 600;
            const ga = document.getElementById('game-area');
            if (ga) ga.appendChild(cvs);
        }
        return cvs;
    }

    window.updateDivineAuraPulse = function (cx, cy, radius, fireMode) {
        if (!_auraActive) _startAuraLoop();
        window._divineAuraState = { cx, cy, radius, fireMode };
    };

    window.stopDivineAuraPulse = function () {
        _auraActive = false;
        if (_auraRafId) { cancelAnimationFrame(_auraRafId); _auraRafId = null; }
        const cvs = document.getElementById('divine-aura-canvas');
        if (cvs) { cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height); }
    };

    function _startAuraLoop() {
        _auraActive = true;
        const origin = performance.now();

        function loop(ts) {
            if (!_auraActive) return;
            const cvs = ensureAuraCanvas();
            const ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, cvs.width, cvs.height);

            const state = window._divineAuraState;
            if (!state) { _auraRafId = requestAnimationFrame(loop); return; }

            const { cx, cy, radius, fireMode } = state;
            const elapsed = ts - origin;

            for (let i = 0; i < PULSE_COUNT; i++) {
                // t goes 0→1 over PULSE_DUR, each pulse offset by half a cycle
                const t = ((elapsed + i * (PULSE_DUR / PULSE_COUNT)) % PULSE_DUR) / PULSE_DUR;

                // Radius grows from ~10% to 100% of aura radius
                const r = radius * (0.1 + t * 1);

                // Opacity: smooth bell curve — fades in, peaks around t=0.3, fades out
                const op = Math.pow(Math.sin(t * Math.PI), 1.6) * 0.25;
                if (op < 0.004 || r < 1) continue;

                // Colour: gold for normal, orange-red for fire mode
                const inner = fireMode ? `255,90,20`  : `255,245,140`;
                const mid   = fireMode ? `220,55,5`   : `255,235,80`;
                const outer = fireMode ? `180,25,0`   : `255,220,50`;

                // Pure radial fill — transparent at centre, peaks near outer edge, fades to nothing
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                grad.addColorStop(0,    `rgba(${inner},0)`);
                grad.addColorStop(0.35, `rgba(${inner},${(op * 0.08).toFixed(3)})`);
                grad.addColorStop(0.65, `rgba(${mid},  ${(op * 0.35).toFixed(3)})`);
                grad.addColorStop(0.85, `rgba(${outer},${(op * 0.65).toFixed(3)})`);
                grad.addColorStop(1,    `rgba(${outer},0)`);

                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();
            }

            _auraRafId = requestAnimationFrame(loop);
        }
        _auraRafId = requestAnimationFrame(loop);
    }
})();