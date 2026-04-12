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