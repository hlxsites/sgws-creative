import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';

function drawBarChart(chartData, chartConfig, chartHolder) {
  console.log("Build bar chart");

  chartHolder.style.width = '600px';
  chartHolder.style.height = '400px';

  const barChart = window.echarts.init(chartHolder);

  var chartDescription = {
    title: {
      text: chartConfig.title
    },
    xAxis: {
      data: ['Shirts', 'Cardigans', 'Chiffons', 'Pants', 'Heels', 'Socks']
    },
    yAxis: {},
    series: [
      {
        name: 'sales',
        type: 'bar',
        data: [5, 20, 36, 10, 10, 20]
      }
    ]
  };

  if(chartConfig.legend){
    chartDescription.legend = {
      data: ['TBD']
    }
  }

  barChart.setOption(chartDescription);
}

function drawChart(block, chartData, chartConfig, chartHolder) {
  const blockClassList = block.classList;
  if (blockClassList.contains('bars')) {
    chartConfig.legend = true;
  }
  if (blockClassList.contains('bars')) {
    drawBarChart(chartData, chartConfig, chartHolder);
  }
}

function readBlockData(block) {
  const blockChildren = [...block.children];
  const data = new Array(blockChildren.length);
  blockChildren.forEach((row, index) => {
    if (row.children.length !== 2) return;
    data[index] = {
      name: row.children[0].innerText,
      value: row.children[1].innerText,
    };
    row.remove();
  });

  return data;
}

export default function decorate(block) {
  const readOptions = {
    configFields: [
      'value-suffix',
      'value-prefix',
      'unit',
      'title',
      'chart-scale',
      'chart-scale-step',
      'scale-step-suffix',
      'scale-step-prefix',
    ],
    removeAfterRead: true,
  };
  const cfg = readPredefinedBlockConfig(block, readOptions);
  const data = readBlockData(block);

  console.log("Read block config ~~~~~~~~~~~~~~~~");
  console.log(cfg);
  console.log("Read block data ~~~~~~~~~~~~~~~~");
  console.log(data);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

  const chartHolder = document.createElement('div');
  chartHolder.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}-chart-holder`;

  block.append(chartHolder);

  // listen for charting library to be loaded before starting to draw
  document.addEventListener(
    'echartsloaded',
    () => {
      drawChart(block, data, cfg, chartHolder);
    },
  );
}
