import { readPredefinedBlockConfig } from '../../scripts/lib-franklin.js';

function readBlockData(block){
  const blockChildren = [...block.children];
  const data = new Array(blockChildren.length);
  blockChildren.forEach((row, index) => {
    if(row.children.length !== 2) return;
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

  const blockClassList = block.classList;

  if(blockClassList.contains('bars')){
    console.log("Build bar chart");
  } else if (blockClassList.contains('pie')){
    console.log("Build pie chart");
  }
}
