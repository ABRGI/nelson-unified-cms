/**
 * Updates the bindings of elements in the document based on the provided selectors and types.
 * It sets 'x-type' and 'x-db-map' attributes based on the properties of the mapped objects.
 *
 * @param {Document} document - The document object representing the HTML document.
 * @param {Object.<string, { message: { type: string, dbMap: string } }>} selectorsWithType - An object mapping selectors to their corresponding types and dbMap values.
 * @returns {Promise<void[]>} A promise that resolves when all bindings are updated.
 */
const updateBindings = async (document, selectorsWithType) => {
    const { message } = selectorsWithType;
    console.log(message)
    const bindingPromises = Object.entries(message).map(async ([selector, { type }]) => {
        const bindings = [...document.querySelectorAll(selector)];

        for (const binding of bindings) {
            binding.setAttribute('x-type', type);
        }
    });

    const bindingPromisesMap = Object.entries(message).map(async ([selector, { dbMap }]) => {
        const bindings = [...document.querySelectorAll(selector)];

        for (const binding of bindings) {
            binding.setAttribute('x-db-map', dbMap);
        }
    });

    return Promise.all([bindingPromises, bindingPromisesMap]);
}

module.exports = { updateBindings };