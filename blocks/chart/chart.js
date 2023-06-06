import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';

const MIN_BAR_CHART_HEIGHT = '400px';

/**
 * Prepare data to be displayed in a bar chart
 * @param {Object} chartData Chart data as read from the block
 * @returns {Object} Object containing barNames and corresponding dataValues
 */
function prepareBarChartData(chartData) {
  const barNames = new Array(chartData.length);
  const dataValues = new Array(chartData.length);
  chartData.forEach((row, index) => {
    barNames[index] = row.name;
    dataValues[index] = {
      value: row.value,
    };
  });
  return {
    barNames,
    dataValues,
  };
}

/**
 * Prepare data to be displayed as two series in a bar chart
 * @param {Object} chartData Chart data as read from the block
 * @returns {Object} Object containing barNames and corresponding dataValues
 */
function prepareBarChartDataWithOverlay(chartData) {
  const barNames = new Array(chartData.length / 2);
  const dataValues = new Array(chartData.length);
  const overlayValues = new Array(chartData.length);
  chartData.forEach((row, index) => {
    barNames[index] = row.name;
    dataValues[index] = {
      value: row.value,
    };
    overlayValues[index] = {
      value: row.additionalValues[0],
    };
  });
  return {
    barNames,
    dataValuesHistogram: dataValues,
    dataValuesOverlay: overlayValues,
  };
}

/**
 * Draw a histogram chart with an overlayed trend line
 * @param {*} chartData Chart data (will be used to determine which chart to draw)
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawHistogramChartWithOverlay(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareBarChartDataWithOverlay(chartData);

  chartHolder.style.width = chartConfig.chartWidth;
  chartHolder.style.height = chartConfig.chartHeight;
  chartConfig['chart-scale-step'] = parseInt(chartConfig['chart-scale-step'], 10);
  chartConfig['chart-scale-overlay-step'] = parseInt(chartConfig['chart-scale-overlay-step'], 10);

  const barChart = window.echarts.init(chartHolder);

  // stylings
  let max = Number.NEGATIVE_INFINITY;
  formattedData.dataValuesHistogram.forEach((datapoint) => {
    datapoint.value = Number(datapoint.value);
    max = Math.max(max, datapoint.value);
    datapoint.itemStyle = {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [{
          offset: 0, color: theme['primary-gradient-end'],
        }, {
          offset: 1, color: theme['primary-gradient-start'],
        }],
      },
    };
  });
  formattedData.dataValuesOverlay.forEach((datapoint) => {
    datapoint.value = Number(datapoint.value);
    max = Math.max(max, datapoint.value);
    datapoint.itemStyle = {
      color: theme['secondary-gradient-start'],
    };
  });
  const axisFontStyle = {
    align: 'center',
    color: 'rgb(0, 0, 0)',
    fontWeight: '400',
    fontFamily: theme['font-family'],
    fontSize: '12px',
    width: '70',
    overflow: 'break',
  };

  // build chart representation
  const chartDescription = {
    title: {
      text: chartConfig.title,
    },
    xAxis: {
      data: formattedData.barNames,
      axisTick: {
        show: false,
      },
      axisLabel: axisFontStyle,
    },
    yAxis: [{
      type: 'value',
      silent: true,
      axisLine: {
        show: true,
        symbol: 'none',
        lineStyle: {
          type: 'solid',
        },
      },
      interval: chartConfig['chart-scale-step'],
      axisLabel: {
        formatter: `{value}${chartConfig['value-suffix']}`,
        align: 'center',
        margin: '20',
        ...axisFontStyle,
      },
      max: (Math.floor(max / chartConfig['chart-scale-step']) + 1) * chartConfig['chart-scale-step'],
      splitLine: { show: false },
    },
    {
      type: 'value',
      silent: true,
      axisLine: {
        show: true,
        symbol: 'none',
        lineStyle: {
          type: 'solid',
        },
      },
      min: chartConfig['chart-scale-overlay-min'],
      max: chartConfig['chart-scale-overlay-max'],
      interval: chartConfig['chart-scale-overlay-step'],
      axisLabel: {
        formatter: `{value}${chartConfig['scale-overlay-label-suffix']}`,
      },
      splitLine: { show: false },
    }],
    series: [
      {
        name: chartConfig.unit,
        type: 'bar',
        yAxisIndex: 0,
        colorBy: 'data',
        data: formattedData.dataValuesHistogram,
      },
      {
        name: chartConfig['overlay-unit'],
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: theme['secondary-gradient-start'],
          width: 1,
        },
        colorBy: 'data',
        data: formattedData.dataValuesOverlay,
      },
    ],
  };

  if (chartConfig.legend) {
    chartDescription.legend = {
      type: 'plain',
      data: [
        {
          name: chartConfig.unit,
        }, {
          name: chartConfig['overlay-unit'],
          itemStyle: {
            color: theme['secondary-gradient-start'],
          },
          lineStyle: {
            color: theme['secondary-gradient-start'],
            width: 1,
          },
        }],
      top: '10%',
      right: '11.5%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: theme['primary-gradient-end'],
          }, {
            offset: 1, color: theme['primary-gradient-start'],
          }],
        },
      },
      textStyle: axisFontStyle,
    };
  }

  // draw chart
  barChart.setOption(chartDescription);
}

/**
 * Draw a histogram chart
 * @param {*} chartData Chart data (will be used to determine which chart to draw)
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawHistogramChart(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareBarChartData(chartData);

  chartHolder.style.width = chartConfig.chartWidth;
  chartHolder.style.height = chartConfig.chartHeight;
  chartConfig['chart-scale-step'] = parseInt(chartConfig['chart-scale-step'], 10);

  const barChart = window.echarts.init(chartHolder);

  // stylings
  let max = Number.NEGATIVE_INFINITY;
  formattedData.dataValues.forEach((datapoint) => {
    datapoint.value = Number(datapoint.value);
    max = Math.max(max, datapoint.value);
    datapoint.itemStyle = {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [{
          offset: 0, color: theme['primary-gradient-end'],
        }, {
          offset: 1, color: theme['primary-gradient-start'],
        }],
      },
    };
  });
  const axisFontStyle = {
    align: 'center',
    color: 'rgb(0, 0, 0)',
    fontWeight: '400',
    fontFamily: theme['font-family'],
    fontSize: '12px',
    width: '70',
    overflow: 'break',
  };

  // build chart representation
  const chartDescription = {
    title: {
      text: chartConfig.title,
    },
    xAxis: {
      data: formattedData.barNames,
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
          type: 'solid',
        },
      },
      interval: chartConfig['chart-scale-step'],
      axisLabel: {
        formatter: `{value}${chartConfig['value-suffix']}`,
        align: 'center',
        margin: '20',
        ...axisFontStyle,
      },
      max: (Math.floor(max / chartConfig['chart-scale-step']) + 1) * chartConfig['chart-scale-step'], // chart scale end
      splitLine: { show: false },
    },
    series: [
      {
        name: chartConfig.title,
        type: 'bar',
        colorBy: 'data',
        data: formattedData.dataValues,
      },
    ],
  };

  if (chartConfig.legend) {
    chartDescription.legend = {
      type: 'plain',
      formatter: chartConfig.unit,
      top: '10%',
      right: '11.5%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: theme['primary-gradient-end'],
          }, {
            offset: 1, color: theme['primary-gradient-start'],
          }],
        },
      },
      textStyle: axisFontStyle,
    };
  }

  // draw chart
  barChart.setOption(chartDescription);
}

/**
 * Draw a bar chart comparing two values/series
 * @param {*} chartData Chart data (will be used to determine which chart to draw)
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawComparisonBarChart(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareBarChartData(chartData);

  chartHolder.style.width = chartConfig.chartWidth;
  chartHolder.style.height = chartConfig.chartHeight;
  const barChart = window.echarts.init(chartHolder);
  // chart stylings
  // for comparison chart we have only two values, so...
  formattedData.dataValues[0].itemStyle = {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [{
        offset: 0, color: theme['primary-gradient-end'],
      }, {
        offset: 1, color: theme['primary-gradient-start'],
      }],
    },
  };
  formattedData.dataValues[1].itemStyle = {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [{
        offset: 0, color: theme['secondary-gradient-end'],
      }, {
        offset: 1, color: theme['secondary-gradient-start'],
      }],
    },
  };
  const axisFontStyle = {
    align: 'center',
    color: 'rgb(0, 0, 0)',
    fontWeight: '400',
    fontFamily: theme['font-family'],
    fontSize: '12px',
    width: '70',
    overflow: 'break',
  };
  const dataLabelFontStyle = {
    color: theme['font-color'],
    fontWeight: '400',
    fontFamily: theme['font-family'],
    fontSize: '15px',
  };

  // build chart representation
  const chartDescription = {
    title: {
      text: chartConfig.title,
      colorBy: 'data',
      textStyle: {
        color: theme['font-color'],
        fontWeight: '400',
        fontFamily: theme['font-family'],
        fontSize: '15px',
      },
    },
    xAxis: {
      data: formattedData.barNames,
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
          type: 'solid',
        },
      },
      axisLabel: {
        formatter: `${chartConfig.unit || ''}{value}${chartConfig['value-suffix'] || ''}`,
        align: 'center',
        margin: '20',
        ...axisFontStyle,
      },
    },
    series: [
      {
        name: chartConfig.title,
        type: 'bar',
        barWidth: '70%',
        colorBy: 'data',
        data: formattedData.dataValues,
        label: {
          show: true,
          position: 'top',
          formatter: `${chartConfig.unit || ''}{@score}${chartConfig['value-suffix'] || ''}`,
          ...dataLabelFontStyle,
        },
      },
    ],
  };

  // draw chart
  barChart.setOption(chartDescription);
}

/**
 * Draw charts based on block styling (type) and data to represent
 * @param {*} block Block to draw the chart in (will be used to determine which chart to draw)
 * @param {*} chartData Chart data (will be used to determine which chart to draw)
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawChart(block, chartData, chartConfig, chartHolder, theme) {
  const blockClassList = block.classList;
  if (blockClassList.contains('bars')) {
    chartConfig.chartWidth = block.clientWidth;
    chartConfig.chartHeight = block.clientHeight !== 0 ? block.clientHeight : MIN_BAR_CHART_HEIGHT;
    chartConfig.legend = blockClassList.contains('graph-legend');

    if (chartData.length === 2) {
      // comparison
      drawComparisonBarChart(chartData, chartConfig, chartHolder, theme);
    } else if (blockClassList.contains('overlay-data')) {
      // histogram with trend line
      drawHistogramChartWithOverlay(chartData, chartConfig, chartHolder, theme);
    } else {
      // default, histogram (one series)
      drawHistogramChart(chartData, chartConfig, chartHolder, theme);
    }
  }
}

function readBlockData(block) {
  const blockChildren = [...block.children];
  const data = new Array(blockChildren.length);
  blockChildren.forEach((row, index) => {
    if (row.children.length > 2) {
      data[index] = {};
      [...row.children].forEach((value, valueIndex) => {
        if (valueIndex === 0) {
          // data label
          data[index].name = value.innerText;
        } else if (valueIndex === 1) {
          // primary value
          data[index].value = value.innerText;
        } else {
          // additional values
          data[index].additionalValues = data[index].additionalValues || [];
          data[index].additionalValues.push(value.innerText);
        }
      });
    } else {
      data[index] = {
        name: row.children[0].innerText,
        value: row.children[1].innerText,
      };
    }
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
      'overlay-unit',
      'title',
      'chart-scale',
      'chart-scale-step',
      'chart-scale-overlay-step',
      'chart-scale-overlay-min',
      'chart-scale-overlay-max',
      'scale-step-suffix',
      'scale-overlay-label-suffix',
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

  const windowTheme = window.sgws?.config?.data;
  const theme = {};
  windowTheme.forEach((themeElement) => {
    theme[themeElement.token] = themeElement.value;
  });

  document.addEventListener(
    'echartsloaded',
    () => {
      echartsLoaded = true;
      drawChart(block, data, cfg, chartHolder, theme);
    },
  );

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (echartsLoaded) {
        // redraw scaled chart
        chartHolder.remove();
        chartHolder = document.createElement('div');
        chartHolder.id = `${Date.now()}-${Math.floor(Math.random() * 10000)}-chart-holder`;
        block.append(chartHolder);
        drawChart(block, data, cfg, chartHolder, theme);
      }
    }, 500);
  });
}
