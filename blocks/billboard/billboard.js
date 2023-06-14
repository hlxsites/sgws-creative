import { getTheme, THEME_TOKEN } from '../../scripts/scripts.js';

/**
 * Structure:
 * Background images:
 * - First row (0) is the "deepest" background image
 * - Last row (4) is second deepest background image (optional)
 * *
 * Content:
 * - Second row (1) is logo + logo decorations left and right
 * - Third row (2) is the main text + optional decorations left and right
 * - Fourth row (3) is product left, product right and optional middle poster text
 */
export default function decorate(block) {
  const pageTheme = getTheme() || [];
  const theme = pageTheme.reduce((obj, { token, value }) => ({ ...obj, [token]: value }), {});

  const blockChildren = [...block.children];
  const bottomBackgroundImage = blockChildren[0].firstElementChild.firstElementChild;
  let topBackgroundImage;
  if(blockChildren.length === 5) {
    topBackgroundImage = blockChildren[blockChildren.length-1];
  }
  const logo = blockChildren[1];
  logo.classList.add('logo-row-layout');
  const mainContent = blockChildren[2];
  mainContent.classList.add('main-row-layout');
  const productContent = blockChildren[3];
  productContent.classList.add('products-row-layout');

  console.log("~~~~~~~~~~~~~")
  // tmp - makes it easier to style and debug
  block.innerHTML = '';
  console.log("~~~~~~~~~~~~~")

  const backgroundStyleImage = bottomBackgroundImage.querySelector('img');
  block.style.backgroundImage = `url(${backgroundStyleImage.src})`;

  const contentHolder = document.createElement('div');
  contentHolder.classList.add('content-holder');

  contentHolder.append(logo, mainContent, productContent);
  if(topBackgroundImage)  {
    const productBackgroundImage = topBackgroundImage.querySelector('img');
    productContent.style.backgroundImage = `url(${productBackgroundImage.src})`;
  }

  block.append(contentHolder);
}
