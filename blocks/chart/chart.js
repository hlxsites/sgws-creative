import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const readOptions = {
    configFields: [
                    'value-suffix',
                    'unit',
                    'title',
                    'chart-scale',
                    'chart-scale-step',
                    'scale-step-suffix'
                  ],
    removeAfterRead: true,
  };
  const cfg = readPredefinedBlockConfig(block, readOptions);

  console.log("Read block config ~~~~~~~~~~~~~~~~");
  console.log(cfg);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
}
