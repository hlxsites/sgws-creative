import {
  createVideoTag,
  createTag,
  animationObserver,
  createIcon,
} from '../../scripts/scripts.js';
import { createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';

function processCellPicture(cell, imgClassName) {
  const pic = cell.querySelector('picture');
  if (pic) {
    const picWrapper = pic.closest('div');
    if (picWrapper && picWrapper.children.length === 1) {
      // picture is only content in column
      picWrapper.classList.add('columns-img-col');
      if (imgClassName) {
        picWrapper.classList.add(imgClassName.trim());
      }
    }
  }
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  const iconCols = block.querySelectorAll(':scope > div > div > *:first-child:has(span.icon)');
  if (iconCols.length === cols.length) {
    block.classList.add('icon-list');
  }

  // Process Banner (single) row (linkable logos, etc.)
  if (block.classList.contains('banner')) {
    const firstRow = block.querySelector(':first-child');
    const bannerCols = [...firstRow.children];
    if (bannerCols.length === 2) {
      processCellPicture(bannerCols[0], 'animate');

      const linkP = bannerCols[1].querySelector('p:last-child');
      const bannerLink = linkP.innerText;
      bannerCols[1].removeChild(linkP);

      firstRow.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(bannerLink, '_columnsLink');
      });
    }

    return;
  }

  // setup image columns and help button
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const videoLink = col.querySelector(':scope a');
      if (videoLink?.href?.endsWith('.mp4')) {
        const videoP = videoLink?.closest('p');
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
        col.append(videoGroup, background);
        videoP.remove();
        posterP.remove();
        block.classList.add('inline-video');

        animationObserver.observe(videoGroup);
        animationObserver.observe(background);
      }

      processCellPicture(col);

      const helpIcon = col.querySelector(':scope span.icon-help');
      const tabView = document.querySelector('div.tabview');
      if (helpIcon && tabView) {
        const parent = helpIcon.closest('p');
        if (parent) {
          const helpDiv = createTag('div', { class: 'has-help' });
          const helpP = createTag('p', { class: 'animate' });

          helpIcon.addEventListener('click', () => {
            helpIcon.closest('div.columns-wrapper').classList.toggle('help-open');
            tabView.classList.toggle('help-open');
          });
          helpP.append(helpIcon);

          helpDiv.append(parent);
          helpDiv.append(helpP);
          col.append(helpDiv);

          // Image to overlay
          const navDiv = createTag('div', { class: 'nav-help animate' });
          const img = createOptimizedPicture(
            'https://main--sgws-creative--hlxsites.hlx.page/bloominbrands/images/help-nav.jpg',
            'Navigation help',
            false,
          );
          navDiv.append(img);

          // Button to close overlay
          const closeIcon = createIcon('close');
          closeIcon.classList.add('nav-help-close', 'animate');
          closeIcon.addEventListener('click', () => {
            helpIcon.closest('div.columns-wrapper').classList.remove('help-open');
            tabView.classList.remove('help-open');
          });
          block.parentNode.append(closeIcon);
          decorateIcons(block.parentNode);

          block.parentNode.append(navDiv);
        }
      }
    });
  });

  // stats background image
  if (block.classList.contains('stats')) {
    const backgroundPicture = block.querySelector(':scope > div > .columns-img-col');
    if (backgroundPicture) {
      const pictureParent = backgroundPicture.parentElement;
      const img = backgroundPicture.querySelector('img');
      pictureParent.remove();
      block.firstElementChild.style.backgroundImage = `url(${img.src})`;
      block.classList.add('background-image');
    }
  }
}
