import { readBlockConfig, decorateIcons, decorateButtons } from '../../scripts/lib-franklin.js';
import { fetchFragment, decoratePictureParagraph, getParentPath } from '../../scripts/scripts.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);

  if (!cfg.footer && block.textContent) {
    return;
  }

  block.textContent = '';

  const mainFooterSection = document.querySelector('main .section.footer-container');

  if (mainFooterSection) {
    // move footer content
    const mainFooter = mainFooterSection.querySelector('.block.footer');
    block.append(...mainFooter.childNodes);
    mainFooter.remove();
  } else {
    // fetch footer content
    const parentPath = getParentPath(1);
    const footerPath = cfg.footer || `/${parentPath}/footer`;
    const footer = await fetchFragment(footerPath, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

    if (footer) {
      decorateButtons(footer);
      decorateIcons(footer);
      decoratePictureParagraph(footer);
      block.append(footer);
    }
  }

  const observer = new IntersectionObserver((entries) => {
    // Loop over the entries
    entries.forEach((entry) => {
      // If the element is visible
      if (entry.isIntersecting) {
        // Add the animation class
        entry.target.classList.add('animate');
      } else {
        entry.target.classList.remove('animate');
      }
    }, { threshold: 0.1 });
  });

  observer.observe(block.querySelector('p.picture'));
}
