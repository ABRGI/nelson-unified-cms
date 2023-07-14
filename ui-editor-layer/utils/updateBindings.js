/**
 * Updates the bindings of elements in the document based on the provided selectors and types.
 *
 * @param {Document} document - The document object representing the HTML document.
 * @param {Object.<string, { type: string }>} selectorsWithType - An object mapping selectors to their corresponding types.
 * @returns {Promise<void[]>} A promise that resolves to an array of undefined values.
 */
const updateBindings = async (document, selectorsWithType) => {
    const bindingPromises = Object.entries(selectorsWithType).map(async ([selector, { type }]) => {
        const bindings = [...document.querySelectorAll(selector)];

        for (const binding of bindings) {
            binding.setAttribute('x-type', type);
        }
    });

    return Promise.all(bindingPromises);
}

module.exports = { updateBindings };