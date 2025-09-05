(function () {
  const el = document.querySelector('[data-wm-plugin="scroll-away-hero-card"]');
  if (!el) return;

  const defaults = {
    threshold: 1,
    heroSelector: "#sections > section:last-child",
    hideOnSectionClick: true,
    preventHideOnInteractiveClick: true,
    interactiveSelector: "a, button",
    hasDeconstructedForEditMode: false,
    contentFill: false,
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

  const config = Object.assign({}, defaults, globalSettings, localSettings);

  const heroCard = document.querySelector(config.heroSelector);
  if (!heroCard) return;

  const page = document.querySelector("#page");
  if (!page) return;

  heroCard.classList.add("wm-scroll-away-hero-card");
  console.log(config.contentFill);
  if (config.contentFill) heroCard.classList.add("content-fill");
  page.append(heroCard);

  const threshold = Number(config.threshold) || defaults.threshold;
  const show = () => {
    heroCard.classList.remove("wm-scroll-away-hero-card--hidden");
  };

  const hide = () => {
    heroCard.classList.add("wm-scroll-away-hero-card--hidden");
  };

  const updateVisibility = () => {
    if (window.scrollY > threshold) hide();
    else show();
  };

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, {passive: true});

  if (config.hideOnSectionClick) {
    heroCard.addEventListener("click", function (e) {
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
            heroCard.remove();
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
  };
})();
