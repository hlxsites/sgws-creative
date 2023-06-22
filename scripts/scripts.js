import {
  sampleRUM,
  buildBlock,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForLCP,
  loadBlocks,
  loadFooter,
  loadCSS,
} from './lib-franklin.js';

const LCP_BLOCKS = ['video']; // add your LCP blocks to the list

export const THEME_TOKEN = Object.freeze({
  PRIMARY_COLOR: 'primary-color',
  SECONDARY_COLOR: 'secondary-color',
  NEUTRAL_COLOR: 'neutral-color',
  BACKGROUND_COLOR: 'background-color',
  TEXT_COLOR: 'text-color',
  TEXT_COLOR_BACKGROUND: 'text-color-background',
  SECONDARY_TEXT_COLOR_BACKGROUND: 'secondary-text-color-background',
  HEADING_FONT_SIZE: 'heading-font-size',
  BODY_FONT_SIZE: 'body-font-size',
  HEADING_FONT_FAMILY: 'heading-font-family',
  SECONDARY_HEADING_FONT_FAMILY: 'secondary-heading-font-family',
  BODY_FONT_FAMILY: 'body-font-family',
  SECONDARY_BODY_FONT_FAMILY: 'secondary-body-font-family',
  HEADING_FONT_WEIGHT: 'heading-font-weight',
});

export const animationObserver = new IntersectionObserver((entries) => {
  // Loop over the entries
  entries.forEach((entry) => {
    const { target, isIntersecting } = entry;
    if (!target.closest('.no-animate')) {
      // If the element is visible
      if (isIntersecting) {
        // Add the animation class
        target.classList.add('animate');
      } else {
        target.classList.remove('animate');
      }
    }
  }, { threshold: 0.1 });
});

/**
 * Determine if we are serving content for the block-library, if so don't load the header or footer
 * @returns {boolean} True if we are loading block library content
 */
export function isBlockLibrary() {
  return window.location.pathname.includes('block-library');
}

/**
 * Create an HTML tag in one line of code
 * @param {string} tag Tag to create
 * @param {object} attributes Key/value object of attributes
 * @param {Element} html html to append to tag
 * @returns {HTMLElement} The created tag
 */
export function createTag(tag, attributes, html = undefined) {
  const element = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement || html instanceof SVGElement) {
      element.append(html);
    } else {
      element.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      element.setAttribute(key, val);
    });
  }
  return element;
}

/**
 * Create a video tag with a src, poster and additional attributes.
 * @param src The video source
 * @param poster The video poster
 * @param attributes Additional video tag attributes.
 * @return {HTMLElement}
 */
export function createVideoTag(src, poster, attributes = {}) {
  return createTag('video', { src, poster, ...attributes });
}

/**
 * Create an icon span that is compatible with decorate icons.
 * @param iconName The name of the icon
 * @return {HTMLElement|undefined}
 */
export function createIcon(iconName) {
  if (!iconName) {
    return undefined;
  }
  return createTag('span', { class: `icon icon-${iconName}` });
}

/**
 * Fetch fragment HTML.
 * @param path fragment path
 * @param init request init
 * @return {Promise<HTMLDivElement|null>}
 */
export async function fetchFragment(path, init = {}) {
  const resp = await fetch(`${path}.plain.html`, init);
  if (resp?.ok) {
    const parent = document.createElement('div');
    parent.innerHTML = await resp.text();
    return parent;
  }
  return null;
}

/**
 * Get the parent paths for the current location.
 * eg. '/level1/level2'
 * @param level How many path levels to return.
 * @return {string} The path
 */
export function getParentPath(level = undefined) {
  const pathParts = window.location.pathname.split('/');
  pathParts.shift();
  if (pathParts.length <= level) {
    return '';
  }
  if (!level) {
    pathParts.pop();
    return pathParts.join('/');
  }
  return pathParts.slice(0, level).join('/');
}
async function loadTheme() {
  let theme = {};
  const themeMeta = getMetadata('theme');
  let configPath = getMetadata('themeconfig') || getMetadata('theme-config');
  if (!configPath) {
    if (themeMeta) {
      // use path as theme name
      configPath = `/themes/${themeMeta}.json`;
    } else {
      // use theme.json in first level folder
      const parentPath = getParentPath(1);
      if (parentPath) {
        configPath = `/${parentPath}/theme.json`;
      } else {
        configPath = '/theme.json';
      }
    }
  }
  if (configPath) {
    const resp = await fetch(`${configPath}`);
    if (resp?.ok) {
      const json = await resp.json();
      const tokens = json?.data || json?.page?.data || {};
      const root = document.querySelector(':root');
      tokens.forEach((e) => {
        if (e.token !== 'font') {
          root.style.setProperty(`--${e.token}`, `${e.value}`);
        }
      });
      theme = json || theme;
    }
  }
  // collect custom fonts
  const customFontConfigs = [];
  const sheets = theme[':names'] ? theme[':names'] : [''];
  sheets.forEach((sheetName) => {
    const sheetData = [...(sheetName ? theme[sheetName].data : (theme.data || []))];
    const fonts = sheetData.filter(({ token }) => token === 'font').map(({ value }) => value);
    customFontConfigs.push(...fonts);
  });
  window.sgws = window.sgws || { config: {} };
  window.sgws.config.theme = Object.freeze({ ...theme });
  window.sgws.config.fonts = customFontConfigs;
}
async function loadFonts() {
  const allFonts = window.sgws.config.fonts;
  await Promise.allSettled(allFonts.map((fontConfig) => {
    const [fontFamily, fontUrl, ...fontDescriptors] = fontConfig.split(';');
    if (fontFamily.startsWith('http')) {
      const head = document.getElementsByTagName('head')[0];
      if (head.querySelector(`link[href='${fontFamily}']`)) {
        return Promise.resolve();
      }
      // add stylesheet
      const link = createTag('link', {
        rel: 'stylesheet', type: 'text/css', media: 'all',
      });
      link.href = fontFamily;
      head.appendChild(link);
      return Promise.resolve();
    }
    const fontAlreadyLoaded = document.fonts.check(`10px ${fontFamily}`);
    if (fontAlreadyLoaded) {
      return Promise.resolve();
    }
    const descriptors = fontDescriptors.reduce((obj, pair) => {
      const [descriptorName, descriptorValue] = pair.split('=');
      return { ...obj, [descriptorName]: descriptorValue };
    }, {});
    const fontFace = new FontFace(fontFamily, `url(${fontUrl.trim()})`, { display: 'swap', ...descriptors });
    document.fonts.add(fontFace);
    return fontFace.load();
  }));
}

/**
 * Does the current page include the named theme.
 * @param name Name of the theme
 * @return {boolean}
 */
export function hasTheme(name = 'page') {
  if (name === 'page') {
    return 'data' in window.sgws.config.theme || 'page' in window.sgws.config.theme;
  }
  return name in window.sgws.config.theme;
}

/**
 * Get a named them for the current page.
 * @param name Name of the theme.
 * @return {*} A theme array.
 */
export function getTheme(name = 'page') {
  if (name === 'page' && 'data' in window.sgws.config.theme) {
    return window.sgws.config.theme.data;
  }
  const [, theme] = Object.entries(window.sgws.config.theme).find(([key]) => key === name) || [];
  return theme?.data;
}

/**
 * If appropriate (product page), add a "Back to home" arrow, centered vertically, against the
 * left of the frame.
 * @param main
 */
function buildBackToHome(main) {
  const backToHome = document.body.querySelector('div.back-to-home');
  const template = getMetadata('template');
  if (template === 'product' && !backToHome) {
    const homeElement = createTag('div', { class: 'back-to-home' });

    let homeUrl = '/p/1';
    const pIndex = document.location.href.indexOf('/p/');
    if (pIndex >= 0) {
      homeUrl = `${document.location.href.substr(0, pIndex + 3)}1`;
    }

    // add 'back to home' button
    const homeButton = createTag('a', {
      href: homeUrl,
      'aria-label': 'Go home',
      role: 'button',
    });
    homeButton.append(createIcon('arrow-left'));
    homeElement.append(homeButton);

    decorateIcons(homeElement);
    main.append(homeElement);
  }
}

/**
 * Builds hero block and prepends to main in a new section.
 * Rules for identifying hero block:
 * - first link is used in the hero, and is a video link
 * - to find the div holding the hero, we look at the link's parent div
 * - if the parent has exactly 2 images, it's a foreground video with a background image
 * - otherwise, the first image becomes the video poster, and other images are added in the section
 * @param {Element} main The container element
 */
function buildVideoSection(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const sectionLink = section.querySelector(':scope > p > a');
    if (!sectionLink?.href?.endsWith('.mp4')) return;
    const sectionImages = section.querySelectorAll('picture');
    if (sectionImages.length === 2) {
      // background image and foreground video
      section.textContent = '';
      section.classList.add('highlight', 'background-image');
      const videoBlock = buildBlock('video', [[sectionImages[1], sectionLink]]);
      section.append(sectionImages[0].parentElement, videoBlock);
    } else {
      // background video, with images in foreground
      section.classList.add('background-video');
      section.prepend(buildBlock('video', [[sectionImages[0], sectionLink]]));
      section.querySelectorAll(':scope > p').forEach((p) => !p.children.length && p.remove());
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildVideoSection(main);
    buildBackToHome(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

const INTERNAL_EXPR = [/^\/.+$/i, /^(.*?(\bsgcreative.southernglazers.com\b)[^$]*)$/i];
function decorateExternalLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    const isInternal = INTERNAL_EXPR.some((exp) => exp.test(href));
    if (!isInternal) {
      a.setAttribute('target', '_blank');
    }
  });
}

function decorateBorders(main) {
  const selections = main.querySelectorAll('.section .default-content-wrapper p.picture:only-child');
  selections.forEach((selection, selectionId) => {
    const pre = selection.parentElement.previousElementSibling;
    const post = selection.parentElement.nextElementSibling;
    if (pre && !pre.classList.contains('default-content-wrapper') && post && !post.classList.contains('default-content-wrapper')) {
      selection.classList.add('border', `border-${selectionId}`);
      const img = selection.querySelector('img')?.src;
      selection.style.backgroundImage = `url(${img})`;
      selection.querySelector('picture')?.remove();
    }
  });
}

export function decoratePictureParagraph(main) {
  const pictures = main.querySelectorAll('p > picture:first-of-type, div > picture:first-of-type');
  pictures.forEach((pic) => {
    const siblingPictures = pic.parentElement.querySelectorAll(':scope > picture');
    if (pic.parentElement.children.length === siblingPictures.length) {
      pic.parentElement.classList.add('picture');
    }
  });
}

/**
 * Decorates the background of all highlighted sections.
 * @param {Element} main The container element
 */
export function decorateSectionBackgrounds(main) {
  main.querySelectorAll('.section.highlight').forEach((section) => {
    const backgroundPicture = section.querySelector(
      ':scope > .default-content-wrapper:first-child > p.picture:first-child > picture:first-child',
    );
    // See if first element is a picture - used as the background since section is 'highlighted'
    if (backgroundPicture) {
      section.classList.add('background-image');
      const pictureParent = backgroundPicture.closest('p.picture');
      section.append(backgroundPicture);
      pictureParent.remove();
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
function decorateMain(main) {
  decorateButtons(main);
  decorateExternalLinks(main);
  decorateIcons(main);
  decoratePictureParagraph(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateSectionBackgrounds(main);
  decorateBorders(main);

  // observe animations
  main.querySelectorAll('h1, h2, h3, p:not(.border)').forEach((element) => {
    animationObserver.observe(element);
  });
}

/**
 * Decorate a fragment for inclusion in a page.
 * @param fragment The plain fragment HTML
 * @return {Promise<HTMLElement|null>} Decorated fragment HTML
 */
export async function decorateFragment(fragment) {
  if (!fragment) {
    return null;
  }
  const main = document.createElement('main');
  main.append(...fragment.childNodes);
  decorateMain(main);
  await loadBlocks(main);
  return main;
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  await loadTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);
  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();
  if (!isBlockLibrary()) {
    loadFooter(doc.querySelector('footer'));
  }
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/styles/favicon-empty.ico`);
  // load additional fonts from theme
  await loadFonts();
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
