import { USA_MAP } from './usa-map.js';


const MIN_MAP_HEIGHT = '400px';

function drawMap(block, mapHolder, mapData, mapConfig) {
  console.log("Drawing map");
  echarts.registerMap('USA', USA_MAP);

  mapHolder.style.width = '800px'; // TODO: Use mapConfig instead
  mapHolder.style.height = '400px'; // TODO: Use mapConfig instead
  const mapChart = window.echarts.init(mapHolder);
  const mapRepresentation = {
    title: {
      text: 'USA map title',
      left: 'right'
    },
    tooltip: {
      /* TO DO: Show images of partners */
    },
    series : [
      {
        name: 'USA partners',
        type: 'map',
        map: 'USA',
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

  // listen for charting library to be loaded before starting to draw
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawMap(block, mapHolder, mapData, mapConfig);
    },
  );
}