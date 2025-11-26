(function () {
  const el = document.querySelector('[data-wm-plugin="scroll-away-hero-section"]');
  if (!el) return;

  const defaults = {
    threshold: 1,
    hideOnSectionClick: true,
    preventHideOnInteractiveClick: true,
    interactiveSelector: "a, button, input, textarea, select, video, audio",
    hasDeconstructedForEditMode: false,
    contentFill: false,
    preventHideWhileInputFocused: true,
    headerSelector: "#header",
    syncHeaderTheme: true,
    allowOnCollection: false,
    titleTagName: "h1",
    sectionTheme: null, // null = inherit from header, or set custom theme
    showIcon: true,
    iconHtml: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  };

  const globalSettings = window.wmScrollAwayHeroSettings || {};

  const ds = el.dataset || {};
  const localSettings = {};
  if (ds.threshold != null && ds.threshold !== "") localSettings.threshold = Number(ds.threshold);
  if (ds.hideOnSectionClick != null && ds.hideOnSectionClick !== "") localSettings.hideOnSectionClick = String(ds.hideOnSectionClick).toLowerCase() === "true";
  if (ds.preventHideOnInteractiveClick != null && ds.preventHideOnInteractiveClick !== "")
    localSettings.preventHideOnInteractiveClick = String(ds.preventHideOnInteractiveClick).toLowerCase() === "true";
  if (ds.interactiveSelector) localSettings.interactiveSelector = ds.interactiveSelector;
  if (ds.contentFill != null && ds.contentFill !== "") localSettings.contentFill = String(ds.contentFill).toLowerCase() === "true";
  if (ds.preventHideWhileInputFocused != null && ds.preventHideWhileInputFocused !== "") localSettings.preventHideWhileInputFocused = String(ds.preventHideWhileInputFocused).toLowerCase() === "true";
  if (ds.headerSelector) localSettings.headerSelector = ds.headerSelector;
  if (ds.syncHeaderTheme != null && ds.syncHeaderTheme !== "") localSettings.syncHeaderTheme = String(ds.syncHeaderTheme).toLowerCase() === "true";
  if (ds.allowOnCollection != null && ds.allowOnCollection !== "") localSettings.allowOnCollection = String(ds.allowOnCollection).toLowerCase() === "true";
  if (ds.titleTagName) {
    const validTags = ["h1", "h2", "h3", "h4"];
    const tagName = ds.titleTagName.toLowerCase();
    if (validTags.includes(tagName)) localSettings.titleTagName = tagName;
  }
  if (ds.sectionTheme != null && ds.sectionTheme !== "") localSettings.sectionTheme = ds.sectionTheme;
  if (ds.showIcon != null && ds.showIcon !== "") localSettings.showIcon = String(ds.showIcon).toLowerCase() === "true";
  if (ds.iconHtml != null && ds.iconHtml !== "") localSettings.iconHtml = ds.iconHtml;

  const config = Object.assign({}, defaults, globalSettings, localSettings);

  // Ensure global namespace exists early for downstream references
  window.wmScrollAwayHero = window.wmScrollAwayHero || {};
  if (window.wmScrollAwayHero.hasDeconstructedForEditMode == null) {
    window.wmScrollAwayHero.hasDeconstructedForEditMode = !!config.hasDeconstructedForEditMode;
  }

  const page = document.querySelector("#page");
  if (!page) return;

  // Preset selectors mapping
  const presetSelectors = {
    "last-section": "#sections > section:last-child",
    "first-section": "#sections > section:first-child",
  };

  // Check if a string is a CSS selector
  const isSelector = (str) => {
    const trimmed = str.trim();
    return trimmed.startsWith("#") || trimmed.startsWith(".") || trimmed.startsWith("[");
  };

  // Parse the data-hero-section attribute
  const parseHeroSectionAttr = (attr) => {
    if (!attr) return null;
    return attr.split(",").map((s) => s.trim()).filter(Boolean);
  };

  const heroSectionAttr = ds.heroSection;
  let contentKeywords = parseHeroSectionAttr(heroSectionAttr);

  // Check if using a selector (sync path) or keywords (async path)
  let selectorKeyword = null;
  if (contentKeywords) {
    selectorKeyword = contentKeywords.find((kw) => {
      return presetSelectors[kw] || isSelector(kw);
    });
  }

  let heroSection = null;
  let isGeneratedSection = false;
  let contentWrapper = null;
  let originalParent = null;
  let originalNextSibling = null;

  if (selectorKeyword) {
    // SYNC PATH: Use existing section from page
    const selector = presetSelectors[selectorKeyword] || selectorKeyword;
    heroSection = document.querySelector(selector);
    if (!heroSection) return; // Section not found, don't initialize
    
    // Store original position for restoring in edit mode
    originalParent = heroSection.parentElement;
    originalNextSibling = heroSection.nextElementSibling;
  } else {
    // ASYNC PATH: Create placeholder hero section immediately (optimistic loading)
    heroSection = document.createElement("section");
    heroSection.className = "wm-scroll-away-hero-section wm-scroll-away-hero-section--generated wm-scroll-away-hero-section--loading page-section";

    contentWrapper = document.createElement("div");
    contentWrapper.className = "wm-scroll-away-hero-content";

    heroSection.appendChild(contentWrapper);
    isGeneratedSection = true;
  }

  heroSection.classList.add("wm-scroll-away-hero-section");
  if (config.contentFill) heroSection.classList.add("content-fill");
  page.append(heroSection);

  // Header theme handling
  const headerEl = document.querySelector(config.headerSelector);
  const initialHeaderTheme = headerEl ? headerEl.getAttribute("data-section-theme") : null;
  
  // Set section theme on generated sections
  if (isGeneratedSection) {
    const themeToApply = config.sectionTheme != null ? config.sectionTheme : initialHeaderTheme;
    if (themeToApply) heroSection.setAttribute("data-section-theme", themeToApply);
  }
  
  const heroTheme = heroSection.getAttribute("data-section-theme");
  const applyHeaderTheme = (isHeroActive) => {
    if (!config.syncHeaderTheme) return;
    if (!headerEl || document.body.classList.contains("sqs-edit-mode-active")) return;
    const desiredTheme = isHeroActive ? (heroTheme || initialHeaderTheme) : initialHeaderTheme;
    if (desiredTheme == null || desiredTheme === "") headerEl.removeAttribute("data-section-theme");
    else headerEl.setAttribute("data-section-theme", desiredTheme);
  };

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

  const show = () => {
    heroSection.classList.remove("wm-scroll-away-hero-section--hidden");
    applyHeaderTheme(true);
  };

  const hide = () => {
    heroSection.classList.add("wm-scroll-away-hero-section--hidden");
    applyHeaderTheme(false);
  };

  const isInputFocused = () => {
    const ae = document.activeElement;
    if (!ae) return false;
    if (ae.isContentEditable) return true;
    const tag = ae.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  };

  const updateVisibility = () => {
    if (config.preventHideWhileInputFocused && isInputFocused()) {
      show();
      return;
    }
    if (window.scrollY > threshold) hide();
    else show();
  };

  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });

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
  const bodyObserver = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "class") {
        const classList = document.body.classList;
        if (classList.contains("sqs-is-page-editing")) {
          if (!wmScrollAwayHero.hasDeconstructedForEditMode) {
            wmScrollAwayHero.hasDeconstructedForEditMode = true;
            
            if (isGeneratedSection) {
              // Generated sections can just be removed
              heroSection.remove();
            } else if (originalParent) {
              // Selector-based sections need to be restored to original position
              heroSection.classList.remove("wm-scroll-away-hero-section", "wm-scroll-away-hero-section--hidden", "content-fill");
              heroSection.style.removeProperty("--wm-scroll-away-hero-header-height");
              
              if (originalNextSibling) {
                originalParent.insertBefore(heroSection, originalNextSibling);
              } else {
                originalParent.appendChild(heroSection);
              }
            }
            
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
    heroSection,
    isGeneratedSection,
  };

  // If using selector, we're done (sync path complete)
  if (!isGeneratedSection) return;

  // ASYNC PATH: Fetch data and inject content
  (async function () {
    // Fetch page JSON data
    const fetchPageData = async () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("format", "json");
        const response = await fetch(url.toString());
        if (!response.ok) return null;
        return await response.json();
      } catch (e) {
        console.warn("scroll-away-hero-section: Could not fetch page JSON", e);
        return null;
      }
    };

    // Determine page type from JSON data
    const getPageType = (data) => {
      if (!data) return null;
      if (data.item) {
        const recordTypeLabel = data.item.recordTypeLabel;
        if (recordTypeLabel === "text") return "blog-item";
        if (recordTypeLabel === "portfolio-item") return "portfolio-item";
        return "item";
      }
      if (data.collection) {
        const typeName = data.collection.typeName || "";
        if (typeName.includes("blog")) return "blog-collection";
        if (typeName.includes("portfolio")) return "portfolio-collection";
        return "collection";
      }
      return "page";
    };

    // Get content by keyword from JSON data
    const getContentByKeyword = (keyword, data, pageType) => {
      if (!data) return null;

      const isItemPage = pageType && pageType.endsWith("-item");

      switch (keyword) {
        case "title":
          if (isItemPage && data.item?.title) return { type: "title", value: data.item.title };
          if (data.collection?.title) return { type: "title", value: data.collection.title };
          return null;

        case "excerpt":
          if (isItemPage && data.item?.excerpt) return { type: "excerpt", value: data.item.excerpt };
          if (!isItemPage && data.collection?.description) return { type: "excerpt", value: data.collection.description };
          return null;

        case "seo-title":
          if (data.collection?.seoData?.seoTitle) return { type: "seo-title", value: data.collection.seoData.seoTitle };
          return null;

        case "seo-description":
          if (data.collection?.seoData?.seoDescription) return { type: "seo-description", value: data.collection.seoData.seoDescription };
          return null;

        case "thumbnail":
          if (isItemPage && data.item?.assetUrl) return { type: "thumbnail", value: data.item.assetUrl };
          return null;

        case "site-title":
          if (data.website?.siteTitle) return { type: "site-title", value: data.website.siteTitle };
          return null;

        case "site-description":
          if (data.website?.siteDescription) return { type: "site-description", value: data.website.siteDescription };
          return null;

        default:
          return null;
      }
    };

    // Create HTML element for content item
    const createContentElement = (content) => {
      if (!content || !content.value) return null;

      switch (content.type) {
        case "title":
        case "seo-title":
        case "site-title": {
          const heading = document.createElement(config.titleTagName);
          heading.className = `wm-scroll-away-hero-${content.type}`;
          heading.textContent = content.value;
          return heading;
        }

        case "excerpt":
        case "seo-description":
        case "site-description": {
          const div = document.createElement("div");
          div.className = `wm-scroll-away-hero-${content.type}`;
          div.innerHTML = content.value;
          return div;
        }

        case "thumbnail": {
          const img = document.createElement("img");
          img.className = "wm-scroll-away-hero-thumbnail";
          img.src = content.value;
          img.alt = "";
          img.loading = "eager";
          return img;
        }

        default:
          return null;
      }
    };

    // Get default content keywords based on page type
    const getDefaultKeywords = (pageType) => {
      switch (pageType) {
        case "blog-item":
          return ["excerpt"];
        case "portfolio-item":
          return ["thumbnail"];
        default:
          return null;
      }
    };

    const pageData = await fetchPageData();
    const pageType = getPageType(pageData);

    // Prevent activation on collection pages unless explicitly allowed
    const isCollectionPage = pageType === "blog-collection" || pageType === "portfolio-collection";
    if (isCollectionPage && !config.allowOnCollection) {
      heroSection.remove();
      return;
    }

    // If no attribute specified, use defaults based on page type
    if (!contentKeywords) {
      contentKeywords = getDefaultKeywords(pageType);
      if (!contentKeywords) {
        // No content to show, remove the placeholder
        heroSection.remove();
        return;
      }
    }

    // Build content items
    const contentItems = [];
    for (const keyword of contentKeywords) {
      const content = getContentByKeyword(keyword, pageData, pageType);
      if (content) contentItems.push(content);
    }

    if (contentItems.length === 0) {
      // No content found, remove the placeholder
      heroSection.remove();
      return;
    }

    // Inject content elements
    for (const content of contentItems) {
      const element = createContentElement(content);
      if (element) contentWrapper.appendChild(element);
    }

    // Add icon as last element if enabled
    if (config.showIcon && config.iconHtml) {
      const iconWrapper = document.createElement("div");
      iconWrapper.className = "wm-scroll-away-hero-icon";
      iconWrapper.innerHTML = config.iconHtml;
      contentWrapper.appendChild(iconWrapper);
    }

    // Remove loading state and trigger fade-in
    heroSection.classList.remove("wm-scroll-away-hero-section--loading");
    heroSection.classList.add("wm-scroll-away-hero-section--loaded");
  })();
})();
