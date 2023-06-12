/* portfolio block */
import { getMetadata, readBlockConfig, createOptimizedPicture } from '../../scripts/lib-franklin.js';
import { createTag } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const portfolioConfig = readBlockConfig(block);
  const portfolioName = getMetadata('portfolio');
  if (!portfolioName) {
    return;
  }

  const portfolioPath = `/portfolio/${portfolioName}.json`;
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
      const card = createTag('li', {});
      card.innerHTML = `<a href="${product.url}" target="_blank">
        <div>
            <div class="picture-container"></div>
            <p>${product.name}</p>
            <p class="variant">${product.variant}</p>
        </div>
      </a>`;
      // add images
      const pictureContainer = card.querySelector('.picture-container');
      Object.entries(product)
        .filter(([key, value]) => key.startsWith('image') && value)
        .forEach(([, value]) => {
          const picture = createOptimizedPicture(value, product.name, false, [{ width: 64 }]);
          const para = createTag('p', { class: 'picture' });
          para.append(picture);
          pictureContainer.append(para);
        });
      pictureContainer.classList.add(`picture-container-${pictureContainer.children.length}`);
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
