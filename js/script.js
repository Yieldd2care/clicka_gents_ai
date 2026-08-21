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

  // -- Calendly booking popup -----------------------------------------------
  const CALENDLY_URL = 'https://calendly.com/clickagents-ai/ai-solutions-for-business';
  document.querySelectorAll('.btn--primary').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        if (typeof Calendly === 'undefined') throw new Error('Calendly widget script did not load');
        Calendly.initPopupWidget({ url: CALENDLY_URL });
      } catch (err) {
        // Widget script blocked/failed (ad-blocker, offline, etc.) — open Calendly directly instead.
        window.open(CALENDLY_URL, '_blank', 'noopener');
      }
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

  // -- Calendar widget ----------------------------------------------------
  const calGrid = document.getElementById('calGrid');
  if (calGrid) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minYear = today.getFullYear();
    const minMonth = today.getMonth();

    // Start one month ahead for fresh-looking availability
    let dispYear = minYear;
    let dispMonth = minMonth + 1;
    if (dispMonth > 11) { dispMonth = 0; dispYear++; }

    const monthLbl = document.querySelector('.cal__monthlbl');
    const prevBtn = document.querySelector('.cal__nav[aria-label="Previous month"]');
    const nextBtn = document.querySelector('.cal__nav[aria-label="Next month"]');

    const renderCalendar = () => {
      const dispDate = new Date(dispYear, dispMonth, 1);
      if (monthLbl) {
        monthLbl.textContent = dispDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }

      const firstDay = (dispDate.getDay() + 6) % 7; // Mon=0
      const daysInMonth = new Date(dispYear, dispMonth + 1, 0).getDate();
      const prevMonthDays = new Date(dispYear, dispMonth, 0).getDate();

      let html = '';
      for (let i = firstDay - 1; i >= 0; i--) {
        html += `<button class="cal-day is-muted" tabindex="-1">${prevMonthDays - i}</button>`;
      }
      let defaultActiveSet = false;
      for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(dispYear, dispMonth, d);
        const dow = cellDate.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isPast = cellDate < today;
        const cls = ['cal-day'];
        if (isWeekend || isPast) cls.push('is-disabled');
        if (cellDate.getTime() === today.getTime()) cls.push('is-today');
        if (!defaultActiveSet && !isWeekend && !isPast) {
          cls.push('is-active');
          defaultActiveSet = true;
        }
        html += `<button class="${cls.join(' ')}">${d}</button>`;
      }
      const totalCells = firstDay + daysInMonth;
      const trail = (7 - (totalCells % 7)) % 7;
      for (let i = 1; i <= trail; i++) {
        html += `<button class="cal-day is-muted" tabindex="-1">${i}</button>`;
      }
      calGrid.innerHTML = html;

      if (prevBtn) {
        const atMin = dispYear === minYear && dispMonth === minMonth;
        prevBtn.disabled = atMin;
        prevBtn.classList.toggle('is-disabled', atMin);
      }
    };

    calGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.cal-day');
      if (!btn || btn.classList.contains('is-muted') || btn.classList.contains('is-disabled')) return;
      calGrid.querySelectorAll('.cal-day.is-active').forEach((d) => d.classList.remove('is-active'));
      btn.classList.add('is-active');
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (prevBtn.disabled) return;
        dispMonth--;
        if (dispMonth < 0) { dispMonth = 11; dispYear--; }
        renderCalendar();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        dispMonth++;
        if (dispMonth > 11) { dispMonth = 0; dispYear++; }
        renderCalendar();
      });
    }

    renderCalendar();

    document.querySelectorAll('.cal__slots .slot').forEach((slot) => {
      slot.addEventListener('click', () => {
        document.querySelectorAll('.cal__slots .slot').forEach((s) => s.classList.remove('slot--active'));
        slot.classList.add('slot--active');
      });
    });
  }

  // -- FAQ: ensure only one open at a time --------------------------------
  const faqs = document.querySelectorAll('.faq-item');
  faqs.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
    });
  });
})();
