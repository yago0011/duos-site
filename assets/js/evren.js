/* DUOS 3B parçacık sahnesi ("evren").
   Tek bir WebGL2 tuvali, sayfanın arkasında sabit durur. Kaydırdıkça parçacıklar bölümlere göre şekil değiştirir:
   galaksi (hero) → iki oyuncu küresi → çarpışıp tek küre (Eşleş) → "%87" → kasa → sakin kabuk → halka (Duos+) → küre (son çağrı).
   Uzak parçacıklar bulanık ve büyük görünür (alan derinliği). Kütüphane yok; site.js sayfa yüklendikten sonra bu dosyayı çağırır.
   Yazılım ile çizen tarayıcılarda (GPU yok) ve "hareketi azalt" açıkken hiç çalışmaz, CSS aurora yerinde kalır. */
(() => {
  'use strict';
  const d = document, root = d.documentElement;
  if (root.classList.contains('rm') || window.__evren) return;
  const force = /[?&]gl=force/.test(location.search);
  const canvas = d.createElement('canvas');
  canvas.className = 'evren';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return;
  // Yazılım çizimi (SwiftShader vb.) yavaş: bu durumda sahne açılmaz
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  if (!force && /swiftshader|llvmpipe|software/i.test(renderer)) return;
  window.__evren = true;

  const mobile = matchMedia('(max-width: 900px)').matches;
  const weak = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3;
  const N = mobile ? (weak ? 5000 : 7500) : (weak ? 11000 : 18000);
  const STARS = Math.floor(N * 0.2);

  // ---- Şekiller -------------------------------------------------------------------------------
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const onSphere = r => { const z = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - z * z); return [Math.cos(a) * s * r, z * r, Math.sin(a) * s * r]; };
  const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
  const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
  const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };

  // Yıldızlar her şekilde aynı yerde durur (derinlik ve paralaks verir)
  const stars = [];
  for (let i = 0; i < STARS; i++) { const r = 5 + rnd() * 9; stars.push(onSphere(r)); }

  const build = fn => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const p = i < STARS ? stars[i] : fn(i - STARS, N - STARS);
      a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2];
    }
    return a;
  };
  const galaxy = () => build(() => {
    const k = rnd();
    if (k < 0.2) { const p = onSphere(Math.pow(rnd(), 2.2) * 0.5); return rotZ(rotX([p[0], p[1] * 0.45, p[2]], -0.95), 0.3); }
    const halo = k > 0.9;
    const arm = Math.floor(rnd() * 3);
    const r = 0.3 + Math.pow(rnd(), 0.85) * 2.4;
    const a = arm * (Math.PI * 2 / 3) + r * 1.9 + gauss() * (halo ? 0.9 : 0.12);
    const spread = halo ? 0.35 : 0.035 + r * 0.03;
    const p = [Math.cos(a) * r + gauss() * spread, gauss() * (halo ? 0.25 : 0.045) * (2.8 - r), Math.sin(a) * r + gauss() * spread];
    return rotZ(rotX(p, -0.95), 0.3);
  });
  const twoOrbs = () => build((i, n) => {
    const left = i < n / 2;
    const r = 0.72 * (rnd() < 0.8 ? 1 : Math.cbrt(rnd()));
    const p = onSphere(r);
    return [p[0] + (left ? -1.25 : 1.25), p[1] + (left ? 0.18 : -0.18), p[2]];
  });
  const merged = () => build(() => {
    if (rnd() < 0.5) { const p = onSphere(0.82 + gauss() * 0.03); return p; }
    const r = 1.15 + Math.pow(rnd(), 1.5) * 1.3, a = rnd() * Math.PI * 2;
    return rotZ(rotX([Math.cos(a) * r, gauss() * 0.035, Math.sin(a) * r], -1.25), 0.18);
  });
  const shell = () => build(() => { const p = onSphere(2.2 + gauss() * 0.25); return p; });
  const torus = () => build(() => {
    const R = 1.35, u = rnd() * Math.PI * 2, v = rnd() * Math.PI * 2, rr = 0.34 * Math.sqrt(rnd());
    const p = [(R + rr * Math.cos(v)) * Math.cos(u), rr * Math.sin(v), (R + rr * Math.cos(v)) * Math.sin(u)];
    return rotZ(rotX(p, -1.0), 0.35);
  });
  const crate = () => build(() => {
    // Kasa: kutu yüzeyleri, kenarlar yoğun, kapakla gövde arasında ince boşluk
    const h = 0.8, edge = rnd() < 0.45;
    let p;
    if (edge) {
      const t = rnd() * 2 - 1, e = Math.floor(rnd() * 12), s1 = (e & 1) ? 1 : -1, s2 = (e & 2) ? 1 : -1, ax = Math.floor(e / 4);
      p = ax === 0 ? [t * h, s1 * h, s2 * h * 0.8] : ax === 1 ? [s1 * h, t * h, s2 * h * 0.8] : [s1 * h, s2 * h, t * h * 0.8];
    } else {
      const f = Math.floor(rnd() * 6), u = rnd() * 2 - 1, v = rnd() * 2 - 1;
      p = f < 2 ? [(f ? 1 : -1) * h, u * h, v * h * 0.8] : f < 4 ? [u * h, (f === 3 ? 1 : -1) * h, v * h * 0.8] : [u * h, v * h, (f === 5 ? 1 : -1) * h * 0.8];
    }
    if (p[1] > h * 0.42) p[1] += 0.12; // kapak
    p = [p[0] + gauss() * 0.012, p[1] + gauss() * 0.012, p[2] + gauss() * 0.012];
    return rotX(rotY(p, 0.62), 0.38);
  });
  // Yazıdan şekil: tuvale yaz, dolu piksellerden rastgele örnekle
  const textShape = (txt, width) => {
    const c = d.createElement('canvas'); c.width = 1024; c.height = 400;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '800 300px Archivo, "Geist", sans-serif';
    x.fillText(txt, 512, 210);
    const data = x.getImageData(0, 0, 1024, 400).data;
    const pts = [];
    for (let y = 0; y < 400; y += 2) for (let xx = 0; xx < 1024; xx += 2) if (data[(y * 1024 + xx) * 4 + 3] > 128) pts.push([xx, y]);
    const k = width / 1024;
    return build(() => {
      const p = pts[Math.floor(rnd() * pts.length)] || [512, 200];
      return [(p[0] - 512) * k + gauss() * 0.01, -(p[1] - 200) * k + gauss() * 0.01, gauss() * 0.07];
    });
  };

  // ---- GL kurulumu -----------------------------------------------------------------------------
  const VS = `#version 300 es
  in vec3 aFrom; in vec3 aTo; in vec4 aSeed; in float aStar;
  uniform float uT, uTime, uPix, uFocus, uInt0, uInt1, uBurst;
  uniform vec4 uXf0, uXf1; // xyz: kaydırma, w: ölçek
  uniform vec2 uRot; uniform mat4 uProj; uniform float uCamZ, uSize, uGain;
  out vec3 vCol; out float vA; out float vBlur;
  mat3 ry(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
  mat3 rx(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
  void main(){
    float dl = aSeed.z * 0.42;
    float t = smoothstep(dl, dl + 0.58, uT);
    vec3 p;
    float burst = sin(3.14159 * t) * uBurst;
    if (aStar > 0.5) {
      p = aFrom;
    } else {
      vec3 p0 = aFrom * uXf0.w + uXf0.xyz;
      vec3 p1 = aTo * uXf1.w + uXf1.xyz;
      p = mix(p0, p1, t);
      vec3 dir = normalize(p - mix(uXf0.xyz, uXf1.xyz, t) + (aSeed.xyw - 0.5) * 0.9 + 1e-3);
      p += dir * burst * (0.35 + aSeed.x * 1.3);
      p += 0.025 * vec3(sin(uTime * .7 + aSeed.x * 40.), cos(uTime * .6 + aSeed.y * 30.), sin(uTime * .5 + aSeed.z * 20.));
    }
    p = ry(sin(uTime * 0.09) * 0.32 + uRot.x) * rx(sin(uTime * 0.07) * 0.08 + uRot.y) * p;
    vec3 v = p - vec3(0., 0., uCamZ);
    gl_Position = uProj * vec4(v, 1.);
    float dist = max(0.2, -v.z);
    float coc = abs(dist - uFocus);
    float sz = (0.016 + aSeed.y * 0.03) * uPix / dist * uSize;
    sz *= 1. + coc * (aStar > 0.5 ? 0.35 : 0.9);
    gl_PointSize = clamp(sz, 1., 48.);
    vBlur = clamp(coc * 0.45, 0., 0.9);
    float w = aSeed.w;
    vec3 violet = vec3(.545, .36, .965), pink = vec3(.925, .30, .60), cyan = vec3(.35, .94, 1.), lilac = vec3(.86, .82, 1.);
    vCol = w < .46 ? violet : w < .8 ? pink : w < .9 ? cyan : lilac;
    float inten = mix(uInt0, uInt1, t);
    vA = uGain * (aStar > 0.5 ? 0.5 : inten) * (0.45 + 0.55 * aSeed.x) / (1. + coc * coc * 0.9) * (1. + burst * 0.5);
  }`;
  const FS = `#version 300 es
  precision mediump float;
  in vec3 vCol; in float vA; in float vBlur; out vec4 o;
  void main(){
    vec2 c = gl_PointCoord * 2. - 1.; float r = dot(c, c);
    if (r > 1.) discard;
    float a = mix(exp(-r * 5.), (1. - r) * 0.55, vBlur) * vA;
    o = vec4(vCol * a, a);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const U = n => gl.getUniformLocation(prog, n);
  const u = { t: U('uT'), time: U('uTime'), pix: U('uPix'), focus: U('uFocus'), i0: U('uInt0'), i1: U('uInt1'), burst: U('uBurst'), xf0: U('uXf0'), xf1: U('uXf1'), rot: U('uRot'), proj: U('uProj'), camZ: U('uCamZ'), size: U('uSize'), gain: U('uGain') };
  const loc = { from: gl.getAttribLocation(prog, 'aFrom'), to: gl.getAttribLocation(prog, 'aTo'), seed: gl.getAttribLocation(prog, 'aSeed'), star: gl.getAttribLocation(prog, 'aStar') };

  const seeds = new Float32Array(N * 4), starF = new Float32Array(N);
  for (let i = 0; i < N; i++) { seeds.set([rnd(), rnd(), rnd(), rnd()], i * 4); starF[i] = i < STARS ? 1 : 0; }
  const vbo = data => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; };
  const bind = (l, b, size) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 0, 0); };
  bind(loc.seed, vbo(seeds), 4);
  bind(loc.star, vbo(starF), 1);

  // Şekiller parça parça üretilir (tek seferde uzun kilit olmasın)
  const shapes = {};
  const makers = [['galaxy', galaxy], ['orbs', twoOrbs], ['merged', merged], ['crate', crate], ['shell', shell], ['torus', torus], ['fit', () => textShape('%87', 4.6)]];
  const ready = new Promise(res => {
    const next = () => {
      const m = makers.shift();
      if (!m) return res();
      shapes[m[0]] = vbo(m[1]());
      setTimeout(next, 0);
    };
    (d.fonts ? d.fonts.load('800 100px Archivo') : Promise.resolve()).then(next, next);
  });

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  // ---- Kaydırma durakları -----------------------------------------------------------------------
  // Her durak: şekil, konum ve ölçek (masaüstü / telefon), parlaklık, geçişte dağılma miktarı
  const top = el => el ? el.getBoundingClientRect().top + scrollY : 0;
  let stops = [];
  const layout = () => {
    const vh = innerHeight, m = innerWidth <= 900;
    const q = s => d.querySelector(s);
    const spacer = q('.story') && q('.story').closest('.pin-spacer') || q('.story');
    const S = (y, shape, x, yy, sc, inten, burst = 1) => ({ y, shape, xf: [x, yy, 0, sc], inten, burst });
    stops = [
      S(0, 'galaxy', m ? 0 : 0.45, m ? -0.7 : 0.05, m ? 0.85 : 1.25, m ? 0.8 : 1.1),
      S(top(q('#oyunlar')) - vh * 0.1, 'galaxy', m ? 0 : 0.8, 0.2, m ? 0.9 : 1.15, 0.7),
      S(top(spacer) - vh * 0.05, 'orbs', m ? 0 : 0.2, m ? 0.9 : 0, m ? 0.75 : 1.1, 0.9, 0.6),
      S(top(spacer) + vh * 0.95, 'merged', m ? 0 : 0.2, m ? 0.9 : 0, m ? 0.75 : 1.15, 1.05, 0.35),
      S(top(q('#ozellikler')) + vh * 0.1, 'fit', m ? 0 : 1.75, m ? -1.9 : 1.15, m ? 0.5 : 0.62, m ? 0.35 : 0.45),
      S(top(q('.builder')), 'crate', m ? 0 : -1.4, m ? 0.9 : 0.1, m ? 0.8 : 1.1, 0.45),
      S(top(q('#guvenlik')), 'shell', 0, 0, 1, 0.35),
      S(top(q('#plus')), 'torus', m ? 0 : -1.5, m ? 0.6 : 0, m ? 0.8 : 1.05, 0.8),
      S(top(q('#katil')), 'merged', 0, m ? -1.6 : -1.45, m ? 0.55 : 0.62, 0.95),
    ];
  };

  // ---- Kamera ---------------------------------------------------------------------------------
  let W = 0, H = 0, dpr = 1;
  const FOV = 50 * Math.PI / 180;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const f = 1 / Math.tan(FOV / 2), a = W / H, n = 0.1, fr = 60;
    gl.uniformMatrix4fv(u.proj, false, new Float32Array([f / a, 0, 0, 0, 0, f, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, 2 * fr * n / (n - fr), 0]));
    gl.uniform1f(u.pix, canvas.height / (2 * Math.tan(FOV / 2)));
    const small = W <= 900;
    gl.uniform1f(u.size, small ? 0.6 : 1);
    gl.uniform1f(u.gain, small ? 0.8 : 1);
    layout();
  };

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = (e.clientX / innerWidth - 0.5) * 0.5; mouse.ty = (e.clientY / innerHeight - 0.5) * 0.3; }, { passive: true });

  let from = null, to = null, visible = true, running = false, t0 = performance.now(), smoothY = scrollY, fade = 0;
  d.addEventListener('visibilitychange', () => { visible = !d.hidden; if (visible && !running) loop(); });

  const frame = now => {
    const time = (now - t0) / 1000;
    smoothY += (scrollY - smoothY) * 0.12;
    const y = smoothY;
    let i = 0;
    while (i < stops.length - 2 && y >= stops[i + 1].y) i++;
    const a = stops[i], b = stops[i + 1] || a;
    const raw = b === a ? 0 : Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y)));
    // Şekil durakta bir süre sabit kalır, sonraki bölüm yaklaşınca dönüşür
    const t = raw < 0.45 ? 0 : raw > 1 ? 1 : (raw - 0.45) / 0.55;
    if (a.shape !== from || b.shape !== to) {
      from = a.shape; to = b.shape;
      bind(loc.from, shapes[from], 3);
      bind(loc.to, shapes[to], 3);
    }
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    const e = t * t * (3 - 2 * t);
    const camZ = 6 - 0.9 * Math.sin(Math.PI * e);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.time, time);
    gl.uniform1f(u.camZ, camZ);
    gl.uniform1f(u.focus, camZ);
    gl.uniform1f(u.i0, a.inten); gl.uniform1f(u.i1, b.inten);
    gl.uniform1f(u.burst, from === to ? 0 : b.burst);
    gl.uniform4fv(u.xf0, a.xf); gl.uniform4fv(u.xf1, b.xf);
    gl.uniform2f(u.rot, mouse.x, mouse.y);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, N);
    if (fade < 1) { fade = Math.min(1, fade + 0.02); canvas.style.opacity = fade; }
  };
  const loop = () => {
    if (!visible) { running = false; return; }
    running = true;
    frame(performance.now());
    requestAnimationFrame(loop);
  };

  ready.then(() => {
    canvas.style.opacity = 0;
    const atmos = d.querySelector('.atmos');
    atmos.insertBefore(canvas, atmos.querySelector('.grain'));
    root.classList.add('has-gl');
    resize();
    addEventListener('resize', resize);
    if (window.ScrollTrigger) window.ScrollTrigger.addEventListener('refresh', layout);
    setTimeout(layout, 1500);
    loop();
  });
})();
