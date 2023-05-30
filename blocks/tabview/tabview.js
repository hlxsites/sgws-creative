import {
  createTag, fetchFragment, decorateFragment, hasTheme, getTheme,
} from '../../scripts/scripts.js';

async function loadTabContent(tab) {
  if (!tab) {
    return;
  }
  const contentPath = tab.getAttribute('data-path');
  let fragment = await fetchFragment(contentPath);
  fragment = await decorateFragment(fragment);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    tab.append(...fragmentSection.children);
    tab.classList.add(...fragmentSection.classList);
    tab.classList.remove('section');
    const tabIndex = [...tab.parentElement.children].indexOf(tab);
    const buttonContainer = tab.closest('.tabview').querySelector('.button-container');
    const tabButton = [...buttonContainer.children].at(tabIndex);
    // apply theme to tab content
    const themeName = [...tab.classList].find((className) => hasTheme(className));
    const theme = getTheme(themeName).data;
    theme.forEach(({ token, value }) => {
      tab.style.setProperty(`--${token}`, `${value}`);
      tabButton?.style.setProperty(`--${token}`, `${value}`);
    });
  }
}

export default async function decorate(block) {
  const buttonGroup = createTag('div', { class: 'button-container' });
  const contentGroup = createTag('div', { class: 'content-container' });

  [...block.children].forEach((group, groupId) => {
    const [tabPicture, tabContent] = [...group.children];
    if (!tabPicture || !tabContent) {
      // invalid tab view structure
      return;
    }
    const tabButton = createTag('button', { role: 'tab', 'aria-selected': groupId === 0 ? 'true' : 'false', 'aria-controls': `tabview${groupId}` });
    tabButton.append(...tabPicture.children);
    group.replaceChild(tabButton, tabPicture);

    tabButton.addEventListener('click', () => {
      buttonGroup.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', 'false');
      });
      tabButton.setAttribute('aria-selected', 'true');
      contentGroup.querySelectorAll(':scope > .tab-content').forEach((content, index) => {
        if ([...buttonGroup.children].indexOf(tabButton) === index) {
          content.classList.add('selected');
        } else {
          content.classList.remove('selected');
        }
      });
    });

    const anchor = tabContent.querySelector('a');
    const contentPath = anchor?.getAttribute('href');
    tabContent.setAttribute('data-path', contentPath || '');
    tabContent.textContent = '';
    tabContent.className = 'tab-content';
    tabContent.setAttribute('id', `tabview${groupId}`);
    tabContent.setAttribute('role', 'tabpanel');

    buttonGroup.append(tabButton);
    contentGroup.append(tabContent);
    block.removeChild(group);
  });

  block.setAttribute('role', 'tablist');
  block.append(buttonGroup, contentGroup);

  // load content of first tab (lazy load the rest)
  const firstTab = contentGroup.querySelector(':scope > .tab-content');
  await loadTabContent(firstTab);
  firstTab.classList.add('selected');

  setTimeout(() => {
    contentGroup.querySelectorAll(':scope > .tab-content:not(:first-child)').forEach((tabContent) => {
      loadTabContent(tabContent);
    });
  }, 3000);
}
