import { getTheme, hasTheme, createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const blockChildren = [...block.children];

  const backgroundStyleImage = blockChildren[0];
  const logo = blockChildren[1];
  const title = blockChildren[2];
  const teaser = blockChildren[3];
  const productRow = blockChildren[4];

  backgroundStyleImage.classList.add('background-image');
  logo.classList.add('logo-row-layout');
  title.classList.add('title-row-layout');
  teaser.classList.add('teaser-row-layout');
  productRow.classList.add('product-row-layout');

  const contentHolder = createTag('div', { class: 'content-holder' });
  contentHolder.append(logo, title, teaser, productRow);
  block.append(backgroundStyleImage, contentHolder);

  const themeName = [...block.closest('.section').classList].find((className) => hasTheme(className));
  getTheme(themeName).forEach(({ token, value }) => {
    block.style.setProperty(`--${token}`, `${value}`);
  });
}
