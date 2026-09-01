/* =============================================================================
   Reviere Studio — interactions
   Vanilla JS, no dependencies. Every module is defensive: if its markup is not
   on the page it simply does nothing.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, event) {
    var nodes = Array.prototype.filter.call(
      container.querySelectorAll(FOCUSABLE),
      function (el) { return el.offsetParent !== null || el === document.activeElement; }
    );
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------------------------
     1. Navigation
     ------------------------------------------------------------------------ */
  function initNav() {
    var nav = document.querySelector('[data-nav]');
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = document.querySelector('[data-nav-toggle]');
    var drawer = document.querySelector('[data-nav-drawer]');
    if (!toggle || !drawer) return;

    var lastFocused = null;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
      if (open) {
        lastFocused = document.activeElement;
        var firstLink = drawer.querySelector(FOCUSABLE);
        if (firstLink) firstLink.focus();
      } else if (lastFocused) {
        lastFocused.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setOpen(false); }
      else if (e.key === 'Tab') { trapFocus(drawer, e); }
    });

    // Close the drawer if the viewport grows past the mobile breakpoint.
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
      if (e.matches && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  }

  /* ---------------------------------------------------------------------------
     2. Hero carousel
     Auto-advance is paused on hover, on keyboard focus, when the tab is hidden,
     when the hero scrolls out of view, and whenever reduced motion is requested.
     ------------------------------------------------------------------------ */
  function initHero() {
    var root = document.querySelector('[data-carousel]');
    if (!root) return;

    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-dot]'));
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var playBtn = root.querySelector('[data-carousel-play]');
    var counter = root.querySelector('[data-carousel-counter]');
    if (slides.length < 2) return;

    var INTERVAL = 6500;
    var index = 0;
    var timer = null;
    var userPaused = reduceMotion.matches;
    var hovered = false;
    var focused = false;
    var visible = true;

    function render() {
      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-selected', String(i === index));
      });
      if (counter) {
        counter.textContent = String(index + 1).padStart(2, '0') + ' / ' +
          String(slides.length).padStart(2, '0');
      }
    }

    function go(next) {
      index = (next + slides.length) % slides.length;
      render();
    }

    function shouldRun() {
      return !userPaused && !hovered && !focused && visible && !document.hidden;
    }

    function tick() {
      stop();
      if (!shouldRun()) return;
      timer = window.setTimeout(function () { go(index + 1); tick(); }, INTERVAL);
    }

    function stop() {
      if (timer) { window.clearTimeout(timer); timer = null; }
    }

    function syncPlayBtn() {
      if (!playBtn) return;
      var playing = shouldRun();
      playBtn.setAttribute('aria-pressed', String(userPaused));
      playBtn.setAttribute('aria-label', userPaused ? 'Riprendi lo scorrimento automatico' : 'Metti in pausa lo scorrimento automatico');
      playBtn.querySelector('[data-icon-play]').hidden = !userPaused;
      playBtn.querySelector('[data-icon-pause]').hidden = userPaused;
      void playing;
    }

    function refresh() { tick(); syncPlayBtn(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1); refresh(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); refresh(); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { go(i); refresh(); });
    });
    if (playBtn) {
      playBtn.addEventListener('click', function () { userPaused = !userPaused; refresh(); });
    }

    root.addEventListener('mouseenter', function () { hovered = true; refresh(); });
    root.addEventListener('mouseleave', function () { hovered = false; refresh(); });
    root.addEventListener('focusin', function () { focused = true; refresh(); });
    root.addEventListener('focusout', function () {
      focused = root.contains(document.activeElement);
      refresh();
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); refresh(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); refresh(); }
    });

    document.addEventListener('visibilitychange', refresh);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        refresh();
      }, { threshold: 0.15 }).observe(root);
    }

    reduceMotion.addEventListener('change', function (e) {
      userPaused = e.matches;
      refresh();
    });

    // Touch swipe
    var startX = null;
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { go(dx < 0 ? index + 1 : index - 1); refresh(); }
      startX = null;
    }, { passive: true });

    render();
    refresh();
  }

  /* ---------------------------------------------------------------------------
     3. Scroll reveal
     ------------------------------------------------------------------------ */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!items.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------------
     4. Gallery: filters + lightbox
     ------------------------------------------------------------------------ */
  function initGallery() {
    var grid = document.querySelector('[data-gallery]');
    if (!grid) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll('[data-item]'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var status = document.querySelector('[data-gallery-status]');
    var visibleItems = items.slice();

    function applyFilter(key) {
      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(chip.dataset.filter === key));
      });
      visibleItems = [];
      items.forEach(function (item) {
        var match = key === 'all' || item.dataset.cat === key;
        item.hidden = !match;
        if (match) visibleItems.push(item);
      });
      if (status) {
        status.textContent = visibleItems.length + ' foto in questa selezione';
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () { applyFilter(chip.dataset.filter); });
    });

    /* Lightbox ------------------------------------------------------------ */
    var lb = document.querySelector('[data-lightbox]');
    if (!lb) return;

    var lbImg = lb.querySelector('[data-lb-img]');
    var lbCount = lb.querySelector('[data-lb-count]');
    var lbPrev = lb.querySelector('[data-lb-prev]');
    var lbNext = lb.querySelector('[data-lb-next]');
    var lbClose = lb.querySelector('[data-lb-close]');
    var cursor = 0;
    var lastFocused = null;

    function show(i) {
      if (!visibleItems.length) return;
      cursor = (i + visibleItems.length) % visibleItems.length;
      var src = visibleItems[cursor].dataset.full;
      var alt = visibleItems[cursor].querySelector('img').alt;
      lbImg.src = src;
      lbImg.alt = alt;
      lbCount.textContent = (cursor + 1) + ' / ' + visibleItems.length;
    }

    function open(item) {
      lastFocused = document.activeElement;
      show(visibleItems.indexOf(item));
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      lbClose.focus();
    }

    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      lbImg.src = '';
      if (lastFocused) lastFocused.focus();
    }

    items.forEach(function (item) {
      item.addEventListener('click', function () { open(item); });
    });

    lbPrev.addEventListener('click', function () { show(cursor - 1); });
    lbNext.addEventListener('click', function () { show(cursor + 1); });
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lightbox__stage')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft') { show(cursor - 1); }
      else if (e.key === 'ArrowRight') { show(cursor + 1); }
      else if (e.key === 'Tab') { trapFocus(lb, e); }
    });

    applyFilter('all');
  }

  /* ---------------------------------------------------------------------------
     5. Contact form
     Client-side validation with a linked error summary. Submission goes to the
     endpoint in data-endpoint when one is configured; otherwise it falls back to
     a pre-filled e-mail draft so the form still works on static hosting.
     ------------------------------------------------------------------------ */
  function initForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;

    var summary = form.querySelector('[data-form-summary]');
    var summaryList = form.querySelector('[data-form-summary-list]');
    var statusBox = form.querySelector('[data-form-status]');
    var submitBtn = form.querySelector('[data-form-submit]');
    var endpoint = (form.dataset.endpoint || '').trim();
    var mailto = form.dataset.mailto || '';

    var RULES = {
      nome:      function (v) { return v.trim().length >= 2 || 'Inserisci il tuo nome e cognome.'; },
      email:     function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Inserisci un indirizzo email valido, ad esempio nome@dominio.it.'; },
      telefono:  function (v) { return v.trim() === '' || /^[+\d][\d\s().-]{6,}$/.test(v.trim()) || 'Inserisci un numero di telefono valido (min. 7 cifre).'; },
      tipo:      function (v) { return v !== '' || 'Seleziona il tipo di evento.'; },
      messaggio: function (v) { return v.trim().length >= 10 || 'Scrivi almeno 10 caratteri per raccontarci il tuo evento.'; },
      privacy:   function (v, el) { return el.checked || 'Devi accettare l\'informativa privacy per inviare la richiesta.'; }
    };

    function fieldWrap(el) { return el.closest('.field') || el.closest('.consent-wrap') || el.parentElement; }

    function setError(el, message) {
      var wrap = fieldWrap(el);
      var box = wrap.querySelector('[data-error-for="' + el.name + '"]');
      wrap.classList.toggle('has-error', Boolean(message));
      el.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (box) {
        box.innerHTML = message
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>' + message
          : '';
      }
    }

    function validateField(el) {
      var rule = RULES[el.name];
      if (!rule) return null;
      var result = rule(el.value, el);
      var message = result === true ? null : result;
      setError(el, message);
      return message;
    }

    // Validate on blur, then live-correct once the field has an error.
    Object.keys(RULES).forEach(function (name) {
      var el = form.elements[name];
      if (!el) return;
      el.addEventListener('blur', function () { validateField(el); });
      el.addEventListener('input', function () {
        if (fieldWrap(el).classList.contains('has-error')) validateField(el);
      });
      el.addEventListener('change', function () {
        if (fieldWrap(el).classList.contains('has-error')) validateField(el);
      });
    });

    function buildBody(data) {
      return [
        'Nome: ' + data.nome,
        'Email: ' + data.email,
        'Telefono: ' + (data.telefono || '—'),
        'Tipo di evento: ' + data.tipo,
        'Data desiderata: ' + (data.data || '—'),
        'Numero ospiti: ' + (data.ospiti || '—'),
        '',
        'Messaggio:',
        data.messaggio
      ].join('\n');
    }

    function showStatus(kind, html) {
      if (!statusBox) return;
      statusBox.hidden = false;
      statusBox.className = 'form__status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
      statusBox.innerHTML = html;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (statusBox) statusBox.hidden = true;

      var errors = [];
      Object.keys(RULES).forEach(function (name) {
        var el = form.elements[name];
        if (!el) return;
        var msg = validateField(el);
        if (msg) errors.push({ el: el, msg: msg });
      });

      if (errors.length) {
        if (errors.length > 1 && summary && summaryList) {
          summaryList.innerHTML = errors.map(function (err) {
            return '<li><a href="#' + err.el.id + '">' + err.msg + '</a></li>';
          }).join('');
          summary.hidden = false;
          summary.setAttribute('tabindex', '-1');
          summary.focus();
        } else {
          if (summary) summary.hidden = true;
          errors[0].el.focus();
        }
        return;
      }
      if (summary) summary.hidden = true;

      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });

      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Invio in corso…';

      function done() {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }

      if (endpoint) {
        fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        }).then(function (res) {
          if (!res.ok) throw new Error('bad status');
          form.reset();
          showStatus('ok', '<strong>Richiesta inviata.</strong> Ti risponderemo entro 24 ore. Per una risposta immediata scrivici su WhatsApp.');
        }).catch(function () {
          showStatus('err', '<strong>Invio non riuscito.</strong> Riprova tra poco oppure scrivici direttamente su WhatsApp o via email.');
        }).finally(done);
      } else {
        // Static fallback: open a pre-filled e-mail draft.
        var subject = 'Richiesta ' + data.tipo + ' — ' + data.nome;
        window.location.href = 'mailto:' + mailto +
          '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(buildBody(data));
        showStatus('ok', '<strong>Abbiamo aperto il tuo programma di posta</strong> con la richiesta già compilata: premi invio per spedirla. Se non si è aperto nulla, scrivici su WhatsApp o a <a href="mailto:' + mailto + '">' + mailto + '</a>.');
        done();
      }
    });
  }

  /* ---------------------------------------------------------------------------
     6. Map
     The Google Maps iframe is injected only after an explicit click, so the page
     sets no third-party cookies for visitors who never ask for the map.
     ------------------------------------------------------------------------ */
  function initMap() {
    var map = document.querySelector('[data-map]');
    if (!map) return;

    var button = map.querySelector('[data-map-load]');
    if (!button) return;

    button.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = map.dataset.src;
      frame.title = 'Mappa: Reviere Studio, Via Montevergine 159, Rutigliano';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.setAttribute('allowfullscreen', '');
      map.appendChild(frame);
      map.classList.add('is-loaded');
      frame.focus();
    });
  }

  /* ---------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    initNav();
    initHero();
    initReveal();
    initGallery();
    initForm();
    initMap();
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
