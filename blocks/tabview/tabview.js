import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import {
  createTag, fetchFragment, decorateFragment, hasTheme, getTheme,
} from '../../scripts/scripts.js';

async function loadProgramPanel(panel, programPath, restOfPanel) {
  let fragment = await fetchFragment(programPath);
  fragment = await decorateFragment(fragment);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    const programFragmentElements = [...fragmentSection.children];
    programFragmentElements.forEach((child) => {
      // program content is hidden by default
      child.classList.add('program-content', 'hidden');
    });
    panel.append(...programFragmentElements, restOfPanel);
  }
}

function computeBadgePlacement(programButton, panel) {
  const badgeHolderElement = panel.querySelector('.slides > .slide.active > .stats-group > .columns-wrapper > .stats > div');
  if (!badgeHolderElement) return;
  programButton.style.marginTop = `calc(-${programButton.offsetHeight}px - ${badgeHolderElement.offsetHeight}px)`;
}

async function loadTabPanel(panel) {
  if (!panel) {
    return;
  }

  const dataPaths = panel.getAttribute('data-path').split(',');
  const contentPath = dataPaths[0];
  let fragment = await fetchFragment(contentPath);
  fragment = await decorateFragment(fragment);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    panel.classList.add(...fragmentSection.classList);
    panel.classList.remove('section');
    panel.append(...fragmentSection.children);
    const block = panel.closest('.tabview');
    const tabIndex = [...block.querySelectorAll('[role="tabpanel"]')].indexOf(panel);
    const buttonContainer = block.querySelector('[role="tablist"]');
    const tabButton = [...buttonContainer.children].at(tabIndex);
    // apply theme to tab content
    const themeName = [...panel.classList].find((className) => hasTheme(className));
    const theme = getTheme(themeName);
    theme.forEach(({ token, value }) => {
      panel.style.setProperty(`--${token}`, `${value}`);
      tabButton?.style.setProperty(`--${token}`, `${value}`);
    });
    // process product border
    const border = panel.querySelector(':scope .default-content-wrapper > p.picture');
    const slides = panel.querySelector(':scope .slides-wrapper');
    if (border && slides) {
      const borderNew = createTag('div', { class: 'default-content-wrapper' });
      const borderNewContent = createTag('p', { class: 'border product' });
      borderNewContent.classList.add('picture');
      const img = border.querySelector('img')?.src;
      borderNewContent.style.backgroundImage = `url(${img})`;
      borderNew.append(borderNewContent);
      border.remove();
      slides.parentNode.insertBefore(borderNew, slides);
    }
  }

  if (dataPaths.length > 1) {
    const programButton = document.createElement('div');
    const programButtonText = document.createElement('div');
    const slidesElement = panel.querySelector('.slides-wrapper');
    programButton.classList.add('clickable-program-overlay');
    programButtonText.textContent = 'Click here for suggested programs';
    programButton.append(programButtonText);
    slidesElement.parentNode.insertBefore(programButton, slidesElement.nextSibling);
    const programElements = panel.querySelectorAll('.program-content');
    if (programElements.length === 0) {
      await loadProgramPanel(panel, dataPaths[1], programButton.nextSibling);
    }
    const closeProgramView = createTag('div', { class: 'button-program-close' });
    closeProgramView.classList.add('hidden');
    closeProgramView.innerHTML = `<button type="button" aria-label="Close program view">
        <span class="icon icon-close">
          <svg xmlns="http://www.w3.org/2000/svg"><use href="#icons-sprite-close"></use></svg>
        </span>
      </button>`;
    const closeProgramButton = closeProgramView.querySelector('button');
    const programSlidesWrapper = panel.querySelector('.slides-wrapper.program-content');
    programSlidesWrapper.parentNode.insertBefore(closeProgramView, programSlidesWrapper);
    const nestedSlides = programButton.previousElementSibling;
    nestedSlides.querySelectorAll('.pairs-with-text').forEach((slideText) => {
      slideText.classList.add('pairs-with-text-badge');
    });

    setTimeout(() => {
      computeBadgePlacement(programButton, panel);
    }, 20);
    programButton.addEventListener('click', async () => {
      // show program slide elements
      const programContent = panel.querySelectorAll('.program-content');
      [...programContent].forEach((child) => {
        child.classList.remove('hidden');
      });
      closeProgramView.classList.remove('hidden');
      // hide elements from "default" slide and mark them as slide content
      slidesElement.classList.add('hidden', 'slide-content');
      programButton.classList.add('hidden', 'slide-content');
      slidesElement.previousSibling.classList.add('hidden', 'slide-content');
      slidesElement.previousSibling.previousSibling?.classList.add('hidden', 'slide-content');
    }, { passive: true });
    closeProgramButton.addEventListener('click', () => {
      const programContent = panel.querySelectorAll('.program-content');
      [...programContent].forEach((child) => {
        child.classList.add('hidden');
      });
      closeProgramView.classList.add('hidden');
      const defaultSlideContent = panel.querySelectorAll('.slide-content');
      [...defaultSlideContent].forEach((child) => {
        child.classList.remove('hidden');
      });
    }, { passive: true });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        computeBadgePlacement(programButton, panel);
      }, 20);
    });
  }
}

export default async function decorate(block) {
  const section = block.closest('.tabview-container');
  const heading = section?.querySelector('h2');
  const tabList = createTag('div', { class: 'tabs', role: 'tablist', 'aria-label': heading ? heading.textContent : 'Tab View' });

  [...block.children].forEach((group, groupId) => {
    const [tabPicture, tabContent] = [...group.children];
    if (!tabPicture || !tabContent) {
      // invalid tab view structure
      return;
    }
    const image = tabPicture.querySelector('img');
    const buttonLabel = image?.getAttribute('alt') || `Tab ${groupId + 1}`;
    const tabButton = createTag('button', {
      id: `tab-${groupId}`, role: 'tab', 'aria-selected': groupId === 0 ? 'true' : 'false', 'aria-controls': `tabpanel-${groupId}`, 'aria-label': buttonLabel,
    });
    image.closest('picture').replaceWith(createOptimizedPicture(image.src, image.alt, false, [{ width: '300' }]));
    tabButton.append(...tabPicture.children);
    group.replaceChild(tabButton, tabPicture);

    tabButton.addEventListener('click', () => {
      tabList.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', 'false');
      });
      tabButton.setAttribute('aria-selected', 'true');
      block.querySelectorAll(':scope > [role="tabpanel"]').forEach((panel, index) => {
        if ([...tabList.children].indexOf(tabButton) === index) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    }, { passive: true });

    const anchors = tabContent.querySelectorAll('a');
    const anchor = anchors[0];
    const contentPath = anchor?.getAttribute('href');
    tabContent.textContent = '';
    tabContent.removeAttribute('class');
    tabContent.setAttribute('id', `tabpanel-${groupId}`);
    tabContent.setAttribute('role', 'tabpanel');
    tabContent.setAttribute('aria-labelledby', `tab=${groupId}`);
    if (anchors.length > 1) {
      const dataPath = `${contentPath || ''},${anchors[1].getAttribute('href') || ''}`;
      tabContent.setAttribute('data-path', dataPath);
    } else {
      tabContent.setAttribute('data-path', contentPath || '');
    }

    tabList.append(tabButton);
    block.removeChild(group);
    block.append(tabContent);
  });

  block.prepend(tabList);

  // load content of first tab (lazy load the rest)
  const firstTab = block.querySelector(':scope > [role="tabpanel"]');
  await loadTabPanel(firstTab);
  firstTab.classList.add('active');
  // load the rest lazily
  block.querySelectorAll(':scope > [role="tabpanel"]').forEach((tabPanel, index) => {
    if (index > 0) {
      loadTabPanel(tabPanel);
    }
  });
}
