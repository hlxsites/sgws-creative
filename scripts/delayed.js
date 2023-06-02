// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

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
// Charts
if (document.querySelector('div.chart-container')) {
  const echarts = loadScript('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.2/echarts.min.js', {
    type: 'text/javascript',
  });
  echarts.onload = () => {
    document.dispatchEvent(new Event('echartsloaded'));
  };
}
