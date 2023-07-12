import { createTag } from '../../scripts/scripts.js';

export default async function decorate(block) {
  if (block.parentElement.parentElement.classList.contains('wood-table')) {
    block.classList.add('wood-table');
  }

  if(block.classList.contains('bottles')) {
    const blockChildren = [...block.children];
    console.log(blockChildren[0].firstElementChild.nextElementSibling);

    const comparisonHolder = createTag('div', { class: 'bottles-comparison-holder' });
    const mainBottleGrid = createTag('div', { class: 'main-bottle-grid' });
    const secondBottleGrid = createTag('div', { class: 'secondary-bottle-grid' });

    mainBottleGrid.append(blockChildren[0].firstElementChild.nextElementSibling, blockChildren[0].firstElementChild);
    secondBottleGrid.append(blockChildren[1].firstElementChild, blockChildren[1].firstElementChild.nextElementSibling);
    comparisonHolder.append(mainBottleGrid, secondBottleGrid);

    blockChildren.forEach((child) => {
      // clean up empty divs
      child.remove();
    });

    const placeholder = createTag('div', { class: 'bottles-comparison-placeholder' });
    block.append(placeholder, comparisonHolder);
  }
}
