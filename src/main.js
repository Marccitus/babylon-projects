/* Babylon Projects — interacción mínima, sin dependencias */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     i18n
     Los textos en español viven en el HTML (data-i18n="clave").
     Para añadir inglés: crear I18N.en con las mismas claves y llamar a
     applyLang('en'). El selector de idioma aún no está implementado.
     Los mensajes generados por JS (formulario) sí viven aquí.
  ------------------------------------------------------------------ */
  const I18N = {
    es: {
      'form.err.nombre': 'Indica tu nombre.',
      'form.err.email': 'Indica tu email.',
      'form.err.emailFormato': 'Revisa el formato del email.',
      'form.err.asunto': 'Selecciona un asunto.',
      'form.err.mensaje': 'Escribe tu mensaje.',
      'form.err.privacidad': 'Debes aceptar la política de privacidad.',
      'form.ok': 'Gracias. Hemos recibido tu mensaje y te responderemos lo antes posible.',
      'form.pending': 'El formulario estará disponible muy pronto. Gracias por tu paciencia.',
      'form.fail': 'No se ha podido enviar el mensaje. Inténtalo de nuevo más tarde.',
      'nav.menu': 'Menú',
      'nav.cerrar': 'Cerrar'
    }
  };
  let lang = document.documentElement.lang || 'es';
  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.es[key] || key;

  // eslint-disable-next-line no-unused-vars
  function applyLang(code) {
    if (!I18N[code]) return;
    lang = code;
    document.documentElement.lang = code;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = I18N[code][el.dataset.i18n];
      if (value) el.innerHTML = value;
    });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Navegación: fondo al hacer scroll, menú móvil y sección activa
  ------------------------------------------------------------------ */
  const nav = document.getElementById('nav');
  const toggle = nav.querySelector('.nav__toggle');
  const toggleLabel = nav.querySelector('.nav__toggle-label');
  const menu = document.getElementById('nav-menu');
  const hero = document.getElementById('inicio');

  let limit = 0;
  const measure = () => { limit = Math.max(hero.offsetHeight * 0.85 - nav.offsetHeight, 80); };
  const setScrolled = () => nav.classList.toggle('is-scrolled', window.scrollY > limit);
  measure();
  setScrolled();
  window.addEventListener('scroll', setScrolled, { passive: true });
  window.addEventListener('resize', () => { measure(); setScrolled(); });

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? t('nav.cerrar') : t('nav.menu');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  const links = [...menu.querySelectorAll('a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((a) => {
      const section = document.querySelector(a.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  /* ------------------------------------------------------------------
     Aparición suave al hacer scroll
  ------------------------------------------------------------------ */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    // Escalonado suave entre elementos hermanos (tarjetas, retratos, valores)
    reveals.forEach((el) => {
      const group = el.parentElement.closest('.areas, .steps, .team, .values');
      if (group) {
        const items = [...group.querySelectorAll('.reveal')];
        el.style.transitionDelay = `${Math.min(items.indexOf(el), 4) * 90}ms`;
      }
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Formulario de contacto: validación en cliente
  ------------------------------------------------------------------ */
  const form = document.getElementById('contact-form');
  if (form) {
    const status = document.getElementById('form-status');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const rules = {
      nombre: (f) => (f.value.trim() ? '' : t('form.err.nombre')),
      email: (f) => {
        const v = f.value.trim();
        if (!v) return t('form.err.email');
        return EMAIL_RE.test(v) ? '' : t('form.err.emailFormato');
      },
      asunto: (f) => (f.value ? '' : t('form.err.asunto')),
      mensaje: (f) => (f.value.trim() ? '' : t('form.err.mensaje')),
      privacidad: (f) => (f.checked ? '' : t('form.err.privacidad'))
    };

    const check = (field) => {
      const msg = rules[field.name](field);
      const err = document.getElementById(field.id + '-err');
      err.textContent = msg;
      if (msg) {
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', err.id);
      } else {
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
      }
      return !msg;
    };

    const fields = Object.keys(rules).map((name) => form.elements[name]);
    fields.forEach((field) => {
      const evt = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'blur';
      field.addEventListener(evt, () => check(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') check(field);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = '';
      const results = fields.map(check);
      const firstInvalid = fields[results.indexOf(false)];
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const endpoint = form.getAttribute('action');
      // TODO: sin backend todavía. Cuando haya action (Formspree / Netlify), se envía por fetch.
      if (!endpoint) {
        // Mientras no haya backend no fingimos un envío: avisamos con honestidad.
        status.textContent = t('form.pending');
        return;
      }
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error(res.status);
        status.textContent = t('form.ok');
        form.reset();
      } catch {
        status.textContent = t('form.fail');
      }
    });
  }
})();
