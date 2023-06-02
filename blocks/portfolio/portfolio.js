/* portfolio block */
import { getMetadata, readBlockConfig, createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { createTag } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const portfolioConfig = readBlockConfig(block);
  const template = getMetadata('template');
  if (!template) {
    return;
  }

  const portfolioPath = `/portfolio/${template}.json`;
  const resp = await fetch(`${portfolioPath}`);
  if (!resp?.ok) {
    return;
  }

  block.textContent = '';
  const json = await resp.json();

  Object.entries(portfolioConfig).forEach(([sheet, title]) => {
    if (!json[sheet]) {
      return;
    }
    const heading = createTag('h3', {});
    heading.textContent = title;
    block.append(heading);

    // build grid
    const { data = [] } = json[sheet];
    const grid = createTag('ul', { class: 'portfolio-grid' });
    data.forEach((product) => {
      const card = createTag('li');
      card.innerHTML = `<a href="${product.url}" target="_blank">
        <p class="picture picture-1"/>
        <p class="picture picture-2"/>
        <p class="picture picture-3"/>
        <p>${product.name}</p>
        <p class="variant">${product.variant}</p>
      </a>`;
      // add images
      card.querySelectorAll('p.picture').forEach((parent, i) => {
        const imageUrl = product[`image${i + 1}`];
        if (!imageUrl) {
          return;
        }
        const picture = createOptimizedPicture(imageUrl, product.name, false, [{ width: 64 }]);
        parent.append(picture);
      });
      grid.append(card);
    });

    block.append(grid);
  });
}
