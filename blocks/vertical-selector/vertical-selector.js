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
  let fragment = await fetchFragment(path);
  fragment = await decorateFragment(fragment);
  return fragment;
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
  const displayedViewer = viewer.querySelector('div.vs-active');

  // Ignore the click if already selected.
  if (displayedViewer && displayedViewer.classList.contains(`fragment-viewer-${index}`)) {
    return;
  }

  // Toggle the icon, in the selector.
  const selector = scope.querySelector('.fragment-selector');
  [...selector.children].forEach((child, childIndex) => {
    if (childIndex === index - 1) {
      child.classList.toggle('vs-active');
    } else {
      child.classList.remove('vs-active');
    }
  });

  if (displayedViewer) {
    displayedViewer.classList.remove('vs-active');
  }
  if (index === 0) {
    // Show the first (default) child again.
    viewer.querySelector('div.default-viewer').classList.add('vs-active');
    closeButton.classList.remove('vs-active');
  } else {
    const showViewer = viewer.querySelector(`div.fragment-viewer-${index}`);
    showViewer.classList.add('vs-active');
    closeButton.classList.add('vs-active');
    window.dispatchEvent(new Event('drawChart'));
    const vertSelector = scope.querySelector('.vertical-selector');
    if (vertSelector) {
      vertSelector.scrollIntoView(true);
    }
  }
}

export default async function decorate(block) {
  const fragmentViewer = createTag('div', { class: 'fragment-viewer', 'aria-label': 'Fragment View' });
  const fragmentSelectors = createTag('div', { class: 'fragment-selector', 'aria-label': 'Fragment View Selectors' });

  [...block.children].forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      // Create default video - first, merged row - and activate (show) it.
      const nextViewer = createTag('div', { class: 'vs-active default-viewer animate' });
      if (appendVideoGroup(row, nextViewer)) {
        block.classList.add('inline-video');
      } else {
        // No video, so just show the row.
        nextViewer.classList.add('vs-bkg');
        nextViewer.replaceChildren(...row.children);
      }
      fragmentViewer.append(nextViewer);
    } else {
      // Set up selector and its fragment.
      const columns = [...row.children];

      const nextSelector = createTag('div', {
        class: `fragment-selector-${rowIndex} animate`,
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

            const viewerHeader = createTag('h2', {});
            viewerHeader.innerHTML = columns[0].innerHTML;

            // setupCharting(block);
            const nextViewer = createTag('div', { class: `fragment-viewer-${rowIndex} animate` });
            nextViewer.append(viewerHeader);
            // If the fragment has a wood table style apply it to the viewer
            if (fragmentSection.querySelector('.wood-table')) {
              nextViewer.classList.add('wood-table');
            }

            nextViewer.append(...fragmentSection.children);
            fragmentViewer.append(nextViewer);
          }
        });
    }
    block.removeChild(row);
  });

  // Button to close overlay
  const closeContainer = createTag('div', { class: 'close-viewer' });
  const closeIcon = createIcon('close');
  closeIcon.classList.add('animate');
  closeIcon.addEventListener('click', () => {
    handleSelectorClick(block, 0);
  });
  closeContainer.append(closeIcon);

  decorateIcons(closeContainer);
  decorateIcons(fragmentSelectors);

  block.append(closeContainer);
  block.append(fragmentViewer);
  block.append(fragmentSelectors);
}
