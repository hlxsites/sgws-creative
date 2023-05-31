import { createTag } from '../../scripts/scripts.js';

export default function decorate(block) {
  // only one poster image (before or after the video link)
  const image = block.querySelector('img');

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
  videoElement.poster = image.src || '';

  videoDiv.appendChild(videoElement);
  block.append(videoDiv);

  videoElement.play();
}
