/**
 * Disables the click events on all elements with 'href' or 'src' attributes in the given document.
 * For elements with the class 'accordion-header w-inline-block', they are replaced with a div element.
 *
 * @param {Document} document - The document object representing the HTML document.
 * @returns {HTMLAnchorElement[]|HTMLImageElement[]} An array of disabled elements with 'href' or 'src' attributes.
 */
const disableLinks = async (document) => {
    /**
     * @type {NodeListOf<HTMLAnchorElement|HTMLImageElement>} links
     */
    const links = [...document.querySelectorAll('[href], [src]')];
    links.forEach(a => {
        if (a.className === 'accordion-header w-inline-block') {
            const div = document.createElement("div");
            div.innerHTML = a.innerHTML;
            a.replaceWith(div);
        }
        /**
         * Disable click events on the link element.
         * @type {CSSStyleDeclaration}
         */
        a.style.pointerEvents = 'none';
    });

    return links;
};

module.exports = { disableLinks };