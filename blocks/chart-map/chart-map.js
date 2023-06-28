import { USA_MAP } from './usa-map.js';
import { createTag, getTheme } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

const MIN_MAP_HEIGHT = 500;
const MIN_MAP_WIDTH = 800;
const MIN_MAP_WIDTH_PX = `${MIN_MAP_WIDTH}px`;

/**
 * Handles the overlay popup listing partners for a state
 * @param {*} block Block holding the map
 * @param {*} data Data to show in the pop-up
 * @param {*} coordinates Coordinates where to place the pop-up
 */
function handleStateDataOverlay(block, data, coordinates) {
  if (!data || !data.partners) return;

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
    const closePartnersView = createTag('div', { class: 'partners-holder-close' });
    const partnersRegion = createTag('div', { class: 'partners-title-region' });
    partnersRegion.textContent = data.name;
    closePartnersView.innerHTML = `<button type="button" aria-label="Close partners view">
        <span class="icon icon-close">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
        viewBox="0 0 96 96" x="0px" y="0px" width="40" height="40" fill="currentColor">
        <path d="M32.444 65.556c-0.512 0-1.024-0.196-1.416-0.584-0.78-0.768-0.78-2.048 0-2.828l31.108-31.096c0.776-0.768 2.048-0.768 2.828 0 0.776 0.768 0.776 2.060 0 2.828l-31.108 31.096c-0.388 0.388-0.9 0.584-1.412 0.584z"/>
        <path d="M63.556 65.556c-0.512 0-1.024-0.196-1.416-0.584l-31.108-31.1c-0.78-0.768-0.78-2.060 0-2.828s2.048-0.768 2.828 0l31.108 31.096c0.78 0.78 0.78 2.060 0 2.828-0.388 0.392-0.896 0.588-1.412 0.588z"/>
        <path d="M48 94c-25.364 0-46-20.64-46-46 0-25.368 20.636-46 46-46s46 20.632 46 46c0 25.36-20.636 46-46 46zM48 6c-23.16 0-42 18.836-42 42 0 23.156 18.84 42 42 42s42-18.844 42-42c0-23.164-18.84-42-42-42z"/>
          </svg>
        </span>
      </button>`;
    partnersHolder.append(closePartnersView, partnersRegion, ...partnerClickableImages);
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

/**
 * Draws a raw map using mapconfig and widths heights from mapConfig
 * @param {*} block Block holding the map
 * @param {*} mapHolder Div holding the map canvas
 * @param {*} mapData Data to show on map
 * @param {*} mapConfig Map configuration (eg. width/height)
 */
function drawRawMap(block, mapHolder, mapData, mapConfig) {
  window.echarts.registerMap('USA', USA_MAP);
  mapHolder.style.width = `${mapConfig.chartWidth}px`;
  mapHolder.style.height = `${mapConfig.chartHeight}px`;
  const mapChart = window.echarts.init(mapHolder);

  // Projection used: https://github.com/d3/d3-geo#geoAlbersUsa
  const projection = window.d3.geoAlbersUsa();
  const mapRepresentation = {
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: {
        color: [
          mapConfig.theme['primary-color'],
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
        itemStyle: {
          areaColor: mapConfig.theme['secondary-color'],
          borderColor: mapConfig.theme['neutral-color'],
          shadowColor: 'rgba(0, 0, 0, 0.15)',
          shadowBlur: 5,
        },
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

/**
 * Sets up config to draw map, then draws map
 * @param {*} block Block holding the map
 * @param {*} mapHolder Div holding the map canvas
 * @param {*} mapData Data to show on map
 */
function drawMap(block, mapHolder, mapData, theme) {
  const mapConfig = {
    theme,
    chartWidth: block.clientWidth !== 0 ? block.clientWidth : MIN_MAP_WIDTH_PX,
  };
  mapConfig.chartHeight = Math.floor((mapConfig.chartWidth * MIN_MAP_HEIGHT) / MIN_MAP_WIDTH);
  drawRawMap(block, mapHolder, mapData, mapConfig);
}

let echartsLoaded = false;
export default function decorate(block) {
  window.hasCharts = true;

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

  const pageTheme = getTheme() || [];
  const theme = pageTheme.reduce((obj, { token, value }) => ({ ...obj, [token]: value }), {});

  setTimeout(() => { // to make sure DOM sizes have been computed
    document.addEventListener(
      'echartsloaded',
      () => {
        echartsLoaded = true;
        drawMap(block, mapHolder, mapData, theme);
      },
    );
  }, 0);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (echartsLoaded) {
        const allStateOverlays = block.getElementsByClassName('partners-holder');
        [...allStateOverlays].forEach((overlay) => {
          overlay.classList.add('hidden');
        });

        // redraw scaled map
        mapHolder.remove();
        mapHolder = createTag('div', { class: 'map-holder' });
        block.prepend(mapHolder);
        drawMap(block, mapHolder, mapData, theme);
      }
    }, 100);
  }, { passive: true });
}
