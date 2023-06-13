import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { createTag } from '../../scripts/scripts.js';

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

function buildProgramSlide(slide, index){
  console.log("Program tab slide: ", index);

  slide.content ='';

  // const images = slide.querySelectorAll('picture');
  // console.log(slide);
  // // first image is background
  // // second image is restaurant logo
  // // last 4 images are products going to bottom



  // const backgroundImage = images[0];
  // backgroundImage.classList.add('slide-background-image');

  // const logoImage = images[1];
  // logoImage.classList.add('slide-logo-image');
}

export default function decorate(block) {
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'Slides');

  [...block.children].forEach((slide, index) => {
    slide.className = 'slide';
    block.setAttribute('role', 'group');
    block.setAttribute('aria-roledescription', 'Slide');
    if (index === 0) {
      slide.classList.add('active');
    }

    // create avatar container
    if(block.classList.contains('program')){
      buildProgramSlide(slide, index);
    } else {
      const avatar = createTag('div', { class: 'avatar' });
      avatar.append(...slide.querySelectorAll('picture'));
      avatar.querySelectorAll('img').forEach((image) => {
        image.closest('picture').replaceWith(createOptimizedPicture(image.src, image.alt, false, [{ width: '275' }]));
      });
      slide.querySelectorAll('p.picture').forEach((p) => p.remove());
      slide.prepend(avatar);
    }
  });

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
    });

    nextButton.addEventListener('click', () => {
      moveSlide(block, 1, slideCount);
    });

    const section = block.closest('.slides-container');
    const slideContent = section?.querySelector('.default-content-wrapper');
    if (slideContent) {
      slideContent.append(navGroup);
    }
  }
}
