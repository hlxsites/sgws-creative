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

const LCP_BLOCKS = []; // add your LCP blocks to the list

export function getParentPath(level = undefined) {
  const pathParts = window.location.pathname.split('/');
  pathParts.shift();
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
      configPath = `/${getParentPath(1)}/theme.json`;
    }
  }

  if (configPath) {
    const resp = await fetch(`${configPath}`);
    if (resp?.ok) {
      const json = await resp.json();
      const tokens = json?.data || json?.theme?.data || {};
      const root = document.querySelector(':root');
      tokens.forEach((e) => {
        root.style.setProperty(`--${e.token}`, `${e.value}`);
      });
      theme = json || theme;
    }
  }
  window.sgws = window.sgws || {};
  window.sgws.config = theme;
}

export function hasTheme(name) {
  return name in window.sgws.config;
}
export function getTheme(name) {
  const [, theme] = Object.entries(window.sgws.config).find(([key]) => key === name) || [];
  return theme;
}
export function getRawTheme() {
  return window.sgws?.config?.theme?.data || window.sgws?.config?.data;
}

/**
 * Create an HTML tag in one line of code
 * @param {string} tag Tag to create
 * @param {object} attributes Key/value object of attributes
 * @returns {HTMLElement} The created tag
 */
export function createTag(tag, attributes) {
  const element = document.createElement(tag);
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      element.setAttribute(key, val);
    });
  }
  return element;
}

export function createIcon(iconName) {
  if (!iconName) {
    return undefined;
  }
  const element = document.createElement('span');
  element.classList.add('icon', `icon-${iconName}`);
  return element;
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
      section.classList.add('highlight', 'background-image');
      section.textContent = '';
      const videoBlock = buildBlock('video', [[sectionImages[1], sectionLink]]);

      section.append(sectionImages[0].parentElement, videoBlock);
    } else {
      // background video, with images in foreground
      section.classList.add('background-video');
      const videoBlock = buildBlock('video', [[sectionImages[0], sectionLink]]);

      section.prepend(videoBlock);
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
      selection.classList.add(`border-${selectionId}`);
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
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateExternalLinks(main);
  decorateIcons(main);
  decoratePictureParagraph(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateSectionBackgrounds(main);
  decorateBorders(main);
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
  link.type = 'image/png';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.replaceWith(link);
  } else {
    document.head.append(link);
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

  // loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  // addFavIcon(`${window.hlx.codeBasePath}/styles/favicon.png`);
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
