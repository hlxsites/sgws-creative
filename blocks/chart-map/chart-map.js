import { USA_MAP } from './usa-map.js';


const MIN_MAP_HEIGHT = '500px';
const MIN_MAP_WIDTH = '700px';

function drawMap(block, mapHolder, mapData, mapConfig) {
  console.log("Drawing map");
  echarts.registerMap('USA', USA_MAP);

  console.log(mapConfig);
  mapHolder.style.width = mapConfig.chartWidth;
  mapHolder.style.height = mapConfig.chartHeight;
  const mapChart = window.echarts.init(mapHolder);

  const projection = d3.geoAlbersUsa(); // https://github.com/d3/d3-geo#geoAlbersUsa
  const mapRepresentation = {
    title: {
      text: 'USA map title',
      left: 'right'
    },
    tooltip: {
      trigger: 'item',
      showDelay: 0,
      transitionDuration: 0.2
    },
    series : [
      {
        name: 'Continental USA partners',
        type: 'map',
        map: 'USA',
        projection: {
          project: function (point) {
            return projection(point);
          },
          unproject: function (point) {
            return projection.invert(point);
          }
        },
        emphasis: {
          label: {
            show: true
          }
        },
        data: mapData,
      }
    ]
  };
  mapChart.setOption(mapRepresentation);
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

  // listen for charting library to be loaded before starting to draw
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawMap(block, mapHolder, mapData, mapConfig);
    },
  );
}