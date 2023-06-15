import { getTheme, hasTheme, createTag } from '../../scripts/scripts.js';

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
  const logo = blockChildren[1];
  const mainContent = blockChildren[2];
  const productContent = blockChildren[3];

  block.innerHTML = '';
  const bottomBackgroundImage = blockChildren[0].firstElementChild.firstElementChild;
  const backgroundStyleImage = bottomBackgroundImage.querySelector('img');
  block.style.backgroundImage = `url(${backgroundStyleImage.src})`;

  const contentHolder = createTag('div', { class: 'content-holder' });
  logo.classList.add('logo-row-layout');
  mainContent.classList.add('main-row-layout');
  productContent.classList.add('products-row-layout');
  if (blockChildren.length === 5) {
    const topBackgroundImage = blockChildren[4];
    topBackgroundImage.classList.add('backdrop-image');
    contentHolder.append(logo, mainContent, productContent, topBackgroundImage);
  } else {
    contentHolder.append(logo, mainContent, productContent);
  }

  const themeName = [...document.querySelector('body').classList]
    .find((className) => hasTheme(className));
  const theme = getTheme(themeName);
  theme.forEach(({ token, value }) => {
    block.style.setProperty(`--${token}`, `${value}`);
  });

  block.append(contentHolder);
}
