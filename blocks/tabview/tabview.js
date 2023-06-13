import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import {
  createTag, fetchFragment, decorateFragment, hasTheme, getTheme,
} from '../../scripts/scripts.js';

async function loadTabPanel(panel) {
  if (!panel) {
    return;
  }
  const contentPath = panel.getAttribute('data-path');
  let fragment = await fetchFragment(contentPath);
  fragment = await decorateFragment(fragment);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    panel.append(...fragmentSection.children);
    panel.classList.add(...fragmentSection.classList);
    panel.classList.remove('section');
    const block = panel.closest('.tabview');
    const tabIndex = [...block.querySelectorAll('[role="tabpanel"]')].indexOf(panel);
    const buttonContainer = block.querySelector('[role="tablist"]');
    const tabButton = [...buttonContainer.children].at(tabIndex);
    // apply theme to tab content
    const themeName = [...panel.classList].find((className) => hasTheme(className));
    const theme = getTheme(themeName);
    if(theme){
      theme.forEach(({ token, value }) => {
        panel.style.setProperty(`--${token}`, `${value}`);
        tabButton?.style.setProperty(`--${token}`, `${value}`);
      });
    }
  }

  const programPath = panel.getAttribute('program-path');
  if(programPath){
    console.log("Fetching program fragment")
    const programButton = document.createElement('div');
    programButton.classList.add('clickable-program-overlay');
    const programButtonText = document.createElement('div');
    programButtonText.textContent = 'Click here for suggested programs';
    const slidesElement = panel.querySelector('.slides-wrapper');
    const slidesElementParent = slidesElement.parentNode;
    programButton.append(programButtonText);
    slidesElementParent.insertBefore(programButton, slidesElement);
  }
}

async function loadTabOverlay(block) {
}

function placeProgramOverlay(block) {
  const slidesElement = block.querySelector('.slides-wrapper');
  const slidesWrapper = window.getComputedStyle(slidesElement);
  const borderWrapper = window.getComputedStyle(slidesElement.nextSibling);
  const programTriangle = block.querySelector('.clickable-program-overlay');
  const programTriangleStyles = window.getComputedStyle(programTriangle);

  console.log(slidesElement.nextSibling)
  const marginTopTriangle =
  parseFloat(slidesWrapper.height)
  + parseFloat(borderWrapper.height) / 2.0
  - parseFloat(programTriangleStyles.height);
  programTriangle.style.marginTop = `${Math.ceil(marginTopTriangle)}px`;
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
    });

    const anchors = tabContent.querySelectorAll('a');
    const anchor = anchors[0];
    const contentPath = anchor?.getAttribute('href');
    tabContent.textContent = '';
    tabContent.removeAttribute('class');
    tabContent.setAttribute('id', `tabpanel-${groupId}`);
    tabContent.setAttribute('role', 'tabpanel');
    tabContent.setAttribute('aria-labelledby', `tab=${groupId}`);
    tabContent.setAttribute('data-path', contentPath || '');
    if(anchors.length > 1){
      tabContent.setAttribute('program-path', anchors[1].getAttribute('href') || '');
    }

    tabList.append(tabButton);
    block.append(tabContent);
    block.removeChild(group);
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

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      placeProgramOverlay(block);
    }, 150);
  });
  setTimeout(() => {
    placeProgramOverlay(block);
  }, 0);
}
