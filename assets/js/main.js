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
     2. Scroll reveal
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
     3. Gallery: filters + lightbox
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
     4. Contact form
     Client-side validation with a linked error summary, then one of three routes:
       1. data-endpoint set  -> POST in background (needs a form service)
       2. otherwise          -> opens WhatsApp with the request already written
       3. secondary link     -> same request as a pre-filled e-mail
     Routes 2 and 3 need no server: the visitor sends the message from their own
     account, so the request arrives in the venue's own WhatsApp or inbox.
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
    var whatsapp = (form.dataset.whatsapp || '').replace(/\D/g, '');
    var mailLink = form.querySelector('[data-form-mail]');

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

    // 2026-06-12 -> 12/06/2026
    function formatDate(iso) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
      return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
    }

    function buildBody(data) {
      return [
        'Nome: ' + data.nome,
        'Email: ' + data.email,
        'Telefono: ' + (data.telefono || '—'),
        'Tipo di evento: ' + data.tipo,
        'Data desiderata: ' + (formatDate(data.data) || '—'),
        'Numero ospiti: ' + (data.ospiti || '—'),
        '',
        'Messaggio:',
        data.messaggio
      ].join('\n');
    }

    // Su WhatsApp il testo si legge in chat: niente etichette vuote.
    function buildWhatsappText(data) {
      var lines = ['Ciao Reviere Studio, vorrei informazioni per un evento.', ''];
      lines.push('Nome: ' + data.nome);
      lines.push('Tipo di evento: ' + data.tipo);
      if (formatDate(data.data)) lines.push('Data: ' + formatDate(data.data));
      if (data.ospiti) lines.push('Ospiti: circa ' + data.ospiti);
      lines.push('Email: ' + data.email);
      if (data.telefono) lines.push('Telefono: ' + data.telefono);
      lines.push('', data.messaggio);
      return lines.join('\n');
    }

    function collect() {
      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });
      return data;
    }

    // Ritorna true se il modulo e' completo; altrimenti mostra gli errori.
    function validateAll() {
      var errors = [];
      Object.keys(RULES).forEach(function (name) {
        var el = form.elements[name];
        if (!el) return;
        var msg = validateField(el);
        if (msg) errors.push({ el: el, msg: msg });
      });

      if (!errors.length) {
        if (summary) summary.hidden = true;
        return true;
      }

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
      return false;
    }

    // Apre in una nuova scheda; se il browser la blocca, naviga nella stessa.
    function openExternal(url) {
      var win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url;
    }

    function showStatus(kind, html) {
      if (!statusBox) return;
      statusBox.hidden = false;
      statusBox.className = 'form__status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
      statusBox.innerHTML = html;
    }

    function sendByMail(data) {
      var subject = 'Richiesta ' + data.tipo + ' — ' + data.nome;
      window.location.href = 'mailto:' + mailto +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(buildBody(data));
      showStatus('ok',
        '<strong>Abbiamo aperto il tuo programma di posta</strong> con la richiesta gi&agrave; scritta: ' +
        'premi invio per spedirla. Se non si &egrave; aperto nulla, scrivici a ' +
        '<a href="mailto:' + mailto + '">' + mailto + '</a>.');
    }

    function sendByWhatsapp(data) {
      openExternal('https://wa.me/' + whatsapp +
        '?text=' + encodeURIComponent(buildWhatsappText(data)));
      showStatus('ok',
        '<strong>Abbiamo aperto WhatsApp con la richiesta gi&agrave; scritta.</strong> ' +
        'Premi invio nella chat per mandarcela: da l&igrave; ti rispondiamo direttamente. ' +
        'Se WhatsApp non si &egrave; aperto, usa il collegamento qui sotto per inviarla via email.');
    }

    // Percorso secondario: stessa richiesta, ma via email.
    if (mailLink) {
      mailLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (statusBox) statusBox.hidden = true;
        if (validateAll()) sendByMail(collect());
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (statusBox) statusBox.hidden = true;
      if (!validateAll()) return;

      var data = collect();

      if (!endpoint) {
        // Senza servizio di invio il messaggio parte dall'account del visitatore:
        // WhatsApp se configurato, altrimenti la posta.
        if (whatsapp) sendByWhatsapp(data);
        else sendByMail(data);
        return;
      }

      submitBtn.disabled = true;
      var originalLabel = submitBtn.innerHTML;
      submitBtn.textContent = 'Invio in corso…';

      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status');
        form.reset();
        showStatus('ok', '<strong>Richiesta inviata.</strong> Ti rispondiamo entro 24 ore.');
      }).catch(function () {
        showStatus('err', '<strong>Invio non riuscito.</strong> Riprova, oppure scrivici su WhatsApp.');
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      });
    });
  }

  /* ---------------------------------------------------------------------------
     5. Map
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
      frame.title = 'Mappa: Reviere Studio, Via Montevergine 161, Rutigliano';
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
  /* ---------------------------------------------------------------------------
     7. Deep link
     Chi arriva da un link con ancora (es. contatti.html#posizione) deve finire
     sulla sezione anche se font e immagini, caricandosi dopo il primo salto,
     spostano il contenuto. Al "load" si riallinea una volta, senza animazione.
     Se nel frattempo la persona ha gia' scrollato da se', non la si sposta.
     ------------------------------------------------------------------------ */
  function initDeepLink() {
    if (!location.hash) return;
    var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;

    var userMoved = false;
    var stop = function () { userMoved = true; };
    ['wheel', 'touchstart', 'keydown'].forEach(function (type) {
      window.addEventListener(type, stop, { once: true, passive: true });
    });

    window.addEventListener('load', function () {
      var align = function () {
        if (userMoved) return;
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
      else align();
    }, { once: true });
  }

  function boot() {
    initNav();
    initReveal();
    initGallery();
    initForm();
    initMap();
    initDeepLink();
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
