/* Coopy tanıtım sitesi: hareket ve etkileşimler.
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
    const intro = $('.intro');
    if (intro) intro.addEventListener('click', () => root.classList.remove('intro-on', 'js-intro'));

    if (RM) { showAll(); interactions(gsap, lenis); vitrin(gsap); return; }

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
      () => vitrin(gsap),
      () => eyes(),
      () => marquees(gsap, lenis),
      () => parallax(gsap),
      () => interactions(gsap, lenis),
    ];
    const safety = setTimeout(showAll, 8000);
    const run = () => {
      const t0 = performance.now();
      while (tasks.length && performance.now() - t0 < 25) tasks.shift()();
      if (tasks.length) setTimeout(run, 0);
      else { clearTimeout(safety); ScrollTrigger.refresh(); }
    };
    const start = () => {
      const fontsReady = Promise.race([d.fonts ? d.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]);
      fontsReady.then(() => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 1200 }) : setTimeout(run, 200)));
    };
    if (d.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
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
    { n: 'Deniz', img: 'deniz', ban: 'arena', deco: 'gold-crown-anim', fit: 87, lfg: 'Valorant', t: 'clutch', meta: ['Türkiye', 'Discord', 'Rekabetçi'], r: '4,9', bio: 'Akşamları dereceli oynuyorum. Sakin iletişim, net bilgi.', common: ['İkinizin de favorisi Valorant', '2 ortak oyun', 'İkiniz de Discord'], g: ['VA', 'Valorant', 'FPS', '#E4474D'] },
    { n: 'Kira', img: 'kira', ban: 'sehir', deco: 'night-wings', fit: 81, t: 'gecekusu', meta: ['Türkiye', 'Oyun içi sesli', 'Eğlencesine'], r: '4,8', bio: 'Gece yarısından sonra normal ve ARAM. Önce eğlence gelir.', common: ['3 ortak ilgi alanı', 'İkiniz de eğlencesine'], g: ['LoL', 'League of Legends', 'MOBA', '#2E7BC4'] },
    { n: 'Emre', img: 'emre', ban: 'oda', deco: 'phoenix-plume', fit: 74, lfg: 'CS2', t: 'carry', meta: ['Türkiye', 'Discord', 'Rekabetçi'], r: '4,7', bio: 'Premier oynuyorum, giriş rolündeyim. Takım oyununu bilirim.', common: ['2 ortak oyun', 'İkiniz de rekabetçi'], g: ['CS', 'Counter-Strike 2', 'FPS', '#D9912B'] },
    { n: 'Zeynep', img: 'zeynep', ban: 'aurora', deco: 'fairy-wing', fit: 78, t: 'efsane', meta: ['Almanya', 'Discord', 'Rekabetçi'], r: '5,0', bio: 'Hafta sonu turnuva provası yapıyoruz. İletişimi iyi bir duo arıyorum.', common: ['1 ortak oyun', 'İkiniz de Discord'], g: ['FN', 'Fortnite', 'Battle Royale', '#7B55D6'] },
  ];
  const ic = id => `<svg><use href="#${id}"/></svg>`;
  // Ünvanlar: uygulamadaki src/data/titles.ts ile aynı renk, simge ve seviye.
  // [ad, renk, renk2, simge, seviye (base | glint | run | legend), nadirlik, yaldızlı yazı, açık ton]
  const TITLES = {
    efsane: ['Yaşayan Efsane', '#FFD36B', '#B07418', 'sparkles', 'legend', 'legendary', 'foil', null],
    ejder: ['Ejderha', '#FF7A3D', '#C0161B', 'dragon', 'legend', 'legendary', 'ember', null],
    anka: ['Anka', '#FFB347', '#E0303A', 'feather', 'legend', 'legendary', 'ember', null],
    golge: ['Hayalet', '#C9B2FF', '#6A3FD0', 'ghost', 'run', 'epic', null, null],
    firtina: ['Yıldırım', '#A9CBFF', '#3E6BFF', 'bolt-lightning', 'run', 'epic', null, null],
    kozmik: ['Meteor', '#FFA477', '#B04BFF', 'meteor', 'run', 'epic', null, null],
    kuzgun: ['Kuzgun', '#9AA6FF', '#2B2F6B', 'crow', 'run', 'epic', null, null],
    sessiz: ['Tek Atar', '#5CFFB6', '#12A06A', 'crosshairs', 'glint', 'rare', null, null],
    clutch: ['Clutch Kralı', '#FF9A4D', '#E2421C', 'crown', 'glint', 'rare', null, null],
    carry: ['Kaptan', '#7CC2FF', '#2E6FD8', 'flag', 'glint', 'rare', null, null],
    rank: ['Rank Avcısı', '#FFE06B', '#D08A1C', 'ranking-star', 'glint', 'rare', null, null],
    gecekusu: ['Gece Kuşu', '#A99BFF', '#5B48D6', 'moon', 'base', 'common', null, null],
    kanka: ['Kanka', '#6EF0C6', '#139C80', 'hand-fist', 'base', 'common', null, null],
    taktik: ['Takımın Beyni', '#C9D4E3', '#6D7890', 'chess-knight', 'base', 'common', null, null],
    mikrofon: ['Mikrofon Açık', '#FFB0D0', '#D64B8A', 'microphone', 'base', 'common', null, null],
    sonmeyen: ['Sönmeyen Ateş', '#A6F2FF', '#5B6CFF', 'bonfire', 'run', null, 'ice', '#F2FEFF'],
    duayen: ['Duayen', '#A6F2FF', '#5B6CFF', 'award', 'run', null, 'ice', '#F2FEFF'],
    canciger: ['Can Ciğer', '#FFD36B', '#E0559E', 'user-group', 'legend', null, 'foil', null],
    plus: ['Coopy+', '#C4A8FF', '#E0559E', 'coopy', 'glint', null, null, null],
  };
  const tb = (key, cls = '') => {
    const [n, c, c2, g, tier, r, text, light] = TITLES[key];
    return `<span class="tb tb--${tier}${text ? ` tb--${text}` : ''}${cls ? ` ${cls}` : ''}" style="--c:${c};--c2:${c2}${light ? `;--l:${light}` : ''}"><span class="tb__tile">${ic('g-' + g)}</span><span class="tb__name">${n}</span>${r ? `<i class="tb__r tb__r--${r}"></i>` : ''}</span>`;
  };
  const cardHTML = p => `
    <div class="pc__banner"><img src="assets/img/banner/${p.ban}.webp" alt=""></div>
    <div class="pc__top"><span class="pill-glass">${ic('i-spark')}%${p.fit} uyum</span>${p.lfg ? `<span class="pill-lfg"><i></i>Şimdi oynamak istiyor · ${p.lfg}</span>` : ''}</div>
    <div class="pc__body">
      <div class="pc__id">
        <span class="ava"><img src="assets/img/oyuncu/${p.img}.webp" alt=""><img class="ava__deco" src="assets/img/sus/${p.deco}.webp" alt=""></span>
        <span class="pc__name"><span class="pc__nm"><b>${p.n}</b><i class="online"></i></span>${tb(p.t)}</span>
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
        gsap.from(split.words, { yPercent: 115, duration: 1.3, stagger: .045, ease: 'expo.out', onComplete: () => split.revert() });
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
  // Süs vitrini: seçili süs sahnede canlanır; sahne, dev ad ve parçacıklar süsün renginde
  // [dosya, ad, koleksiyon, fiyat, Coopy+ fiyatı, renk, avatara oran, parçacık, açıklama]
  const VITRIN = [
    ['dragon-ember', 'Kor Ejderi', 'Kor Ejderi', '99,99', '79,99', '#FF7A1E', 1.43, 'ember', 'Rünlü halka ve iki yanında ejder kanatları. Kanatlar ağır ağır çırpar, alttaki ejder gözü arada kırpar.'],
    ['cosmic-eye', 'Kozmik Göz', 'Kozmik Göz', '99,99', '79,99', '#9B7BFF', 1.56, 'dust', 'Dokunaçlar kıvrılır, kaya parçaları süzülür. Kristal göz galaksi gibi parlar ve arada kırpar.'],
    ['abyss-lure', 'Derin Fener', 'Derin Deniz', '99,99', '79,99', '#2FC8F0', 1.66, 'bubble', 'Fener balığının ışığı sallanır, pullardaki noktalar yanıp söner, kabarcıklar yükselir.'],
    ['crimson-oni', 'Kızıl Oni', 'Kızıl Oni', '99,99', '79,99', '#F0283F', 1.4, 'ember', 'Ağır zincir ve çatlak boynuzlu oni maskesi. Maskenin gözleri kızıl alevle tutuşur.'],
    ['sakura-dream', 'Sakura Rüyası', 'Sakura Rüyası', '94,99', '75,99', '#FF7FB6', 1.4, 'petal', 'Sakura çelengi, dalda uyuyan minik kitsune ve rüzgârda sallanan kâğıt fener.'],
    ['phoenix-plume', 'Anka Tüyü', 'Küllerden Doğan', '99,99', '79,99', '#FF8A2A', 1.4, 'ember', 'Alev renkli anka tüyleri kanat gibi açılır, tüylerin arasından korlar yükselir.'],
    ['night-wings', 'Gece Kanatları', 'Gece Yarısı Balosu', '99,99', '79,99', '#A65CFF', 1.4, 'dust', 'Avatarınızın arkasından açılan yarasa kanatları, füme gümüş halka ve siyah güller.'],
    ['frost-tiara', 'Buz Tacı', 'Ayaz Sarayı', '94,99', '75,99', '#6FCBFF', 1.4, 'snow', 'Gümüş mavi buz halkası, tepesinde kristal taç; çevresinde kar taneleri süzülür.'],
    ['rune-ring', 'Rün Çemberi', 'Taşların Fısıltısı', '99,99', '79,99', '#2EE0F5', 1.4, 'dust', 'Avatarınızın çevresinde yüzen rün taşları. Işık halkada dolaştıkça rünler sırayla yanar.'],
    ['gold-crown', 'Altın Taç', 'Taht ve Taç', '99,99', '79,99', '#FFB938', 1.4, 'dust', 'Altın barok halka, yan yatmış kraliyet tacı, kızıl güller ve yakutlar.'],
    ['moon-rose', 'Ay Gülü', 'Ay Işığında Güller', '89,99', '71,99', '#B9AEFF', 1.4, 'dust', 'Fildişi güllerle sarılı gümüş filigran halka, tepesinde hilal ay.'],
    ['flame-sword', 'Alev Kılıcı', 'Kordan Dövülmüş', '99,99', '79,99', '#FF6418', 1.4, 'ember', 'Avatarınızın çevresine kıvrılmış bir kılıç. Alevler kabzadan uca doğru akar.'],
  ];
  function vitrin(gsap) {
    const box = $('[data-vitrin]');
    if (!box) return;
    const V = 'assets/img/vitrin/';
    const thumbs = $('.vitrin__thumbs', box), ava = $('.vt-ava', box), word = $('.vitrin__word', box);
    const DUR = 4200;
    thumbs.innerHTML = VITRIN.map(([id, n, , , , c], i) => `<button class="vt-th" type="button" style="--tc:${c}" data-i="${i}" aria-label="${n}"><img src="${V}${id}-k.webp" alt="" loading="lazy" width="180" height="180"><i></i></button>`).join('');
    box.style.setProperty('--dur', DUR + 'ms');
    const fx = vitrinFx(box);
    let cur = -1, timer = 0, visible = false, hover = false;
    const deco = ([id, , , , , , k]) => {
      const el = d.createElement('span');
      el.className = 'vt-deco'; el.style.setProperty('--k', k);
      el.innerHTML = `<img src="${V}${id}.webp" alt=""><img src="${V}${id}-fx.webp" alt="">`;
      return el;
    };
    const setWord = text => {
      const old = [...word.children];
      if (old.length && !RM) gsap.to(old, { yPercent: -110, opacity: 0, duration: .45, ease: 'power3.in', stagger: .015, onComplete: () => old.forEach(e => e.remove()) });
      else old.forEach(e => e.remove());
      const line = d.createElement('span');
      line.style.cssText = 'position:absolute;left:0;bottom:0';
      line.innerHTML = [...text.toLocaleUpperCase('tr')].map(ch => `<span class="ch">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
      word.appendChild(line);
      // uzun ad panele sığsın
      const avail = box.clientWidth - 2 * parseFloat(getComputedStyle(word).left);
      if (line.scrollWidth > avail) line.style.fontSize = (avail / line.scrollWidth).toFixed(3) + 'em';
      if (!RM) gsap.from(line.children, { yPercent: 110, duration: .9, ease: 'power4.out', stagger: .03, delay: .2 });
    };
    const show = i => {
      if (i === cur) return;
      cur = i;
      const it = VITRIN[i];
      box.style.setProperty('--vc', it[5]);
      const old = $('.vt-deco', ava);
      const el = deco(it);
      ava.appendChild(el);
      if (old) gsap.to(old, { opacity: 0, scale: .86, rotation: -8, duration: .4, ease: 'power2.in', onComplete: () => old.remove() });
      if (!RM) {
        gsap.fromTo(el, { opacity: 0, scale: 1.25, rotation: 10 }, { opacity: 1, scale: 1, rotation: 0, duration: .9, ease: 'back.out(1.6)', delay: .1 });
        gsap.fromTo($('.vt-ava__img', ava), { scale: .94 }, { scale: 1, duration: .8, ease: 'elastic.out(1, .5)' });
      }
      setWord(it[1]);
      $('.vitrin__name', box).textContent = it[1];
      $('.vitrin__coll', box).textContent = `${it[2]} koleksiyonu`;
      $('.vitrin__desc', box).textContent = it[8];
      $('.vitrin__price b', box).textContent = `${it[3]} ₺`;
      $('.vitrin__price em', box).textContent = `${it[4]} ₺`;
      $('.vitrin__idx b', box).textContent = String(i + 1).padStart(2, '0');
      if (!RM) gsap.fromTo($$('.vitrin__name, .vitrin__coll, .vitrin__desc', box), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power3.out', stagger: .06 });
      $$('.vt-th', thumbs).forEach((t, j) => t.classList.toggle('on', j === i));
      fx.set(it[7], it[5]);
      // sıradaki süsün hareketli katmanı önceden yüklensin
      const nx = VITRIN[(i + 1) % VITRIN.length]; (new Image()).src = `${V}${nx[0]}-fx.webp`;
      schedule();
    };
    const schedule = () => { clearTimeout(timer); box.classList.toggle('is-paused', hover || !visible); if (!RM && visible && !hover) timer = setTimeout(() => show((cur + 1) % VITRIN.length), DUR); };
    thumbs.addEventListener('click', e => { const t = e.target.closest('.vt-th'); if (t) show(+t.dataset.i); });
    thumbs.addEventListener('pointerenter', () => { hover = true; schedule(); });
    thumbs.addEventListener('pointerleave', () => { hover = false; const on = $('.vt-th.on i', thumbs); if (on) { on.style.animation = 'none'; void on.offsetWidth; on.style.animation = ''; } schedule(); });
    new IntersectionObserver(e => { visible = e[0].isIntersecting; fx.run(visible); if (visible && cur < 0) show(0); else schedule(); }, { threshold: .25 }).observe(box);
    // sahne fareye göre hafifçe eğilir
    if (FINE && !RM) {
      const stage = $('.vitrin__stage', box);
      const rx = gsap.quickTo(ava, 'rotationX', { duration: .9, ease: 'power3' }), ry = gsap.quickTo(ava, 'rotationY', { duration: .9, ease: 'power3' });
      const sx = gsap.quickTo(word, 'x', { duration: 1.4, ease: 'power3' });
      box.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; ry(px * 18); rx(-py * 14); sx(-px * 30); });
      box.addEventListener('pointerleave', () => { rx(0); ry(0); sx(0); });
    }
  }

  // Vitrin parçacıkları: süsün türüne göre kor, yıldız tozu, kabarcık, yaprak ya da kar
  function vitrinFx(box) {
    const cv = $('.vitrin__fx', box);
    const api = { set() {}, run() {} };
    if (!cv || RM) return api;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W = 0, H = 0, kind = 'ember', rgb = [255, 122, 30], on = false, raf = 0, last = 0;
    const size = () => { W = cv.width = cv.offsetWidth * dpr; H = cv.height = cv.offsetHeight * dpr; };
    size(); addEventListener('resize', size, { passive: true });
    const N = innerWidth < 760 ? 22 : 40;
    const ps = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), v: .4 + Math.random() * .8, r: .7 + Math.random() * 1.5, ph: Math.random() * 6.3, a: 0 }));
    api.set = (k, hex) => { kind = k; rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); ps.forEach(p => { p.a = 0; }); };
    api.run = v => { on = v; if (v && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    function tick(now) {
      raf = 0;
      if (!on) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      const [r, g, b] = rgb;
      const fall = kind === 'snow' || kind === 'petal';
      for (const p of ps) {
        p.a = Math.min(1, p.a + dt * .7);
        p.ph += dt * (kind === 'dust' ? 1.4 : 2.6);
        const sp = kind === 'dust' ? .018 : kind === 'bubble' ? .05 : kind === 'ember' ? .075 : .04;
        p.y += (fall ? 1 : -1) * dt * p.v * sp;
        p.x += Math.sin(p.ph) * dt * (kind === 'petal' ? .03 : .008);
        if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.y > 1.05) { p.y = -.05; p.x = Math.random(); }
        const x = p.x * W, y = p.y * H, s = p.r * dpr;
        const edge = Math.min(1, p.y / .12, (1 - p.y) / .12);
        const tw = kind === 'dust' ? .3 + .7 * Math.abs(Math.sin(p.ph * .8)) : kind === 'ember' ? .55 + .45 * Math.sin(p.ph * 2.2) : .85;
        const al = Math.max(0, p.a * tw * edge);
        if (kind === 'bubble') {
          ctx.strokeStyle = `rgba(${r},${g},${b},${al * .75})`; ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.arc(x, y, s * 2.8, 0, 6.283); ctx.stroke();
        } else if (kind === 'petal') {
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.ph); ctx.scale(1, .55 + .45 * Math.sin(p.ph * 1.7));
          ctx.fillStyle = `rgba(${r},${g},${b},${al * .8})`; ctx.beginPath(); ctx.ellipse(0, 0, s * 3.2, s * 1.8, 0, 0, 6.283); ctx.fill(); ctx.restore();
        } else {
          const R = s * (kind === 'snow' ? 3 : 5);
          const gr = ctx.createRadialGradient(x, y, 0, x, y, R);
          gr.addColorStop(0, `rgba(255,255,255,${al})`); gr.addColorStop(.2, `rgba(${r},${g},${b},${al * .9})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    }
    return api;
  }

  // Coopy gözleri imleci izler ve arada kırpar (üst çubuk ve alt bilgi logosu)
  function eyes() {
    const marks = $$('.brand__mark');
    if (!marks.length) return;
    if (FINE) addEventListener('pointermove', e => {
      marks.forEach(m => {
        const r = m.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const k = Math.min(1, Math.hypot(dx, dy) / 300), a = Math.atan2(dy, dx);
        // bebekler varsayılan olarak sağ üste bakar; imlece doğru en fazla ~5 birim kayar (viewBox 1024 ölçeğinde ~45)
        $$('.pup', m).forEach(p => { p.style.translate = `${Math.cos(a) * 45 * k + 0}px ${Math.sin(a) * 40 * k + 30 * k}px`; });
      });
    }, { passive: true });
    const blink = () => { marks.forEach(m => { m.classList.remove('is-blink'); void m.getBoundingClientRect(); m.classList.add('is-blink'); }); setTimeout(blink, 3500 + Math.random() * 4000); };
    setTimeout(blink, 3000);
  }

  // ------------------------------------------------------------------------------------------
  function parallax(gsap) {
    gsap.to('.foot__word', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.fromTo('.final__glow', { scale: .7, opacity: .4 }, { scale: 1.15, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'center center', scrub: true } });
    // vitrin kaydırmayla açılır: panel hafifçe büyür, dev ad kayar
    gsap.from('.vitrin', { scale: .94, borderRadius: 64, ease: 'none', scrollTrigger: { trigger: '.vitrin', start: 'top bottom', end: 'top 30%', scrub: true } });
    gsap.fromTo('.vitrin__word', { xPercent: 3 }, { xPercent: -3, ease: 'none', scrollTrigger: { trigger: '.vitrin', start: 'top bottom', end: 'bottom top', scrub: true } });
    if (!FINE) gsap.fromTo('.holo__card', { '--ry': '-24deg', '--rx': '10deg' }, { '--ry': '14deg', '--rx': '-4deg', ease: 'none', scrollTrigger: { trigger: '.plus', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  // ------------------------------------------------------------------------------------------
  // Hareket azaltılmış olsa da çalışan etkileşimler: Hazırım, kasa, Coopy+ kartı, manyetik düğmeler
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

  // Coopy+ kartı: fareye göre eğilir, folyo ve parlama ışığı takip eder
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
  // Kasalar: uygulamadaki iki sandık (src/data/crates.ts) aynı içerik ve ağırlıklarla, CS2 tarzı şerit
  function crate(gsap) {
    const box = $('[data-crate]');
    if (!box) return;
    const RAR = {
      common: { label: 'Sıradan', c: '#B0C3D9', p: 10 },
      rare: { label: 'Nadir', c: '#4B69FF', p: 25 },
      epic: { label: 'Destansı', c: '#8847FF', p: 60 },
      legendary: { label: 'Efsanevi', c: '#E4AE39', p: 150 },
    };
    const T = (key, w) => ({ key, n: TITLES[key][0], r: TITLES[key][5], w });
    const P = (img, n, r, w) => ({ img, n, r, w });
    const CRATES = {
      unvan: {
        name: 'Ünvan Sandığı', count: '15 hareketli ünvan', chest: ['unvan', 300, 231],
        blurb: 'Adınızın altında duran hareketli ünvanlar. Nadir olanların kendine özel animasyonu var.',
        drops: [T('gecekusu', 40), T('kanka', 40), T('taktik', 40), T('mikrofon', 40), T('sessiz', 22), T('clutch', 22), T('carry', 22), T('rank', 22),
          T('golge', 10), T('firtina', 10), T('kozmik', 10), T('kuzgun', 10), T('efsane', 3), T('ejder', 3), T('anka', 3)],
      },
      pet: {
        name: 'Pet Sandığı', count: '18 hareketli pet', chest: ['pet', 300, 268],
        blurb: 'Bannerınızın kenarında yaşayan hareketli petler. Tekrar çıkan pet Kasa Puanı olur.',
        drops: [P('slime', 'Jöle Slime', 'common', 30), P('kapibara', 'Kapibara', 'common', 30), P('hamster', 'Tombul Hamster', 'common', 30), P('kurbaga', 'Nilüfer Kurbağa', 'common', 30),
          P('tilki', 'Tilki Yavrusu', 'rare', 20), P('panda', 'Kulaklıklı Panda', 'rare', 20), P('shiba', 'Oyuncu Shiba', 'rare', 20), P('aksolotl', 'Aksolotl', 'rare', 20), P('kizilpanda', 'Boba Panda', 'rare', 20),
          P('baykus', 'Gece Baykuşu', 'epic', 9), P('penguen', 'Atkılı Penguen', 'epic', 9), P('ejder', 'Yavru Ejder', 'epic', 9), P('cadikedi', 'Cadı Kedisi', 'epic', 9),
          P('tekir', 'Uykucu Tekir', 'epic', 7), P('kitap', 'Büyü Kitabı', 'epic', 7), P('anka', 'Yavru Anka', 'legendary', 3), P('kurt', 'Bozkurt Yavrusu', 'legendary', 3), P('balina', 'Yıldız Balinası', 'legendary', 3)],
      },
    };
    const track = $('.reel__track', box);
    const reel = $('.reel', box);
    const marker = $('.reel__marker', box);
    const btn = $('.crate__btn', box);
    const out = $('.crate__result', box);
    const tabs = $$('[data-kind]', box);
    const N = 44, WIN = 36;
    let cur = CRATES.unvan;
    const total = () => cur.drops.reduce((s, x) => s + x.w, 0);
    const pick = () => { let r = Math.random() * total(); for (const x of cur.drops) { if ((r -= x.w) < 0) return x; } return cur.drops[0]; };
    // Oranlar uygulamadaki gibi: %10'dan küçükse bir ondalık
    const pct = v => '%' + (v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v));
    const item = x => `<div class="ri" style="--rc:${RAR[x.r].c}">${x.img ? `<img src="assets/img/pet/${x.img}.webp" alt="">` : tb(x.key)}<small>${x.img ? x.n : 'Ünvan'}</small></div>`;
    const build = win => {
      const list = Array.from({ length: N }, pick);
      list[WIN] = win;
      track.innerHTML = list.map(item).join('');
      gsap.set(track, { x: 0 });
    };
    const show = kind => {
      cur = CRATES[kind];
      tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.kind === kind));
      const [img, w, h] = cur.chest;
      const chest = $('.crate__chest', box);
      Object.assign(chest, { src: `assets/img/kasa/${img}.webp`, width: w, height: h, alt: cur.name });
      $('.crate__name', box).textContent = cur.name;
      $('.crate__count', box).textContent = cur.count;
      $('.crate__blurb', box).textContent = cur.blurb;
      const sum = total();
      $('.rarity', box).innerHTML = ['common', 'rare', 'epic', 'legendary'].map(r => {
        const v = cur.drops.filter(x => x.r === r).reduce((s, x) => s + x.w, 0) / sum * 100;
        return `<li style="--rc:${RAR[r].c}">${RAR[r].label}<em>${pct(v)}</em></li>`;
      }).join('');
      out.style.removeProperty('--rc');
      out.innerHTML = '<small>Kasadan çıkan</small><b>Sandığı açmak için düğmeye basın</b>';
      build(pick());
      if (!RM) gsap.fromTo(chest, { y: 10, scale: .92, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: .6, ease: 'back.out(2)' });
    };
    build(pick());
    let spinning = false;
    const spin = forced => {
      if (spinning) return;
      spinning = true;
      btn.disabled = true;
      tabs.forEach(t => (t.disabled = true));
      const win = forced || pick();
      build(win);
      out.innerHTML = '<small>Sandık açılıyor</small><b>…</b>';
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
        tabs.forEach(t => (t.disabled = false));
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
    tabs.forEach(t => t.addEventListener('click', () => { if (!spinning && cur !== CRATES[t.dataset.kind]) show(t.dataset.kind); }));
    btn.addEventListener('click', () => spin());
    // İlk gösterim: bölüm görününce bir kez kendiliğinden açılır (destansı bir ünvan çıkar)
    if (window.ScrollTrigger && !RM) window.ScrollTrigger.create({ trigger: box, start: 'top 65%', once: true, onEnter: () => spin(cur.drops[8]) });
  }

  // Başlat: dosyanın sonunda, yukarıdaki tüm tanımlar hazır olduktan sonra
  if (!window.gsap || !window.ScrollTrigger) { showAll(); basics(null); }
  else { try { init(); } catch (e) { console.error(e); showAll(); } }
})();
