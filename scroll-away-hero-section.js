(function () {
  const el = document.querySelector('[data-wm-plugin="scroll-away-hero-section"]');
  if (!el) return;

  const defaults = {
    threshold: 1,
    heroSelector: "#sections > section:last-child",
    hideOnSectionClick: true,
    preventHideOnInteractiveClick: true,
    interactiveSelector: "a, button, input, textarea, select, video, audio",
    hasDeconstructedForEditMode: false,
    contentFill: false,
    storageKey: "wm-scroll-away-hero-dismissed",
    preventHideWhileInputFocused: true,
    headerSelector: "#header",
  };

  const globalSettings = window.wmScrollAwayHeroSettings || {};

  const ds = el.dataset || {};
  const localSettings = {};
  if (ds.threshold != null && ds.threshold !== "") localSettings.threshold = Number(ds.threshold);
  if (ds.heroSelector) localSettings.heroSelector = ds.heroSelector;
  if (ds.hideOnSectionClick != null && ds.hideOnSectionClick !== "") localSettings.hideOnSectionClick = String(ds.hideOnSectionClick).toLowerCase() === "true";
  if (ds.preventHideOnInteractiveClick != null && ds.preventHideOnInteractiveClick !== "")
    localSettings.preventHideOnInteractiveClick = String(ds.preventHideOnInteractiveClick).toLowerCase() === "true";
  if (ds.interactiveSelector) localSettings.interactiveSelector = ds.interactiveSelector;
  if (ds.contentFill != null && ds.contentFill !== "") localSettings.contentFill = String(ds.contentFill).toLowerCase() === "true";
  if (ds.storageKey) localSettings.storageKey = ds.storageKey;
  if (ds.preventHideWhileInputFocused != null && ds.preventHideWhileInputFocused !== "") localSettings.preventHideWhileInputFocused = String(ds.preventHideWhileInputFocused).toLowerCase() === "true";
  if (ds.headerSelector) localSettings.headerSelector = ds.headerSelector;

  const config = Object.assign({}, defaults, globalSettings, localSettings);

  // Ensure global namespace exists early for downstream references
  window.wmScrollAwayHero = window.wmScrollAwayHero || {};
  if (window.wmScrollAwayHero.hasDeconstructedForEditMode == null) {
    window.wmScrollAwayHero.hasDeconstructedForEditMode = !!config.hasDeconstructedForEditMode;
  }

  const heroSection = document.querySelector(config.heroSelector);
  if (!heroSection) return;

  const page = document.querySelector("#page");
  if (!page) return;

  heroSection.classList.add("wm-scroll-away-hero-section");
  if (config.contentFill) heroSection.classList.add("content-fill");
  page.append(heroSection);

  const updateHeaderHeightVar = () => {
    const headerEl = document.querySelector(config.headerSelector);
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    heroSection.style.setProperty("--wm-scroll-away-hero-header-height", headerHeight + "px");
  };
  updateHeaderHeightVar();
  window.addEventListener("resize", updateHeaderHeightVar, { passive: true });
  window.addEventListener("load", updateHeaderHeightVar, { passive: true });
  const headerElForObserve = document.querySelector(config.headerSelector);
  if (headerElForObserve && window.ResizeObserver) {
    try {
      const ro = new ResizeObserver(updateHeaderHeightVar);
      ro.observe(headerElForObserve);
    } catch (e) {}
  }

  const threshold = Number(config.threshold) || defaults.threshold;
  const getIsDismissed = () => {
    try {
      return window.localStorage.getItem(String(config.storageKey)) === "1";
    } catch (e) {
      return false;
    }
  };

  const setDismissed = () => {
    try {
      window.localStorage.setItem(String(config.storageKey), "1");
    } catch (e) {
      // ignore storage errors
    }
  };

  const show = () => {
    heroSection.classList.remove("wm-scroll-away-hero-section--hidden");
  };

  const hide = () => {
    heroSection.classList.add("wm-scroll-away-hero-section--hidden");
  };

  const dismiss = () => {
    setDismissed();
    hide();
  };

  const isInputFocused = () => {
    const ae = document.activeElement;
    if (!ae) return false;
    if (ae.isContentEditable) return true;
    const tag = ae.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  };

  const resetDismissal = () => {
    try {
      window.localStorage.removeItem(String(config.storageKey));
    } catch (e) {
      // ignore storage errors
    }
    updateVisibility();
  };

  const updateVisibility = () => {
    if (getIsDismissed()) {
      hide();
      return;
    }
    if (config.preventHideWhileInputFocused && isInputFocused()) {
      show();
      return;
    }
    if (window.scrollY > threshold) hide();
    else show();
  };

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, {passive: true});

  if (config.hideOnSectionClick) {
    heroSection.addEventListener("click", function (e) {
      if (config.preventHideOnInteractiveClick && e.target && typeof e.target.closest === "function") {
        if (e.target.closest(config.interactiveSelector)) return;
      }
      hide();
    });
  }

  const isBackend = window.self !== window.top;

  // Observe changes to the body's class attribute
  const bodyObserver = new MutationObserver(async mutations => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "class") {
        const classList = document.body.classList;
        if (classList.contains("sqs-is-page-editing")) {
          if (!wmScrollAwayHero.hasDeconstructedForEditMode) {
            wmScrollAwayHero.hasDeconstructedForEditMode = true;
            heroSection.remove();
            bodyObserver.disconnect();
          }
        }
      }
    }
  });

  if (isBackend) {
    bodyObserver.observe(document.body, {
      attributes: true,
    });
  }

  window.wmScrollAwayHero = {
    show,
    hide,
    updateVisibility,
    dismiss,
    resetDismissal,
  };
})();
