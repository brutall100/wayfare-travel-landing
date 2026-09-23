/* Wayfare — puslapio elgsena */

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isSmallScreen = window.matchMedia('(max-width: 760px)').matches;

const random = (min, max) => min + Math.random() * (max - min);

/* ---------- Šviesus / tamsus režimas ---------- */

function initThemeToggle() {
  const button = document.querySelector('.theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

  const syncButton = () => {
    const theme = currentTheme();
    // Ikonėlė piešiama pagal data-theme, todėl jį nustatome visada
    root.dataset.theme = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  };

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('wayfare-theme', next);
    } catch (e) { /* be atminties tiesiog neįsimename */ }
    syncButton();
  });

  syncButton();
}

/* ---------- Meniu telefone ---------- */

function initNav() {
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  links.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && links.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* ---------- Gyvas fonas: maršrutai ir dalelės ---------- */

function initMapBackground() {
  if (reducedMotion.matches) return;

  const routesLayer = document.querySelector('.map-bg__routes');
  const particlesLayer = document.querySelector('.map-bg__particles');

  const routeCount = isSmallScreen ? 2 : 4;
  for (let i = 0; i < routeCount; i += 1) {
    const route = document.createElement('div');
    route.className = 'route';
    route.style.top = `${random(12, 88)}%`;
    route.style.setProperty('--angle', `${random(-18, 18).toFixed(1)}deg`);

    const line = document.createElement('div');
    line.className = 'route__line';

    const vehicle = document.createElement('div');
    vehicle.className = 'route__vehicle';
    vehicle.style.setProperty('--dur', `${random(22, 38).toFixed(1)}s`);
    vehicle.style.setProperty('--delay', `${(-random(0, 30)).toFixed(1)}s`);

    route.append(line, vehicle);
    routesLayer.append(route);
  }

  const particleCount = isSmallScreen ? 18 : 36;
  const kinds = ['dot', 'dot', 'dash', 'pin'];
  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement('span');
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    particle.className = `particle particle--${kind}`;
    const size = kind === 'pin' ? random(8, 14) : random(3, 7);
    particle.style.left = `${random(0, 100)}%`;
    particle.style.setProperty('--size', `${size.toFixed(1)}px`);
    particle.style.setProperty('--dur', `${random(18, 34).toFixed(1)}s`);
    particle.style.setProperty('--delay', `${(-random(0, 34)).toFixed(1)}s`);
    particle.style.setProperty('--dx', `${random(-80, 80).toFixed(0)}px`);
    particle.style.setProperty('--spin', `${random(-180, 180).toFixed(0)}deg`);
    particle.style.setProperty('--alpha', random(0.35, 0.9).toFixed(2));
    if (kind === 'dash') particle.style.width = `${random(10, 18).toFixed(0)}px`;
    particlesLayer.append(particle);
  }
}

/* ---------- Bangelė (ripple) ant mygtukų ---------- */

function initRipple() {
  document.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('.btn, .chip, .round-btn');
    if (!button || reducedMotion.matches) return;

    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    button.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

/* ---------- Atsiradimas slenkant ir skaičių skaičiavimas ---------- */

function countUp(element) {
  const target = Number(element.dataset.count);
  if (reducedMotion.matches) {
    element.textContent = target;
    return;
  }
  const duration = 1400;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    element.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  const counters = document.querySelectorAll('[data-count]');

  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  items.forEach((item, index) => {
    item.style.transitionDelay = `${(index % 3) * 80}ms`;
    revealObserver.observe(item);
  });

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  counters.forEach((counter) => {
    counter.textContent = '0';
    counterObserver.observe(counter);
  });
}

/* ---------- Kelionių filtras (valdo ir fono transportą) ---------- */

function initTripFilter() {
  const chips = document.querySelectorAll('.chip[data-filter]');
  const tickets = document.querySelectorAll('.ticket');
  const status = document.getElementById('filter-status');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;

      chips.forEach((other) => {
        const active = other === chip;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });

      let shown = 0;
      tickets.forEach((ticket) => {
        const match = filter === 'all' || ticket.dataset.type === filter;
        ticket.hidden = !match;
        ticket.classList.remove('is-entering');
        if (match) {
          shown += 1;
          ticket.classList.add('is-visible');
          // Priverčiame naršyklę iš naujo paleisti animaciją
          void ticket.offsetWidth;
          ticket.classList.add('is-entering');
        }
      });

      // Fone važiuoja pasirinktas transportas, maršrutai užsidega
      if (filter === 'all') delete root.dataset.vehicle;
      else root.dataset.vehicle = filter;
      document.querySelectorAll('.route').forEach((route) => {
        route.classList.toggle('is-lit', filter !== 'all');
      });

      status.textContent = `Rodoma kelionių: ${shown}`;
    });
  });
}

/* ---------- Atsiliepimų slankiklis ---------- */

function initReviews() {
  const track = document.querySelector('.reviews__track');
  const buttons = document.querySelectorAll('[data-slide]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const card = track.querySelector('.review');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const direction = Number(button.dataset.slide);
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const atStart = track.scrollLeft <= 4;

      // Pabaigoje grįžtame į pradžią ir atvirkščiai
      if (direction > 0 && atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
      else if (direction < 0 && atStart) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
      else track.scrollBy({ left: step * direction, behavior: 'smooth' });
    });
  });
}

/* ---------- Naujienlaiškio forma ---------- */

function initNewsletter() {
  const form = document.querySelector('.newsletter__form');
  const input = form.querySelector('input');
  const message = form.querySelector('.newsletter__msg');
  const button = form.querySelector('button');

  const show = (text, type) => {
    message.textContent = text;
    message.className = `newsletter__msg is-${type}`;
  };

  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true' && input.validity.valid) {
      input.removeAttribute('aria-invalid');
      message.textContent = '';
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();

    if (!value) {
      input.setAttribute('aria-invalid', 'true');
      show('Įrašyk el. pašto adresą.', 'error');
      input.focus();
      return;
    }
    if (!input.validity.valid) {
      input.setAttribute('aria-invalid', 'true');
      show('Atrodo, kad adrese yra klaida. Pvz.: vardas@pavyzdys.lt', 'error');
      input.focus();
      return;
    }

    // Demo: duomenys niekur nesiunčiami
    input.removeAttribute('aria-invalid');
    button.classList.remove('is-sent');
    void button.offsetWidth;
    button.classList.add('is-sent');
    show('Ačiū! Pirmas maršrutas jau skrenda į tavo pašto dėžutę.', 'success');
    form.reset();
  });
}

initThemeToggle();
initNav();
initMapBackground();
initRipple();
initReveal();
initTripFilter();
initReviews();
initNewsletter();
