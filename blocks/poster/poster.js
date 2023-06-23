import { getTheme, hasTheme, createTag } from '../../scripts/scripts.js';

export default function decorate(block) {
  const blockChildren = [...block.children];

  const stylingImages = blockChildren[0];
  const backgroundImage = stylingImages.children[0].querySelector('img');
  const posterImage = stylingImages.children[1];
  block.style.backgroundImage = `url(${backgroundImage.src})`;
  stylingImages.remove();

  const logo = blockChildren[1];
  const title = blockChildren[2];
  const teaser = blockChildren[3];
  const productRow = blockChildren[4];

  logo.classList.add('logo-row-layout');
  title.classList.add('title-row-layout');
  teaser.classList.add('teaser-row-layout');
  productRow.classList.add('product-row-layout');

  const imageHolder = createTag('div', { class: 'poster-image-holder' });
  const contentHolder = createTag('div', { class: 'content-holder' });
  contentHolder.append(logo, title, teaser, productRow);

  imageHolder.append(posterImage);
  block.append(contentHolder, imageHolder);

  const themeName = [...block.closest('.section').classList].find((className) => hasTheme(className));
  getTheme(themeName).forEach(({ token, value }) => {
    block.style.setProperty(`--${token}`, `${value}`);
  });
}
