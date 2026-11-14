/* Gays Against Groomers — site interactions. No dependencies. */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 860px)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Header state + mobile navigation ------------------------------------ */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-stuck', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('.nav-toggle');
  const links = $('.nav-links');
  if (toggle && links) {
    const set = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); } });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    matchMedia('(min-width: 1081px)').addEventListener('change', () => set(false));
  }

  /* Reveal on scroll ----------------------------------------------------- */
  const revealables = $$('[data-reveal], .split-words');
  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach((el) => io.observe(el));
  }

  /* Hero ribbon: a slow spectrum of light travelling through darkness ----- */
  const stage = $('.hero-stage');
  if (stage) {
    const core = $('canvas.core', stage);
    const glow = $('canvas.glow', stage);
    const ctx = core.getContext('2d');
    const gctx = glow.getContext('2d');
    const colors = ['#f0407f', '#9b5cf6', '#5f62f2', '#3f8cff', '#2fd0ea', '#5fe08a', '#ffd23a', '#ff8a34'];
    const strands = small ? 14 : 30;
    let w = 0, h = 0, dpr = 1, running = false, visible = true, last = 0, raf = 0;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5);
      w = stage.clientWidth; h = stage.clientHeight;
      core.width = w * dpr; core.height = h * dpr;
      glow.width = Math.max(1, Math.round(w / 4)); glow.height = Math.max(1, Math.round(h / 4));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    const gradient = (shift) => {
      const g = ctx.createLinearGradient(-w * 0.1, 0, w * 1.1, 0);
      const n = colors.length;
      for (let i = 0; i <= n; i++) {
        const pos = i / n;
        const idx = (i + Math.floor(shift)) % n;
        g.addColorStop(pos, colors[idx]);
      }
      return g;
    };

    function draw(t) {
      if (!w || !h || !core.width || !core.height) return;
      const T = t * 0.00009;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = gradient(0);
      const mid = h * (small ? 0.34 : 0.52);
      const amp = h * (small ? 0.1 : 0.16);
      const step = small ? 28 : 20;
      for (let i = 0; i < strands; i++) {
        const o = i / (strands - 1) - 0.5;            // -0.5 … 0.5 across the ribbon
        ctx.beginPath();
        for (let x = -w * 0.1; x <= w * 1.1; x += step) {
          const u = x / w;
          // ribbon centre line: two slow travelling waves
          const c = mid + Math.sin(u * 3.1 + T * 1.3) * amp + Math.sin(u * 1.4 - T * 0.8 + 1.7) * amp * 0.7;
          // ribbon width breathes and twists, so strands cross like folded silk
          const width = (Math.sin(u * 2.3 - T * 1.1) * 0.75 + 0.25) * h * (small ? 0.09 : 0.15);
          const y = c + o * width + Math.sin(u * 7 + o * 5 + T * 2) * 3;
          x === -w * 0.1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const edge = 1 - Math.abs(o) * 1.5;
        ctx.globalAlpha = 0.16 + edge * 0.34;
        ctx.lineWidth = i % 5 === 0 ? 1.6 : 0.8;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      gctx.clearRect(0, 0, glow.width, glow.height);
      gctx.drawImage(core, 0, 0, glow.width, glow.height);
    }

    const loop = (t) => {
      if (!running) return;
      if (t - last > 32) { draw(t); last = t; }       // ~30fps is plenty for slow light
      raf = requestAnimationFrame(loop);
    };
    const sync = () => {
      const should = visible && !document.hidden && !reduce;
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
    };
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(stage);
    document.addEventListener('visibilitychange', sync);
    resize(); sync();
  }

  /* Gentle parallax for ambient lights + hero logo ------------------------ */
  const par = $$('[data-parallax]');
  if (par.length && !reduce && !small) {
    let ticking = false;
    const update = () => {
      par.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translate3d(0, ${(p * Number(el.dataset.parallax || 40)).toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* Minimal cursor light (desktop, fine pointers only) -------------------- */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches && !small) {
    const light = document.createElement('div');
    light.className = 'cursor-light';
    light.setAttribute('aria-hidden', 'true');
    document.body.appendChild(light);
    let x = 0, y = 0, tx = 0, ty = 0, on = false, moving = false;
    const tick = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      light.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) requestAnimationFrame(tick); else moving = false;
    };
    addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; x = tx; y = ty; light.classList.add('is-on'); }
      if (!moving) { moving = true; requestAnimationFrame(tick); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { on = false; light.classList.remove('is-on'); });
  }

  /* Filter + search (newsroom, resources) --------------------------------- */
  $$('[data-filter-scope]').forEach((scope) => {
    const items = $$('[data-item]', scope);
    const chips = $$('.chip', scope);
    const input = $('input[type="search"]', scope);
    const empty = $('.empty', scope);
    const count = $('[data-count]', scope);
    const more = $('[data-more]', scope);
    const pageSize = Number(scope.dataset.pageSize) || Infinity;
    let kind = 'all';
    let limit = pageSize;
    const apply = () => {
      const q = (input ? input.value : '').trim().toLowerCase();
      let matched = 0;
      items.forEach((el) => {
        const ok = (kind === 'all' || el.dataset.kind === kind) && (!q || el.dataset.search.includes(q));
        if (ok) matched++;
        el.hidden = !ok || matched > limit;
        if (!el.hidden) el.classList.add('is-in');
      });
      if (empty) empty.hidden = matched > 0;
      if (count) count.textContent = matched > limit ? `Showing ${limit} of ${matched}` : `${matched} ${matched === 1 ? 'result' : 'results'}`;
      if (more) more.hidden = matched <= limit;
    };
    chips.forEach((c) => c.addEventListener('click', () => {
      kind = c.dataset.kind;
      limit = pageSize;
      chips.forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
      apply();
    }));
    if (input) input.addEventListener('input', () => { limit = pageSize; apply(); });
    if (more) more.addEventListener('click', () => { limit += pageSize; apply(); });
    const param = new URLSearchParams(location.search).get('q');
    if (param && input) input.value = param;
    apply();
  });

  /* Forms ------------------------------------------------------------------ */
  $$('form[data-form]').forEach((form) => {
    const status = $('.form-status', form.parentElement);
    const say = (state, msg) => { status.hidden = false; status.dataset.state = state; status.textContent = msg; status.focus(); };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (form.elements._gotcha && form.elements._gotcha.value) return;   // honeypot
      const endpoint = form.dataset.endpoint;
      if (!endpoint) {
        say('error', 'This form is not connected to a delivery service yet, so nothing was sent. Please reach us through one of the channels listed on this page.');
        return;
      }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        say('ok', 'Thank you. Your message was sent.');
      } catch (err) {
        say('error', 'Something went wrong and your message was not sent. Please try again.');
      } finally { btn.disabled = false; }
    });
  });

  /* Share: copy link -------------------------------------------------------- */
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const original = btn.textContent;
    try { await navigator.clipboard.writeText(btn.dataset.copy || location.href); btn.textContent = 'Copied'; }
    catch (e) { btn.textContent = 'Copy failed'; }
    setTimeout(() => { btn.textContent = original; }, 1800);
  }));
})();
