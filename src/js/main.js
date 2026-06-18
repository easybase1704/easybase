// ─── 原基科技 ─── 交互逻辑 ───

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      const spans = toggle.querySelectorAll('span');
      if (menu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.transform = '';
      }
    });

    // Close menu on non-dropdown link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (!link.parentElement.classList.contains('nav__item--dropdown')) {
          menu.classList.remove('open');
        }
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Hero slider
  const slider = document.getElementById('heroSlider');
  if (slider) {
    const slides = slider.querySelectorAll('.hero-slider__slide');
    const dots = slider.querySelectorAll('.hero-slider__dot');
    const prevBtn = slider.querySelector('.hero-slider__arrow--prev');
    const nextBtn = slider.querySelector('.hero-slider__arrow--next');
    let current = 0;
    let timer = null;
    const total = slides.length;

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + total) % total;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
      stopAuto();
      timer = setInterval(next, 4000);
    }

    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    prevBtn.addEventListener('click', () => { prev(); startAuto(); });
    nextBtn.addEventListener('click', () => { next(); startAuto(); });

    dots.forEach(dot => {
      dot.addEventListener('click', () => { goTo(parseInt(dot.dataset.index)); startAuto(); });
    });

    // Touch swipe
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); startAuto(); }
    });

    startAuto();
  }

  // Lazy load images
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[loading="lazy"]').forEach(img => observer.observe(img));
  }
});
