import { readBlockConfig, decorateIcons, decorateButtons } from '../../scripts/lib-franklin.js';
import { fetchFragment, decoratePictureParagraph } from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = cfg.footer || '/footer';
  const footer = await fetchFragment(footerPath, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (footer) {
    decorateButtons(footer);
    decorateIcons(footer);
    decoratePictureParagraph(footer);
    block.append(footer);
  }
}
