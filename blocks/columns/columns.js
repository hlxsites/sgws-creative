import { createVideoTag, createTag, animationObserver } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const images = block.querySelectorAll('img');
  [...images].forEach((image) => {
    image.closest('picture').replaceWith(createOptimizedPicture(image.src, image.alt, false, [{ width: Math.ceil(window.innerWidth / 1.80) }]));
  });

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  const iconCols = block.querySelectorAll(':scope > div > div > *:first-child:has(span.icon)');
  if (iconCols.length === cols.length) {
    block.classList.add('icon-list');
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const videoLink = col.querySelector(':scope a');
      if (videoLink?.href?.endsWith('.mp4')) {
        const videoP = videoLink?.closest('p');
        const posterP = videoP.previousElementSibling;
        const posterImage = posterP?.querySelector('img');
        const video = createVideoTag(videoLink.href, posterImage?.src, {});
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
