import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';

const MIN_CHART_HEIGHT = '400px';

/**
 * Prepare data to be displayed in a bar chart
 * @param {Object} chartData Chart data as read from the block
 * @returns {Object} Object containing barNames and corresponding dataValues
 */
function prepareChartData(chartData) {
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
function prepareChartDataWithOverlay(chartData) {
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
 * Build shared parts of chart representation
 * @param {*} chartData Chart data (will be used to determine which chart to draw)
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function buildChartRepresentation(chartConfig, theme) {
  const chartDescription = {};
  chartDescription.title = {
    text: chartConfig.title,
    textStyle: {
      color: theme['font-color'],
      fontWeight: theme['font-weight'],
      fontFamily: theme['font-family'],
      fontSize: `${theme['computed-font-size-px'] * 2}px`,
    },
    left: 'center',
  };

  if (chartConfig.legend) {
    chartDescription.legend = {
      type: 'plain',
      selectedMode: false,
      top: '10%',
      right: '11.5%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: getGradientStops(theme['primary-gradient-end'], theme['primary-gradient-start'])
        },
      },
    };
  }

  return chartDescription;
}

/**
 * Initialize the chart library object
 * @param {*} chartHolder Element holding the chart
 * @param {*} chartConfig Chart configuration
 * @returns An initialized chart object
 */
function initializeChart(chartHolder, chartConfig) {
  chartHolder.style.width = chartConfig.chartWidth;
  chartHolder.style.height = chartConfig.chartHeight;
  return window.echarts.init(chartHolder);
}

/**
 * Axis font styling for bar charts
 * @param {*} theme Theme to use for styling
 * @returns An axis font style object
 */
function getBarChartAxisFontStyle(theme) {
  return {
    align: 'center',
    color: theme['axis-color'],
    fontWeight: theme['font-weight'],
    fontFamily: theme['font-family'],
    fontSize: theme['axis-font-size'],
    width: '70',
    overflow: 'break',
    cursor: 'auto',
  };
}

function getGradientStops(startColor, endColor) {
  return [{
    offset: 0, color: startColor,
  }, {
    offset: 1, color: endColor,
  }];
}

/**
 * Draw a histogram chart with an overlayed trend line
 * @param {*} chartData Chart data (will be used to determine which chart to draw)
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawHistogramChartWithOverlay(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareChartDataWithOverlay(chartData);
  chartConfig['chart-scale-step'] = parseInt(chartConfig['chart-scale-step'], 10);
  chartConfig['chart-scale-overlay-step'] = parseInt(chartConfig['chart-scale-overlay-step'], 10);
  const barChart = initializeChart(chartHolder, chartConfig);
  const baseChartDescription = buildChartRepresentation(chartConfig, theme);

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
        colorStops: getGradientStops(theme['primary-gradient-end'], theme['primary-gradient-start'])
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
  const axisFontStyle = getBarChartAxisFontStyle(theme);
  const interactivitySettings = {
    emphasis: {
      disabled: true,
    },
  };

  // build specific chart representation
  const barChartSpecificDescription = {
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
        margin: '22',
        ...axisFontStyle,
      },
      max: (Math.floor(max / chartConfig['chart-scale-step']) + 1) * chartConfig['chart-scale-step'],
      splitLine: { show: false },
    }, {
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
      splitLine: {
        show: false
      },
    }],
    series: [
      {
        name: chartConfig.unit,
        type: 'bar',
        cursor: 'auto',
        yAxisIndex: 0,
        colorBy: 'data',
        data: formattedData.dataValuesHistogram,
        ...interactivitySettings
      }, {
        name: chartConfig['overlay-unit'],
        type: 'line',
        cursor: 'auto',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: theme['secondary-gradient-start'],
          width: 1,
        },
        colorBy: 'data',
        data: formattedData.dataValuesOverlay,
        ...interactivitySettings
      },
    ],
  };

  if (chartConfig.legend) {
    baseChartDescription.legend.data = [
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
      }];
    baseChartDescription.legend.textStyle = axisFontStyle;
  }

  const chartDescription = Object.assign(baseChartDescription, barChartSpecificDescription);
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
  const formattedData = prepareChartData(chartData);
  chartConfig['chart-scale-step'] = parseInt(chartConfig['chart-scale-step'], 10);
  const barChart = initializeChart(chartHolder, chartConfig);
  const baseChartDescription = buildChartRepresentation(chartConfig, theme);

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
        colorStops: getGradientStops(theme['primary-gradient-end'], theme['primary-gradient-start'])
      },
    };
  });
  const axisFontStyle = getBarChartAxisFontStyle(theme);
  const interactivitySettings = {
    emphasis: {
      disabled: true,
    },
  };

  // build chart representation
  const barChartSpecificDescription = {
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
        margin: '22',
        ...axisFontStyle,
      },
      max: (Math.floor(max / chartConfig['chart-scale-step']) + 1) * chartConfig['chart-scale-step'], // chart scale end
      splitLine: { show: false },
    },
    series: [
      {
        name: chartConfig.title,
        type: 'bar',
        cursor: 'auto',
        colorBy: 'data',
        data: formattedData.dataValues,
        ...interactivitySettings
      },
    ],
  };

  if (chartConfig.legend) {
    baseChartDescription.legend.formatter = chartConfig.unit;
    baseChartDescription.legend.textStyle = axisFontStyle;
  }

  const chartDescription = Object.assign(baseChartDescription, barChartSpecificDescription);
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
  const formattedData = prepareChartData(chartData);
  const barChart = initializeChart(chartHolder, chartConfig);
  const baseChartDescription = buildChartRepresentation(chartConfig, theme);

  // chart stylings
  // for comparison chart we have only two values, so...
  formattedData.dataValues[0].itemStyle = {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: getGradientStops(theme['primary-gradient-end'], theme['primary-gradient-start']),
    },
  };
  formattedData.dataValues[1].itemStyle = {
    color: {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: getGradientStops(theme['secondary-gradient-end'], theme['secondary-gradient-start']),
    },
  };
  const axisFontStyle = getBarChartAxisFontStyle(theme);
  const dataLabelFontStyle = {
    color: theme['font-color'],
    fontWeight: theme['font-weight'],
    fontFamily: theme['font-family'],
    fontSize: theme['font-size'],
    cursor: 'auto',
  };
  const titleTextStyle = {
    color: theme['font-color'],
    fontWeight: theme['font-weight'],
    fontFamily: theme['font-family'],
    fontSize: theme['font-size'],
  };
  const interactivitySettings = {
    emphasis: {
      disabled: true,
    },
  };

  // build comparison bar chart specific representation
  const barChartSpecificDescription = {
    title: {
      textStyle: titleTextStyle,
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
        margin: '22',
        ...axisFontStyle,
      },
    },
    series: [
      {
        name: chartConfig.title,
        type: 'bar',
        cursor: 'auto',
        barWidth: '70%',
        colorBy: 'data',
        data: formattedData.dataValues,
        label: {
          show: true,
          position: 'top',
          formatter: `${chartConfig.unit || ''}{@score}${chartConfig['value-suffix'] || ''}`,
          ...dataLabelFontStyle,
        },
        ...interactivitySettings
      },
    ],
  };
  const chartDescription = Object.assign(baseChartDescription, barChartSpecificDescription);
  barChart.setOption(chartDescription);
}

/**
 * Draw two pie charts next to each other to compare values
 * @param {*} chartData Chart data (will be used to determine which chart to draw)
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawComparisonPieChart(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareChartData(chartData);
  const pieChart = initializeChart(chartHolder, chartConfig);
  const baseChartDescription = buildChartRepresentation(chartConfig, theme);

  // format data for representation
  const firstSeries = [
    {
      value: formattedData.dataValues[0].value,
      name: formattedData.dataValues[0].value,
      itemStyle: {
        color: {
          type: 'radial',
          x: 0.5,
          y: 0.5,
          r: 0.70,
          colorStops: getGradientStops(theme['primary-gradient-start'], theme['primary-gradient-end']),
        },
      },
    },
    {
      value: 100 - parseInt(formattedData.dataValues[0].value, 10),
      name: formattedData.dataValues[0].value,
      itemStyle: {
        color: theme['primary-gradient-end'],
        opacity: 0.8,
      },
    },
  ];
  const secondSeries = [
    {
      value: formattedData.dataValues[1].value,
      name: formattedData.dataValues[1].value,
      itemStyle: {
        color: {
          type: 'radial',
          x: 0.66,
          y: 0.66,
          r: 0.75,
          colorStops: getGradientStops(theme['secondary-gradient-start'], theme['secondary-gradient-end']),
        },
      },
    },
    {
      value: 100 - parseInt(formattedData.dataValues[1].value, 10),
      name: formattedData.dataValues[1].value,
      itemStyle: {
        color: theme['secondary-gradient-end'],
        opacity: 0.8,
      },
    },
  ];

  // stylings
  const labelStylings = {
    show: true,
    position: 'center',
    fontWeight: theme['font-weight'],
    color: theme['font-color'],
    formatter: `{@value}${chartConfig['value-suffix']}`,
  };
  const interactivitySettings = {
    percentPrecision: 1,
    showEmptyCircle: true,
    stillShowZeroSum: true,
    silent: true,
    legendHoverLink: false,
    selectedMode: false,
    labelLine: {
      show: false,
    },
    emphasis: {
      disabled: true,
    },
  };

  // build specific chart representation
  const pieChartSpecificDescription = {
    series: [
      {
        name: chartConfig.title,
        type: 'pie',
        roseType: 'radius',
        radius: ['40%', '55%'],
        center: ['27.5%', '45%'],
        colorBy: 'data',
        label: {
          fontSize: `${theme['computed-font-size-px'] * 3}`,
          ...labelStylings,
        },
        data: firstSeries,
        ...interactivitySettings,
      },
      {
        name: chartConfig.title,
        type: 'pie',
        roseType: 'radius',
        radius: ['35%', '47.5%'],
        center: ['74.5%', '55%'],
        colorBy: 'data',
        label: {
          fontSize: `${theme['computed-font-size-px'] * 2.33}`,
          ...labelStylings,
        },
        data: secondSeries,
        ...interactivitySettings,
      },
    ],
  };
  const chartDescription = Object.assign(baseChartDescription, pieChartSpecificDescription);
  pieChart.setOption(chartDescription);
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
  chartConfig.chartWidth = block.clientWidth;
  chartConfig.chartHeight = block.clientHeight !== 0 ? block.clientHeight : MIN_CHART_HEIGHT;
  if (blockClassList.contains('bars')) {
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
  } else if (blockClassList.contains('pie')) {
    drawComparisonPieChart(chartData, chartConfig, chartHolder, theme);
  }
}

/**
 * Read block data (assumes only data left to read in block)
 * @param {*} block Holding block
 * @returns {Array} Array of read data elements
 */
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

  const windowTheme = window.sgws?.config?.data;
  const theme = {};
  windowTheme.forEach((themeElement) => {
    theme[themeElement.token] = themeElement.value;
  });
  // add things shared by all charts in theming here for now
  let computedStyles = window.getComputedStyle(block);
  theme['computed-font-size-px'] = parseInt(computedStyles.fontSize, 10);
  theme['font-size'] = `${theme['computed-font-size-px'] * 1.1}px`;
  theme['axis-font-size'] = `${theme['computed-font-size-px'] * 0.8}px`;
  theme['axis-color'] = 'rgb(0, 0, 0)';
  theme['font-weight'] = computedStyles.fontWeight;

  // listen for charting library to be loaded before starting to draw
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
        // get updated theme styles, if any
        computedStyles = window.getComputedStyle(block);
        theme['computed-font-size-px'] = parseInt(computedStyles.fontSize, 10);
        theme['font-size'] = `${theme['computed-font-size-px'] * 1.1}px`;
        theme['axis-font-size'] = `${theme['computed-font-size-px'] * 0.8}px`;

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
