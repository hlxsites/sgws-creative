import {
  fetchFragment,
  decorateFragment,
} from '../../scripts/scripts.js';

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  let fragment = await fetchFragment(path);
  fragment = await decorateFragment(fragment);
  if (fragment) {
    const fragmentSections = fragment.querySelectorAll(':scope .section');
    const section = block.closest('.section');
    if (fragmentSections.length === 1) {
      // add to section
      section.classList.add(...fragmentSections[0].classList);
      block.closest('.fragment-wrapper').replaceWith(...fragmentSections[0].childNodes);
    } else {
      // replace section
      section.replaceWith(...fragment.childNodes);
    }
  }
}
