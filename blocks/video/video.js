export default function decorate(block) {
  let posterImage = null;

  block.querySelectorAll('img').forEach((image) => {
    const imageHolderParagraph = image.closest('p');
    imageHolderParagraph.remove();
    posterImage = image.src;
  });

  block.querySelectorAll('a').forEach((videoLink) => {
    const divToReplace = videoLink.closest('div').parentNode;
    const videoDiv = document.createElement('div');

    videoDiv.classList.add('video-content');
    const videoElement = document.createElement('video');
    videoElement.innerHTML = `<source src="${videoLink.href}" type="video/mp4">`;

    videoElement.muted = true;
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.playsinline = true;
    videoElement.poster = posterImage;

    videoDiv.appendChild(videoElement);
    block.append(videoDiv);
    divToReplace.remove();

    videoElement.play();
  });
}
