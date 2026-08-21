/* ClickAgents AI — interactions & animations */

(function () {
  'use strict';

  // -- Sticky nav state ----------------------------------------------------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // -- Reveal on scroll ----------------------------------------------------
  const reveals = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => el.classList.add('is-visible'), delay);
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach((el) => io.observe(el));

  // -- Counter animations --------------------------------------------------
  const counters = document.querySelectorAll('[data-counter]');
  const formatNum = (n, fmt) => {
    if (fmt === 'comma') return Math.round(n).toLocaleString('en-US');
    return Math.round(n).toString();
  };
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.counter);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const fmt = el.dataset.format || '';
    const dur = 1600;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = target * ease(t);
      el.textContent = prefix + formatNum(v, fmt) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + formatNum(target, fmt) + suffix;
    };
    requestAnimationFrame(tick);
  };
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => counterIO.observe(c));

  // -- Chart draw animation -----------------------------------------------
  const chart = document.querySelector('.dash__chart');
  if (chart) {
    const cIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          chart.classList.add('chart-active');
          cIO.unobserve(chart);
        });
      },
      { threshold: 0.4 }
    );
    cIO.observe(chart);
  }

  // -- Magnetic-ish CTA hover (subtle) -------------------------------------
  document.querySelectorAll('.btn--primary').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // -- Process rail: scroll-driven fill -----------------------------------
  const railList = document.querySelector('.process__list--v2');
  if (railList) {
    const updateRail = () => {
      const rect = railList.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress: 0 when top of list reaches 70% viewport; 1 when bottom reaches 30% viewport
      const start = vh * 0.7;
      const end = vh * 0.3;
      const total = (rect.height) + (start - end);
      const traveled = start - rect.top;
      const p = Math.max(0, Math.min(1, traveled / total));
      // Map progress to actual fill height in px (matches the ::after geometry)
      const fillMax = rect.height - 108; // top 54 + bottom 54
      const fillPx = Math.max(0, fillMax * p);
      railList.style.setProperty('--rail-progress', fillPx + 'px');
      if (p > 0.01 && p < 0.99) railList.classList.add('is-rail-active');
      else railList.classList.remove('is-rail-active');
    };
    updateRail();
    window.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
  }

  // -- FAQ: ensure only one open at a time --------------------------------
  const faqs = document.querySelectorAll('.faq-item');
  faqs.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
    });
  });
})();
