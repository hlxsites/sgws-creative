import { getTheme, hasTheme, createTag } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

export default function decorate(block) {
  const themeName = [...block.closest('.section').classList].find((className) => hasTheme(className));
  getTheme(themeName).forEach(({ token, value }) => {
    block.style.setProperty(`--${token}`, `${value}`);
  });
}
