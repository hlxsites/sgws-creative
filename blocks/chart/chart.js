import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';
import { getTheme, THEME_TOKEN } from '../../scripts/scripts.js';

const MIN_CHART_HEIGHT_INT = 400;
const MIN_CHART_HEIGHT = `${MIN_CHART_HEIGHT_INT}ps`;

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
  const barNames = new Array(chartData.length);
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
 * Compute font styling based on theme
 * and block computed styles
 * @param {*} block Block holding the chart
 * @param {*} theme Theme
 */
function computeFontSizes(block, theme) {
  const computedStyles = window.getComputedStyle(block);
  theme['computed-font-size-px'] = parseInt(computedStyles.fontSize, 10);

  if (Number.isNaN(theme['computed-font-size-px'])) {
    theme['font-size'] = '12px';
    theme['axis-font-size'] = '12px';
  } else {
    theme['font-size'] = `${theme['computed-font-size-px'] * 1.1}px`;
    theme['axis-font-size'] = `${theme['computed-font-size-px'] * 0.8}px`;
  }
  theme['font-weight'] = computedStyles.fontWeight;
}

/**
 * Create a gradient color
 * @param {*} startColor Start gradient color
 * @param {*} endColor End gradient color
 * @returns An array containing two gradient steps
 */
function getGradientStops(startColor, endColor) {
  return [{
    offset: 0, color: startColor || '#FFFFFF',
  }, {
    offset: 1, color: endColor || '#000000',
  }];
}

/**
 * Create a chart gradient color
 * @param {*} startColor Start gradient color
 * @param {*} endColor End gradient color
 * @returns A chart gradient color
 */
function getLinearColorGradient(startColor, endColor) {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: getGradientStops(startColor, endColor),
  };
}

/**
 * Set shared interactivity settings
 * @returns An object of interactivity settings
 */
function getInteractivitySettings() {
  return {
    emphasis: {
      disabled: true,
    },
  };
}

/**
 * Build shared parts of chart representation
 * @param {*} chartConfig Chart configuration
 * @param {*} theme Theming details, optional
 */
function buildChartRepresentation(chartConfig, theme) {
  const chartDescription = {};
  chartDescription.title = {
    text: chartConfig.title,
    textStyle: {
      color: theme[THEME_TOKEN.PRIMARY_COLOR],
      fontWeight: theme['font-weight'],
      fontFamily: theme[THEME_TOKEN.BODY_FONT_FAMILY],
      fontSize: `${theme['computed-font-size-px'] * 2}px`,
    },
    left: 'center',
  };
  if (chartConfig.legend) {
    chartDescription.legend = {
      type: 'plain',
      orient: 'vertical',
      selectedMode: false,
      top: '10%',
      right: '17.5%',
      itemStyle: {
        color: getLinearColorGradient(theme[THEME_TOKEN.PRIMARY_COLOR], theme['primary-gradient-color']),
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
    fontFamily: theme[THEME_TOKEN.BODY_FONT_FAMILY],
    fontSize: theme['axis-font-size'],
    width: '70',
    overflow: 'break',
    cursor: 'auto',
  };
}

/**
 * Draw a histogram chart with an overlayed trend line
 * @param {*} chartData Chart data
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawHistogramChartWithOverlay(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareChartDataWithOverlay(chartData);
  chartConfig['chart-scale-step'] = parseInt(chartConfig['chart-scale-step'], 10);
  chartConfig['chart-scale-overlay-step'] = parseInt(chartConfig['chart-scale-overlay-step'], 10);

  // stylings
  let max = Number.NEGATIVE_INFINITY;
  formattedData.dataValuesHistogram.forEach((datapoint) => {
    datapoint.value = Number(datapoint.value);
    max = Math.max(max, datapoint.value);
    datapoint.itemStyle = {
      color: getLinearColorGradient(theme[THEME_TOKEN.PRIMARY_COLOR], theme['primary-gradient-color']),
    };
  });
  formattedData.dataValuesOverlay.forEach((datapoint) => {
    datapoint.value = Number(datapoint.value);
    datapoint.itemStyle = {
      color: theme['neutral-gradient-color'],
    };
  });
  const axisConfig = {
    type: 'value',
    silent: true,
    axisLine: {
      show: true,
      symbol: 'none',
      lineStyle: {
        type: 'solid',
      },
    },
    splitLine: { show: false },
  };
  const axisFontStyle = getBarChartAxisFontStyle(theme);

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
      ...axisConfig,
      interval: chartConfig['chart-scale-step'],
      axisLabel: {
        formatter: `{value}${chartConfig['value-suffix']}`,
        align: 'center',
        margin: '22',
        ...axisFontStyle,
      },
      max: (Math.floor(max / chartConfig['chart-scale-step']) + 1) * chartConfig['chart-scale-step'],
    }, {
      ...axisConfig,
      min: chartConfig['chart-scale-overlay-min'],
      max: chartConfig['chart-scale-overlay-max'],
      interval: chartConfig['chart-scale-overlay-step'],
      axisLabel: {
        formatter: `{value}${chartConfig['scale-overlay-label-suffix']}`,
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
        ...getInteractivitySettings(),
      }, {
        name: chartConfig['overlay-unit'],
        type: 'line',
        cursor: 'auto',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: theme['neutral-gradient-color'],
          width: 1,
        },
        colorBy: 'data',
        data: formattedData.dataValuesOverlay,
        ...getInteractivitySettings(),
      },
    ],
  };

  const barChartRepresentation = buildChartRepresentation(chartConfig, theme);
  if (chartConfig.legend) {
    barChartSpecificDescription.legend = barChartRepresentation.legend;
    barChartSpecificDescription.legend.data = [
      {
        name: chartConfig.unit,
      }, {
        name: chartConfig['overlay-unit'],
        itemStyle: {
          color: theme['neutral-gradient-color'],
        },
        lineStyle: {
          color: theme['neutral-gradient-color'],
          width: 1,
        },
      },
    ];
    barChartSpecificDescription.legend.textStyle = axisFontStyle;
  }

  const barChart = initializeChart(chartHolder, chartConfig);
  barChart.setOption({
    ...barChartRepresentation,
    ...barChartSpecificDescription,
  });
}

/**
 * Draw a histogram chart representing an evolution over time,
 * @param {*} chartData Chart data (x-axis is time), with a present and future limit
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawHistogramTimeline(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareChartData(chartData);
  chartConfig['chart-scale-step'] = parseInt(chartConfig['chart-scale-step'], 10);
  chartConfig['chart-data-ending'] = parseInt(chartConfig['chart-data-ending'], 10);

  formattedData.barNames.forEach((element, index) => {
    formattedData.barNames[index] = Number.parseInt(element, 10);
  });
  let max = Number.NEGATIVE_INFINITY;
  formattedData.dataValues.forEach((datapoint, i) => {
    datapoint.value = Number(datapoint.value);
    max = Math.max(max, datapoint.value);
    datapoint.itemStyle = {
      color: getLinearColorGradient(theme[THEME_TOKEN.PRIMARY_COLOR], theme['primary-gradient-color']),
    };
    if (formattedData.barNames[i] <= chartConfig['chart-data-ending']) {
      datapoint.itemStyle.opacity = 0.6;
    }
  });
  const axisFontStyle = getBarChartAxisFontStyle(theme);

  const barChartSpecificDescription = {
    title: {
      text: chartConfig.title,
      left: 'center',
    },
    xAxis: {
      name: chartConfig.subtitle,
      nameLocation: 'center',
      nameGap: 50,
      nameTextStyle: {
        ...axisFontStyle,
      },
      data: formattedData.barNames,
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: (value) => {
          if (value > chartConfig['chart-data-ending']) {
            return `${value} (predicted)`;
          }
          return value;
        },
        rotate: 45,
        margin: 25,
        ...axisFontStyle,
      },
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
        formatter: `{value}${chartConfig['scale-step-suffix']}`,
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
        barWidth: '99%',
        ...getInteractivitySettings(),
      },
    ],
  };
  const barChartRepresentation = buildChartRepresentation(chartConfig, theme);
  if (chartConfig.legend) {
    barChartSpecificDescription.legend = {
      ...barChartRepresentation.legend,
      left: 'center',
      formatter: chartConfig.unit,
      textStyle: axisFontStyle,
    };
    barChartSpecificDescription.legend.textStyle.width = '400';
  }

  const barChart = initializeChart(chartHolder, chartConfig);
  barChart.setOption({
    ...barChartRepresentation,
    ...barChartSpecificDescription,
  });
}

/**
 * Draw a histogram chart
 * @param {*} chartData Chart data
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawHistogramChart(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareChartData(chartData);
  chartConfig['chart-scale-step'] = parseInt(chartConfig['chart-scale-step'], 10);

  // stylings
  let max = Number.NEGATIVE_INFINITY;
  formattedData.dataValues.forEach((datapoint) => {
    datapoint.value = Number(datapoint.value);
    max = Math.max(max, datapoint.value);
    datapoint.itemStyle = {
      color: getLinearColorGradient(theme[THEME_TOKEN.PRIMARY_COLOR], theme['primary-gradient-color']),
    };
  });
  const axisFontStyle = getBarChartAxisFontStyle(theme);

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
        ...getInteractivitySettings(),
      },
    ],
  };
  const barChartRepresentation = buildChartRepresentation(chartConfig, theme);
  if (chartConfig.legend) {
    barChartSpecificDescription.legend = {
      ...barChartRepresentation.legend,
      formatter: chartConfig.unit,
      textStyle: axisFontStyle,
    };
  }

  const barChart = initializeChart(chartHolder, chartConfig);
  barChart.setOption({
    ...barChartRepresentation,
    ...barChartSpecificDescription,
  });
}

/**
 * Draw a bar chart comparing two values/series
 * @param {*} chartData Chart data
 * @param {*} chartConfig Chart configuration
 * @param {*} chartHolder Element (div) holding the chart
 * @param {*} theme Theming details, optional
 */
function drawComparisonBarChart(chartData, chartConfig, chartHolder, theme) {
  const formattedData = prepareChartData(chartData);

  // chart stylings
  // for comparison chart we have only two values, so...
  formattedData.dataValues[0].itemStyle = {
    color: getLinearColorGradient(theme[THEME_TOKEN.PRIMARY_COLOR], theme['primary-gradient-color']),
  };
  formattedData.dataValues[1].itemStyle = {
    color: getLinearColorGradient(theme[THEME_TOKEN.NEUTRAL_COLOR], theme['neutral-gradient-color']),
  };
  const axisFontStyle = getBarChartAxisFontStyle(theme);
  const dataLabelFontStyle = {
    color: theme[THEME_TOKEN.PRIMARY_COLOR],
    fontWeight: theme['font-weight'],
    fontFamily: theme[THEME_TOKEN.BODY_FONT_FAMILY],
    fontSize: theme['font-size'],
    cursor: 'auto',
  };
  const titleTextStyle = {
    color: theme[THEME_TOKEN.PRIMARY_COLOR],
    fontWeight: theme['font-weight'],
    fontFamily: theme[THEME_TOKEN.BODY_FONT_FAMILY],
    fontSize: theme['font-size'],
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
    series: [{
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
      ...getInteractivitySettings(),
    },
    ],
  };

  const barChart = initializeChart(chartHolder, chartConfig);
  barChart.setOption({
    ...buildChartRepresentation(chartConfig, theme),
    ...barChartSpecificDescription,
  });
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
          colorStops: getGradientStops(theme['primary-gradient-color'], theme[THEME_TOKEN.PRIMARY_COLOR]),
        },
      },
    },
    {
      value: 100 - parseInt(formattedData.dataValues[0].value, 10),
      name: formattedData.dataValues[0].value,
      itemStyle: {
        color: theme[THEME_TOKEN.PRIMARY_COLOR],
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
          colorStops: getGradientStops(theme['neutral-gradient-color'], theme[THEME_TOKEN.NEUTRAL_COLOR]),
        },
      },
    },
    {
      value: 100 - parseInt(formattedData.dataValues[1].value, 10),
      name: formattedData.dataValues[1].value,
      itemStyle: {
        color: theme[THEME_TOKEN.NEUTRAL_COLOR],
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
  const pieInteractivitySettings = {
    percentPrecision: 1,
    showEmptyCircle: true,
    stillShowZeroSum: true,
    silent: true,
    legendHoverLink: false,
    selectedMode: false,
    labelLine: {
      show: false,
    },
    ...getInteractivitySettings(),
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
        ...pieInteractivitySettings,
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
        ...pieInteractivitySettings,
      },
    ],
  };

  const pieChart = initializeChart(chartHolder, chartConfig);
  pieChart.setOption({
    ...buildChartRepresentation(chartConfig, theme),
    ...pieChartSpecificDescription,
  });
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
  chartConfig.chartHeight = MIN_CHART_HEIGHT;
  let elem = block;
  for (let i = 0; i < 4; i += 1) {
    if (elem.clientHeight > 0) {
      chartConfig.chartHeight = `${Math.max(MIN_CHART_HEIGHT_INT, elem.clientHeight - 105)}px`;
      break;
    }
    elem = elem.parentElement;
  }
  if (blockClassList.contains('bars')) {
    chartConfig.legend = blockClassList.contains('graph-legend');
    if (chartData.length === 2) {
      // comparison
      drawComparisonBarChart(chartData, chartConfig, chartHolder, theme);
    } else if (blockClassList.contains('overlay-data')) {
      // histogram with trend line
      drawHistogramChartWithOverlay(chartData, chartConfig, chartHolder, theme);
    } else if (blockClassList.contains('timeline')) {
      // histogram for evolution of time
      drawHistogramTimeline(chartData, chartConfig, chartHolder, theme);
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
      'subtitle',
      'chart-scale',
      'chart-scale-step',
      'chart-scale-overlay-step',
      'chart-scale-overlay-min',
      'chart-scale-overlay-max',
      'scale-step-suffix',
      'scale-overlay-label-suffix',
      'scale-step-prefix',
      'chart-data-ending',
    ],
    removeAfterRead: true,
  };
  const cfg = readPredefinedBlockConfig(block, readOptions);
  const data = readBlockData(block);

  window.hasCharts = true;
  let chartHolder = document.createElement('div');
  block.append(chartHolder);

  const pageTheme = getTheme() || [];
  const theme = pageTheme.reduce((obj, { token, value }) => ({ ...obj, [token]: value }), {});

  computeFontSizes(block, theme);
  theme['axis-color'] = 'rgb(0, 0, 0)';

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
        computeFontSizes(block, theme);
        // redraw scaled chart
        chartHolder.remove();
        chartHolder = document.createElement('div');
        block.append(chartHolder);
        drawChart(block, data, cfg, chartHolder, theme);
      }
    }, 250);
  });
  // Trigger this event type to draw the charts immediately.
  window.addEventListener('drawChart', () => {
    if (echartsLoaded) {
      computeFontSizes(block, theme);
      chartHolder = document.createElement('div');
      block.append(chartHolder);
      drawChart(block, data, cfg, chartHolder, theme);
    }
  });
}
