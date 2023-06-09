// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

window.hasCharts = window.hasCharts || false;

// Core Web Vitals RUM collection
sampleRUM('cwv');

// loads additional delayed scripts
const loadScript = (url, attrs) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (attrs) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const attr in attrs) {
      script.setAttribute(attr, attrs[attr]);
    }
  }
  head.append(script);
  return script;
};

// add more delayed functionality here
// Maps (projections)
if (document.querySelector('div.chart-map-container')) {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3-geo/1.9.1/d3-geo.min.js', {
    type: 'text/javascript',
  });
}

// Charts
if (window.hasCharts) {
  const echarts = loadScript('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.2/echarts.min.js', {
    type: 'text/javascript',
  });
  echarts.onload = () => {
    document.dispatchEvent(new Event('echartsloaded'));
  };
}
