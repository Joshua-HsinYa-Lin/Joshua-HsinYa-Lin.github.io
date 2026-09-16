/* Shared helpers for the portfolio. No dependencies. Everything a project
   page needs beyond its own physics lives here: theme, header, DPR canvases,
   a visibility aware animation loop, an instrument style plotter, controls,
   and a seven segment digit. */
(function () {
  const Site = {};
  const root = document.documentElement;

  /* Older mobile browsers lack roundRect on the canvas context. */
  if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(typeof r === 'number' ? r : (r && r[0]) || 0, w / 2, h / 2);
      this.moveTo(x + rr, y);
      this.lineTo(x + w - rr, y);
      this.arcTo(x + w, y, x + w, y + rr, rr);
      this.lineTo(x + w, y + h - rr);
      this.arcTo(x + w, y + h, x + w - rr, y + h, rr);
      this.lineTo(x + rr, y + h);
      this.arcTo(x, y + h, x, y + h - rr, rr);
      this.lineTo(x, y + rr);
      this.arcTo(x, y, x + rr, y, rr);
      this.closePath();
      return this;
    };
  }

  const THEME_KEY = 'jl-theme';
  function applyTheme(t) {
    if (t) root.setAttribute('data-theme', t);
    else root.removeAttribute('data-theme');
  }
  /* Light is the default regardless of the system setting; dark is opt in
     through the header toggle and remembered per browser. */
  function currentTheme() {
    const s = root.getAttribute('data-theme');
    if (s) return s;
    return 'light';
  }
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t) applyTheme(t);
  } catch (e) {}
  Site.toggleTheme = function () {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  };

  Site.header = function () {
    const el = document.querySelector('header.site-header');
    if (!el) return;
    const rootPath = el.getAttribute('data-root') || './';
    const home = rootPath + 'index.html';
    el.innerHTML =
      '<div class="bar">' +
      '<a class="brand" href="' + home + '">Hsin Ya Lin</a>' +
      '<nav>' +
      '<a href="' + home + '#projects">Projects</a>' +
      '<a href="' + rootPath + 'about/index.html">About</a>' +
      '<a class="hide-sm" href="https://github.com/Joshua-HsinYa-Lin" target="_blank" rel="noopener">GitHub</a>' +
      '<button class="theme" type="button" aria-label="Toggle dark mode" title="Toggle dark mode">&#9680;</button>' +
      '</nav></div>';
    el.querySelector('.theme').addEventListener('click', Site.toggleTheme);
  };

  Site.footer = function () {
    const el = document.querySelector('footer.site-footer');
    if (!el) return;
    el.innerHTML = 'Hsin Ya Lin &middot; Electrical Engineering, Purdue University &middot; ' +
      '<a href="mailto:lin2082@purdue.edu">lin2082@purdue.edu</a>';
  };

  /* Canvas with device pixel ratio handling. opts.aspect is height over width;
     opts.height is a fixed CSS pixel height and wins if given. */
  Site.canvas = function (el, opts) {
    opts = opts || {};
    const ctx = el.getContext('2d');
    const st = { el: el, ctx: ctx, w: 0, h: 0, dpr: 1, onresize: null };
    let lastW = -1;
    function resize() {
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      if (Math.abs(w - lastW) < 0.5 && st.h > 0) return;
      lastW = w;
      const h = opts.height ? opts.height : w * (opts.aspect || 0.5);
      st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(w * st.dpr);
      el.height = Math.round(h * st.dpr);
      el.style.height = h + 'px';
      st.w = w;
      st.h = h;
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      if (st.onresize) st.onresize();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el);
    else window.addEventListener('resize', resize);
    resize();
    st.resize = resize;
    return st;
  };

  /* requestAnimationFrame loop that only runs while the element is on screen.
     fn(dt, t) receives seconds. */
  Site.loop = function (el, fn) {
    let running = false;
    let visible = false;
    let raf = 0;
    let last = 0;
    function frame(ts) {
      raf = 0;
      if (!running || !visible) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      fn(dt, ts / 1000);
      raf = requestAnimationFrame(frame);
    }
    function kick() {
      if (running && visible && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        kick();
      }, { rootMargin: '120px' });
      io.observe(el);
    } else {
      visible = true;
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
    return {
      start: function () { running = true; kick(); },
      stop: function () { running = false; },
      get running() { return running; }
    };
  };

  Site.fmt = function (n, d) {
    if (n === undefined || n === null || isNaN(n)) return '';
    if (d === undefined) d = 2;
    return Number(n).toFixed(d);
  };
  Site.clamp = function (x, a, b) { return x < a ? a : (x > b ? b : x); };
  Site.lerp = function (a, b, t) { return a + (b - a) * t; };
  Site.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  Site.colors = {
    panel: '#0c0f15', rule: '#1c2330', grid: '#161c27', ink: '#c7d0dd', muted: '#6f7a8c',
    amber: '#ffb648', cyan: '#4cc9f0', green: '#8ce99a', pink: '#f472b6', red: '#ff6b6b', violet: '#b197fc', white: '#ffffff'
  };
  function monoFont() { return getComputedStyle(root).getPropertyValue('--mono') || 'monospace'; }
  function sansFont() { return getComputedStyle(root).getPropertyValue('--font') || 'sans-serif'; }
  Site.mono = monoFont;
  Site.sans = sansFont;

  function niceStep(range, n) {
    const raw = range / Math.max(1, n);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    let s;
    if (m < 1.5) s = 1;
    else if (m < 3.5) s = 2;
    else if (m < 7.5) s = 5;
    else s = 10;
    return s * p;
  }
  Site.ticks = function (a, b, n) {
    const step = niceStep(b - a, n || 5);
    const out = [];
    const start = Math.ceil(a / step - 1e-9) * step;
    for (let v = start; v <= b + 1e-9; v += step) out.push(Math.abs(v) < 1e-12 ? 0 : v);
    return out;
  };

  /* Instrument style plot on a canvas 2D context. Coordinates in CSS pixels. */
  Site.Plot = function (ctx, o) {
    this.ctx = ctx;
    this.set(o);
  };
  Site.Plot.prototype.set = function (o) {
    if (o.x) this.x = o.x;
    if (o.y) this.y = o.y;
    if (o.box) this.box = o.box;
    if (o.xlabel !== undefined) this.xlabel = o.xlabel;
    if (o.ylabel !== undefined) this.ylabel = o.ylabel;
    if (o.xfmt) this.xfmt = o.xfmt;
    if (o.yfmt) this.yfmt = o.yfmt;
    if (o.xticks !== undefined) this.xticks = o.xticks;
    if (o.yticks !== undefined) this.yticks = o.yticks;
    if (o.title !== undefined) this.title = o.title;
    if (o.xlog !== undefined) this.xlog = o.xlog;
  };
  Site.Plot.prototype.px = function (x) {
    const b = this.box;
    if (this.xlog) {
      const l0 = Math.log10(this.x[0]);
      const l1 = Math.log10(this.x[1]);
      return b.x + (Math.log10(x) - l0) / (l1 - l0) * b.w;
    }
    return b.x + (x - this.x[0]) / (this.x[1] - this.x[0]) * b.w;
  };
  Site.Plot.prototype.py = function (y) {
    const b = this.box;
    return b.y + b.h - (y - this.y[0]) / (this.y[1] - this.y[0]) * b.h;
  };
  Site.Plot.prototype.xOf = function (px) {
    const b = this.box;
    if (this.xlog) {
      const l0 = Math.log10(this.x[0]);
      const l1 = Math.log10(this.x[1]);
      return Math.pow(10, l0 + (px - b.x) / b.w * (l1 - l0));
    }
    return this.x[0] + (px - b.x) / b.w * (this.x[1] - this.x[0]);
  };
  Site.Plot.prototype.yOf = function (py) {
    const b = this.box;
    return this.y[0] + (b.y + b.h - py) / b.h * (this.y[1] - this.y[0]);
  };
  Site.Plot.prototype.axes = function () {
    const c = this.ctx;
    const b = this.box;
    const C = Site.colors;
    c.save();
    c.fillStyle = '#0a0d12';
    c.fillRect(b.x, b.y, b.w, b.h);
    c.font = '11px ' + monoFont();
    c.textBaseline = 'top';
    let xt;
    if (this.xlog) {
      xt = [];
      for (let d = Math.floor(Math.log10(this.x[0])); d <= Math.ceil(Math.log10(this.x[1])); d++) {
        const v = Math.pow(10, d);
        if (v >= this.x[0] * 0.999 && v <= this.x[1] * 1.001) xt.push(v);
      }
    } else {
      xt = this.xticks || Site.ticks(this.x[0], this.x[1], 6);
    }
    const yt = this.yticks || Site.ticks(this.y[0], this.y[1], 5);
    c.strokeStyle = C.grid;
    c.lineWidth = 1;
    c.fillStyle = C.muted;
    c.textAlign = 'center';
    for (const v of xt) {
      const X = Math.round(this.px(v)) + 0.5;
      c.beginPath();
      c.moveTo(X, b.y);
      c.lineTo(X, b.y + b.h);
      c.stroke();
      c.fillText(this.xfmt ? this.xfmt(v) : String(+v.toPrecision(6)), X, b.y + b.h + 4);
    }
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    for (const v of yt) {
      const Y = Math.round(this.py(v)) + 0.5;
      c.beginPath();
      c.moveTo(b.x, Y);
      c.lineTo(b.x + b.w, Y);
      c.stroke();
      c.fillText(this.yfmt ? this.yfmt(v) : String(+v.toPrecision(6)), b.x - 6, Y);
    }
    if (this.y[0] < 0 && this.y[1] > 0) {
      c.strokeStyle = '#2a3446';
      const Y = Math.round(this.py(0)) + 0.5;
      c.beginPath();
      c.moveTo(b.x, Y);
      c.lineTo(b.x + b.w, Y);
      c.stroke();
    }
    c.strokeStyle = C.rule;
    c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    c.fillStyle = C.muted;
    if (this.xlabel) {
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(this.xlabel, b.x + b.w / 2, b.y + b.h + 30);
    }
    if (this.ylabel) {
      c.save();
      c.translate(b.x - 40, b.y + b.h / 2);
      c.rotate(-Math.PI / 2);
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      c.fillText(this.ylabel, 0, 0);
      c.restore();
    }
    if (this.title) {
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      c.fillStyle = C.ink;
      c.font = '600 12px ' + sansFont();
      c.fillText(this.title, b.x, b.y - 5);
    }
    c.restore();
  };
  Site.Plot.prototype.clip = function (fn) {
    const c = this.ctx;
    const b = this.box;
    c.save();
    c.beginPath();
    c.rect(b.x, b.y, b.w, b.h);
    c.clip();
    fn();
    c.restore();
  };
  /* pts: array of [x, y], or {xs, ys}. */
  Site.Plot.prototype.line = function (pts, o) {
    o = o || {};
    const c = this.ctx;
    const self = this;
    this.clip(function () {
      c.beginPath();
      c.strokeStyle = o.color || Site.colors.amber;
      c.lineWidth = o.width || 2;
      c.setLineDash(o.dash || []);
      c.lineJoin = 'round';
      let first = true;
      const n = pts.xs ? pts.xs.length : pts.length;
      for (let i = 0; i < n; i++) {
        const x = pts.xs ? pts.xs[i] : pts[i][0];
        const y = pts.xs ? pts.ys[i] : pts[i][1];
        if (!isFinite(x) || !isFinite(y)) { first = true; continue; }
        const X = self.px(x);
        const Y = self.py(y);
        if (first) { c.moveTo(X, Y); first = false; }
        else c.lineTo(X, Y);
      }
      c.stroke();
      c.setLineDash([]);
      if (o.fill && n > 1) {
        c.globalAlpha = 0.18;
        c.fillStyle = o.color || Site.colors.amber;
        c.lineTo(self.px(pts.xs ? pts.xs[n - 1] : pts[n - 1][0]), self.py(0));
        c.lineTo(self.px(pts.xs ? pts.xs[0] : pts[0][0]), self.py(0));
        c.closePath();
        c.fill();
        c.globalAlpha = 1;
      }
    });
  };
  Site.Plot.prototype.hline = function (y, o) {
    o = o || {};
    const c = this.ctx;
    const b = this.box;
    const Y = this.py(y);
    if (Y < b.y || Y > b.y + b.h) return;
    c.save();
    c.strokeStyle = o.color || Site.colors.muted;
    c.lineWidth = o.width || 1;
    c.setLineDash(o.dash || [4, 4]);
    c.beginPath();
    c.moveTo(b.x, Y);
    c.lineTo(b.x + b.w, Y);
    c.stroke();
    if (o.label) {
      c.setLineDash([]);
      c.fillStyle = o.color || Site.colors.muted;
      c.font = '11px ' + monoFont();
      c.textAlign = o.align || 'right';
      c.textBaseline = 'bottom';
      c.fillText(o.label, o.align === 'left' ? b.x + 6 : b.x + b.w - 6, Y - 3);
    }
    c.restore();
  };
  Site.Plot.prototype.vline = function (x, o) {
    o = o || {};
    const c = this.ctx;
    const b = this.box;
    const X = this.px(x);
    if (X < b.x || X > b.x + b.w) return;
    c.save();
    c.strokeStyle = o.color || Site.colors.muted;
    c.lineWidth = o.width || 1;
    c.setLineDash(o.dash || [4, 4]);
    c.beginPath();
    c.moveTo(X, b.y);
    c.lineTo(X, b.y + b.h);
    c.stroke();
    if (o.label) {
      c.setLineDash([]);
      c.fillStyle = o.color || Site.colors.muted;
      c.font = '11px ' + monoFont();
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText(o.label, X + 5, b.y + 5 + (o.dy || 0));
    }
    c.restore();
  };
  Site.Plot.prototype.dot = function (x, y, o) {
    o = o || {};
    const c = this.ctx;
    c.save();
    c.fillStyle = o.color || Site.colors.amber;
    c.beginPath();
    c.arc(this.px(x), this.py(y), o.r || 4, 0, Math.PI * 2);
    c.fill();
    if (o.ring) {
      c.strokeStyle = o.color || Site.colors.amber;
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(this.px(x), this.py(y), (o.r || 4) + 4, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  };
  Site.Plot.prototype.text = function (x, y, s, o) {
    o = o || {};
    const c = this.ctx;
    c.save();
    c.fillStyle = o.color || Site.colors.ink;
    c.font = (o.weight || '') + ' ' + (o.size || 11) + 'px ' + (o.mono === false ? sansFont() : monoFont());
    c.textAlign = o.align || 'left';
    c.textBaseline = o.base || 'middle';
    c.fillText(s, this.px(x) + (o.dx || 0), this.py(y) + (o.dy || 0));
    c.restore();
  };
  Site.Plot.prototype.legend = function (items, o) {
    o = o || {};
    const c = this.ctx;
    const b = this.box;
    c.save();
    c.font = '11px ' + monoFont();
    c.textBaseline = 'middle';
    let x = o.x !== undefined ? o.x : b.x + 10;
    let y = o.y !== undefined ? o.y : b.y + 12;
    for (const it of items) {
      c.fillStyle = it.color;
      c.fillRect(x, y - 1.5, 14, 3);
      c.fillStyle = Site.colors.ink;
      c.textAlign = 'left';
      c.fillText(it.label, x + 19, y);
      if (o.horizontal) x += 19 + c.measureText(it.label).width + 16;
      else y += 16;
    }
    c.restore();
  };

  /* Controls. Each returns an object with a live .value. */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  Site.el = el;
  Site.slider = function (parent, o) {
    const wrap = el('label', 'ctl' + (o.wide ? ' wide' : ''));
    const lab = el('span', 'ctl-label', o.label);
    const inp = el('input');
    inp.type = 'range';
    inp.min = o.min;
    inp.max = o.max;
    inp.step = o.step === undefined ? 'any' : o.step;
    inp.value = o.value;
    const out = el('output');
    wrap.appendChild(lab);
    wrap.appendChild(inp);
    wrap.appendChild(out);
    parent.appendChild(wrap);
    const fmt = o.fmt || function (v) { return Site.fmt(v, o.digits === undefined ? 2 : o.digits) + (o.unit ? ' ' + o.unit : ''); };
    const api = {
      el: wrap,
      input: inp,
      get value() { return parseFloat(inp.value); },
      set value(v) { inp.value = v; out.textContent = fmt(parseFloat(inp.value)); },
      refresh: function () { out.textContent = fmt(parseFloat(inp.value)); }
    };
    inp.addEventListener('input', function () {
      out.textContent = fmt(parseFloat(inp.value));
      if (o.onInput) o.onInput(parseFloat(inp.value));
    });
    out.textContent = fmt(parseFloat(inp.value));
    return api;
  };
  Site.button = function (parent, o) {
    const b = el('button', 'btn' + (o.primary ? ' primary' : ''), o.label);
    b.type = 'button';
    if (o.title) b.title = o.title;
    b.addEventListener('click', function () { if (o.onClick) o.onClick(b); });
    parent.appendChild(b);
    return b;
  };
  Site.toggle = function (parent, o) {
    let on = !!o.value;
    const b = el('button', 'btn' + (on ? ' on' : ''), o.label);
    b.type = 'button';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.addEventListener('click', function () {
      on = !on;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (o.onChange) o.onChange(on);
    });
    parent.appendChild(b);
    return { el: b, get value() { return on; }, set value(v) { on = !!v; b.classList.toggle('on', on); } };
  };
  /* Segmented select: options is [{value, label}]. */
  Site.select = function (parent, o) {
    const wrap = el('div', 'seg-select');
    let val = o.value;
    const btns = [];
    o.options.forEach(function (opt) {
      const b = el('button', 'btn' + (opt.value === val ? ' on' : ''), opt.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        val = opt.value;
        btns.forEach(function (x) { x.classList.toggle('on', x === b); });
        if (o.onChange) o.onChange(val);
      });
      btns.push(b);
      wrap.appendChild(b);
    });
    parent.appendChild(wrap);
    return { el: wrap, get value() { return val; }, set value(v) { val = v; btns.forEach(function (x, i) { x.classList.toggle('on', o.options[i].value === v); }); } };
  };
  Site.readouts = function (parent, keys) {
    const wrap = el('div', 'readouts');
    const map = {};
    keys.forEach(function (k) {
      const r = el('span', 'r', k.label + ' <b class="' + (k.color || '') + '">&nbsp;</b>');
      wrap.appendChild(r);
      map[k.key] = r.querySelector('b');
    });
    parent.appendChild(wrap);
    return {
      el: wrap,
      set: function (k, v) { if (map[k]) map[k].textContent = v; }
    };
  };

  /* Seven segment digit. ch is one character. Segments a b c d e f g. */
  const SEG = {
    '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg',
    'A': 'abcefg', 'B': 'cdefg', 'C': 'adef', 'D': 'bcdeg', 'E': 'adefg', 'F': 'aefg', 'H': 'bcefg', 'L': 'def', 'M': 'aceg', 'N': 'ceg', 'O': 'abcdef',
    'P': 'abefg', 'R': 'eg', 'S': 'acdfg', 'T': 'defg', 'U': 'bcdef', 'W': 'bdf', 'Y': 'bcdfg', '-': 'g', ' ': '', '_': 'd'
  };
  Site.segDigit = function (ctx, x, y, w, h, ch, o) {
    o = o || {};
    const on = o.on || '#ff2a2a';
    const off = o.off || 'rgba(255,255,255,0.06)';
    const s = String(ch);
    const lit = s.charAt(0) === '#' ? s.slice(1) : (SEG[s.toUpperCase()] || '');
    const t = Math.max(2, w * 0.14);
    const gap = t * 0.35;
    const segs = {
      a: [x + t + gap, y, w - 2 * t - 2 * gap, t],
      b: [x + w - t, y + t + gap, t, h / 2 - t - 1.5 * gap],
      c: [x + w - t, y + h / 2 + gap / 2, t, h / 2 - t - 1.5 * gap],
      d: [x + t + gap, y + h - t, w - 2 * t - 2 * gap, t],
      e: [x, y + h / 2 + gap / 2, t, h / 2 - t - 1.5 * gap],
      f: [x, y + t + gap, t, h / 2 - t - 1.5 * gap],
      g: [x + t + gap, y + h / 2 - t / 2, w - 2 * t - 2 * gap, t]
    };
    for (const k in segs) {
      const s = segs[k];
      ctx.fillStyle = lit.indexOf(k) >= 0 ? on : off;
      ctx.fillRect(s[0], s[1], s[2], s[3]);
    }
    if (o.dot !== undefined) {
      ctx.fillStyle = o.dot ? on : off;
      ctx.beginPath();
      ctx.arc(x + w + t * 0.9, y + h - t / 2, t / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  Site.led = function (ctx, x, y, r, on, color) {
    ctx.fillStyle = on ? (color || '#ff2a2a') : 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = color || '#ff2a2a';
      ctx.beginPath();
      ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  Site.ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };
  Site.ready(function () {
    Site.header();
    Site.footer();
  });

  window.Site = Site;
})();
