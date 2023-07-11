import { readBlockConfig, decorateIcons, decorateButtons } from '../../scripts/lib-franklin.js';
import {
  fetchFragment,
  decoratePictureParagraph,
  getParentPath,
  createTag,
  createIcon,
} from '../../scripts/scripts.js';

const MAX_SOURCES = 17;

function getPageCount(block) {
  const sourcePages = block.querySelectorAll('.sources ol > li');
  return Math.ceil(sourcePages.length / MAX_SOURCES);
}
function showSources(block, direction, count) {
  const fullList = [...block.querySelectorAll('.sources ol > li')];
  const activeSet = fullList.filter((item) => item.classList.contains('active'));
  let startIndex = 0;
  if (direction > 0) {
    const lastSelected = activeSet.slice(-1)[0];
    startIndex = fullList.findIndex((item) => item === lastSelected) + 1;
    if (startIndex >= fullList.length) {
      return;
    }
  } else {
    const [firstSelected] = activeSet;
    if (firstSelected === fullList[0]) {
      return;
    }
    startIndex = fullList.findIndex((item) => item === firstSelected) - MAX_SOURCES;
    if (startIndex < 0) {
      startIndex = 0;
    }
  }

  activeSet.forEach((item) => item.classList.remove('active'));

  fullList.slice(startIndex, startIndex + MAX_SOURCES).forEach((item) => item.classList.add('active'));

  // update nav
  const numPages = getPageCount(block);
  count.textContent = `${Math.ceil((startIndex + 1) / MAX_SOURCES)} of ${numPages}`;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);

  if (!cfg.footer && block.textContent) {
    return;
  }

  block.textContent = '';

  const mainFooterSection = document.querySelector('main .section.footer-container');
  if (mainFooterSection && !cfg.footer) {
    // move footer content
    const mainFooter = mainFooterSection.querySelector('.block.footer');
    block.append(...mainFooter.childNodes);
    mainFooterSection.remove();
  } else {
    // fetch footer content
    const parentPath = getParentPath(1);
    const footerPath = cfg.footer || parentPath ? `/${parentPath}/footer` : '/footer';
    const footerFrag = await fetchFragment(footerPath, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});
    if (footerFrag) {
      decorateButtons(footerFrag);
      decorateIcons(footerFrag);
      decoratePictureParagraph(footerFrag);
      block.append(footerFrag);
    }
  }

  // perform additional decoration under footer tag
  const footer = document.querySelector('footer');
  if (!footer?.contains(block)) {
    return;
  }

  let observerElementQuery = 'h2, p';

  const sources = block.querySelector('.sources');
  if (sources) {
    const viewSourceBtn = createTag('p', { class: 'button-container' });
    viewSourceBtn.innerHTML = '<button class="primary">View Presentation Sources</button>';

    viewSourceBtn.addEventListener('click', () => {
      sources.classList.add('open');
    });

    const buttonSibling = block.querySelector('.footer-content p.button-container');
    buttonSibling.parentElement.insertBefore(viewSourceBtn, buttonSibling.nextElementSibling);

    const sourcesHeader = createTag('div', { class: 'header' });
    const sourcesTitle = sources.querySelector('h2');
    sourcesTitle.parentElement.prepend(sourcesHeader);

    const closeBtn = createTag('button', { class: 'close' });
    closeBtn.append(createIcon('close'));

    closeBtn.addEventListener('click', () => {
      sources.classList.remove('open');
    });

    // add navigation buttons
    const previousButton = createTag('a', {
      href: '#',
      class: 'sources-prev',
      'aria-label': 'Previous sources',
      role: 'button',
    });
    previousButton.append(createIcon('arrow-small'));
    const nextButton = createTag('a', {
      href: '#', class: 'sources-next', 'aria-label': 'More sources', role: 'button',
    });
    nextButton.append(createIcon('arrow-small'));
    const pageCount = createTag('p');

    const navGroup = createTag('div', {
      class: 'sources-nav',
      role: 'group',
      'aria-label': 'Source page controls',
    });
    navGroup.append(previousButton, nextButton, pageCount);

    previousButton.addEventListener('click', (e) => {
      e.preventDefault();
      showSources(block, -1, pageCount);
    });

    nextButton.addEventListener('click', (e) => {
      e.preventDefault();
      showSources(block, 1, pageCount);
    });

    sourcesHeader.append(sourcesTitle, navGroup, closeBtn);

    showSources(block, 0, pageCount);
    decorateIcons(sources);
  } else {
    const lastNavElement = block.querySelector('.product .footer > div > div:last-child');
    if (lastNavElement) {
      const nav = lastNavElement.querySelector(':first-child > :first-child');
      if (nav && nav.nodeName === 'A') {
        lastNavElement.classList.add('product-footer-nav');
        lastNavElement.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = nav.href;
        });

        const returnNav = createTag('div', {
          'aria-label': 'Return',
        });
        const returnIcon = createIcon('arrow-left');
        returnNav.append(returnIcon);

        const paragraphs = block.querySelectorAll('p');
        paragraphs.forEach((p) => {
          p.classList.add('no-animate');
        });

        const textP = createTag('p', { class: 'no-animate' });
        textP.textContent = nav.textContent;
        nav.parentNode.append(textP);
        returnNav.append(nav.parentNode);
        nav.remove();
        lastNavElement.append(returnNav);
      }
      decorateIcons(lastNavElement);

      observerElementQuery = 'div.picture';
    }
  }

  const observer = new IntersectionObserver((entries) => {
    // Loop over the entries
    entries.forEach((entry) => {
      const elements = entry.target.querySelectorAll(observerElementQuery);
      elements.forEach((el) => {
        // If the element is visible
        if (entry.isIntersecting) {
          // Add the animation class
          el.classList.add('animate');
        } else {
          el.classList.remove('animate');
        }
      });
    });
  });

  if (block.firstElementChild) {
    observer.observe(block.firstElementChild);
  }
}
