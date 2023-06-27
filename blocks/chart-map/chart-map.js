import { USA_MAP } from './usa-map.js';


const MIN_MAP_HEIGHT = '500px';
const MIN_MAP_WIDTH = '700px';

function drawMap(block, mapHolder, mapData, mapConfig) {
  console.log("Drawing map");
  echarts.registerMap('USA', USA_MAP);

  mapHolder.style.width = mapConfig.chartWidth;
  mapHolder.style.height = mapConfig.chartHeight;
  const mapChart = window.echarts.init(mapHolder);

  const projection = d3.geoAlbersUsa(); // https://github.com/d3/d3-geo#geoAlbersUsa
  const mapRepresentation = {
    title: {
      text: 'USA map title',
      left: 'right'
    },
    visualMap: {
      show:false,
      min: 0,
      max: 1,
      inRange: {
        color: [
          'red'
        ]
      },
      calculable: false
    },
    series : [
      {
        name: 'Continental USA partners',
        type: 'map',
        map: 'USA',
        colorBy: 'series',
        projection: {
          project: function (point) {
            return projection(point);
          },
          unproject: function (point) {
            return projection.invert(point);
          }
        },
        selectedMode: 'multiple',
        data: mapData,
      }
    ]
  };
  mapChart.setOption(mapRepresentation);

  mapChart.on('click', function (params) {
    // show partners
    /*
    - build DOM element
    - place it absolutely
    - show it
    - hide it if reclicked
    */
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

  // listen for charting library to be loaded before starting to draw
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawMap(block, mapHolder, mapData, mapConfig);
    },
  );
}