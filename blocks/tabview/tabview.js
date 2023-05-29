import { createTag, fetchFragment, decorateFragment } from '../../scripts/scripts.js';

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
  }
}

export default async function decorate(block) {
  const buttonGroup = createTag('div', { className: 'button-container' });
  const contentGroup = createTag('div', { className: 'content-container' });

  [...block.children].forEach((group) => {
    const [tabPicture, tabContent] = [...group.children];
    if (!tabPicture || !tabContent) {
      // invalid tab view structure
      return;
    }
    const tabButton = createTag('button', {});
    tabButton.append(...tabPicture.children);
    group.replaceChild(tabButton, tabPicture);

    const anchor = tabContent.querySelector('a');
    const contentPath = anchor?.getAttribute('href');
    tabContent.setAttribute('data-path', contentPath || '');
    tabContent.textContent = '';
    tabContent.className = 'tab-content';

    buttonGroup.append(tabButton);
    contentGroup.append(tabContent);
    block.removeChild(group);
  });

  block.append(buttonGroup, contentGroup);

  // load content of first tab (lazy load the rest)
  await loadTabContent(contentGroup.querySelector(':scope > .tab-content'));
}
