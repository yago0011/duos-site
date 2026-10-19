/* Coopy, yeni tasarım: canlı deste, eşleşme anı, süs vitrini, kasa şeridi. GSAP (assets/vendor) ile. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = '../assets/img/';
  const ic = id => `<svg viewBox="0 0 24 24"><use href="#${id}"/></svg>`;

  // Ünvanlar: uygulamadaki TitleBadge ile aynı renk ve seviye
  const TITLES = {
    efsane: ['Yaşayan Efsane', '#FFD36B', '#B07418', 'sparkles', 'legend', 'legendary', 'foil', null],
    ejder: ['Ejderha', '#FF7A3D', '#C0161B', 'dragon', 'legend', 'legendary', 'ember', null],
    kozmik: ['Meteor', '#FFA477', '#B04BFF', 'meteor', 'run', 'epic', null, null],
    golge: ['Hayalet', '#C9B2FF', '#6A3FD0', 'ghost', 'run', 'epic', null, null],
    sonmeyen: ['Sönmeyen Ateş', '#A6F2FF', '#5B6CFF', 'bonfire', 'run', null, 'ice', '#F2FEFF'],
    clutch: ['Clutch Kralı', '#FF9A4D', '#E2421C', 'crown', 'glint', 'rare', null, null],
    gecekusu: ['Gece Kuşu', '#A99BFF', '#5B48D6', 'moon', 'base', 'common', null, null],
  };
  const tb = key => {
    const [n, c, c2, g, tier, r, text, light] = TITLES[key];
    return `<span class="tb tb--${tier}${text ? ` tb--${text}` : ''}" style="--c:${c};--c2:${c2}${light ? `;--l:${light}` : ''}"><span class="tb__tile"><svg><use href="#g-${g}"/></svg></span><span class="tb__name">${n}</span>${r ? `<i class="tb__r tb__r--${r}"></i>` : ''}</span>`;
  };
  // Süsler: taban + yalnızca hareket eden ışık katmanı (uygulamadaki gibi); k = süsün avatara oranı
  const deco = (id, k) => `<span class="ava__deco" style="--k:${k}"><img src="${IMG}sus2/${id}.webp" alt=""><img src="${IMG}sus2/${id}-fx.webp" alt=""></span>`;
  const ava = (who, d, k) => `<span class="ava"><img class="ava__img" src="${IMG}oyuncu/${who}.webp" alt="">${d ? deco(d, k) : ''}</span>`;

  /* ================= Sahnedeki parçacıklar (profil efektleri gibi: kor, yıldız tozu, kabarcık) ================= */
  const Fx = (() => {
    const cv = $('.hero__fx');
    const api = { set() {} };
    if (!cv || RM) return api;
    const ctx = cv.getContext('2d');
    let W, H, kind = 'ember', col = '#FF7F1E';
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { W = cv.width = cv.offsetWidth * dpr; H = cv.height = cv.offsetHeight * dpr; };
    size(); addEventListener('resize', size);
    const N = innerWidth < 900 ? 26 : 46;
    const ps = Array.from({ length: N }, () => ({ x: Math.random(), y: Math.random(), v: .3 + Math.random() * .7, r: .6 + Math.random() * 1.6, ph: Math.random() * 6.28, a: 0 }));
    api.set = (k, c) => { kind = k; col = c; ps.forEach(p => { p.a = 0; }); };
    const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    let last = performance.now(), on = true;
    new IntersectionObserver(e => { on = e[0].isIntersecting; if (on) { last = performance.now(); requestAnimationFrame(tick); } }).observe(cv);
    function tick(now) {
      if (!on) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      const [r, g, b] = rgb(col);
      for (const p of ps) {
        p.a = Math.min(1, p.a + dt * .8);
        p.ph += dt * (kind === 'dust' ? 1.6 : 3);
        p.y -= dt * p.v * (kind === 'dust' ? .02 : kind === 'bubble' ? .05 : .07);
        p.x += Math.sin(p.ph) * dt * .008;
        if (p.y < -.05) { p.y = 1.05; p.x = Math.random(); }
        // sahnenin sağ yarısında yoğun (deste orada)
        const x = (innerWidth < 900 ? p.x : .35 + p.x * .65) * W, y = p.y * H, s = p.r * dpr * (kind === 'bubble' ? 2.6 : 1);
        const tw = kind === 'dust' ? .35 + .65 * Math.abs(Math.sin(p.ph * .8)) : kind === 'ember' ? .6 + .4 * Math.sin(p.ph * 2.3) : .8;
        const al = p.a * tw * (y / H < .15 ? y / H / .15 : 1);
        if (kind === 'bubble') {
          ctx.strokeStyle = `rgba(${r},${g},${b},${al * .7})`; ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.arc(x, y, s, 0, 6.283); ctx.stroke();
        } else {
          const gr = ctx.createRadialGradient(x, y, 0, x, y, s * 5);
          gr.addColorStop(0, `rgba(255,255,255,${al})`); gr.addColorStop(.18, `rgba(${r},${g},${b},${al * .9})`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, s * 5, 0, 6.283); ctx.fill();
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return api;
  })();

  /* ================= Deste ================= */
  const PLAYERS = [
    { who: 'kira', name: 'Kira', age: 21, deco: 'abyss-lure', k: 1.66, title: 'sonmeyen', banner: 'oda', meta: 'Türkiye · Yazılı · Rekabetçi', bio: '“Hafta sonu gece oynuyorum, sessiz ama düzenli.”', games: [['CS2', 'Premier 14.000']], fit: 58, color: '#59E5FF', fx: 'bubble', act: 'no' },
    { who: 'zeynep', name: 'Zeynep', age: 22, deco: 'cosmic-eye', k: 1.56, title: 'kozmik', banner: 'aurora', meta: 'Türkiye · Discord sesli · Rekabetçi', bio: '“Kontrol oynuyorum. Sakin iletişim, net bilgi.”', games: [['Valorant', 'Elmas 1'], ['LoL', 'Altın']], fit: 91, color: '#B58CFF', fx: 'dust', act: 'match' },
    { who: 'emre', name: 'Emre', age: 24, deco: 'dragon-ember', k: 1.43, title: 'ejder', banner: 'sehir', meta: 'Türkiye · Oyun içi sesli · Eğlencesine', bio: '“Support arıyorum, ben ADC. Akşamları aktifim.”', games: [['LoL', 'Zümrüt'], ['Fortnite', '']], fit: 76, color: '#FF7F1E', fx: 'ember', act: 'duo' },
  ];
  const ME = { who: 'deniz', deco: 'crimson-oni', k: 1.4 };
  const cardHTML = p => `
    <article class="card" style="--c:${p.color}">
      <span class="stamp stamp--duo">DUO</span><span class="stamp stamp--no">GEÇ</span>
      <div class="card__banner"><img src="${IMG}banner/${p.banner}.webp" alt=""></div>
      <div class="card__body">
        ${ava(p.who, p.deco, p.k)}
        <div class="card__name">${p.name}<small>${p.age}</small></div>
        ${tb(p.title)}
        <div class="card__meta">${p.meta}</div>
        <p class="card__bio">${p.bio}</p>
        <div class="card__games">${p.games.map(([g, r]) => `<span><b>${g}</b>${r ? ` · ${r}` : ''}</span>`).join('')}</div>
      </div>
      <div class="card__fit">Uyum<span class="bar" style="--fit:${p.fit}%"><i></i></span><b>%${p.fit}</b></div>
    </article>`;

  const hero = $('.hero');
  const deck = $('.deck');
  if (deck) {
    deck.insertAdjacentHTML('afterbegin', PLAYERS.map(cardHTML).join(''));
    let cards = $$('.card', deck).map((el, i) => ({ el, p: PLAYERS[i] }));
    const btnNo = $('.deck__actions span:first-child', deck);
    const btnYes = $('.deck__actions span:last-child', deck);
    const pos = k => ({ x: 0, y: k * 18, scale: 1 - k * .055, rotation: 0, filter: `brightness(${1 - k * .22})`, zIndex: 10 - k });
    const layout = (d = 0) => cards.forEach(({ el }, k) => gsap.to(el, { ...pos(k), duration: d, ease: 'power3.out', overwrite: 'auto' }));
    const setTone = p => { hero.style.setProperty('--glow', p.color); Fx.set(p.fx, p.color); };
    layout(); setTone(cards[0].p);

    const m = $('.match', deck);
    const matchTl = p => {
      $('.match__pair', m).innerHTML = ava(ME.who, ME.deco, ME.k) + ava(p.who, p.deco, p.k);
      $('.match__sub', m).textContent = `${p.name} de seninle oynamak istiyor`;
      const [a, b] = $$('.match__pair .ava', m);
      const ring = $('.match__ring', m);
      const typing = $('.bubble.typing', m);
      const msg = $('.bubble.msg', m);
      return gsap.timeline()
        .set(m, { opacity: 1 })
        .fromTo($('.match__bg', m), { opacity: 0 }, { opacity: 1, duration: .3 })
        .fromTo(a, { x: -150, rotation: -14, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: .55, ease: 'back.out(1.6)' }, '<.05')
        .fromTo(b, { x: 150, rotation: 14, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: .55, ease: 'back.out(1.6)' }, '<')
        .fromTo(ring, { scale: .7, opacity: .9 }, { scale: 2.6, opacity: 0, duration: 1.1, ease: 'power2.out' }, '-=.15')
        .fromTo($('.match__title', m), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out' }, '<.05')
        .fromTo($('.match__sub', m), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, '<.1')
        .fromTo(typing, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .3 }, '+=.2')
        .to(typing, { opacity: 0, duration: .15 }, '+=1.1')
        .set(typing, { display: 'none' })
        .set(msg, { display: 'block' })
        .fromTo(msg, { y: 10, opacity: 0, scale: .9 }, { y: 0, opacity: 1, scale: 1, duration: .35, ease: 'back.out(2)' })
        .to(m, { opacity: 0, duration: .4 }, '+=1.9')
        .set(typing, { display: 'flex' })
        .set(msg, { display: 'none' });
    };

    const swipe = () => {
      const { el, p } = cards[0];
      const yes = p.act !== 'no';
      const dir = yes ? 1 : -1;
      const tl = gsap.timeline({ onComplete: () => {
        cards.push(cards.shift());
        gsap.set(el, { ...pos(cards.length - 1), opacity: 0 });
        gsap.set($$('.stamp', el), { opacity: 0 });
        gsap.to(el, { opacity: 1, duration: .4, delay: .1 });
        setTimeout(swipe, p.act === 'match' ? 900 : 1500);
      } });
      tl.to(el, { rotation: -2.5 * dir, x: -12 * dir, duration: .55, ease: 'sine.inOut' }, 1.1)
        .to(el, { rotation: 2 * dir, x: 10 * dir, duration: .5, ease: 'sine.inOut' })
        .call(() => { (yes ? btnYes : btnNo).classList.remove('is-press'); void deck.offsetWidth; (yes ? btnYes : btnNo).classList.add('is-press'); })
        .fromTo($(yes ? '.stamp--duo' : '.stamp--no', el), { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: .22, ease: 'back.out(2)' })
        .to(el, { x: 640 * dir, y: -60, rotation: 24 * dir, duration: .7, ease: 'power2.in' }, '+=.25')
        .call(() => { const rest = cards.slice(1); rest.forEach(({ el: e }, k) => gsap.to(e, { ...pos(k), duration: .55, ease: 'power3.out' })); setTone(cards[1].p); }, null, '-=.35');
      if (p.act === 'match') tl.add(matchTl(p), '-=.1');
    };
    if (!RM) setTimeout(swipe, 900);
  }

  /* ================= Giriş yazısı: satırlar alttan kayar (yalnızca açılışta) ================= */
  if (!RM && window.gsap) {
    gsap.from('.h1 .ln > span', { yPercent: 110, duration: 1, ease: 'power4.out', stagger: .09, delay: .1 });
    gsap.from('.hero__lead, .hero__cta, .hero__games', { y: 18, opacity: 0, duration: .8, ease: 'power3.out', stagger: .08, delay: .45 });
    gsap.from('.deck', { y: 40, opacity: 0, rotation: 4, duration: 1.1, ease: 'power3.out', delay: .3 });
  }

  /* ================= Vitrin ================= */
  const DECOS = [
    ['dragon-ember', 'Kor Ejderi', 'Kor Ejderi', '99,99', '#FF7F1E', 1.43],
    ['cosmic-eye', 'Kozmik Göz', 'Kozmik Göz', '99,99', '#B58CFF', 1.56],
    ['abyss-lure', 'Derin Fener', 'Derin Deniz', '99,99', '#59E5FF', 1.66],
    ['crimson-oni', 'Kızıl Oni', 'Kızıl Oni', '99,99', '#FF2D4B', 1.4],
    ['sakura-dream', 'Sakura Rüyası', 'Sakura Rüyası', '94,99', '#FFB7D5', 1.4],
    ['phoenix-plume', 'Anka Tüyü', 'Küllerden Doğan', '99,99', '#FF9A3C', 1.4],
    ['night-wings', 'Gece Kanatları', 'Gece Yarısı Balosu', '99,99', '#C07BFF', 1.4],
    ['frost-tiara', 'Buz Tacı', 'Ayaz Sarayı', '94,99', '#9FE3FF', 1.4],
    ['rune-ring', 'Rün Çemberi', 'Taşların Fısıltısı', '99,99', '#5AF0FF', 1.4],
    ['gold-crown', 'Altın Taç', 'Taht ve Taç', '99,99', '#FFD27A', 1.4],
    ['moon-rose', 'Ay Gülü', 'Ay Işığında Güller', '89,99', '#D9D3FF', 1.4],
    ['flame-sword', 'Alev Kılıcı', 'Kordan Dövülmüş', '99,99', '#FF8A2A', 1.4],
  ];
  const vit = $('.showcase');
  if (vit) {
    const stage = $('.stage', vit), thumbs = $('.thumbs', vit);
    thumbs.innerHTML = DECOS.map(([id, n, , , c], i) => `<button class="thumb" style="--tc:${c}" type="button" aria-label="${n}" data-i="${i}"><img src="${IMG}sus2/${id}-still.webp" alt="" loading="lazy"><span class="t"></span></button>`).join('');
    let cur = -1, timer;
    const show = i => {
      if (i === cur) return;
      cur = i;
      const [id, n, coll, price, c, k] = DECOS[i];
      stage.style.setProperty('--sc', c);
      const old = $('.ava__deco', stage);
      const nd = document.createElement('span');
      nd.innerHTML = deco(id, k); const el = nd.firstChild;
      $('.ava', stage).appendChild(el);
      if (old) gsap.to(old, { opacity: 0, scale: .9, duration: .35, onComplete: () => old.remove() });
      gsap.fromTo(el, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out' });
      const info = $('.stage__info', stage);
      info.innerHTML = `<b>${n}</b><span>${coll} koleksiyonu</span>`;
      gsap.fromTo(info.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .06, ease: 'power3.out' });
      $('.price b', vit).textContent = `${price} ₺`;
      $$('.thumb', thumbs).forEach((t, j) => { t.classList.toggle('on', j === i); });
      clearTimeout(timer); if (!RM) timer = setTimeout(() => show((cur + 1) % DECOS.length), 3600);
    };
    thumbs.addEventListener('click', e => { const t = e.target.closest('.thumb'); if (t) show(+t.dataset.i); });
    show(0);
  }

  /* ================= Kasa şeridi (CS2 gibi): görünür olunca kendiliğinden döner ================= */
  const RAR = { common: ['Sıradan', '#B0C3D9'], rare: ['Nadir', '#4B69FF'], epic: ['Destansı', '#8847FF'], legendary: ['Efsanevi', '#E4AE39'] };
  const PETS = [['slime', 'Jöle Slime', 'common', 30], ['kapibara', 'Kapibara', 'common', 30], ['hamster', 'Tombul Hamster', 'common', 30], ['kurbaga', 'Nilüfer Kurbağa', 'common', 30],
    ['tilki', 'Tilki Yavrusu', 'rare', 20], ['panda', 'Kulaklıklı Panda', 'rare', 20], ['shiba', 'Oyuncu Shiba', 'rare', 20], ['aksolotl', 'Aksolotl', 'rare', 20], ['kizilpanda', 'Boba Panda', 'rare', 20],
    ['baykus', 'Gece Baykuşu', 'epic', 9], ['penguen', 'Atkılı Penguen', 'epic', 9], ['ejder', 'Yavru Ejder', 'epic', 9], ['cadikedi', 'Cadı Kedisi', 'epic', 9],
    ['tekir', 'Uykucu Tekir', 'epic', 7], ['kitap', 'Büyü Kitabı', 'epic', 7], ['anka', 'Yavru Anka', 'legendary', 3], ['kurt', 'Bozkurt Yavrusu', 'legendary', 3], ['balina', 'Yıldız Balinası', 'legendary', 3]];
  const crate = $('.crate');
  if (crate) {
    const total = PETS.reduce((s, x) => s + x[3], 0);
    const pct = v => '%' + (v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v));
    $('.rar', crate).innerHTML = Object.entries(RAR).map(([r, [n, c]]) => `<span style="--r:${c}">${n} ${pct(PETS.filter(x => x[2] === r).reduce((s, x) => s + x[3], 0) / total * 100)}</span>`).join('');
    const pick = () => { let r = Math.random() * total; for (const x of PETS) { if ((r -= x[3]) < 0) return x; } return PETS[0]; };
    const track = $('.strip__track', crate), strip = $('.strip', crate), res = $('.crate__res', crate);
    const N = 46, WIN = 38;
    const item = x => `<div class="it" style="--r:${RAR[x[2]][1]}"><img src="${IMG}pet/${x[0]}.webp" alt="" loading="lazy"><small>${x[1]}</small></div>`;
    let spinning = false, rounds = 0;
    const spin = () => {
      if (spinning) return; spinning = true;
      // Tanıtımda ilk çevirmede efsanevi, sonra gerçek oranlarla
      const win = rounds++ === 0 ? PETS.find(x => x[0] === 'balina') : pick();
      const list = Array.from({ length: N }, pick); list[WIN] = win;
      track.innerHTML = list.map(item).join('');
      const it = track.children[0];
      const w = it.offsetWidth + 12;
      const target = WIN * w + it.offsetWidth / 2 - strip.offsetWidth / 2 + (Math.random() - .5) * it.offsetWidth * .7;
      res.innerHTML = '<small>Çevriliyor</small><b>&nbsp;</b>';
      gsap.fromTo(track, { x: 0 }, { x: -target, duration: RM ? 0 : 6, ease: 'power4.out', onComplete: () => {
        const el = track.children[WIN];
        el.classList.add('win');
        res.innerHTML = `<small style="color:${RAR[win[2]][1]}">${RAR[win[2]][0]}</small><b>${win[1]}</b>`;
        gsap.fromTo(res.children, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .06 });
        spinning = false;
        if (!RM) setTimeout(spin, 4200);
      } });
    };
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { o.disconnect(); spin(); } }, { threshold: .4 }).observe(crate);
  }

  /* üst çubuk */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 30);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
