/* ============================================================
   ALINA KUZNETSOVA - PORTFOLIO  |  main.js
   ============================================================ */

var Portfolio = (function() {

  var RAMP = " .-_,:;~=+<>[]{}()|/tfjrxnuvzXYJCLQ0Zmwqdbkha*#MW8%B@$";
  var R    = RAMP.length;

  /* ── CORE ASCII RENDERER ── */
  function renderASCII(opts) {
    var fontSize  = opts.fontSize  || 4;
    var numLayers = opts.layers    || 10;
    var wrap      = opts.wrap;
    var mode      = opts.toneMode  || 'icon';

    var CW = fontSize * 0.601;
    var CH = fontSize * 1.14;

    var OPACITIES = [0.25,0.35,0.45,0.55,0.67,0.78,0.88,0.95,0.99,1.0];
    var PX = [0.4,0.9,1.6,2.5,3.6,5.0,6.6,8.4,10.5,13.0];
    var PY = [0.3,0.6,1.1,1.7,2.4,3.3,4.4,5.6,7.0,8.8];

    var layerEls = [];
    for (var i = 0; i < numLayers; i++) {
      var pre = document.createElement('pre');
      pre.style.cssText = [
        'position:'+(i===0?'relative':'absolute'),
        'top:0','left:0',
        'white-space:pre',
        'font-family:"Courier New",monospace',
        'font-size:'+fontSize+'px',
        'line-height:1.14',
        'letter-spacing:0.02em',
        'pointer-events:none',
        'will-change:transform',
        'color:rgba(255,255,255,'+OPACITIES[i]+')',
        'z-index:'+i
      ].join(';');
      wrap.appendChild(pre);
      layerEls.push(pre);
    }

    var off = document.createElement('canvas');
    off.style.display = 'none';
    document.body.appendChild(off);

    var img = new Image();
    img.crossOrigin = 'anonymous';

    function doRender() {
      var imgAspect = img.width / img.height;

      // Use parent height - guaranteed to exist since section is min-height:100vh
      var parent = wrap.parentElement || wrap;
      var wH = parent.clientHeight || window.innerHeight;
      var wW = parent.clientWidth  || window.innerWidth * 0.5;
      var scale = opts.scale || 0.94;

      var ROWS = Math.round(wH * scale / CH);
      var COLS = Math.round(ROWS * imgAspect * (CH / CW));
      var maxC = Math.round(wW * 0.94 / CW);
      if (COLS > maxC) {
        COLS = maxC;
        ROWS = Math.round(COLS / imgAspect * (CW / CH));
      }

      off.width = COLS; off.height = ROWS;
      var ctx = off.getContext('2d');
      ctx.drawImage(img, 0, 0, COLS, ROWS);
      var data = ctx.getImageData(0, 0, COLS, ROWS).data;

      function tone(lum, alpha) {
        if (alpha < 30) return -1;
        if (mode === 'portrait') {
          if (lum > 0.82) return -1;
          var lv = 1.0 - lum;
          if (lv < 0.03) return -1;
          return Math.pow(lv, 0.75);
        } else {
          if (lum > 0.94) return -1; // near-white bg -> skip
          var lv = 1.0 - lum;
          if (lv < 0.04) return -1;
          return Math.pow(lv, 0.85);
        }
      }

      var raw = [];
      for (var i = 0; i < data.length; i += 4) {
        var r=data[i], g=data[i+1], b=data[i+2], a=data[i+3];
        if (a < 30 || (r>240&&g>240&&b>240)) { raw.push(-1); continue; }
        var lum = (0.299*r + 0.587*g + 0.114*b) / 255;
        raw.push(tone(lum, a));
      }

      var valid = raw.filter(function(v){return v>=0;}).sort(function(a,b){return a-b;});
      var lo = valid[Math.floor(valid.length*0.005)];
      var hi = valid[Math.floor(valid.length*0.995)];
      var norm = raw.map(function(v){
        return v<0 ? -1 : Math.max(0, Math.min(1, (v-lo)/(hi-lo)));
      });

      
      for (var li = 0; li < numLayers; li++) {
        var bw = 1.0 / numLayers;
        var mn = li*bw, mx = mn+bw+0.012, out = '';
        for (var row = 0; row < ROWS; row++) {
          for (var col = 0; col < COLS; col++) {
            var d = norm[row*COLS+col];
            out += (d>=0 && d>=mn && d<mx)
              ? RAMP[Math.min(Math.floor(d*R), R-1)]
              : ' ';
          }
          out += '\n';
        }
        layerEls[li].textContent = out;
      }

      if (opts.onDone) opts.onDone(layerEls, PX, PY);
    }

    img.onload = function() {
      // Small delay ensures layout is complete
      setTimeout(doRender, 100);
    };
    img.onerror = function() {
      console.warn('Failed to load:', opts.src);
    };
    img.src = opts.src;
  }

  /* ── PARALLAX ── */
  function initParallax(wrap, layerEls, PX, PY, strength) {
    strength = strength || 1;
    var tx=0,ty=0,cx=0,cy=0;
    window.addEventListener('mousemove', function(e) {
      tx = (e.clientX/window.innerWidth  - 0.5)*2;
      ty = (e.clientY/window.innerHeight - 0.5)*2;
    });
    (function tick() {
      cx += (tx-cx)*0.055; cy += (ty-cy)*0.055;
      wrap.style.transform = 'perspective(1000px) rotateY('+(cx*10*strength)+'deg) rotateX('+(-cy*6*strength)+'deg)';
      for (var i = 0; i < layerEls.length; i++)
        layerEls[i].style.transform = 'translate('+(cx*-PX[i])+'px,'+(cy*-PY[i])+'px)';
      requestAnimationFrame(tick);
    })();
  }

  /* ── UFO ANIMATED ASCII ── */
  function renderUFO(src, canvasEl, cols) {
    cols = cols || 90;
    var CHAR_W = 5.5, CHAR_H = 5.5 * 1.7;
    var RAMP2 = " .-,:;=+<>[]{}|/tfjxnuvzXYJCLQ0Zmwqdbkha*#MW8%B@$";
    var R2 = RAMP2.length;
    var off = document.createElement('canvas');
    off.style.display = 'none';
    document.body.appendChild(off);
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      var rows = Math.round(cols * (img.height/img.width) * (CHAR_W/CHAR_H));
      off.width = cols; off.height = rows;
      var ctx = off.getContext('2d');
      ctx.fillStyle = 'white'; ctx.fillRect(0,0,cols,rows);
      ctx.drawImage(img, 0, 0, cols, rows);
      var data = ctx.getImageData(0,0,cols,rows).data;
      var cells = [];
      for (var row=0; row<rows; row++) {
        for (var col=0; col<cols; col++) {
          var i=(row*cols+col)*4;
          var r=data[i],g=data[i+1],b=data[i+2];
          var isBeam = (b<30 && g>80 && g>r*1.2);
          var lum = (0.299*r+0.587*g+0.114*b)/255;
          var d = Math.pow(1-lum, 1.0);
          var skip = (r>232&&g>232&&b>232) || d<0.05;
          cells.push({ ch: skip?' ':RAMP2[Math.min(Math.floor(d*R2),R2-1)], isBeam:isBeam, col:col, row:row, skip:skip });
        }
      }
      var dW = Math.round(cols*CHAR_W), dH = Math.round(rows*CHAR_H);
      canvasEl.width = dW; canvasEl.height = dH;
      canvasEl.style.cssText = 'width:'+dW+'px;height:'+dH+'px;display:block';
      var dCtx = canvasEl.getContext('2d');
      dCtx.font = CHAR_W+'px Courier New'; dCtx.textBaseline = 'top';
      var t = 0;
      (function drawFrame() {
        dCtx.fillStyle = '#0a0906'; dCtx.fillRect(0,0,dW,dH);
        for (var ci=0; ci<cells.length; ci++) {
          var cell = cells[ci];
          if (cell.skip) continue;
          if (cell.isBeam) {
            var pulse = 0.55 + 0.45*Math.sin(t*0.04 + cell.row*0.25);
            var gv = Math.round(pulse*220);
            dCtx.fillStyle = 'rgb('+Math.round(gv*0.55)+','+gv+',0)';
          } else {
            dCtx.fillStyle = 'rgba(237,232,223,0.82)';
          }
          dCtx.fillText(cell.ch, cell.col*CHAR_W, cell.row*CHAR_H);
        }
        t++; requestAnimationFrame(drawFrame);
      })();
    };
    img.src = src;
  }

  /* ── EDGE PARTICLES ── */
  function initEdgeParticles(canvasEl, chars, count) {
    count = count || 30;
    function resize() {
      var p = canvasEl.parentElement;
      canvasEl.width  = p.offsetWidth  || window.innerWidth*0.5;
      canvasEl.height = p.offsetHeight || window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    var ctx = canvasEl.getContext('2d');
    var particles = [];
    function spawn() {
      var w=canvasEl.width, h=canvasEl.height;
      var edge=Math.floor(Math.random()*4);
      var x,y;
      if (edge===0) { x=Math.random()*w; y=-20; }
      else if (edge===1) { x=w+20; y=Math.random()*h; }
      else if (edge===2) { x=Math.random()*w; y=h+20; }
      else { x=-20; y=Math.random()*h; }
      return { x:x,y:y, vx:(Math.random()-0.5)*0.35, vy:(Math.random()-0.5)*0.35,
               ch:chars[Math.floor(Math.random()*chars.length)],
               alpha:Math.random()*0.35+0.08, size:Math.random()*4+9 };
    }
    for (var i=0; i<count; i++) particles.push(spawn());
    (function draw() {
      var w=canvasEl.width, h=canvasEl.height;
      ctx.clearRect(0,0,w,h);
      for (var i=0; i<particles.length; i++) {
        var p=particles[i];
        p.x+=p.vx; p.y+=p.vy;
        if (p.x<-40||p.x>w+40||p.y<-40||p.y>h+40) { particles[i]=spawn(); continue; }
        ctx.font=p.size+'px Courier New';
        ctx.fillStyle='rgba(237,232,223,'+p.alpha+')';
        ctx.fillText(p.ch,p.x,p.y);
      }
      requestAnimationFrame(draw);
    })();
  }

  var particleChars = {
    newnatures: ['NCA','seed','grow','3x3','16ch','lerp','m=0.5','cell','pool','step'],
    rematch:    ['e4','d5','Nf3','Nc6','Bb5','O-O','Re1','e5','1-0','d4'],
    borderless: ['SD','LoRA','XR','vec','rgb','uv','0,0','1,1','ctrl','px'],
    piblo:      ['zap','orb','*','>>','pluto','bleep','UFO','beep','420'],
    midjourney: ['--iw','0.7','--raw','sref','cref','v7','--chaos','prompt'],
    parure:     ['SOLAR','gold','PVD','agate','18K','ring','bangle','sun']
  };

  return {
    renderASCII:       renderASCII,
    initParallax:      initParallax,
    renderUFO:         renderUFO,
    initEdgeParticles: initEdgeParticles,
    particleChars:     particleChars
  };

})();