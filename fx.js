(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  // header turns solid on scroll
  const header = document.querySelector('header');
  const onScroll = () => header && header.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // reveal on scroll
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 }) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  // film grain layer
  const g = document.createElement('div'); g.className = 'grain'; document.body.appendChild(g);

  // custom cursor
  let mx = innerWidth / 2, my = innerHeight / 2;
  if (fine && !reduce) {
    document.documentElement.classList.add('has-cursor');
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate3d(${mx}px,${my}px,0)`; }, { passive: true });
    document.addEventListener('mouseover', e => ring.classList.toggle('hover', !!e.target.closest('a,button,.card')));
    document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = 1; });
    (function loop() { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = `translate3d(${rx}px,${ry}px,0)`; requestAnimationFrame(loop); })();
  }

  // hero: lantern + fog + embers
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const lantern = hero.querySelector('.lantern');
  let lx = 0.5, ly = 0.45, tx = 0.5, ty = 0.45, lastMove = 0;
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; lastMove = performance.now();
  }, { passive: true });

  const cv = hero.querySelector('canvas'), ctx = cv.getContext('2d');
  let W, H, DPR = Math.min(devicePixelRatio || 1, 2);
  const size = () => { W = hero.clientWidth; H = hero.clientHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
  size(); addEventListener('resize', size);

  const fog = Array.from({ length: 9 }, () => ({ x: Math.random(), y: 0.45 + Math.random() * 0.55, r: 0.25 + Math.random() * 0.35, v: (Math.random() * 0.4 + 0.15) * (Math.random() < .5 ? -1 : 1) / 1000, a: 0.05 + Math.random() * 0.06 }));
  const embers = Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), v: 0.0004 + Math.random() * 0.0009, s: 0.6 + Math.random() * 1.6, p: Math.random() * 6.28 }));

  let visible = true;
  if (io) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    // idle lantern drifts on its own (also the behaviour on touch screens)
    if (!fine || t - lastMove > 2500) { tx = 0.5 + Math.sin(t / 3200) * 0.26; ty = 0.42 + Math.sin(t / 2300) * 0.1; }
    lx += (tx - lx) * 0.06; ly += (ty - ly) * 0.06;
    lantern.style.setProperty('--lx', (lx * 100).toFixed(2) + '%');
    lantern.style.setProperty('--ly', (ly * 100).toFixed(2) + '%');

    ctx.clearRect(0, 0, W, H);
    for (const f of fog) {
      f.x += f.v; if (f.x < -0.4) f.x = 1.4; if (f.x > 1.4) f.x = -0.4;
      const gx = f.x * W, gy = f.y * H, gr = f.r * Math.max(W, H);
      const gr2 = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      gr2.addColorStop(0, `rgba(170,185,190,${f.a})`); gr2.addColorStop(1, 'rgba(170,185,190,0)');
      ctx.fillStyle = gr2; ctx.fillRect(0, 0, W, H);
    }
    for (const e of embers) {
      e.y -= e.v; e.p += 0.02; if (e.y < -0.05) { e.y = 1.05; e.x = Math.random(); }
      const ex = (e.x + Math.sin(e.p) * 0.01) * W, ey = e.y * H;
      const d = Math.hypot(e.x - lx, (e.y - ly) * H / W);
      const glow = Math.max(0.15, 1 - d * 2.2);
      ctx.fillStyle = `rgba(255,${170 + (e.s * 20) | 0},100,${0.55 * glow})`;
      ctx.beginPath(); ctx.arc(ex, ey, e.s, 0, 6.283); ctx.fill();
    }
  }
  if (!reduce) requestAnimationFrame(frame);
})();
