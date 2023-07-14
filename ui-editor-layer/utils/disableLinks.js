/**
 * Disables the click events on all links in the given document.
 *
 * @param {Document} document - The document object representing the HTML document.
 * @returns {Promise<HTMLAnchorElement[]>} An array of disabled link elements.
 */
const disableLinks = async (document) => {
    /**
     * @type {NodeListOf<HTMLAnchorElement|HTMLImageElement>} links
     */
    const links = [...document.querySelectorAll('[href], [src]')];

    links.forEach(a => {
        /**
         * Disable click events on the link element.
         * @type {CSSStyleDeclaration}
         */
        a.style.pointerEvents = 'none'; });

    return links;
}

module.exports = { disableLinks };