import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';

const MIN_BAR_CHART_HEIGHT = '400px';

function drawHistogramChart(chartData, chartConfig, chartHolder, theme) {
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
      axisLine: {
        show: true,
        symbol: 'none',
        lineStyle: {
          type: 'solid'
        }
      },
      // splitNumber: 10, // scale step
      // interval: 15 // make sure to force scale step
      axisLabel: {
        formatter: `{value}${chartConfig['value-suffix']}`,
        align: 'center',
      },
      // min: 'dataMin', // chart scale start
      // max: 'dataMax' // chart scale end
      splitLine: { show: false },
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
        },
      }
    ]
  };
}

function drawComparisonBarChart(chartData, chartConfig, chartHolder, theme) {
  console.log(chartConfig);

  chartHolder.style.width = chartConfig.chartWidth;
  chartHolder.style.height = chartConfig.chartHeight;

  const barChart = window.echarts.init(chartHolder);
  const barNames = new Array(chartData.length);
  const dataValues = new Array(chartData.length);
  chartData.forEach((row, index) => {
    barNames[index] = row.name;
    dataValues[index] = {
      value: row.value
    };
  });

  // chart stylings
  // for comparison chart we have only two values, so...
  dataValues[0].itemStyle = {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [{
          offset: 0, color: 'rgb(2, 28, 73)'
      }, {
          offset: 1, color: 'rgb(72, 114, 190)'
      }],
    }
  };
  dataValues[1].itemStyle = {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [{
          offset: 0, color: 'rgb(114, 114, 114)'
      }, {
          offset: 1, color: 'rgb(209, 209, 209)'
      }],
    }
  };
  const axisFontStyle = {
    align: 'center',
    color: 'rgb(0, 0, 0)',
    fontWeight: '400',
    fontFamily: 'Roboto',
    fontSize: '12px',
    width: '70',
    overflow: 'break',
  };
  const dataLabelFontStyle = {
    color: 'rgb(2, 28, 73)',
    fontWeight: '400',
    fontFamily: 'Roboto',
    fontSize: '15px',
  };

  // build chart
  const chartDescription = {
    title: {
      text: chartConfig.title,
      colorBy: 'data',
      textStyle: {
        color: 'rgb(2, 28, 73)',
        fontWeight: '400',
        fontFamily: 'Roboto',
        fontSize: '15px',
      }
    },
    xAxis: {
      data: barNames,
      axisTick: {
        show: false,
      },
      axisLabel: axisFontStyle,
    },
    yAxis: {
      type: 'value',
      silent: true,
      axisLine: {
        show: true,
        symbol: 'none',
        lineStyle: {
          type: 'solid'
        }
      },
      axisLabel: {
        formatter: `{value}${chartConfig['value-suffix'] || ''}${chartConfig['unit'] || ''}`,
        align: 'center',
        margin: '20',
        ...axisFontStyle
      },
      //splitLine: { show: false },
    },
    series: [
      {
        name: chartConfig.title,
        type: 'bar',
        barWidth: '70%',
        colorBy: 'data',
        data: dataValues,
        label: {
          show: true,
          position: 'top',
          formatter: `{@score}${chartConfig['value-suffix'] || ''}${chartConfig['unit'] || ''}`,
          ...dataLabelFontStyle
        },
      }
    ]
  };

  // draw chart
  barChart.setOption(chartDescription);
}

function drawChart(block, chartData, chartConfig, chartHolder, theme) {
  const blockClassList = block.classList;
  if (blockClassList.contains('bars')) {
    chartConfig.chartWidth = block.clientWidth;
    chartConfig.chartHeight = block.clientHeight !== 0 ? block.clientHeight : MIN_BAR_CHART_HEIGHT;

    console.log("Chart width: ", chartConfig.chartWidth)
    console.log("Chart height: ", chartConfig.chartHeight)

    if (chartData.length === 2) {
      console.log("Draw comparison bar chart")
      drawComparisonBarChart(chartData, chartConfig, chartHolder, theme);
    } else if (blockClassList.contains('histogram')) {
      console.log("Draw histogram")
      drawHistogramChart(chartData, chartConfig, chartHolder, theme);
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

  let chartHolder = document.createElement('div');
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

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if(echartsLoaded){
        // redraw scaled chart
        chartHolder.remove();
        chartHolder = document.createElement('div');
        chartHolder.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}-chart-holder`;
        block.append(chartHolder);
        drawChart(block, data, cfg, chartHolder, {});
      }
    }, 500);
  });
}
