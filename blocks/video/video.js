import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

function observeVideo(block, videoElement, rootMargin){
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
    });
  }, {
    root: null,
    rootMargin: rootMargin,
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
  videoElement.autoplay = true;
  videoElement.loop = true;
  videoElement.playsinline = true;
  if (image && image.src) {
    videoElement.poster = image.src;
  }

  videoDiv.appendChild(videoElement);
  block.append(imagePicture);
  videoElement.addEventListener('loadeddata', () => {
    imagePicture.remove();
  });

  block.append(videoDiv);
  if (!block.closest('.section').classList.contains('background-video')) {
    observeVideo(block, videoElement, '0px');
  } else {
    videoElement.addEventListener("loadedmetadata", function (e) {
      observeVideo(block, videoElement, `${videoElement.videoHeight}px`);
    }, true);
  }
}
