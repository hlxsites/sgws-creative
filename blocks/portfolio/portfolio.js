/* portfolio block */
import { getMetadata, readBlockConfig } from '../../scripts/lib-franklin.js';
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

  const json = await resp.json();
  console.log(json);

  block.textContent = '';

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
        <p class="picture"></p>
        <p>${product.name}</p>
        <p class="variant">${product.variant}</p>
      </a>`;
      grid.append(card);
    });
    block.append(grid);
  });
}
