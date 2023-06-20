import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

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
  videoElement.play();
  block.append(videoDiv);
}
