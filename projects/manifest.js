/* Registry of projects, in the order they appear on the home page.

   Adding a project: create projects/<slug>/index.html (copy an existing one
   as the template, it carries its own script and images) and add one entry
   here. Nothing else on the site changes.

   preview(ctx, w, h, t) draws the live thumbnail on the home page card. Keep
   it small and make it hint at what the page lets a visitor do. t is seconds. */
window.PROJECTS = [
  {
    slug: 'socet',
    title: 'A matrix coprocessor on an FPGA',
    hook: 'Type a matrix on the keypad and watch a 33 state machine, three memory regions and a valid/ready handshake do the arithmetic, one clock at a time.',
    when: 'Purdue SoCET · Jan 2026 to present',
    tags: ['SystemVerilog', 'FPGA', 'RTL to GDS'],
    preview: function (ctx, w, h, t) {
      const words = ['ROW ', 'COL ', '  124', 'ADD ', '   3 15', 'TRA '];
      const s = words[Math.floor(t / 1.3) % words.length].padStart(8, ' ');
      const dw = Math.min(28, w / 11);
      const dh = dw * 1.6;
      const x0 = (w - 8 * dw * 1.25) / 2;
      const y0 = h * 0.22;
      for (let i = 0; i < 8; i++) Site.segDigit(ctx, x0 + i * dw * 1.25, y0, dw, dh, s[i]);
      const ly = y0 + dh + 26;
      const lit = Math.floor(t * 6) % 8;
      for (let i = 0; i < 8; i++) Site.led(ctx, x0 + 8 + i * dw * 0.55, ly, 5, i === lit);
      Site.led(ctx, w / 2, ly, 7, true, '#3b5bff');
      for (let i = 0; i < 8; i++) Site.led(ctx, w - x0 - 8 - i * dw * 0.55, ly, 5, i === (7 - lit));
    }
  },
  {
    slug: 'socet-soc',
    title: 'A Kalman filter in hardware',
    status: 'in progress',
    hook: 'A RISC-V system on chip with an attitude filter accelerator. Watch a Kalman filter fuse a gyro and an accelerometer, then see how the whole filter becomes a straight line of descriptors over one multiplier.',
    when: 'Purdue SoCET · Fall 2026',
    tags: ['RISC-V', 'Kalman filter', 'Fixed point', 'SPI'],
    _s: { t: 0, th: 0, est: 0, bias: 0, pts: [] },
    preview: function (ctx, w, h, t, dt) {
      const s = this._s;
      const truth = 0.35 * Math.sin(t * 1.1);
      const meas = truth + (Math.random() - 0.5) * 0.5;
      s.est += (meas - s.est) * 0.12;
      s.pts.push([t, truth, meas, s.est]);
      while (s.pts.length && s.pts[0][0] < t - 6) s.pts.shift();
      const x0 = 14, x1 = w - 14, cy = h * 0.5, amp = h * 0.36;
      function X(tt) { return x1 - (t - tt) / 6 * (x1 - x0); }
      ctx.fillStyle = 'rgba(76,201,240,0.7)';
      s.pts.forEach(function (p, i) { if (i % 3 === 0) { ctx.beginPath(); ctx.arc(X(p[0]), cy - p[2] * amp, 1.6, 0, Math.PI * 2); ctx.fill(); } });
      ctx.strokeStyle = '#8a93a5'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); s.pts.forEach(function (p, i) { const x = X(p[0]), y = cy - p[1] * amp; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#8ce99a'; ctx.lineWidth = 2;
      ctx.beginPath(); s.pts.forEach(function (p, i) { const x = X(p[0]), y = cy - p[3] * amp; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
      ctx.fillStyle = '#6f7a8c'; ctx.font = '10px ' + Site.mono();
      ctx.fillText('noisy sensor · truth · filter estimate', 14, h - 10);
      void dt;
    }
  },
  {
    slug: 'tasa',
    title: 'Pointing a satellite with spinning wheels',
    hook: 'Spin a wheel one way and the body turns the other. Slew a satellite, split torque across a four wheel pyramid, and feel what 727 ms of latency does to a control loop.',
    when: 'Taiwan Space Agency · Jul to Aug 2026',
    tags: ['Attitude control', 'ESP32 firmware', 'Hardware in the loop'],
    _s: { th: 0, om: 0, tgt: 0.9, wheel: 0, next: 0 },
    preview: function (ctx, w, h, t, dt) {
      const s = this._s;
      if (t > s.next) { s.tgt = (Math.random() - 0.5) * 2.6; s.next = t + 3.2; }
      const tau = Site.clamp(-3.0 * (s.th - s.tgt) - 2.2 * s.om, -1.2, 1.2);
      s.om += tau * dt;
      s.th += s.om * dt;
      s.wheel -= tau * 18 * dt;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.34;
      ctx.save();
      ctx.strokeStyle = '#2a3446';
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(s.tgt - Math.PI / 2) * R * 1.35, cy + Math.sin(s.tgt - Math.PI / 2) * R * 1.35);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.translate(cx, cy);
      ctx.rotate(s.th);
      ctx.fillStyle = '#1b2230';
      ctx.strokeStyle = '#4cc9f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-R * 0.55, -R * 0.55, R * 1.1, R * 1.1);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4cc9f0';
      ctx.fillRect(-R * 1.3, -R * 0.12, R * 0.7, R * 0.24);
      ctx.fillRect(R * 0.6, -R * 0.12, R * 0.7, R * 0.24);
      ctx.strokeStyle = '#ffb648';
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.55);
      ctx.lineTo(0, -R * 0.95);
      ctx.stroke();
      ctx.rotate(s.wheel);
      ctx.strokeStyle = '#ffb648';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(i * Math.PI / 2) * R * 0.32, Math.sin(i * Math.PI / 2) * R * 0.32);
        ctx.stroke();
      }
      ctx.restore();
    }
  },
  {
    slug: 'ece20007',
    title: 'A boost converter and an equalizer, measured against their simulations',
    hook: 'Drag the duty cycle and watch the inductor pump 5 V up to 30 V. Move three faders and hear the bands. Then see why the bench read 9.5% below the simulation.',
    when: 'Purdue ECE 20007 · Spring 2026',
    tags: ['Power electronics', 'Analog', 'LTspice'],
    preview: function (ctx, w, h, t) {
      const per = 0.9;
      const D = 0.55 + 0.25 * Math.sin(t * 0.7);
      const x0 = 14;
      const x1 = w - 14;
      const n = 6;
      const pw = (x1 - x0) / n;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4cc9f0';
      ctx.beginPath();
      const yp0 = h * 0.86;
      const yp1 = h * 0.66;
      for (let i = 0; i < n; i++) {
        const xs = x0 + i * pw;
        ctx.moveTo(xs, yp1);
        ctx.lineTo(xs + pw * D, yp1);
        ctx.lineTo(xs + pw * D, yp0);
        ctx.lineTo(xs + pw, yp0);
        ctx.lineTo(xs + pw, yp1);
      }
      ctx.stroke();
      ctx.strokeStyle = '#ffb648';
      ctx.beginPath();
      const yi0 = h * 0.56;
      const yi1 = h * 0.30;
      for (let i = 0; i < n; i++) {
        const xs = x0 + i * pw;
        if (i === 0) ctx.moveTo(xs, yi0);
        ctx.lineTo(xs + pw * D, yi1);
        ctx.lineTo(xs + pw, yi0);
      }
      ctx.stroke();
      ctx.strokeStyle = '#8ce99a';
      ctx.beginPath();
      const vo = h * (0.24 - 0.14 * (D - 0.3));
      for (let x = x0; x <= x1; x += 2) {
        const ph = ((x - x0) / pw) % 1;
        const y = vo + (ph < D ? ph / D * 5 : (1 - (ph - D) / (1 - D)) * 5);
        if (x === x0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#6f7a8c';
      ctx.font = '10px ' + Site.mono();
      ctx.fillText('PWM', x0, yp1 - 6);
      ctx.fillText('iL', x0, yi1 - 6);
      ctx.fillText('Vout', x0, Math.max(12, vo - 6));
      void per;
    }
  },
  {
    slug: 'lunabotics',
    title: 'The board that disconnects the battery',
    hook: 'Six cells, two stacked protection ICs, and a load. Overload it, overcharge it, overheat it, and watch the FETs open before anything else does.',
    when: 'Purdue Lunabotics · Sep 2025 to Aug 2026',
    tags: ['Battery protection', 'KiCad', 'Hand assembly'],
    _s: { v: [4.12, 3.98, 4.05, 3.91, 4.18, 3.95], ph: 0 },
    preview: function (ctx, w, h, t, dt) {
      const s = this._s;
      const mean = s.v.reduce(function (a, b) { return a + b; }, 0) / 6;
      let hi = 0;
      for (let i = 1; i < 6; i++) if (s.v[i] > s.v[hi]) hi = i;
      if (s.v[hi] - mean > 0.004) s.v[hi] -= 0.05 * dt;
      else if (Math.random() < dt * 0.25) s.v[Math.floor(Math.random() * 6)] += 0.12;
      const bw = Math.min(34, w / 9);
      const gap = bw * 0.5;
      const x0 = (w - 6 * bw - 5 * gap) / 2;
      const base = h * 0.82;
      const top = h * 0.16;
      ctx.font = '10px ' + Site.mono();
      for (let i = 0; i < 6; i++) {
        const x = x0 + i * (bw + gap);
        const f = (s.v[i] - 3.4) / (4.25 - 3.4);
        const bh = (base - top) * Site.clamp(f, 0, 1);
        ctx.fillStyle = '#1b2230';
        ctx.fillRect(x, top, bw, base - top);
        ctx.fillStyle = i === hi && s.v[hi] - mean > 0.004 ? '#ff6b6b' : '#8ce99a';
        ctx.fillRect(x, base - bh, bw, bh);
        ctx.fillStyle = '#6f7a8c';
        ctx.textAlign = 'center';
        ctx.fillText(s.v[i].toFixed(2), x + bw / 2, base + 14);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#6f7a8c';
      ctx.fillText('balancing', x0, top - 6);
    }
  },
  {
    slug: 'nycu',
    title: 'Decoding bits that moved',
    hook: 'Delete one bit and every bit after it reads as wrong. Corrupt a codeword, compare position scoring against alignment, and see why a Transformer was pointed at it.',
    when: 'NYCU Institute of Communications · May to Jul 2026',
    tags: ['Error correction', 'PyTorch', 'Transformers'],
    _s: { bits: null, k: 5, next: 0 },
    preview: function (ctx, w, h, t) {
      const s = this._s;
      const n = Math.min(22, Math.floor((w - 20) / 15));
      if (!s.bits || s.bits.length !== n) {
        const r = Site.rng(7);
        s.bits = [];
        for (let i = 0; i < n; i++) s.bits.push(r() < 0.5 ? 0 : 1);
      }
      if (t > s.next) { s.k = 2 + Math.floor(Math.random() * (n - 6)); s.next = t + 2.4; }
      const cw = (w - 20) / n;
      ctx.font = 'bold 13px ' + Site.mono();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const y1 = h * 0.33;
      const y2 = h * 0.66;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = '#c7d0dd';
        ctx.fillText(String(s.bits[i]), 10 + cw * (i + 0.5), y1);
        const rec = i < s.k ? s.bits[i] : (i === n - 1 ? 0 : s.bits[i + 1]);
        const wrong = rec !== s.bits[i];
        ctx.fillStyle = wrong ? '#ff6b6b' : '#8ce99a';
        ctx.fillText(String(rec), 10 + cw * (i + 0.5), y2);
      }
      ctx.strokeStyle = '#ffb648';
      ctx.lineWidth = 2;
      const xk = 10 + cw * (s.k + 0.5);
      ctx.beginPath();
      ctx.moveTo(xk, y1 + 10);
      ctx.lineTo(xk, y2 - 10);
      ctx.stroke();
      ctx.fillStyle = '#6f7a8c';
      ctx.font = '10px ' + Site.mono();
      ctx.textAlign = 'left';
      ctx.fillText('sent', 10, y1 - 16);
      ctx.fillText('received, one bit deleted', 10, y2 + 18);
      ctx.textBaseline = 'alphabetic';
    }
  },
  {
    slug: 'frc8020',
    title: 'Wiring a robot so a fault finds itself',
    hook: 'A short appears somewhere in the harness. Find it in a single harness, then in one with a labeled connector at every subsystem. Count your steps.',
    when: 'FIRST Robotics Team 8020 · Aug 2023 to Jun 2024',
    tags: ['Power distribution', 'CAN bus', 'Harnessing'],
    _s: { fault: 2, next: 0, open: 0 },
    preview: function (ctx, w, h, t) {
      const s = this._s;
      if (t > s.next) { s.fault = Math.floor(Math.random() * 6); s.next = t + 3; s.open = 0; }
      const phase = (t - (s.next - 3)) / 3;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 - Math.PI / 2;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        const isF = i === s.fault;
        const cut = isF && phase > 0.5;
        ctx.strokeStyle = cut ? '#2a3446' : (isF ? '#ff6b6b' : '#4cc9f0');
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cut ? cx + Math.cos(a) * R * 0.45 : x, cut ? cy + Math.sin(a) * R * 0.45 : y);
        ctx.stroke();
        ctx.fillStyle = '#1b2230';
        ctx.strokeStyle = isF ? '#ff6b6b' : '#4cc9f0';
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const mx = cx + Math.cos(a) * R * 0.5;
        const my = cy + Math.sin(a) * R * 0.5;
        ctx.fillStyle = cut ? '#ffb648' : '#ffb648';
        ctx.fillRect(mx - 4, my - 4, 8, 8);
      }
      ctx.fillStyle = phase > 0.5 ? '#8ce99a' : '#ff6b6b';
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0c0f15';
      ctx.font = 'bold 9px ' + Site.mono();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PDP', cx, cy);
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#6f7a8c';
      ctx.font = '10px ' + Site.mono();
      ctx.textAlign = 'left';
      ctx.fillText(phase > 0.5 ? 'unplugged one connector, fault isolated' : 'fault somewhere on the bus', 10, h - 8);
    }
  },
  {
    slug: 'trace',
    title: 'How much of your weight does a helper carry?',
    hook: 'Lean on a rod held by someone else and watch the knee unload, the ankle push sideways, and the helper’s wrist take the difference. Then compare against motion capture.',
    when: 'Purdue TRACE Laboratory · Jan 2026 to present',
    tags: ['Biomechanics', 'Inverse dynamics', 'MATLAB'],
    preview: function (ctx, w, h, t) {
      const x0 = 34;
      const x1 = w - 10;
      const base = h * 0.8;
      const amp = h * 0.55;
      ctx.strokeStyle = '#2a3446';
      ctx.beginPath();
      ctx.moveTo(x0, base);
      ctx.lineTo(x1, base);
      ctx.stroke();
      function hump(ph) { const s = Math.sin(ph); return s > 0 ? Math.pow(s, 0.6) : 0; }
      const cols = ['#4cc9f0', '#ff6b6b'];
      for (let k = 0; k < 2; k++) {
        ctx.strokeStyle = cols[k];
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 2) {
          const ph = (x - x0) / 60 - t * 1.6 + k * Math.PI;
          const y = base - amp * hump(ph) * (k === 0 ? 0.42 : 1);
          if (x === x0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#6f7a8c';
      ctx.font = '10px ' + Site.mono();
      ctx.fillText('left knee, unassisted', 40, 14);
      ctx.fillStyle = '#4cc9f0';
      ctx.fillText('right knee, leaning on the rod', 40, 28);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(x0 - 24, 8, 16, 3);
      ctx.fillStyle = '#4cc9f0';
      ctx.fillRect(x0 - 24, 22, 16, 3);
    }
  },
  {
    slug: 'lna',
    title: 'A low noise amplifier',
    status: 'starting Fall 2026',
    hook: 'Purdue IEEE Microwave is designing one this semester and I am on it. Until there is a design to show, here is why the first stage decides the noise of the whole receiver.',
    when: 'Purdue IEEE · Fall 2026',
    tags: ['RF', 'Altium', 'Noise figure'],
    preview: function (ctx, w, h, t) {
      const y = h / 2;
      const n = 3;
      const stageW = (w - 40) / n;
      const r = Site.rng(1);
      ctx.lineWidth = 2;
      let noise = 1.5;
      for (let i = 0; i < n; i++) {
        const xs = 20 + i * stageW;
        ctx.strokeStyle = '#4cc9f0';
        ctx.beginPath();
        for (let x = xs; x < xs + stageW * 0.45; x += 2) {
          const yy = y + Math.sin((x - t * 90) * 0.35) * 10 * (1 + i * 0.35) + (r() - 0.5) * noise;
          if (x === xs) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
        ctx.fillStyle = i === 0 ? '#ffb648' : '#1b2230';
        ctx.strokeStyle = '#ffb648';
        ctx.beginPath();
        ctx.moveTo(xs + stageW * 0.47, y - 18);
        ctx.lineTo(xs + stageW * 0.47 + 26, y);
        ctx.lineTo(xs + stageW * 0.47, y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        noise *= i === 0 ? 1.6 : 3.2;
      }
      ctx.fillStyle = '#6f7a8c';
      ctx.font = '10px ' + Site.mono();
      ctx.fillText('the first stage sets the noise figure', 20, h - 10);
    }
  }
];
