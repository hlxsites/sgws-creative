import { getTheme, hasTheme, createTag } from '../../scripts/scripts.js';

export default function decorate(block) {
  const themeName = [...block.closest('.section').classList].find((className) => hasTheme(className));
  getTheme(themeName).forEach(({ token, value }) => {
    block.style.setProperty(`--${token}`, `${value}`);
  });

  const blockChildren = [...block.children];
  block.innerHTML = '';

  const backgroundStyleImage = blockChildren[0].firstElementChild.querySelector('img');
  block.style.backgroundImage = `url(${backgroundStyleImage.src})`;

  /* bottom background image */
  blockChildren[4].querySelector('img').loading = 'eager';

  const contentHolder = createTag('div', { class: 'content-holder' });
  contentHolder.append(blockChildren[1], blockChildren[2], blockChildren[3], blockChildren[4]);
  block.append(contentHolder);
}
