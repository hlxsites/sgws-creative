import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const blockChildren = [...block.children];
  /* block background image */
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
  blockChildren[3].querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '190' }])));
  contentHolder.append(blockChildren[1], blockChildren[2], blockChildren[3], topBackgroundImage);
  block.append(contentHolder);
}
