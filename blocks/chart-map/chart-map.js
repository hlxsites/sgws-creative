import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';
import { getTheme, THEME_TOKEN } from '../../scripts/scripts.js';

const MIN_MAP_HEIGHT = '400px';


function drawMap(){
}

let echartsLoaded = false;
export default function decorate(block) {
  let mapHolder = document.createElement('div');
  block.append(mapHolder);

  const pageTheme = getTheme() || [];
  const theme = pageTheme.reduce((obj, { token, value }) => ({ ...obj, [token]: value }), {});

  // listen for charting library to be loaded before starting to draw
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawMap();
    },
  );

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (echartsLoaded) {
        // redraw scaled chart
        mapHolder.remove();
        mapHolder = document.createElement('div');
        block.append(mapHolder);
        drawMap();
      }
    }, 500);
  });
}