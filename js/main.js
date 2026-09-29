/* ============================================================
   alina kuznetsova, portfolio | main.js
   the ascii system: an image split into ten brightness bands,
   each band set as a layer of text, layers shifted at different
   rates by the cursor to give depth.

   usage (no setup needed, runs on load):
   <div class="fig-art">
     <div class="ascii" data-ascii="images/face.png" data-h="520"
          data-fs="3" data-mode="portrait" role="img" aria-label="..."></div>
   </div>
   data-h   target height in px (capped by the container)
   data-fs  glyph size in px
   data-mode "portrait" for faces, anything else for objects
   ============================================================ */

var Portfolio = (function () {

  var RAMP = " .-_,:;~=+<>[]{}()|/tfjrxnuvzXYJCLQ0Zmwqdbkha*#MW8%B@$";
  var R = RAMP.length;
  var LAYERS = 10;

  // opacities tuned for ink on paper: the back layers stay legible
  var OPACITY = [0.2, 0.28, 0.37, 0.47, 0.57, 0.67, 0.77, 0.87, 0.95, 1.0];
  var PX = [0.4, 0.9, 1.6, 2.5, 3.6, 5.0, 6.6, 8.4, 10.5, 13.0];
  var PY = [0.3, 0.6, 1.1, 1.7, 2.4, 3.3, 4.4, 5.6, 7.0, 8.8];

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var instances = [];

  function inkRGB() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--ascii-rgb');
    return (v && v.trim()) || '17,22,18';
  }

  // tone curve: how dark a pixel is, or -1 to leave it blank
  function tone(r, g, b, a, portrait) {
    if (a < 30 || (r > 232 && g > 232 && b > 232)) return -1;
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    var lv = 1 - lum;
    if (portrait) return (lum > 0.9 || lv < 0.03) ? -1 : Math.pow(lv, 0.6);
    return lv < 0.04 ? -1 : Math.pow(lv, 0.85);
  }

  function build(inst) {
    var el = inst.el, img = inst.img;
    var fs = parseFloat(el.dataset.fs) || 3;
    var box = el.parentElement;
    var maxH = Math.min(parseFloat(el.dataset.h) || 420, (box.clientHeight || 420) * 0.96);
    var maxW = (box.clientWidth || 300) * 0.96;
    var CW = fs * 0.601, CH = fs * 1.14;
    var aspect = img.width / img.height;

    var rows = Math.round(maxH / CH);
    var cols = Math.round(rows * aspect * (CH / CW));
    var maxCols = Math.floor(maxW / CW);
    if (cols > maxCols) { cols = maxCols; rows = Math.round(cols / aspect * (CW / CH)); }
    if (cols < 4 || rows < 4) return;

    var c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cols, rows);
    var data = ctx.getImageData(0, 0, cols, rows).data;
    var portrait = el.dataset.mode === 'portrait';

    var raw = new Array(cols * rows), valid = [];
    for (var i = 0, p = 0; i < data.length; i += 4, p++) {
      var t = tone(data[i], data[i + 1], data[i + 2], data[i + 3], portrait);
      raw[p] = t;
      if (t >= 0) valid.push(t);
    }
    if (!valid.length) return;
    valid.sort(function (a, b) { return a - b; });
    var lo = valid[Math.floor(valid.length * 0.005)];
    var hi = valid[Math.floor(valid.length * 0.995)];
    var span = (hi - lo) || 1;

    var rgb = inkRGB();
    var frag = document.createDocumentFragment();
    var layers = [];
    for (var li = 0; li < LAYERS; li++) {
      var mn = li / LAYERS, mx = mn + 1 / LAYERS + 0.012, out = '';
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var v = raw[y * cols + x];
          if (v < 0) { out += ' '; continue; }
          var d = Math.max(0, Math.min(1, (v - lo) / span));
          out += (d >= mn && d < mx) ? RAMP[Math.min(Math.floor(d * R), R - 1)] : ' ';
        }
        out += '\n';
      }
      var pre = document.createElement('pre');
      pre.setAttribute('aria-hidden', 'true');
      pre.textContent = out;
      pre.style.fontSize = fs + 'px';
      pre.style.color = 'rgba(' + rgb + ',' + OPACITY[li] + ')';
      pre.style.zIndex = li;
      frag.appendChild(pre);
      layers.push(pre);
    }
    el.textContent = '';
    el.appendChild(frag);
    inst.layers = layers;
    inst.width = box.clientWidth;
  }

  // crop transparent or white margins so every figure fills its box the same way
  function trim(img) {
    var scale = Math.min(1, 800 / Math.max(img.width, img.height));
    var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    var d = ctx.getImageData(0, 0, w, h).data;
    var x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var blank = d[i + 3] < 30 || (d[i] > 232 && d[i + 1] > 232 && d[i + 2] > 232);
        if (!blank) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return c;
    var out = document.createElement('canvas');
    out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }

  function mount(el) {
    var inst = { el: el, layers: [], visible: true, width: 0 };
    var img = new Image();
    img.onload = function () { inst.img = trim(img); build(inst); };
    img.onerror = function () { console.warn('ascii: could not load', el.dataset.ascii); };
    img.src = el.dataset.ascii;
    instances.push(inst);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inst.visible = entries[0].isIntersecting;
      }, { rootMargin: '120px' }).observe(el);
    }
  }

  // one shared loop for every figure on the page
  var tx = 0, ty = 0, cx = 0, cy = 0;
  function onMove(e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }
  function tick() {
    cx += (tx - cx) * 0.055;
    cy += (ty - cy) * 0.055;
    for (var i = 0; i < instances.length; i++) {
      var inst = instances[i];
      if (!inst.visible || !inst.layers.length) continue;
      inst.el.style.transform = 'perspective(1000px) rotateY(' + (cx * 8) + 'deg) rotateX(' + (-cy * 5) + 'deg)';
      for (var j = 0; j < inst.layers.length; j++) {
        inst.layers[j].style.transform = 'translate(' + (cx * -PX[j] * 0.7) + 'px,' + (cy * -PY[j] * 0.7) + 'px)';
      }
    }
    requestAnimationFrame(tick);
  }

  // rebuild only when a container has meaningfully changed width
  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      instances.forEach(function (inst) {
        if (inst.img && Math.abs(inst.el.parentElement.clientWidth - inst.width) > 40) build(inst);
      });
    }, 200);
  }

  function init() {
    var els = document.querySelectorAll('[data-ascii]');
    for (var i = 0; i < els.length; i++) mount(els[i]);
    window.addEventListener('resize', onResize);
    if (!reduceMotion) {
      window.addEventListener('mousemove', onMove, { passive: true });
      requestAnimationFrame(tick);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { mount: mount };

})();
