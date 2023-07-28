/**
 * Object containing selectors with their corresponding types.
 * @typedef {Object.<string, {type: string, editor?: string}>} SelectorsWithType
 */

/**
 * Selectors with their corresponding types.
 * @type {SelectorsWithType}
 */
const selectorsWithType = {
    'div.hero-content .heading-hero': { type: 'heading', editor: 'text' },
    'div.hero-content .paragraph-hero': { type: 'paragraph', editor: 'text' },
    'div.hero-content .room-showcase-container': { type: 'container', editor: '' },
    '#experiences .container': { type: 'title' },
    '#gallery .content': { type: 'cards' },
    '#how-it-works': { type: 'slideshow' },
    '#faq': { type: 'triple-cols' },
    '#longer-stays': { type: 'dual-cols' },
    '#location .content:first-child .text-section-title': { type: 'heading' },
    '#location .content:first-child .paragraph-md': { type: 'paragraph' },
    '#location .content:nth-child(2)': { type: 'map' },
};
module.exports = selectorsWithType;