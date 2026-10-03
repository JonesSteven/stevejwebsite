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

  // ----- Photo carousel -----
  const track = document.querySelector('.car-track');
  if (!track) return;
  const slides = [...track.querySelectorAll('.car-slide')];
  const thumbs = [...document.querySelectorAll('.car-thumb')];
  const prevBtn = document.querySelector('.car-prev');
  const nextBtn = document.querySelector('.car-next');
  const captionEl = document.querySelector('.car-caption');
  const countEl = document.querySelector('.car-count');
  const altOf = (i) => slides[i].querySelector('img').alt;
  let current = -1;

  // While an arrow/thumbnail scroll is animating, ignore intermediate slides.
  let settling = false;
  let settleTimer;
  const settle = () => { settling = false; clearTimeout(settleTimer); };
  track.addEventListener('scrollend', settle);

  const goTo = (i) => {
    const target = Math.max(0, Math.min(slides.length - 1, i));
    settling = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 900); // fallback where scrollend is unsupported
    setCurrent(target);
    track.scrollTo({ left: target * track.clientWidth });
  };

  const setCurrent = (i) => {
    if (i === current) return;
    current = i;
    captionEl.textContent = altOf(i);
    countEl.textContent = `${i + 1} / ${slides.length}`;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === slides.length - 1;
    thumbs.forEach((t, k) => t.setAttribute('aria-current', k === i ? 'true' : 'false'));
    // Keep the active thumbnail in view without moving the page vertically.
    const strip = thumbs[i].parentElement;
    const t = thumbs[i];
    strip.scrollTo({ left: t.offsetLeft - strip.offsetLeft - (strip.clientWidth - t.clientWidth) / 2, behavior: 'smooth' });
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
  // Keep the same photo in place when the window is resized or rotated.
  window.addEventListener('resize', () => {
    track.style.scrollBehavior = 'auto';
    goTo(current);
    track.style.scrollBehavior = '';
  });
  setCurrent(0);

  // ----- Full-screen viewer -----
  const dialog = document.querySelector('.lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector('.lb-img');
  const caption = dialog.querySelector('.lb-caption');
  const fullSrc = (i) => slides[i].querySelector('a').href;
  let index = 0;

  const show = (i) => {
    index = (i + slides.length) % slides.length;
    img.src = fullSrc(index);
    img.alt = altOf(index);
    caption.textContent = `${altOf(index)} · ${index + 1} / ${slides.length}`;
    // Warm the cache for the neighbours so arrowing feels instant.
    [index + 1, index - 1].forEach((n) => {
      new Image().src = fullSrc((n + slides.length) % slides.length);
    });
  };

  slides.forEach((s, i) => s.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    show(i);
    dialog.showModal();
  }));

  dialog.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  dialog.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  dialog.querySelector('.lb-close').addEventListener('click', () => dialog.close());

  // Close when clicking the dark area outside the photo.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.tagName === 'FIGURE') dialog.close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });

  // Return to the carousel on the photo last viewed full screen.
  dialog.addEventListener('close', () => {
    track.style.scrollBehavior = 'auto';
    goTo(index);
    track.style.scrollBehavior = '';
    track.focus({ preventScroll: true });
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
