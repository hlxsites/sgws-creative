import { getTheme, hasTheme, createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

/**
 * Structure:
 * Background images:
 * - First row (0) is the "deepest" background image
 * - Last row (4) is second deepest background image (optional)
 * *
 * Content:
 * - Second row (1) is logo + logo decorations left and right
 * - Third row (2) is the main text + optional decorations left and right
 * - Fourth row (3) is products left, products right and middle poster text (optional)
 */
export default function decorate(block) {
  const blockChildren = [...block.children];
  blockChildren[3].querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '190' }])));
  const backgroundStyleImage = blockChildren[0].firstElementChild.querySelector('img');

  block.innerHTML = '';
  block.style.backgroundImage = `url(${backgroundStyleImage.src})`;

  /* bottom background image */
  const topBackgroundImage = blockChildren[4];
  topBackgroundImage.querySelector('img').loading = 'eager';

  topBackgroundImage.classList.add('backdrop-image');
  blockChildren[1].classList.add('logo-row-layout');
  blockChildren[2].classList.add('main-row-layout');
  blockChildren[3].classList.add('products-row-layout');

  const contentHolder = createTag('div', { class: 'content-holder' });
  contentHolder.append(blockChildren[1], blockChildren[2], blockChildren[3], topBackgroundImage);
  block.append(contentHolder);

  const themeName = [...block.closest('.section').classList].find((className) => hasTheme(className));
  getTheme(themeName).forEach(({ token, value }) => {
    block.style.setProperty(`--${token}`, `${value}`);
  });
}
