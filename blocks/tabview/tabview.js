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
    const theme = getTheme(themeName).data;
    theme.forEach(({ token, value }) => {
      panel.style.setProperty(`--${token}`, `${value}`);
      tabButton?.style.setProperty(`--${token}`, `${value}`);
    });
  }
}

export default async function decorate(block) {
  const tabList = createTag('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Tab List' });

  [...block.children].forEach((group, groupId) => {
    const [tabPicture, tabContent] = [...group.children];
    if (!tabPicture || !tabContent) {
      // invalid tab view structure
      return;
    }
    const tabButton = createTag('button', {
      id: `tab-${groupId}`, role: 'tab', 'aria-selected': groupId === 0 ? 'true' : 'false', 'aria-controls': `tabpanel-${groupId}`,
    });
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

    const anchor = tabContent.querySelector('a');
    const contentPath = anchor?.getAttribute('href');
    tabContent.setAttribute('data-path', contentPath || '');
    tabContent.textContent = '';
    tabContent.removeAttribute('class');
    tabContent.setAttribute('id', `tabpanel-${groupId}`);
    tabContent.setAttribute('role', 'tabpanel');
    tabContent.setAttribute('aria-labelledby', `tab=${groupId}`);

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
}
