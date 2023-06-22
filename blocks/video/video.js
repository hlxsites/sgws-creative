import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

function observeVideo(block, rootMargin) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const videoElement = entry.target.querySelector('video');
      videoElement.autoplay = true;
      videoElement.loop = true;
      videoElement.playsinline = true;
      if (entry.isIntersecting) {
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
  imagePicture.replaceWith(createOptimizedPicture(image.src, image.alt, true, [{ width: window.innerWidth || '1400' }]));
  block.append(imagePicture);

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
    // force use of webp for posters
    let newUrl = image.src.replace('.png', '.webp');
    newUrl = newUrl.replace('format=png', 'format=webp');
    videoElement.poster = newUrl;
  }

  videoDiv.appendChild(videoElement);
  block.append(imagePicture, videoDiv);

  videoElement.addEventListener('loadeddata', () => {
    imagePicture.remove();
  }, { passive: true });

  if (!block.closest('.section').classList.contains('background-video')) {
    observeVideo(block, '0px');
  } else {
    videoElement.addEventListener('loadedmetadata', () => {
      observeVideo(block, `${videoElement.videoHeight}px`);
    }, { passive: true });
  }
}
