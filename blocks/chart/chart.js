import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';

function drawComparisonBarChart(chartData, chartConfig, chartHolder, theme) {
  chartHolder.style.width = '600px';
  chartHolder.style.height = '400px';
  console.log(chartConfig)

  const barChart = window.echarts.init(chartHolder);

  const barNames = new Array(chartData.length);
  const dataValues = new Array(chartData.length);

  chartData.forEach((row, index) => {
    barNames[index] = row.name;
    dataValues[index] = {
      value: row.value,
      itemStyle: { color: 'blue' },
    };
  });

  const chartDescription = {
    title: {
      text: chartConfig.title
    },
    xAxis: {
      data: barNames,
      axisTick: {
        show: false,
      }
    },
    yAxis: {
      type: 'value',
      silent: true,
      // splitNumber: 10, // scale step
      // interval: 15 // make sure to force scale step
      axisLabel: {
        formatter: `{value}${chartConfig['value-suffix']}`,
        align: 'center',
      },
      // min: 'dataMin', // chart scale start
      // max: 'dataMax' // chart scale end
      lineStyle: {
        width: 0,
      },
    },
    series: [
      {
        name: chartConfig.title,
        type: 'bar',
        colorBy: 'data',
        data: dataValues,
        label: {
          show: true,
          position: 'top',
          formatter: `{@score}${chartConfig['value-suffix']}`
        }
      }
    ]
  };

  barChart.setOption(chartDescription);
}

function drawChart(block, chartData, chartConfig, chartHolder, theme) {
  const blockClassList = block.classList;
  if (blockClassList.contains('bars')) {
    if (blockClassList.contains('comparison')) {
      drawComparisonBarChart(chartData, chartConfig, chartHolder, theme);
    } else if (blockClassList.contains('histogram')) {
      console.log("Draw histogram")
    }
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

let echartsLoaded = false;
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

  const chartHolder = document.createElement('div');
  chartHolder.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}-chart-holder`;
  block.append(chartHolder);

  // listen for charting library to be loaded before starting to draw
  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawChart(block, data, cfg, chartHolder, {});
    },
  );
}
