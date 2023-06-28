import { USA_MAP } from './usa-map.js';
import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

// also gives the aspect ratio of the map
const MIN_MAP_HEIGHT = '500px';
const MIN_MAP_WIDTH = '800px';

function handleStateDataOverlay(block, data, coordinates) {
  if ( !data
    || !data.partners) {
    return;
  }

  let partnersHolder = document.getElementById(`partners-holder-${data.name}`);
  if (partnersHolder) {
    partnersHolder.classList.remove('hidden');
  } else {
    partnersHolder = document.createElement('div'); // TODO: replace with createTag
    partnersHolder.id = `partners-holder-${data.name}`;
    partnersHolder.classList.add('partners-holder');

    let partnerClickableImages = [];
    let imageToUse = null;
    [...data.partners.children].forEach((partnerItem, index) => {
      if (index % 2 === 0) { //image
        imageToUse = partnerItem.querySelector('img');
      } else { //link
        let clickableImage = partnerItem;
        if(!clickableImage.href){
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

    const closePartnersButton = closePartnersView.querySelector('button');
    closePartnersButton.addEventListener('click', () => {
      partnersHolder.classList.add('hidden');
    }, { passive: true });
  }

  // TODO: compute nicer position
  const mapWidthMiddle = block.offsetWidth / 2;
  if(coordinates.x >= mapWidthMiddle){
    partnersHolder.style.left = `calc(${coordinates.x}px)`;
  } else {
    partnersHolder.style.left = `calc(${coordinates.x}px)`;
  }
  const mapHeightMiddle = block.offsetHeight / 2;
  if(coordinates.y >= mapHeightMiddle){
    partnersHolder.style.top = `calc(${coordinates.y}px)`;
  } else {
    partnersHolder.style.top = `calc(${coordinates.y}px)`;
  }
}

function drawMap(block, mapHolder, mapData, mapConfig) {
  console.log("Drawing map");
  echarts.registerMap('USA', USA_MAP);

  mapHolder.style.width = mapConfig.chartWidth;
  mapHolder.style.height = mapConfig.chartHeight;
  const mapChart = window.echarts.init(mapHolder);

  const projection = d3.geoAlbersUsa(); // https://github.com/d3/d3-geo#geoAlbersUsa
  const mapRepresentation = {
    visualMap: {
      show: false,
      min: 0,
      max: 1,
      inRange: {
        color: [
          'grey'
        ]
      },
      calculable: false
    },
    emphasis: {
      label: {
        show: true
      }
    },
    tooltip: {
      trigger: 'item',
      showDelay: 0,
      transitionDuration: 0.2,
      formatter: function (params) {
        if (params.value === 1) {
          return params.data.name;
        }
        return '';
      }
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
          project: function (point) {
            return projection(point);
          },
          unproject: function (point) {
            return projection.invert(point);
          }
        },
        selectedMode: false,
        data: mapData,
      }
    ]
  };
  mapChart.setOption(mapRepresentation);
  mapChart.on('click', function (params) {
    handleStateDataOverlay(block, params.data, {
      x: params.event.offsetX + block.offsetLeft + mapHolder.offsetLeft/2,
      y: params.event.offsetY+ block.offsetTop,
    });
  });
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

  const mapConfig = {};
  mapConfig.chartWidth = block.clientWidth !== 0 ? block.clientWidth : MIN_MAP_WIDTH;
  mapConfig.chartHeight = block.clientHeight !== 0 ? block.clientHeight : MIN_MAP_HEIGHT;

  // TODO: load themes, uses colors from themes like in chart.js

  // listen for charting library to be loaded before starting to draw
  // TODO: Make sure d3 is also loaded (fix race condition)
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawMap(block, mapHolder, mapData, mapConfig);
    },
  );

  // TODO: Properly size map and resize when resizing event is fired
}