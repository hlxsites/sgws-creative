import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

function observeVideo(block, rootMargin) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const videoElement = entry.target.querySelector('video');
      if (entry.isIntersecting) {
        if (!videoElement.autoplay) videoElement.toggleAttribute('autoplay', true);
        if (!videoElement.loop) videoElement.toggleAttribute('loop', true);
        if (!videoElement.playsinline) videoElement.toggleAttribute('playsinline', true);
        videoElement.play();
      } else {
        videoElement.pause();
      }
    });
  }, {
    root: null,
    rootMargin,
    threshold: 0.1,
  });
  observer.observe(block);
}

export default function decorate(block) {
  // only one poster image (before or after the video link)
  const image = block.querySelector('img');
  const imagePicture = image.closest('picture');
  const newImagePicture = createOptimizedPicture(image.src, image.alt, true);
  const posterImage = newImagePicture.querySelector('img');
  posterImage.width = 750;
  posterImage.height = 422;
  imagePicture.remove();
  block.append(newImagePicture);

  // only one video link per block
  const videoLink = block.querySelector('a');
  block.textContent = '';

  const videoDiv = createTag('div', { class: 'video-content' });
  const videoElement = document.createElement('video');
  videoElement.innerHTML = `<source src="${videoLink.href}" type="video/mp4">`;

  videoElement.muted = true;
  videoElement.autoplay = false;
  videoElement.loop = false;
  videoElement.playsinline = false;
  videoElement.preload = 'metadata';
  if (image && image.src) {
    videoElement.poster = image.src;
  }

  videoDiv.appendChild(videoElement);
  block.append(newImagePicture, videoDiv);

  videoElement.addEventListener('loadeddata', () => {
    newImagePicture.classList.add('hidden');
  }, { passive: true });
  if (!block.closest('.section').classList.contains('background-video')) {
    observeVideo(block, '0px');
  } else {
    videoElement.addEventListener('loadedmetadata', () => {
      observeVideo(block, `${videoElement.videoHeight}px`);
    }, { passive: true });
  }
}
