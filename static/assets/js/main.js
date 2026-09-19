/* Portfolio interactions: nav, accordion, filters, counters, meters, gallery, form. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Sticky nav ---------- */
  var nav = $('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $('.nav__toggle');
  var panel = $('.nav__mobile');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = '<i class="' + (open ? 'ri-close-line' : 'ri-menu-line') + '"></i>';
    });
    $$('a', panel).forEach(function (a) {
      a.addEventListener('click', function () {
        panel.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<i class="ri-menu-line"></i>';
      });
    });
  }

  /* ---------- Scroll spy ---------- */
  var spyLinks = $$('.nav__links a[href^="#"], .nav__links a[href*="#"]').filter(function (a) {
    return a.getAttribute('href').indexOf('#') === 0;
  });
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var sections = spyLinks
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        spyLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ----------
     Every animated element also has a failsafe: if the observer never reports
     (throttled tab, odd embedding, older engine) the final state is applied
     anyway, so content is never left invisible or at zero. */
  var revealables = $$('.reveal');
  var showAll = function () { revealables.forEach(function (el) { el.classList.add('is-visible'); }); };
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      showAll();
    } else {
      var revealObs = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
      revealables.forEach(function (el) { revealObs.observe(el); });
      // Anything already on screen should not wait for a callback.
      revealables.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
      });
      setTimeout(showAll, 1500);
    }
  }

  /* ---------- Accordion ---------- */
  $$('.accordion').forEach(function (acc) {
    $$('.accordion__trigger', acc).forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var item = trigger.closest('.accordion__item');
        var open = item.classList.contains('is-open');
        $$('.accordion__item', acc).forEach(function (other) {
          other.classList.remove('is-open');
          $('.accordion__trigger', other).setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  });

  /* ---------- Filters ---------- */
  $$('[data-filter-group]').forEach(function (group) {
    var target = document.getElementById(group.getAttribute('data-filter-group'));
    if (!target) return;
    var items = $$('[data-category]', target);
    $$('.filter', group).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-value');
        $$('.filter', group).forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        items.forEach(function (item) {
          var show = want === 'All' || item.getAttribute('data-category') === want;
          item.classList.toggle('is-hidden', !show);
        });
      });
    });
  });

  /* ---------- Animated counters ----------
     Markup ships the final value; JS rewinds to zero only when it is able to
     animate, so a no-JS or observer-less visitor still reads the real number. */
  var counters = $$('[data-count-to]');
  if (counters.length) {
    var settle = function (el) {
      el.textContent = parseFloat(el.getAttribute('data-count-to')).toLocaleString('en-US') +
        (el.getAttribute('data-suffix') || '');
    };
    var run = function (el) {
      var to = parseFloat(el.getAttribute('data-count-to'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduced) { settle(el); return; }
      var start = null;
      var dur = 1600;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * eased).toLocaleString('en-US') + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window && !reduced) {
      var pending = counters.slice();
      counters.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
      var cObs = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          pending.splice(pending.indexOf(e.target), 1);
          run(e.target);
          obs.unobserve(e.target);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cObs.observe(el); });
      setTimeout(function () { pending.forEach(settle); }, 2500);
    } else {
      counters.forEach(settle);
    }
  }

  /* ---------- Skill meters ----------
     Same idea: the bar is already at its real width in the markup. */
  var meters = $$('.meter__fill[data-pct]');
  if (meters.length) {
    var fill = function (el) { el.style.width = el.getAttribute('data-pct') + '%'; };
    if ('IntersectionObserver' in window && !reduced) {
      var waiting = meters.slice();
      meters.forEach(function (el) { el.style.width = '0%'; });
      var mObs = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          waiting.splice(waiting.indexOf(e.target), 1);
          fill(e.target);
          obs.unobserve(e.target);
        });
      }, { threshold: 0.3 });
      meters.forEach(function (el) { mObs.observe(el); });
      setTimeout(function () { waiting.forEach(fill); }, 2500);
    } else {
      meters.forEach(fill);
    }
  }

  /* ---------- Gallery lightbox ---------- */
  var lightbox = $('.lightbox');
  if (lightbox) {
    var frame = $('.lightbox__frame', lightbox);
    var titleEl = $('.lightbox__bar h3', lightbox);
    var lastFocus = null;

    var embedFor = function (url) {
      var drive = /drive\.google\.com\/file\/d\/([^/]+)/.exec(url);
      if (drive) return 'https://drive.google.com/file/d/' + drive[1] + '/preview';
      var yt = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/.exec(url);
      if (yt) return 'https://www.youtube.com/embed/' + yt[1] + '?autoplay=1';
      return url;
    };

    var close = function () {
      lightbox.classList.remove('is-open');
      frame.innerHTML = '';
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    $$('[data-video]').forEach(function (card) {
      card.addEventListener('click', function () {
        lastFocus = card;
        titleEl.textContent = card.getAttribute('data-title') || '';
        frame.innerHTML =
          '<iframe src="' + embedFor(card.getAttribute('data-video')) + '" allow="autoplay; fullscreen" allowfullscreen title="' +
          (card.getAttribute('data-title') || 'Video') + '"></iframe>';
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        $('.lightbox__close', lightbox).focus();
      });
    });

    $('.lightbox__close', lightbox).addEventListener('click', close);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
    });
  }

  /* ---------- Contact form ---------- */
  var form = $('#contact-form');
  if (form) {
    var note = $('.form-note', form);
    var details = $('#details', form);
    var counterEl = $('.counter', form);

    if (details && counterEl) {
      var sync = function () { counterEl.textContent = details.value.length + '/500 characters'; };
      details.addEventListener('input', sync);
      sync();
    }

    var say = function (msg, state) {
      if (!note) return;
      note.textContent = msg;
      note.setAttribute('data-state', state);
    };

    form.addEventListener('submit', function (e) {
      var endpoint = form.getAttribute('action');
      var data = new FormData(form);

      // No backend configured yet: fall back to opening the visitor's mail client.
      if (!endpoint) {
        e.preventDefault();
        var lines = [];
        data.forEach(function (v, k) { if (v) lines.push(k + ': ' + v); });
        var mail = form.getAttribute('data-mailto');
        window.location.href =
          'mailto:' + mail +
          '?subject=' + encodeURIComponent('Project enquiry from ' + (data.get('name') || 'website')) +
          '&body=' + encodeURIComponent(lines.join('\n'));
        say('Opening your email app — if nothing happens, write to ' + mail + ' directly.', 'ok');
        return;
      }

      e.preventDefault();
      var btn = $('button[type="submit"]', form);
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      say('', '');

      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('Request failed');
          form.reset();
          if (details && counterEl) counterEl.textContent = '0/500 characters';
          say('Thanks — your message is on its way. I usually reply within a day or two.', 'ok');
        })
        .catch(function () {
          say('Something went wrong. Please email ' + form.getAttribute('data-mailto') + ' instead.', 'err');
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  }

  /* ---------- Year stamp ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
