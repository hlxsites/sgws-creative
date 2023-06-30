import {
    createTag
} from '../../scripts/scripts.js';

async function decorateStats(block) {
}

export default async function decorate(block) {
    if (block.parentElement.parentElement.classList.contains('wood-table')) {
        block.classList.add('wood-table');
    }

    // If block has a the size class
    if (block.classList.contains('stats')) {
        decorateStats(block);
    }
}