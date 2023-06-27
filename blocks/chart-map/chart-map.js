import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';
import { getTheme, THEME_TOKEN } from '../../scripts/scripts.js';

const MIN_MAP_HEIGHT = '400px';

function drawMap() {
}

let echartsLoaded = false;
export default function decorate(block) {
  const mapData = [];
  [...block.children].forEach((dataItem) => {
    const dataElements = [...dataItem.children]
    mapData.push({
      name: dataElements[0].textContent,
      value: 1,
      partners: dataElements[1],
    });
    dataItem.remove();
  });

  let mapHolder = document.createElement('div');
  mapHolder.classList.add('map-holder');
  block.append(mapHolder);

  // listen for charting library to be loaded before starting to draw
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawMap();
    },
  );

  // let resizeTimeout;
  // window.addEventListener('resize', () => {
  //   clearTimeout(resizeTimeout);
  //   resizeTimeout = setTimeout(() => {
  //     if (echartsLoaded) {
  //       // redraw scaled chart
  //       mapHolder.remove();
  //       mapHolder = document.createElement('div');
  //       block.append(mapHolder);
  //       drawMap();
  //     }
  //   }, 500);
  // });
}