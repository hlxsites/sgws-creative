import { USA_MAP } from './usa-map.js';
import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

// also gives the aspect ratio of the map
const MIN_MAP_HEIGHT = 500;
const MIN_MAP_WIDTH = 800;
const MIN_MAP_WIDTH_PX = `${MIN_MAP_WIDTH}px`;

function handleStateDataOverlay(block, data, coordinates) {
  if (!data
    || !data.partners) {
    return;
  }

  let partnersHolder = document.getElementById(`partners-holder-${data.name}`);
  if (partnersHolder) {
    partnersHolder.classList.remove('hidden');
  } else {
    partnersHolder = createTag('div', { class: 'partners-holder', id: `partners-holder-${data.name}` });

    const partnerClickableImages = [];
    let imageToUse = null;
    [...data.partners.children].forEach((partnerItem, index) => {
      if (index % 2 === 0) { // image
        imageToUse = partnerItem.querySelector('img');
      } else { // link
        let clickableImage = partnerItem;
        if (!clickableImage.href) {
          clickableImage = partnerItem.querySelector('a');
        }

        if (!clickableImage) return;
        if (clickableImage.innerText) {
          clickableImage.innerText = '';
        }
        clickableImage.append(createOptimizedPicture(imageToUse.src, imageToUse.alt, false, [{ width: '150' }]));
        partnerClickableImages.push(clickableImage);
      }
    });

    // TODO: Add proper close button to partnersHolder
    const closePartnersView = createTag('div', { class: 'partners-holder-close' });
    closePartnersView.innerHTML = `<button type="button" aria-label="Close partners view">
        <span class="icon icon-close">X</span>
      </button>`;

    partnersHolder.append(closePartnersView, ...partnerClickableImages);
    block.append(partnersHolder);

    closePartnersView.querySelector('button')?.addEventListener('click', () => {
      partnersHolder.classList.add('hidden');
    }, { passive: true });
  }

  const mapWidthMiddle = block.offsetWidth / 2;
  if (coordinates.x >= mapWidthMiddle) {
    partnersHolder.style.left = `calc(${coordinates.x}px)`;
  } else {
    partnersHolder.style.left = `calc(${coordinates.x}px)`;
  }
  const mapHeightMiddle = block.offsetHeight / 2;
  if (coordinates.y >= mapHeightMiddle) {
    partnersHolder.style.top = `calc(${coordinates.y}px)`;
  } else {
    partnersHolder.style.top = `calc(${coordinates.y}px)`;
  }
}

function drawRawMap(block, mapHolder, mapData, mapConfig) {
  window.echarts.registerMap('USA', USA_MAP);
  mapHolder.style.width = `${mapConfig.chartWidth}px`;
  mapHolder.style.height = `${mapConfig.chartHeight}px`;
  const mapChart = window.echarts.init(mapHolder);

  const projection = window.d3.geoAlbersUsa(); // https://github.com/d3/d3-geo#geoAlbersUsa
  const mapRepresentation = {
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: {
        color: [
          'grey',
        ],
      },
      calculable: false,
    },
    emphasis: {
      label: {
        show: true,
      },
    },
    tooltip: {
      trigger: 'item',
      showDelay: 0,
      transitionDuration: 0.2,
      formatter: (params) => {
        if (params.value === 1) {
          return params.data.name;
        }
        return '';
      },
    },
    series: [
      {
        name: 'Continental USA partners',
        type: 'map',
        map: 'USA',
        colorBy: 'series',
        emphasis: {
          disabled: true,
        },
        projection: {
          project: (point) => projection(point),
          unproject: (point) => projection.invert(point),
        },
        selectedMode: false,
        data: mapData,
      },
    ],
  };
  mapChart.setOption(mapRepresentation);
  mapChart.on('click', (params) => {
    handleStateDataOverlay(block, params.data, {
      x: params.event.offsetX + block.offsetLeft + mapHolder.offsetLeft / 2,
      y: params.event.offsetY + block.offsetTop,
    });
  });
}

function drawMap(block, mapHolder, mapData) {
  const mapConfig = {};
  mapConfig.chartWidth = block.clientWidth !== 0 ? block.clientWidth : MIN_MAP_WIDTH_PX;
  mapConfig.chartHeight = Math.floor((mapConfig.chartWidth * MIN_MAP_HEIGHT) / MIN_MAP_WIDTH);
  drawRawMap(block, mapHolder, mapData, mapConfig);
}

let echartsLoaded = false;
export default function decorate(block) {
  const mapData = [];
  [...block.children].forEach((dataItem) => {
    const dataElements = [...dataItem.children];
    mapData.push({
      name: dataElements[0].textContent,
      value: 1,
      partners: dataElements[1],
    });
    dataItem.remove();
  });

  let mapHolder = createTag('div', { class: 'map-holder' });
  block.append(mapHolder);

  setTimeout(() => {
    // Make sure DOM sizes have been computed

    // listen for charting library to be loaded before starting to draw
    // TODO: Make sure d3 is also loaded (fix race condition)
    document.addEventListener(
      'echartsloaded',
      () => {
        echartsLoaded = true;
        drawMap(block, mapHolder, mapData);
      },
    );
  }, 0);

  // TODO: load themes, uses colors from themes like in chart.js

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (echartsLoaded) {
        // TODO: hide all open popups

        // redraw scaled map
        mapHolder.remove();
        mapHolder = createTag('div', { class: 'map-holder' });
        block.append(mapHolder);
        drawMap(block, mapHolder, mapData);
      }
    }, 250);
  });
}
