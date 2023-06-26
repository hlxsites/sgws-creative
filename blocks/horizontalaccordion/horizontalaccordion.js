import {
  createVideoTag,
  createTag,
  createIcon,
  animationObserver,
  fetchFragment,
  decorateFragment,
} from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

async function loadFragment(cell) {
  const link = cell.querySelector('a');
  const path = link ? link.getAttribute('href') : cell.textContent.trim();
  const fragment = await fetchFragment(path);
  return decorateFragment(fragment);
}

function appendVideoGroup(cell, target) {
  const videoLink = cell.querySelector(':scope a');
  if (!videoLink?.href?.endsWith('.mp4')) {
    return false;
  }
  const videoP = videoLink?.closest('p');
  if (!videoP) {
    return false;
  }
  const posterP = videoP.previousElementSibling;
  const posterImage = posterP?.querySelector('img');
  const attributes = {
    preload: 'none',
  };

  const video = createVideoTag(videoLink.href, posterImage?.src, attributes);
  const playButton = createTag('button', {
    class: 'play-button',
    type: 'button',
    'aria-label': 'Play Video',
  });
  const background = createTag('div', { class: 'video-background' });
  playButton.addEventListener('click', () => {
    video.controls = true;
    video.play();
    playButton.remove();
  }, { passive: true });
  const videoGroup = createTag('p', { class: 'video-group' });
  videoGroup.append(video, playButton);
  target.append(videoGroup, background);
  videoP.remove();
  posterP.remove();

  animationObserver.observe(videoGroup);
  animationObserver.observe(background);

  return true;
}

function handleSelectorClick(scope, index) {
  const viewer = scope.querySelector('.fragment-viewer');
  const closeButton = scope.querySelector('span.icon-close');
  const displayedViewer = viewer.querySelector('div.active');
  const wasAlreadyDisplayed = displayedViewer.classList.contains(`fragment-viewer-${index}`);
  if (displayedViewer) {
    displayedViewer.classList.remove('active');
  }
  if (wasAlreadyDisplayed || index === 0) {
    // Show the first (default) child again.
    viewer.firstChild.classList.add('active');
    closeButton.classList.remove('active');
  } else {
    viewer.querySelector(`div.fragment-viewer-${index}`).classList.add('active');
    closeButton.classList.add('active');
  }

  const selector = scope.querySelector('.fragment-selector');
  [...selector.children].forEach((child, childIndex) => {
    if (childIndex === index - 1) {
      child.classList.toggle('active');
    } else {
      child.classList.remove('active');
    }
  });

  closeButton.scrollIntoView(true);
}

export default async function decorate(block) {
  const fragmentViewer = createTag('div', { class: 'fragment-viewer', 'aria-label': 'Fragment View' });
  const fragmentSelectors = createTag('div', { class: 'fragment-selector', role: 'tablist', 'aria-label': 'Fragment View Selectors' });

  [...block.children].forEach((row, rowIndex) => {
    // Create default video - first, merged row.
    if (rowIndex === 0) {
      const nextViewer = createTag('div', { class: 'active animate' });
      if (appendVideoGroup(row, nextViewer)) {
        block.classList.add('inline-video');
        fragmentViewer.appendChild(nextViewer);
      }
      block.removeChild(block.firstElementChild);
    } else {
      // Set up selector and the fragment.
      const columns = [...row.children];

      const nextSelector = createTag('div', {
        class: `fragment-selector-${rowIndex} animate`,
        role: 'tablist',
        'aria-label': `Fragment View Selector ${rowIndex}`,
      });
      const selectorText = createTag('p', {});
      selectorText.innerHTML = `#${rowIndex}: ${columns[0].innerHTML}`;
      nextSelector.append(selectorText);

      const nextSelectorIcon = createTag('div', {});
      nextSelectorIcon.append(createIcon('arrow-small'));
      nextSelectorIcon.append(createIcon('check'));
      nextSelector.append(selectorText);
      nextSelector.append(nextSelectorIcon);

      nextSelector.addEventListener('click', () => {
        handleSelectorClick(block, rowIndex);
      });
      fragmentSelectors.append(nextSelector);

      loadFragment(columns[1])
        .then((fragment) => {
          if (fragment) {
            const fragmentSection = fragment.querySelector(':scope .section');
            fragmentSection.classList.add(`fragment-viewer-${rowIndex}`);

            // setupCharting(block);
            const nextViewer = createTag('div', { class: `fragment-viewer-${rowIndex} animate` });
            nextViewer.append(...fragmentSection.children);
            fragmentViewer.append(nextViewer);
            block.removeChild(block.firstElementChild);
          }
        });
    }
  });

  // Button to close overlay
  const closeButton = createTag('div', { class: 'close-viewer', 'aria-label': 'Close Fragment View' });
  const closeIcon = createIcon('close');
  closeIcon.classList.add('animate');
  closeIcon.addEventListener('click', () => {
    handleSelectorClick(block, 0);
  });
  closeButton.append(closeIcon);

  decorateIcons(closeButton);
  decorateIcons(fragmentSelectors);

  block.append(closeButton);
  block.append(fragmentViewer);
  block.append(fragmentSelectors);
}
