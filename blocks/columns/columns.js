export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  const iconCols = block.querySelectorAll(':scope > div > div > *:first-child:has(span.icon)');
  if (iconCols.length === cols.length) {
    block.classList.add('icon-list');
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // stats background image
  const backgroundPicture = block.querySelector(':scope > div > .columns-img-col');
  if (backgroundPicture) {
    const pictureParent = backgroundPicture.parentElement;
    const img = backgroundPicture.querySelector('img');
    pictureParent.remove();
    block.firstElementChild.style.backgroundImage = `url(${img.src})`;
    block.classList.add('background-image');
  }
}
