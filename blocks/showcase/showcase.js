import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(showcaseBlock) {
  const imageColumn = showcaseBlock.removeChild(showcaseBlock.children[0]);
  const evenNumberOfHotspots = showcaseBlock.children.length % 2 === 0;
  const columns = document.createElement('div');
  columns.classList.add(evenNumberOfHotspots ? 'even-hotspots' : 'odd-hotspots');

  // Setup 5 rows and 3 columns.  Hotspot buttons are in the left and right columns and the
  // 'bottle' image in the middle.
  // Even number of hotspots - 1 button in left column, 1 button in right column
  // Odd number of hotspots - buttons in alternate rows (left/right cell)
  [...showcaseBlock.children].forEach((row, index) => {
    if (index === 1) {
      // Add the 'bottle' image.
      imageColumn.classList.add('showcase-image-cell');
      columns.append(imageColumn);
    } else if (index % 2 === 1) {
      // Empty cell in middle column
      const emptyImageCell = document.createElement('div');
      emptyImageCell.classList.add('showcase-image-cell');
      columns.append(emptyImageCell);
    }

    // Created the 'hotspot' div.
    const hotSpot = document.createElement('div');
    const side = index % 2 === 0 ? 'left' : 'right';
    hotSpot.classList.add(`showcase-hotspot-${side}`);
    hotSpot.innerHTML = `<button type="button" aria-controls="nav" aria-label="Showcase hotspot">
        <span class="icon icon-plus"></span>
      </button>`;

    const popupDialog = document.createElement('div');

    const headerText = row.querySelector('div');
    const popupHeader = document.createElement('h2');
    popupHeader.innerText = headerText.innerText;
    popupDialog.append(popupHeader);
    row.removeChild(headerText);

    const bodyText = row.querySelector('div');
    const popupText = document.createElement('span');
    popupText.innerText = bodyText.innerText;
    popupDialog.append(popupText);

    const button = hotSpot.querySelector('button');
    if (evenNumberOfHotspots) {
      button.prepend(popupDialog);
    } else {
      button.append(popupDialog);
    }

    row.removeChild(bodyText);
    row.prepend(hotSpot);
    showcaseBlock.removeChild(row);

    if (!evenNumberOfHotspots && index % 2 === 1) {
      // Empty cell in last column, next row's 1st column and next row's 2nd column
      columns.append(document.createElement('div'));
      columns.append(document.createElement('div'));
      const emptyImageCell = document.createElement('div');
      emptyImageCell.classList.add('showcase-image-cell');
      columns.append(emptyImageCell);
    }
    columns.append(hotSpot);
  });

  // Just for completeness, finish the bottom row in the 'odd' case.
  if (!evenNumberOfHotspots) {
    columns.append(document.createElement('div'));
    columns.append(document.createElement('div'));
  }

  showcaseBlock.append(columns);
  decorateIcons(columns);
}
