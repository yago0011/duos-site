/* DUOS tanıtım sitesi: hareket ve etkileşimler.
   Lenis (yumuşak kaydırma) + GSAP / ScrollTrigger / SplitText. "Hareketi azalt" açıksa animasyonlar atlanır,
   etkileşimler (menü, anahtar, kasa, SSS) çalışmaya devam eder. */
(() => {
  'use strict';
  const d = document;
  const root = d.documentElement;
  const RM = root.classList.contains('rm');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const showAll = () => root.classList.add('ready-all');

  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  function init() {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // ---- Yumuşak kaydırma ----
    let lenis = null;
    if (!RM && window.Lenis) {
      lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    window.__lenis = lenis;
    basics(lenis);

    if (RM) { showAll(); interactions(gsap, lenis); return; }

    // ---- İmleç ışığı ve hero nokta ızgarası ----
    if (FINE) {
      root.classList.add('has-pointer');
      const light = $('.cursor-light');
      const lx = gsap.quickTo(light, 'x', { duration: .9, ease: 'power3' });
      const ly = gsap.quickTo(light, 'y', { duration: .9, ease: 'power3' });
      const hero = $('.hero');
      addEventListener('pointermove', e => {
        lx(e.clientX); ly(e.clientY);
        const r = hero.getBoundingClientRect();
        if (e.clientY < r.bottom) { hero.style.setProperty('--mx', `${e.clientX - r.left}px`); hero.style.setProperty('--my', `${e.clientY - r.top}px`); }
      }, { passive: true });
    }

    // Hero hemen (giriş animasyonu zaten CSS ile başladı); geri kalanı sayfa yüklendikten sonra küçük parçalar hâlinde,
    // böylece açılışta ana iş parçacığı uzun süre kilitlenmez.
    hero(gsap);
    zones();
    const tasks = [
      () => reveals(gsap, ScrollTrigger),
      () => splitHeadings(gsap),
      () => counters(gsap),
      () => story(gsap),
      () => features(gsap),
      () => builder(gsap),
      () => marquees(gsap, lenis),
      () => parallax(gsap),
      () => interactions(gsap, lenis),
      () => scale(),
    ];
    const safety = setTimeout(showAll, 8000);
    const run = () => {
      const t0 = performance.now();
      while (tasks.length && performance.now() - t0 < 25) tasks.shift()();
      if (tasks.length) setTimeout(run, 0);
      else { clearTimeout(safety); ScrollTrigger.refresh(); loadEvren(); }
    };
    const start = () => {
      const fontsReady = Promise.race([d.fonts ? d.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]);
      fontsReady.then(() => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1200 }) : setTimeout(run, 200)));
    };
    if (d.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
  }

  // 3B parçacık sahnesi (assets/js/evren.js): her şey kurulduktan sonra, boşta kalınca yüklenir
  function loadEvren() {
    // İlk etkileşimde (fare, dokunuş, kaydırma) ya da en geç 6 sn sonra: açılış hızını etkilemesin
    let done = false;
    const evs = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'scroll', 'keydown'];
    const go = () => {
      if (done) return; done = true;
      evs.forEach(e => removeEventListener(e, go));
      const s = d.createElement('script'); s.src = 'assets/js/evren.js'; s.async = true; d.body.appendChild(s);
    };
    evs.forEach(e => addEventListener(e, go, { passive: true, once: true }));
    setTimeout(go, 6000);
  }

  // Sağdaki ilerleme ölçeği: hangi bölümdesin, sayfanın neresindesin
  function scale() {
    const el = $('.scale');
    if (!el) return;
    const secs = [['#top', 'Giriş'], ['#nasil', 'Nasıl çalışır'], ['#ozellikler', 'Özellikler'], ['#magaza', 'Mağaza'], ['#guvenlik', 'Güvenlik'], ['#plus', 'Duos+'], ['#sss', 'SSS'], ['#katil', 'Kapalı test']];
    const mark = $('.scale__mark', el), label = $('.scale__label', el);
    const upd = () => {
      const max = d.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      mark.style.transform = `translateY(${p * 100}%)`;
      let cur = secs[0][1];
      secs.forEach(([s, n]) => { const t = $(s); if (t && t.getBoundingClientRect().top < innerHeight * 0.5) cur = n; });
      if (label.textContent !== cur) label.textContent = cur;
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // Ekran dışındaki bölümlerde sonsuz CSS animasyonları durur (pil ve işlemci için)
  function zones() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-paused', !e.isIntersecting)), { rootMargin: '120px 0px' });
    $$('[data-zone]').forEach(z => io.observe(z));
  }

  // ------------------------------------------------------------------------------------------
  // Menü, bağlantılar, SSS (hareket azaltılmış olsa da çalışır)
  function basics(lenis) {
    const nav = $('#nav');
    // Menü hep yerinde kalır; kaydırınca yalnızca cam zemin açılır
    const onScroll = () => nav.classList.toggle('is-solid', scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    const burger = $('.nav__burger');
    const menu = $('#menu');
    const setMenu = open => {
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
      root.classList.toggle('menu-open', open);
      menu.hidden = !open;
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open && window.gsap && !RM) window.gsap.from($$('a', menu), { y: 30, opacity: 0, duration: .8, stagger: .05, ease: 'expo.out' });
    };
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });

    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      if (!menu.hidden) setMenu(false);
      if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -10, duration: 1.6 });
      else target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    }));

    // SSS: açılıp kapanırken yükseklik yumuşak değişsin
    $$('.qa').forEach(q => {
      const sum = $('summary', q);
      const body = $('.qa__a', q);
      sum.addEventListener('click', e => {
        if (RM || !window.gsap) return;
        e.preventDefault();
        const g = window.gsap;
        if (q.open) {
          g.to(body, { height: 0, duration: .5, ease: 'power3.inOut', onComplete: () => { q.open = false; body.style.height = ''; window.ScrollTrigger && window.ScrollTrigger.refresh(); } });
        } else {
          q.open = true;
          g.fromTo(body, { height: 0 }, { height: 'auto', duration: .6, ease: 'expo.out', onComplete: () => { body.style.height = ''; window.ScrollTrigger && window.ScrollTrigger.refresh(); } });
        }
      });
    });
  }

  // ------------------------------------------------------------------------------------------
  function hero(gsap) {
    // Telefonun üstündeki kedi: sayfa yüklendikten sonra hareketli sürüme geçer
    const cat = $('.phone__cat');
    if (cat) {
      const later = () => setTimeout(() => swapAnim(cat), 2500);
      if (d.readyState === 'complete') later(); else addEventListener('load', later, { once: true });
    }
    tilt(gsap);
    deck(gsap);
  }

  function swapAnim(img) {
    const src = img.dataset.anim;
    if (!src || img.dataset.swapped) return;
    const pre = new Image();
    pre.onload = () => { img.src = src; img.dataset.swapped = '1'; };
    pre.src = src;
  }

  // Sahne: fareye göre hafif 3B eğilme; dokunmatikte yavaş salınım
  function tilt(gsap) {
    const stage = $('.stage');
    const inner = $('.stage__tilt');
    const layers = $$('[data-depth]', inner).filter(el => !el.classList.contains('phone'));
    if (FINE) {
      const rx = gsap.quickTo(inner, 'rotationX', { duration: 1, ease: 'power3' });
      const ry = gsap.quickTo(inner, 'rotationY', { duration: 1, ease: 'power3' });
      const movers = layers.map(el => ({ k: +el.dataset.depth, x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }) }));
      $('.hero').addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        ry(px * 16); rx(-py * 10);
        movers.forEach(m => { m.x(px * 26 * m.k); m.y(py * 20 * m.k); });
      });
      $('.hero').addEventListener('pointerleave', () => { rx(0); ry(0); movers.forEach(m => { m.x(0); m.y(0); }); });
    } else {
      gsap.to(inner, { rotationY: 7, rotationX: -3, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      layers.forEach((el, i) => gsap.to(el, { y: -10, duration: 2.6 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    }
  }

  // ------------------------------------------------------------------------------------------
  // Keşfet destesi: kendi kendine kayar, sürüklenebilir
  const PLAYERS = [
    { n: 'Deniz', img: 'deniz', ban: 'arena', deco: 'gold-crown-anim', fit: 87, lfg: 'Valorant', t: ['t-fire', 'i-zap', 'Clutch Kralı'], meta: ['Türkiye', 'Discord', 'Rekabetçi'], r: '4,9', bio: 'Akşamları dereceli oynuyorum. Sakin iletişim, net bilgi.', common: ['İkinizin de favorisi Valorant', '2 ortak oyun', 'İkiniz de Discord'], g: ['VA', 'Valorant', 'FPS', '#E4474D'] },
    { n: 'Kira', img: 'kira', ban: 'sehir', deco: 'night-wings', fit: 81, t: ['t-neon', 'i-moon', 'Gece Kuşu'], meta: ['Türkiye', 'Oyun içi sesli', 'Eğlencesine'], r: '4,8', bio: 'Gece yarısından sonra normal ve ARAM. Önce eğlence gelir.', common: ['3 ortak ilgi alanı', 'İkiniz de eğlencesine'], g: ['LoL', 'League of Legends', 'MOBA', '#2E7BC4'] },
    { n: 'Emre', img: 'emre', ban: 'oda', deco: 'phoenix-plume', fit: 74, lfg: 'CS2', t: ['t-glitch', 'i-rocket', 'Carry Makinesi'], meta: ['Türkiye', 'Discord', 'Rekabetçi'], r: '4,7', bio: 'Premier oynuyorum, giriş rolündeyim. Takım oyununu bilirim.', common: ['2 ortak oyun', 'İkiniz de rekabetçi'], g: ['CS', 'Counter-Strike 2', 'FPS', '#D9912B'] },
    { n: 'Zeynep', img: 'zeynep', ban: 'aurora', deco: 'fairy-wing', fit: 78, t: ['t-rainbow', 'i-star', 'Yaşayan Efsane'], meta: ['Almanya', 'Discord', 'Rekabetçi'], r: '5,0', bio: 'Hafta sonu turnuva provası yapıyoruz. İletişimi iyi bir duo arıyorum.', common: ['1 ortak oyun', 'İkiniz de Discord'], g: ['FN', 'Fortnite', 'Battle Royale', '#7B55D6'] },
  ];
  const ic = id => `<svg><use href="#${id}"/></svg>`;
  const cardHTML = p => `
    <div class="pc__banner"><img src="assets/img/banner/${p.ban}.webp" alt=""></div>
    <div class="pc__top"><span class="pill-glass">${ic('i-spark')}%${p.fit} uyum</span>${p.lfg ? `<span class="pill-lfg"><i></i>Şimdi oynamak istiyor · ${p.lfg}</span>` : ''}</div>
    <div class="pc__body">
      <div class="pc__id">
        <span class="ava"><img src="assets/img/oyuncu/${p.img}.webp" alt=""><img class="ava__deco" src="assets/img/sus/${p.deco}.webp" alt=""></span>
        <span class="pc__name"><span class="pc__nm"><b>${p.n}</b><i class="online"></i></span><span class="title ${p.t[0]}">${ic(p.t[1])}${p.t[2]}</span></span>
      </div>
      <p class="pc__meta">${p.meta.join('<i></i>')}<i></i>${ic('i-star')}${p.r}</p>
      <p class="pc__bio">${p.bio}</p>
      <div class="pc__common"><small>Ortak noktanız</small>${p.common.map(c => `<span>${c}</span>`).join('')}</div>
      <div class="pc__game" style="--gc:${p.g[3]}"><span class="gt">${p.g[0]}</span><span><small>Favori oyunu</small><b>${p.g[1]}</b></span><em>${p.g[2]}</em></div>
    </div>
    <span class="stamp stamp--like">DUO</span><span class="stamp stamp--pass">GEÇ</span>`;

  function deck(gsap) {
    const el = $('#deck');
    if (!el) return;
    const POS = [{ y: 0, scale: 1, opacity: 1 }, { y: 12, scale: .95, opacity: .7 }, { y: 24, scale: .9, opacity: .35 }];
    let idx = 0;
    const first = $('.pc', el);
    const cards = [0, 1, 2].map(k => {
      let c = k === 0 ? first : null;
      if (!c) {
        c = d.createElement('article');
        c.className = 'pc';
        c.innerHTML = cardHTML(PLAYERS[k]);
        el.insertBefore(c, el.firstChild);
      }
      c.style.zIndex = 3 - k;
      gsap.set(c, POS[k]);
      return c;
    });
    let busy = false;
    const pattern = [1, 1, -1, 1];
    let n = 0;

    const fly = (dir, fromX = 0) => {
      if (busy) return;
      busy = true;
      const top = cards[0];
      const stamp = $(dir > 0 ? '.stamp--like' : '.stamp--pass', top);
      gsap.timeline({ onComplete: () => {
        idx = (idx + 1) % PLAYERS.length;
        cards.push(cards.shift());
        const back = cards[2];
        back.innerHTML = cardHTML(PLAYERS[(idx + 2) % PLAYERS.length]);
        gsap.set(back, { x: 0, rotation: 0, ...POS[2] });
        cards.forEach((c, k) => { c.style.zIndex = 3 - k; });
        busy = false;
      } })
        .to(stamp, { opacity: 1, duration: .2 }, 0)
        .fromTo(top, { x: fromX }, { x: dir * 420, y: 60, rotation: dir * 22, duration: .75, ease: 'power2.in' }, fromX ? 0 : .15)
        .to(cards[1], { ...POS[0], duration: .7, ease: 'expo.out' }, .35)
        .to(cards[2], { ...POS[1], duration: .7, ease: 'expo.out' }, .4);
    };

    // Kendi kendine kaydırma: yalnızca hero görünürken
    let timer = null;
    const auto = on => {
      clearInterval(timer);
      if (on) timer = setInterval(() => { if (!dragging && !d.hidden) fly(pattern[n++ % pattern.length]); }, 3200);
    };
    window.ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: s => auto(s.isActive) });
    setTimeout(() => auto(true), 2400);

    // Sürükleme
    let dragging = false, sx = 0, dx = 0;
    el.addEventListener('pointerdown', e => {
      if (busy || !e.target.closest('.pc') || e.target.closest('.pc') !== cards[0]) return;
      dragging = true; sx = e.clientX; dx = 0;
      cards[0].setPointerCapture(e.pointerId);
      gsap.killTweensOf(cards[0]);
    });
    el.addEventListener('pointermove', e => {
      if (!dragging) return;
      dx = e.clientX - sx;
      gsap.set(cards[0], { x: dx, rotation: dx * .06 });
      gsap.set($('.stamp--like', cards[0]), { opacity: Math.max(0, Math.min(1, dx / 90)) });
      gsap.set($('.stamp--pass', cards[0]), { opacity: Math.max(0, Math.min(1, -dx / 90)) });
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 80) fly(Math.sign(dx), dx);
      else gsap.to(cards[0], { x: 0, rotation: 0, duration: .8, ease: 'elastic.out(1, .55)' }), gsap.to($$('.stamp', cards[0]), { opacity: 0, duration: .2 });
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  // ------------------------------------------------------------------------------------------
  function splitHeadings(gsap) {
    $$('[data-split]').forEach(el => {
      window.ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => {
        gsap.set(el, { visibility: 'visible' });
        if (!window.SplitText) { gsap.from(el, { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out' }); return; }
        const split = window.SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
        gsap.from(split.words, { yPercent: 60, opacity: 0, filter: 'blur(14px)', duration: 1.4, stagger: .05, ease: 'expo.out', clearProps: 'filter', onComplete: () => split.revert() });
      } });
    });
  }

  function reveals(gsap, ScrollTrigger) {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: .08, ease: 'expo.out', overwrite: true }),
    });
  }

  function countTo(gsap, el, dur = 1.6, delay = 0) {
    const to = +el.dataset.count;
    const o = { v: +(el.dataset.countFrom || 0) };
    el.textContent = o.v;
    gsap.to(o, { v: to, duration: dur, delay, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
  }
  function counters(gsap) {
    $$('[data-count]').filter(el => !el.closest('.hero') && !el.closest('.streak')).forEach(el => {
      el.textContent = el.dataset.countFrom || 0;
      window.ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => countTo(gsap, el) });
    });
  }

  // ------------------------------------------------------------------------------------------
  // Sonsuz şeritler: kaydırma hızına ve yönüne tepki verir
  function marquees(gsap, lenis) {
    let dir = 1;
    let boost = 0;
    if (lenis) lenis.on('scroll', e => { if (e.direction) dir = e.direction; boost = Math.min(Math.abs(e.velocity) / 12, 6); });
    $$('[data-marquee]').forEach(m => {
      const track = $('.marquee__track', m);
      const base = [...track.children];
      const setW = track.scrollWidth;
      let copies = 1;
      while (track.scrollWidth < setW + m.clientWidth * 1.2 && copies < 6) {
        base.forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
        copies++;
      }
      const speed = parseFloat(m.dataset.speed || 1) * 60; // piksel / saniye
      let x = 0, active = false, b = 0;
      const set = gsap.quickSetter(track, 'x', 'px');
      window.ScrollTrigger.create({ trigger: m, start: 'top bottom', end: 'bottom top', onToggle: s => { active = s.isActive; } });
      gsap.ticker.add((t, dt) => {
        if (!active) return;
        b += (boost - b) * .08;
        x -= speed * dir * (1 + b) * dt / 1000;
        x = ((x % setW) - setW) % setW;
        set(x);
      });
    });
    gsap.ticker.add(() => { boost *= .92; });
  }

  // ------------------------------------------------------------------------------------------
  // Kaydır, eşleş, oyna: sabitlenen bölüm, kaydırmaya bağlı
  function story(gsap) {
    const sec = $('.story');
    if (!sec) return;
    const words = $$('.sw__f', sec);
    const steps = $$('.st', sec);
    const labels = $$('.story__bar span', sec);
    const card = $('.pc--story', sec);
    const finger = $('.finger', sec);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec, pin: '.story__pin', start: 'top top', end: '+=260%', scrub: 1, anticipatePin: 1,
        onUpdate: s => { const i = Math.min(2, Math.floor(s.progress * 3)); labels.forEach((l, k) => l.classList.toggle('on', k <= i)); },
      },
    });
    tl.to('.story__progress b', { scaleX: 1, duration: 3 }, 0)
      // 1 · Kaydır
      .to(words[0], { clipPath: 'inset(-.2em 0% -.3em 0em)', duration: .5 }, 0)
      .fromTo(finger, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: .15 }, .15)
      .to([card, finger], { x: 150, duration: .5, ease: 'power1.in' }, .3)
      .to(card, { rotation: 12, duration: .5, ease: 'power1.in' }, .3)
      .to($('.stamp--like', card), { opacity: 1, duration: .2 }, .45)
      .to(finger, { opacity: 0, duration: .1 }, .8)
      .to(card, { x: 420, y: 60, rotation: 26, duration: .2 }, .8)
      // 2 · Eşleş
      .to(steps[0], { autoAlpha: 0, y: -14, duration: .12 }, 1)
      .fromTo(steps[1], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .15 }, 1.08)
      .to(words[1], { clipPath: 'inset(-.2em 0% -.3em 0em)', duration: .5 }, 1)
      .to('.scr--deck', { autoAlpha: 0, duration: .12 }, 1)
      .to('.scr--match', { autoAlpha: 1, duration: .12 }, 1.02)
      .from('.mav--l', { x: -140, rotation: -30, duration: .35, ease: 'power3.out' }, 1.05)
      .from('.mav--r', { x: 140, rotation: 30, duration: .35, ease: 'power3.out' }, 1.05)
      .fromTo('.match__rings i', { scale: .6, opacity: .9 }, { scale: 2.4, opacity: 0, duration: .45, stagger: .1, ease: 'power2.out' }, 1.35)
      .from('.match__title, .match__sub', { y: 20, opacity: 0, duration: .2, stagger: .05, ease: 'power2.out' }, 1.38)
      .from('.match__sugs > *', { y: 16, opacity: 0, duration: .2, stagger: .06, ease: 'power2.out' }, 1.5)
      // 3 · Oyna
      .to(steps[1], { autoAlpha: 0, y: -14, duration: .12 }, 2)
      .fromTo(steps[2], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .15 }, 2.08)
      .to(words[2], { clipPath: 'inset(-.2em 0% -.3em 0em)', duration: .5 }, 2)
      .to('.scr--match', { autoAlpha: 0, duration: .12 }, 2)
      .to('.scr--chat', { autoAlpha: 1, duration: .12 }, 2.02)
      .from('.scr--chat .msg', { y: 18, opacity: 0, scale: .96, duration: .18, stagger: .14, ease: 'power2.out' }, 2.12)
      .from('.chat__card', { y: 20, opacity: 0, duration: .2, ease: 'power2.out' }, 2.7)
      .to({}, { duration: .1 }, 2.9);
  }

  // ------------------------------------------------------------------------------------------
  function features(gsap) {
    // Kenar parlaması (spotlight)
    const bento = $('[data-spotlight]');
    if (bento && FINE) {
      const tiles = $$('.tile', bento);
      bento.addEventListener('pointermove', e => {
        tiles.forEach(t => { const r = t.getBoundingClientRect(); t.style.setProperty('--x', `${e.clientX - r.left}px`); t.style.setProperty('--y', `${e.clientY - r.top}px`); });
      });
    }
    // Uyum göstergesi
    const fg = $('.gauge__fg');
    if (fg) {
      gsap.fromTo(fg, { strokeDasharray: '0 100' }, { strokeDasharray: '87 100', duration: 2, ease: 'expo.out', scrollTrigger: { trigger: '.tile--fit', start: 'top 75%', once: true } });
      gsap.from('.fit__list li', { x: 20, opacity: 0, duration: 1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.tile--fit', start: 'top 70%', once: true } });
    }
    // Hazırım: görünür olunca bir kez kendiliğinden açılır
    window.ScrollTrigger.create({ trigger: '.tile--ready', start: 'top 70%', once: true, onEnter: () => setTimeout(() => setReady(true), 700) });
    // Seri: gün gün yanar, sayı artar
    const week = $$('.streak__week li');
    window.ScrollTrigger.create({ trigger: '.tile--streak', start: 'top 75%', once: true, onEnter: () => {
      const b = $('.streak__flame b');
      countTo(gsap, b, 1.8);
      week.slice(0, 5).forEach((li, i) => setTimeout(() => li.classList.add('on'), 250 + i * 280));
      gsap.fromTo('.streak__flame', { scale: .7 }, { scale: 1, duration: 1.4, delay: 1.6, ease: 'elastic.out(1, .4)' });
    } });
    // Sohbet ve Discord döngüleri: yalnızca ekrandayken
    loopWhenVisible(gsap, '.tile--chat', () => gsap.timeline({ repeat: -1, repeatDelay: 1.6 })
      .from('.chatdemo__sugs span', { y: 10, opacity: 0, duration: .5, stagger: .12, ease: 'expo.out' })
      .from('.chatdemo .msg--me', { y: 14, opacity: 0, scale: .96, duration: .5, ease: 'expo.out' }, '+=.4')
      .from('.chatdemo .msg--typing', { opacity: 0, duration: .3 }, '+=.3')
      .to('.chatdemo .msg--typing', { opacity: 0, duration: .2 }, '+=1.2')
      .from('.chatdemo .msg:not(.msg--me):not(.msg--typing)', { y: 14, opacity: 0, scale: .96, duration: .5, ease: 'expo.out' }, '<'));
    const cmd = $('.discord__cmd');
    if (cmd) {
      const full = cmd.dataset.type;
      const o = { n: 0 };
      cmd.textContent = '';
      loopWhenVisible(gsap, '.tile--discord', () => gsap.timeline({ repeat: -1, repeatDelay: 2.4 })
        .fromTo(o, { n: 0 }, { n: full.length, duration: 1.8, ease: 'none', onUpdate: () => { cmd.textContent = full.slice(0, Math.round(o.n)); } }, .4)
        .call(() => { cmd.textContent = ''; }, null, '+=.35')
        .fromTo('.discord__post', { opacity: .25, y: 12 }, { opacity: 1, y: 0, duration: .7, ease: 'expo.out' }, '<'));
    }
  }
  function loopWhenVisible(gsap, sel, make) {
    const el = $(sel);
    if (!el) return;
    let tl = null;
    window.ScrollTrigger.create({ trigger: el, start: 'top 85%', end: 'bottom 10%', onToggle: s => {
      if (s.isActive) { if (!tl) tl = make(); else tl.resume(); } else if (tl) tl.pause();
    } });
  }
  function setReady(on) {
    const sw = $('#readySwitch');
    if (!sw) return;
    sw.setAttribute('aria-checked', on);
    $('.ready').classList.toggle('is-on', on);
  }

  // ------------------------------------------------------------------------------------------
  // Profil kurucu: süs, ünvan, pet ve efekt sırayla takılır; satırlara dokununca açılıp kapanır
  function builder(gsap) {
    const box = $('[data-builder]');
    if (!box) return;
    const parts = [$('.bc__deco', box), $('.bc__title', box), $('.bc__pet', box), $('.bc__fx', box)];
    const rows = $$('.bl', box);
    const state = [false, false, false, false];
    const show = (i, on, instant) => {
      state[i] = on;
      rows[i].classList.toggle('is-on', on);
      rows[i].setAttribute('aria-pressed', on);
      const el = parts[i];
      const dur = instant ? 0 : 1;
      if (i === 0) gsap.to(el, on ? { scale: 1, opacity: 1, duration: dur, ease: 'back.out(1.8)' } : { scale: 1.5, opacity: 0, duration: dur * .4 });
      if (i === 1) gsap.to(el, on ? { scale: 1, opacity: 1, duration: dur * .8, ease: 'back.out(2.2)' } : { scale: .6, opacity: 0, duration: dur * .3 });
      if (i === 2) { if (on) swapAnim(el); gsap.to(el, on ? { y: 0, opacity: 1, duration: dur * 1.1, ease: 'bounce.out' } : { y: -120, opacity: 0, duration: dur * .4 }); }
      if (i === 3) gsap.to(el, { opacity: on ? 1 : 0, duration: dur * .8 });
    };
    gsap.set(parts[0], { scale: 1.5, opacity: 0 });
    gsap.set(parts[1], { scale: .6, opacity: 0 });
    gsap.set(parts[2], { y: -120, opacity: 0 });
    rows.forEach((b, i) => b.addEventListener('click', () => show(i, !state[i])));
    window.ScrollTrigger.create({ trigger: box, start: 'top 60%', once: true, onEnter: () => {
      [0, 1, 2, 3].forEach(i => setTimeout(() => show(i, true), 300 + i * 900));
    } });
  }

  // ------------------------------------------------------------------------------------------
  function parallax(gsap) {
    gsap.to('.foot__word', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.final__glow', { scale: .7, opacity: .4 }, { scale: 1.15, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'center center', scrub: true } });
    gsap.from('.bc', { y: 80, rotation: -3, ease: 'none', scrollTrigger: { trigger: '.builder', start: 'top bottom', end: 'center center', scrub: true } });
    if (!FINE) gsap.fromTo('.holo__card', { '--ry': '-24deg', '--rx': '10deg' }, { '--ry': '14deg', '--rx': '-4deg', ease: 'none', scrollTrigger: { trigger: '.plus', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // ------------------------------------------------------------------------------------------
  // Hareket azaltılmış olsa da çalışan etkileşimler: Hazırım, kasa, Duos+ kartı, manyetik düğmeler
  function interactions(gsap, lenis) {
    const sw = $('#readySwitch');
    if (sw) sw.addEventListener('click', () => setReady(sw.getAttribute('aria-checked') !== 'true'));
    crate(gsap);
    if (!FINE || RM) return;
    holo(gsap);
    $$('[data-magnetic]').forEach(el => {
      const k = parseFloat(el.dataset.strength || .3);
      const inner = el.querySelector('span, .orb__core');
      const mx = gsap.quickTo(el, 'x', { duration: .8, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: .8, ease: 'power3' });
      const ix = inner ? gsap.quickTo(inner, 'x', { duration: .8, ease: 'power3' }) : null;
      const iy = inner ? gsap.quickTo(inner, 'y', { duration: .8, ease: 'power3' }) : null;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        mx(x * k); my(y * k);
        if (ix) { ix(x * k * .4); iy(y * k * .4); }
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)', overwrite: true });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)', overwrite: true });
      });
    });
  }

  // Duos+ kartı: fareye göre eğilir, folyo ve parlama ışığı takip eder
  function holo(gsap) {
    const stage = $('.plus__stage');
    const card = $('.holo__card');
    if (!stage || !card) return;
    const st = { rx: 8, ry: -14, px: 50, py: 50, gx: 30, gy: 20 };
    const apply = () => {
      card.style.setProperty('--rx', `${st.rx}deg`); card.style.setProperty('--ry', `${st.ry}deg`);
      card.style.setProperty('--px', `${st.px}%`); card.style.setProperty('--py', `${st.py}%`);
      card.style.setProperty('--gx', `${st.gx}%`); card.style.setProperty('--gy', `${st.gy}%`);
    };
    stage.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
      gsap.to(st, { rx: (.5 - y) * 22, ry: (x - .5) * 30, px: x * 100, py: y * 100, gx: x * 100, gy: y * 100, duration: .6, ease: 'power3', onUpdate: apply, overwrite: true });
    });
    stage.addEventListener('pointerleave', () => gsap.to(st, { rx: 8, ry: -14, px: 50, py: 50, gx: 30, gy: 20, duration: 1.2, ease: 'elastic.out(1, .5)', onUpdate: apply, overwrite: true }));
  }

  // ------------------------------------------------------------------------------------------
  // Kasa: uygulamadaki Çırak Sandığı ağırlıklarıyla (src/data/crates.ts) CS2 tarzı şerit
  function crate(gsap) {
    const box = $('[data-crate]');
    if (!box) return;
    const RAR = {
      common: { label: 'Sıradan', c: '#A7B0C0', p: 10 },
      rare: { label: 'Nadir', c: '#4FA3FF', p: 25 },
      epic: { label: 'Destansı', c: '#B36BFF', p: 60 },
      legendary: { label: 'Efsanevi', c: '#FFC23D', p: 150 },
    };
    const DROPS = [
      { n: 'Gece Kuşu', t: 't-neon', i: 'i-moon', r: 'common', w: 40 },
      { n: 'Sessiz Nişancı', t: 't-ice', i: 'i-aim', r: 'common', w: 40 },
      { n: 'Herkesin Kankası', t: 't-mint', i: 'i-smile', r: 'common', w: 40 },
      { n: 'Clutch Kralı', t: 't-fire', i: 'i-zap', r: 'rare', w: 25 },
      { n: 'Carry Makinesi', t: 't-glitch', i: 'i-rocket', r: 'rare', w: 25 },
      { n: 'Uykucu Tekir', img: 'tekir', r: 'epic', w: 12 },
      { n: 'Büyü Kitabı', img: 'kitap', r: 'epic', w: 10 },
      { n: 'Bozkurt Yavrusu', img: 'kurt', r: 'legendary', w: 4 },
      { n: 'Yaşayan Efsane', t: 't-rainbow', i: 'i-star', r: 'legendary', w: 4 },
    ];
    const total = DROPS.reduce((s, x) => s + x.w, 0);
    const pick = () => { let r = Math.random() * total; for (const x of DROPS) { if ((r -= x.w) < 0) return x; } return DROPS[0]; };
    const track = $('.reel__track', box);
    const reel = $('.reel', box);
    const marker = $('.reel__marker', box);
    const btn = $('.crate__btn', box);
    const out = $('.crate__result', box);
    const N = 44, WIN = 36;
    const item = x => `<div class="ri" style="--rc:${RAR[x.r].c}">${x.img ? `<img src="assets/img/pet/${x.img}.webp" alt="">` : `<span class="title ${x.t}">${ic(x.i)}${x.n}</span>`}<small>${x.img ? x.n : 'Ünvan'}</small></div>`;
    const build = win => {
      const list = Array.from({ length: N }, pick);
      list[WIN] = win;
      track.innerHTML = list.map(item).join('');
      gsap.set(track, { x: 0 });
    };
    build(pick());
    let spinning = false;
    const spin = forced => {
      if (spinning) return;
      spinning = true;
      btn.disabled = true;
      const win = forced || pick();
      build(win);
      out.innerHTML = '<small>Kasa açılıyor</small><b>…</b>';
      const first = track.children[0];
      const step = first.offsetWidth + 10;
      const center = reel.clientWidth / 2;
      const jitter = (Math.random() - .5) * first.offsetWidth * .7;
      const target = -(WIN * step + first.offsetWidth / 2 - center + jitter);
      let last = -1;
      const done = () => {
        const w = track.children[WIN];
        w.classList.add('is-win');
        const r = RAR[win.r];
        out.style.setProperty('--rc', r.c);
        out.innerHTML = `<small>Kasadan çıkan</small><b>${win.n} · <em>${r.label}</em></b><small>Zaten sahipseniz +${r.p} Kasa Puanı</small>`;
        if (!RM) gsap.fromTo(w, { scale: 1 }, { scale: 1.08, duration: .6, ease: 'back.out(3)' });
        spinning = false;
        btn.disabled = false;
      };
      if (RM) { gsap.set(track, { x: target }); done(); return; }
      gsap.to(track, {
        x: target, duration: 5.6, ease: 'power4.out',
        onUpdate: () => {
          const i = Math.floor((-gsap.getProperty(track, 'x') + center) / step);
          if (i !== last) { last = i; gsap.fromTo(marker, { scaleX: 2.2 }, { scaleX: 1, duration: .18, overwrite: true }); }
        },
        onComplete: done,
      });
    };
    btn.addEventListener('click', () => spin());
    // İlk gösterim: bölüm görününce bir kez kendiliğinden açılır
    if (window.ScrollTrigger && !RM) window.ScrollTrigger.create({ trigger: box, start: 'top 65%', once: true, onEnter: () => spin(DROPS[5]) });
  }

  // Başlat: dosyanın sonunda, yukarıdaki tüm tanımlar hazır olduktan sonra
  if (!window.gsap || !window.ScrollTrigger) { showAll(); basics(null); }
  else { try { init(); } catch (e) { console.error(e); showAll(); } }
})();
