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

  Object.entries(portfolioConfig).forEach(([sheet, title = '']) => {
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
        <div>
        <p class="picture picture-1"/>
        <p class="picture picture-2"/>
        <p class="picture picture-3"/>
        <p>${product.name}</p>
        <p class="variant">${product.variant}</p>
        </div>
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

  const observer = new IntersectionObserver((entries) => {
    // Loop over the entries
    entries.forEach((entry) => {
      // If the element is visible
      if (entry.isIntersecting) {
        // Add the animation class
        entry.target.classList.add('animate');
      } else {
        entry.target.classList.remove('animate');
      }
    }, { threshold: 0.1 });
  });

  block.closest('.portfolio-container').querySelectorAll('h2, h3').forEach((element) => {
    observer.observe(element);
  });
}
