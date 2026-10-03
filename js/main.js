// Progressive enhancement only: the page works fully without this file.
(() => {
  document.documentElement.classList.remove('no-js');

  // ----- Highlight the nav link for the section in view -----
  const links = [...document.querySelectorAll('.nav-links a')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove('active'));
        byId.get(e.target.id)?.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // ----- Career cards: one details panel open at a time -----
  const careerCards = [...document.querySelectorAll('.career-card')];
  const panelFor = (card) => document.getElementById(card.getAttribute('aria-controls'));
  careerCards.forEach((card) => { panelFor(card).hidden = true; });
  careerCards.forEach((card) => card.addEventListener('click', () => {
    const opening = card.getAttribute('aria-expanded') !== 'true';
    careerCards.forEach((c) => {
      c.setAttribute('aria-expanded', 'false');
      panelFor(c).hidden = true;
    });
    if (opening) {
      card.setAttribute('aria-expanded', 'true');
      panelFor(card).hidden = false;
    }
  }));

  // ----- "In the news" story cards -----
  const news = document.querySelector('.news');
  if (news) {
    const track = news.querySelector('.news-track');
    const cards = [...track.querySelectorAll('.news-card')];
    const prev = news.querySelector('.news-prev');
    const next = news.querySelector('.news-next');
    const count = news.querySelector('.news-count');
    const dots = cards.map(() => news.querySelector('.news-dots').appendChild(document.createElement('span')));
    let current = -1;
    const setCurrent = (i) => {
      if (i === current) return;
      current = i;
      count.textContent = `${i + 1} / ${cards.length}`;
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    // Ignore intermediate positions while an arrow-triggered scroll animates.
    let settling = false;
    let settleTimer;
    const settle = () => { settling = false; clearTimeout(settleTimer); };
    track.addEventListener('scrollend', settle);
    const goTo = (i) => {
      const target = Math.max(0, Math.min(cards.length - 1, i));
      settling = true;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 900);
      setCurrent(target);
      track.scrollTo({ left: target * track.clientWidth });
    };
    track.addEventListener('scroll', () => {
      if (!settling) setCurrent(Math.round(track.scrollLeft / track.clientWidth));
    }, { passive: true });
    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });
    window.addEventListener('resize', () => {
      track.style.scrollBehavior = 'auto';
      track.scrollTo({ left: current * track.clientWidth });
      track.style.scrollBehavior = '';
    });
    setCurrent(0);
  }

  // ----- Carousels (photos and book slides) -----
  // Each .carousel scrolls with CSS scroll-snap; this adds arrows, counter, caption,
  // optional thumbnails, and hands off to the shared full-screen viewer.
  const setupCarousel = (root) => {
    const track = root.querySelector('.car-track');
    const slides = [...track.querySelectorAll('.car-slide')];
    const thumbs = [...root.querySelectorAll('.car-thumb')];
    const prevBtn = root.querySelector('.car-prev');
    const nextBtn = root.querySelector('.car-next');
    const captionEl = root.querySelector('.car-caption');
    const countEl = root.querySelector('.car-count');
    const altOf = (i) => slides[i].querySelector('img').alt;
    const fullSrc = (i) => slides[i].querySelector('a').href;
    let current = -1;

    // While an arrow/thumbnail scroll is animating, ignore intermediate slides.
    let settling = false;
    let settleTimer;
    const settle = () => { settling = false; clearTimeout(settleTimer); };
    track.addEventListener('scrollend', settle);

    const setCurrent = (i) => {
      if (i === current) return;
      current = i;
      captionEl.textContent = altOf(i);
      countEl.textContent = `${i + 1} / ${slides.length}`;
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
      if (!thumbs.length) return;
      thumbs.forEach((t, k) => t.setAttribute('aria-current', k === i ? 'true' : 'false'));
      // Keep the active thumbnail in view without moving the page vertically.
      const strip = thumbs[i].parentElement;
      const t = thumbs[i];
      strip.scrollTo({ left: t.offsetLeft - strip.offsetLeft - (strip.clientWidth - t.clientWidth) / 2, behavior: 'smooth' });
    };

    const goTo = (i, instant = false) => {
      const target = Math.max(0, Math.min(slides.length - 1, i));
      settling = true;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 900); // fallback where scrollend is unsupported
      setCurrent(target);
      if (instant) track.style.scrollBehavior = 'auto';
      track.scrollTo({ left: target * track.clientWidth });
      if (instant) track.style.scrollBehavior = '';
    };

    // Track which slide is showing after swipes, trackpad scrolls and keyboard scrolling.
    track.addEventListener('scroll', () => {
      if (!settling) setCurrent(Math.round(track.scrollLeft / track.clientWidth));
    }, { passive: true });

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));
    thumbs.forEach((t, i) => t.addEventListener('click', () => goTo(i)));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1); }
    });
    // Keep the same slide in place when the window is resized or rotated.
    window.addEventListener('resize', () => goTo(current, true));
    setCurrent(0);

    return { track, slides, altOf, fullSrc, goTo };
  };

  const carousels = [...document.querySelectorAll('.carousel')].map(setupCarousel);

  // ----- Full-screen viewer (shared by all carousels) -----
  const dialog = document.querySelector('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('.lb-img');
  const caption = dialog.querySelector('.lb-caption');
  let active = null;
  let index = 0;

  const show = (i) => {
    const n = active.slides.length;
    index = (i + n) % n;
    img.src = active.fullSrc(index);
    img.alt = active.altOf(index);
    caption.textContent = `${active.altOf(index)} · ${index + 1} / ${n}`;
    // Warm the cache for the neighbours so arrowing feels instant.
    [index + 1, index - 1].forEach((k) => {
      new Image().src = active.fullSrc((k + n) % n);
    });
  };

  carousels.forEach((c) => c.slides.forEach((s, i) => s.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    active = c;
    show(i);
    dialog.showModal();
  })));

  dialog.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());

  // Close when clicking the dark area outside the image.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.tagName === 'FIGURE') dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  // Return to the carousel on the slide last viewed full screen.
  dialog.addEventListener('close', () => {
    if (!active) return;
    active.goTo(index, true);
    active.track.focus({ preventScroll: true });
  });

  // Swipe on touch screens.
  let startX = null;
  dialog.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
