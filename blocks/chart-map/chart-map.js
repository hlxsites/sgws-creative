import { USA_MAP } from './usa-map.js';
import { createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

const MIN_MAP_HEIGHT = '500px';
const MIN_MAP_WIDTH = '700px';

function handleStateDataOverlay(block, data, coordinates) {
  console.log("click: ", coordinates);

  // uneven list of div means not all images are clickable, ignore
  if (!data
    || !data.partners
    || data.partners.children.length % 2 !== 0) {
      return;
  }

  let partnersHolder = document.createElement('div'); // TODO: replace with createTag
  partnersHolder.id = `partners-holder-${data.name}`;
  partnersHolder.classList.add('partners-holder');
  // TODO: Add close button to partnersHolder

  let partnerClickableImages = [];

  let imageToUse = null;
  // TODO: Only do this if there is no pop-up already
  // else just switch visibility on the existing one
  [...data.partners.children].forEach((partnerItem, index) => {
    if(index % 2 === 0){ //image
      imageToUse = partnerItem.querySelector('img');
    } else { //link
      const clickableImage = partnerItem.querySelector('a');
      if(!clickableImage) return;
      if(clickableImage.innerText){
        clickableImage.innerText = '';
      }
      clickableImage.append(createOptimizedPicture(imageToUse.src, imageToUse.alt, false, [{ width: '150' }]));
      partnerClickableImages.push(clickableImage);
    }
  });

  const closePartnersView = createTag('div', { class: 'partners-holder-close' });
  closePartnersView.innerHTML = `<button type="button" aria-label="Close partners view">
    <span class="icon icon-close">X</span>
  </button>`;

  partnersHolder.append(closePartnersView, ...partnerClickableImages);
  partnersHolder.style.position = 'absolute';
  partnersHolder.style.top = `${coordinates.y}px`;
  partnersHolder.style.left = `${coordinates.x}px`;
  block.append(partnersHolder);

  const closePartnersButton = closePartnersView.querySelector('button');
  closePartnersButton.addEventListener('click', () => {
    partnersHolder.classList.add('hidden');
  }, { passive: true });
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
      x: params.event.offsetX,
      y: params.event.offsetY
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
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawMap(block, mapHolder, mapData, mapConfig);
    },
  );

  // TODO: Properly size map and resize when resizing event is fired
}