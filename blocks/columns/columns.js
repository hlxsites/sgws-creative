import { createVideoTag, createTag, animationObserver } from '../../scripts/scripts.js';

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
      if (helpIcon) {
        const parent = helpIcon.closest('p');
        if (parent) {
          const helpBtnDiv = createTag('div', {class: 'has-help'});
          const helpBtnP = createTag('p', {class: 'animate'});

          helpIcon.addEventListener('click', () => {
            helpIcon.classList.toggle('open');
          });
          helpBtnP.append(helpIcon);

          helpBtnDiv.append(parent);
          helpBtnDiv.append(helpBtnP);
          col.append(helpBtnDiv);
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
