import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import {
  createTag, fetchFragment, decorateFragment, animationObserver,
} from '../../scripts/scripts.js';

function getSelectedSlide(block) {
  return block.querySelector('.slide.active');
}
function getSlidePosition(slide) {
  return [...slide.parentElement.children].indexOf(slide) + 1;
}

function moveSlide(block, direction, count) {
  let selectedSlide = getSelectedSlide(block);
  selectedSlide.classList.remove('active');
  if (direction > 0) {
    if (selectedSlide.nextElementSibling) {
      selectedSlide = selectedSlide.nextElementSibling;
    } else {
      selectedSlide = selectedSlide.parentElement.firstElementChild;
    }
  } else if (selectedSlide.previousElementSibling) {
    selectedSlide = selectedSlide.previousElementSibling;
  } else {
    selectedSlide = selectedSlide.parentElement.lastElementChild;
  }
  selectedSlide.classList.add('active');
  // update nav
  count.textContent = `${getSlidePosition(selectedSlide)} of ${block.children.length}`;
}

async function buildProgramFragmentSlide(slide, slideContentPath) {
  if (!slideContentPath) return;
  let fragment = await fetchFragment(slideContentPath);
  fragment = await decorateFragment(fragment);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    slide.append(...fragmentSection.children);
  }
}

async function buildStatsFragmentSlide(slide, path, link) {
  if (!path) return;
  let fragment = await fetchFragment(path);
  fragment = await decorateFragment(fragment);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    const statsGroup = createTag('div', { class: 'stats-group' });
    statsGroup.append(...fragmentSection.children);
    slide.append(statsGroup);
    link.remove();
    // border tags
    const selections = statsGroup.querySelectorAll('.default-content-wrapper p.picture:only-child');
    selections.forEach((selection, selectionId) => {
      selection.classList.add('border', `border-${selectionId}`);
      const img = selection.querySelector('img')?.src;
      selection.style.backgroundImage = `url(${img})`;
      selection.querySelector('picture')?.remove();
    });
  }
}

export default async function decorate(block) {
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'Slides');

  const isProgram = block.classList.contains('program');
  [...block.children].forEach(async (slide, index) => {
    slide.className = 'slide';
    block.setAttribute('role', 'group');
    block.setAttribute('aria-roledescription', 'Slide');
    if (index === 0) {
      slide.classList.add('active');
    }

    if (isProgram) {
      // Program slides (fragments)
      const slideContent = slide.querySelector('a');
      const slideContentPath = slideContent.getAttribute('href');
      slideContent.closest('div').remove();
      await buildProgramFragmentSlide(slide, slideContentPath);
    } else {
      // "Standard slide": create avatar container and set up 'pairs with' view if available
      const avatar = createTag('div', { class: 'avatar' });
      avatar.append(...slide.querySelectorAll('picture'));
      avatar.querySelectorAll('img').forEach((image) => {
        image.closest('picture').replaceWith(createOptimizedPicture(image.src, image.alt, false, [{ width: '275' }]));
      });
      slide.querySelectorAll('p.picture').forEach((p) => p.remove());
      slide.prepend(avatar);

      /* Set up 'pairs with' view, if there are two headers provided. */
      const headers = slide.querySelectorAll('h3');
      if (headers.length === 2) {
        slide.classList.add('hide-pairing');
        const middleDiv = slide.querySelectorAll('div')[1];
        const mainHeader = middleDiv.querySelector('h3');
        if (mainHeader) {
          const toggle = createTag('div', { class: 'toggle-pairs-with animate' });
          toggle.innerHTML = `<button type="button" aria-label="Showcase hover">
              <span class="icon icon-pairs-circle"></span>
              <span class="icon icon-pairs-covered"></span>
              <span class="icon icon-pairs-glass"></span>
          </button>`;
          mainHeader.parentNode.insertBefore(toggle, mainHeader.nextElementSibling);

          const pairedButton = toggle.querySelector('button');
          pairedButton.addEventListener('click', () => {
            slide.classList.toggle('hide-pairing');
            slide.classList.toggle('show-pairing');
          }, { passive: true });
        }

        const pairsWith = createTag('div', {
          class: 'pairs-with animate',
          role: 'group',
        });
        const pairsImages = createTag('div', { class: 'pairs-with-meal animate' });

        const meal = slide.querySelector('picture:last-child');
        pairsImages.append(meal);
        const bottle = avatar.querySelector('picture:last-child').cloneNode(true);
        pairsImages.append(bottle);
        pairsWith.append(pairsImages);

        const pairsText = createTag('div', { class: 'pairs-with-text animate' });
        const header1 = createTag('h3', { class: 'animate' });
        header1.innerText = 'A PERFECT PAIRING:';
        headers[1].innerText = `${headers[0].innerText} + ${headers[1].innerText}`;
        pairsText.append(header1);
        pairsText.append(headers[1]);

        const description = slide.querySelector('p:last-child');
        pairsText.append(description);
        pairsWith.append(pairsText);

        const closePairsView = createTag('div', { class: 'pairs-close' });
        closePairsView.innerHTML = `<button type="button" aria-label="Close view">
              <span class="icon icon-close"></span>
              </button>`;
        const closeButton = closePairsView.querySelector('button');
        closeButton.addEventListener('click', () => {
          slide.classList.toggle('hide-pairing');
          slide.classList.toggle('show-pairing');
        }, { passive: true });
        pairsWith.append(closePairsView);

        slide.append(pairsWith);
      }
    }

    // load stats fragment
    const links = slide.querySelectorAll('a');
    if (links.length === 0) return;
    const link = links[links.length - 1];
    const path = link ? link.getAttribute('href') : slide.textContent.trim();
    await buildStatsFragmentSlide(slide, path, link);
  });

  decorateIcons(block);

  if (block.children.length > 1) {
    // add navigation buttons
    const previousButton = createTag('button', {
      class: 'slide-prev',
      'aria-label': 'Previous slide',
    });
    const nextButton = createTag('button', { class: 'slide-next', 'aria-label': 'Next slide' });
    const slideCount = createTag('p');
    slideCount.textContent = `1 of ${block.children.length}`;

    const navGroup = createTag('div', {
      class: 'slide-nav',
      role: 'group',
      'aria-label': 'Slide controls',
    });
    navGroup.append(previousButton, nextButton, slideCount);

    previousButton.addEventListener('click', () => {
      moveSlide(block, -1, slideCount);
    }, { passive: true });

    nextButton.addEventListener('click', () => {
      moveSlide(block, 1, slideCount);
    }, { passive: true });

    const section = block.closest('.slides-container');
    const slideContent = section?.querySelector('.default-content-wrapper');
    if (slideContent) {
      slideContent.append(navGroup);
      animationObserver.observe(previousButton);
      animationObserver.observe(nextButton);
      animationObserver.observe(slideCount);
    }
  }
}
