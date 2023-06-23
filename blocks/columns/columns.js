import { createVideoTag, createTag, animationObserver, createIcon } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  const iconCols = block.querySelectorAll(':scope > div > div > *:first-child:has(span.icon)');
  if (iconCols.length === cols.length) {
    block.classList.add('icon-list');
  }

  // setup image columns and help button
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const videoLink = col.querySelector(':scope a');
      if (videoLink?.href?.endsWith('.mp4')) {
        const videoP = videoLink?.closest('p');
        const posterP = videoP.previousElementSibling;
        const attributes = {
          preload: 'auto',
        };
        const video = createVideoTag(videoLink.href, posterP?.querySelector('img')?.src, attributes);
        const playButton = createTag('button', { class: 'play-button', type: 'button', 'aria-label': 'Play Video' });
        const background = createTag('div', { class: 'video-background' });
        playButton.addEventListener('click', () => {
          video.controls = true;
          video.play();
          playButton.remove();
        });
        const videoGroup = createTag('p', { class: 'video-group' });
        videoGroup.append(video, playButton);
        col.append(videoGroup, background);
        videoP.remove();
        posterP.remove();
        block.classList.add('inline-video');

        animationObserver.observe(videoGroup);
        animationObserver.observe(background);
      }
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }

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

          let imagesRoot = '/p/1';
          const pIndex = document.location.pathname.indexOf('/p/');
          if (pIndex >= 0) {
            imagesRoot = `${document.location.pathname.substr(0, pIndex)}/images`;
          }

          const navDiv = createTag('div', { class: 'nav-help animate' });
          const img = createTag('img', {
            src: `${imagesRoot}/media_1b2d0c5c923af03695467204154a13945c5e1da53.jpeg`,
            alt: 'Navigation help',
            'aria-label': 'Navigation help',
          });
          navDiv.append(img);

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
  const backgroundPicture = block.querySelector(':scope > div > .columns-img-col');
  if (backgroundPicture) {
    const pictureParent = backgroundPicture.parentElement;
    const img = backgroundPicture.querySelector('img');
    pictureParent.remove();
    block.firstElementChild.style.backgroundImage = `url(${img.src})`;
    block.classList.add('background-image');
  }
}
