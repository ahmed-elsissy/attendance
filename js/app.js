/* ==========================================================================
   App Interactions, Accessibility & Conversion Tracking
   ========================================================================== */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP_NUMBER = '201062091434';

  /* ------------------------------------------------------------------------
     1. Lightweight Analytics Helper (GA4 dataLayer + Plausible compatible)
     ------------------------------------------------------------------------ */
  function trackEvent(eventName, params = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
    if (typeof window.plausible === 'function') {
      window.plausible(eventName, { props: params });
    }
  }
  window.trackAcademicEvent = trackEvent;

  /* ------------------------------------------------------------------------
     2. Header Navigation, ScrollSpy & Mobile Burger Drawer
     ------------------------------------------------------------------------ */
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const navLinks = [...document.querySelectorAll('#main-nav a[href^="#"]')];

  function closeMobileMenu() {
    if (!menuToggle || !mainNav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'فتح القائمة الرئيسية');
    mainNav.classList.remove('is-open');
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      menuToggle.setAttribute('aria-expanded', String(next));
      menuToggle.setAttribute('aria-label', next ? 'إغلاق القائمة الرئيسية' : 'فتح القائمة الرئيسية');
      mainNav.classList.toggle('is-open', next);
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMobileMenu());
    });

    document.addEventListener('click', (event) => {
      if (
        mainNav.classList.contains('is-open') &&
        !mainNav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mainNav.classList.contains('is-open')) {
        closeMobileMenu();
        menuToggle.focus();
      }
    });
  }

  const linkedSections = navLinks
    .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
    .filter((item) => item.section);

  function setActiveNavLink(activeLink) {
    navLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && linkedSections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = linkedSections.find((item) => item.section === visible.target);
        if (match) setActiveNavLink(match.link);
      },
      { rootMargin: '-22% 0px -62% 0px', threshold: [0.1, 0.35, 0.6] }
    );
    linkedSections.forEach(({ section }) => navObserver.observe(section));
  }

  /* ------------------------------------------------------------------------
     3. Mobile Sticky Bottom CTA Bar
     ------------------------------------------------------------------------ */
  const stickyCta = document.getElementById('mobile-sticky-cta');
  const heroSection = document.querySelector('.hero, .sub-hero');
  const contactSection = document.querySelector('#contact, #cta, .subpage-cta-box');

  if ('IntersectionObserver' in window && stickyCta && heroSection) {
    let heroVisible = true;
    let contactVisible = false;

    const updateStickyState = () => {
      const shouldShow = !heroVisible && !contactVisible;
      stickyCta.classList.toggle('is-visible', shouldShow);
    };

    const stickyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === heroSection) heroVisible = entry.isIntersecting;
          if (entry.target === contactSection) contactVisible = entry.isIntersecting;
        });
        updateStickyState();
      },
      { threshold: 0.12 }
    );

    stickyObserver.observe(heroSection);
    if (contactSection) stickyObserver.observe(contactSection);
  }

  /* ------------------------------------------------------------------------
     4. Mobile Tabs for Before / After Process Lanes
     ------------------------------------------------------------------------ */
  const laneTabs = [...document.querySelectorAll('[data-lane-target]')];
  const beforeLane = document.getElementById('lane-before');
  const afterLane = document.getElementById('lane-after');

  function activateLane(targetId) {
    laneTabs.forEach((btn) => {
      const selected = btn.dataset.laneTarget === targetId;
      btn.setAttribute('aria-selected', String(selected));
    });
    if (beforeLane && afterLane) {
      beforeLane.classList.toggle('is-hidden-mobile', targetId !== 'lane-before');
      afterLane.classList.toggle('is-hidden-mobile', targetId !== 'lane-after');
    }
  }

  laneTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      activateLane(btn.dataset.laneTarget);
      trackEvent('before_after_tab', { lane: btn.dataset.laneTarget });
    });
  });

  /* ------------------------------------------------------------------------
     5. Accessible 4-Role Switcher Tabs (RTL Keyboard Aware)
     ------------------------------------------------------------------------ */
  const roleTabs = [...document.querySelectorAll('.role-tab[data-role-target]')];
  const rolePanels = [...document.querySelectorAll('.role-panel')];

  function activateRoleTab(selectedTab, moveFocus = false) {
    const targetId = selectedTab.dataset.roleTarget;
    roleTabs.forEach((tab) => {
      const isSelected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });
    rolePanels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });
    if (moveFocus) selectedTab.focus();
    trackEvent('role_tab_view', { role: targetId });
  }

  roleTabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateRoleTab(tab, false));
    tab.addEventListener('keydown', (event) => {
      let nextIndex = null;
      // In RTL, ArrowLeft moves to next item, ArrowRight moves to previous item
      if (event.key === 'ArrowLeft') nextIndex = (idx + 1) % roleTabs.length;
      else if (event.key === 'ArrowRight') nextIndex = (idx - 1 + roleTabs.length) % roleTabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = roleTabs.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        activateRoleTab(roleTabs[nextIndex], true);
      }
    });
  });

  /* ------------------------------------------------------------------------
     6. Dashboard Gallery Lightbox Modal (Keyboard + Touch Swipe)
     ------------------------------------------------------------------------ */
  const galleryItems = [...document.querySelectorAll('.gallery-item[data-full], .real-shot-button[data-full]')];
  const galleryModal = document.querySelector('.gallery-modal');
  const modalImage = galleryModal?.querySelector('img');
  const modalCaptionText = galleryModal?.querySelector('.gallery-caption-text');
  const modalCounter = galleryModal?.querySelector('.gallery-counter');
  const prevBtn = galleryModal?.querySelector('.gallery-prev');
  const nextBtn = galleryModal?.querySelector('.gallery-next');
  let activeGalleryIndex = 0;
  let lastFocusedTrigger = null;

  if (galleryItems.length <= 1) {
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = true;
    if (modalCounter) modalCounter.hidden = true;
  }

  function showGallerySlide(index) {
    if (!galleryItems.length || !modalImage) return;
    activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[activeGalleryIndex];
    const thumb = item.querySelector('img');
    modalImage.src = item.dataset.full;
    modalImage.alt = thumb ? thumb.alt : item.dataset.caption || '';
    if (modalCaptionText) modalCaptionText.textContent = item.dataset.caption || '';
    if (modalCounter) modalCounter.textContent = `${activeGalleryIndex + 1} / ${galleryItems.length}`;
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      lastFocusedTrigger = item;
      showGallerySlide(index);
      galleryModal?.showModal();
      trackEvent('gallery_item_open', { caption: item.dataset.caption, index: index + 1 });
    });
  });

  galleryModal?.querySelector('.gallery-close')?.addEventListener('click', () => galleryModal.close());
  galleryModal?.querySelector('.gallery-prev')?.addEventListener('click', () => showGallerySlide(activeGalleryIndex - 1));
  galleryModal?.querySelector('.gallery-next')?.addEventListener('click', () => showGallerySlide(activeGalleryIndex + 1));

  galleryModal?.addEventListener('close', () => {
    if (lastFocusedTrigger) lastFocusedTrigger.focus();
  });

  galleryModal?.addEventListener('click', (event) => {
    if (event.target === galleryModal) galleryModal.close();
  });

  document.addEventListener('keydown', (event) => {
    if (!galleryModal?.open) return;
    if (event.key === 'ArrowRight') showGallerySlide(activeGalleryIndex - 1);
    if (event.key === 'ArrowLeft') showGallerySlide(activeGalleryIndex + 1);
  });

  let touchStartX = 0;
  galleryModal?.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    { passive: true }
  );
  galleryModal?.addEventListener(
    'touchend',
    (event) => {
      const deltaX = event.changedTouches[0].screenX - touchStartX;
      if (Math.abs(deltaX) > 45) {
        if (deltaX > 0) showGallerySlide(activeGalleryIndex + 1);
        else showGallerySlide(activeGalleryIndex - 1);
      }
    },
    { passive: true }
  );

  /* ------------------------------------------------------------------------
     7. Scroll Reveal & Animated Numeric Counters
     ------------------------------------------------------------------------ */
  const revealNodes = [...document.querySelectorAll('.reveal')];
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealNodes.forEach((node) => node.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.03, rootMargin: '0px 0px 60px 0px' }
    );
    revealNodes.forEach((node) => revealObserver.observe(node));
  }

  const counterNodes = [...document.querySelectorAll('[data-count]')];
  const numberFormatter = new Intl.NumberFormat('en-US');

  function animateCounter(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    if (!Number.isFinite(target) || prefersReducedMotion) {
      el.textContent = `${prefix}${numberFormatter.format(target)}${suffix}`;
      return;
    }
    const duration = 600;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = `${prefix}${numberFormatter.format(current)}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window && counterNodes.length && !prefersReducedMotion) {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    counterNodes.forEach((node) => counterObserver.observe(node));
  }

  /* ------------------------------------------------------------------------
     8. Print Executive Summary & Analytics Listeners
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-print-summary]').forEach((btn) => {
    btn.addEventListener('click', () => {
      trackEvent('print_executive_summary');
      window.print();
    });
  });

  document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
    link.addEventListener('click', () => {
      trackEvent('whatsapp_click', { source: link.dataset.ctaSource || 'link' });
    });
  });

  document.querySelectorAll('.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        const q = item.querySelector('summary')?.textContent?.trim().slice(0, 60);
        trackEvent('faq_expand', { question: q });
      }
    });
  });

  // Scroll Depth Milestones (25%, 50%, 75%, 100%)
  const milestones = new Set();
  window.addEventListener(
    'scroll',
    () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((window.scrollY / scrollable) * 100);
      [25, 50, 75, 95].forEach((mark) => {
        if (pct >= mark && !milestones.has(mark)) {
          milestones.add(mark);
          trackEvent('scroll_depth', { percent: mark === 95 ? 100 : mark });
        }
      });
    },
    { passive: true }
  );

  /* ------------------------------------------------------------------------
     9. Demo Request Form (Webhook + Structured WhatsApp & Copy/Mail Dispatch)
     ------------------------------------------------------------------------ */
  const demoForm = document.getElementById('demo-request-form');
  const formFeedback = document.getElementById('form-feedback');
  const copyBriefBtn = document.getElementById('copy-brief-btn');

  function buildBriefText(formData) {
    const lines = [
      'مرحباً، أرغب في طلب عرض توضيحي لمنظومة الحوكمة الرقمية للحضور الأكاديمي:',
      `• الاسم: ${formData.get('name') || '—'}`,
      `• المسمى الوظيفي: ${formData.get('role') || '—'}`,
      `• الجامعة / الكلية: ${formData.get('institution') || '—'}`,
      `• عدد الطلاب التقريبي: ${formData.get('students') || '—'}`,
      `• وسيلة التواصل: ${formData.get('contact') || '—'}`,
      `• نطاق الاهتمام: ${formData.get('scope') || '—'}`
    ];
    const notes = (formData.get('notes') || '').toString().trim();
    if (notes) lines.push(`• ملاحظات إضافية: ${notes}`);
    return lines.join('\n');
  }

  function showFeedback(message) {
    if (!formFeedback) return;
    formFeedback.textContent = message;
    formFeedback.hidden = false;
  }

  if (demoForm) {
    demoForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!demoForm.reportValidity()) return;

      const formData = new FormData(demoForm);
      const brief = buildBriefText(formData);
      const endpoint = (demoForm.dataset.endpoint || '').trim();

      trackEvent('demo_form_submit', {
        scope: formData.get('scope'),
        students: formData.get('students')
      });

      // If a Formspree / Google Apps Script webhook URL is configured, send JSON first
      if (endpoint) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData.entries()))
          });
          if (response.ok) {
            showFeedback('تم استلام طلبكم بنجاح. سيتواصل معكم فريق التشغيل لتنسيق موعد العرض التوضيحي.');
            demoForm.reset();
            return;
          }
        } catch {
          // Graceful fallback to direct WhatsApp dispatch below
        }
      }

      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(brief)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      showFeedback('تم تجهيز ملخص طلبكم وفتح محادثة واتساب المباشرة لإرساله فوراً إلى فريق المنظومة.');
    });

    copyBriefBtn?.addEventListener('click', async () => {
      if (!demoForm.reportValidity()) return;
      const formData = new FormData(demoForm);
      const brief = buildBriefText(formData);
      trackEvent('demo_brief_copy');

      try {
        await navigator.clipboard.writeText(brief);
        showFeedback('تم نسخ ملخص الطلب رسمياً إلى الحافظة — يمكنكم لصقه في البريد الإلكتروني أو المراسلات الرسمية.');
      } catch {
        showFeedback('يرجى استخدام زر الإرسال المباشر عبر واتساب لإتمام الطلب.');
      }
    });
  }
})();
