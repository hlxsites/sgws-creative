export default async function decorate(block) {
  if (block.parentElement.parentElement.classList.contains('wood-table')) {
    block.classList.add('wood-table');
  }
}
