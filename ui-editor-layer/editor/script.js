import {createEditControlsAfterFill} from "./modules/createEditControlsAfterFill";

window.addEventListener('DOMContentLoaded', () => {
    /**
     * Tries to query elements with specific attributes (`x-type` and `x-db-map`) from the document.
     * If the elements are not found, it waits for a duration before trying again.
     * Once the elements are found, it groups them by their attribute values and logs the groups.
     * After logging, it calls `createEditControlsAfterFill` with the found elements and other relevant data.
     *
     * Note: It's important to ensure the context in which this function runs has access to the `document` object.
     *
     * @function
     * @throws {Error} Throws an error if elements with the specified attributes are not found after multiple retries.
     */
    const tryQuerySelector = () => {
        localStorage.removeItem("storeObject");
        const elements = document.querySelectorAll('[x-binding-type]');
        const elementsMap = document.querySelectorAll('[x-binding-key]');

        if ((elements.length || elementsMap.length) === 0) setTimeout(tryQuerySelector, 10000);

        const elementsByType = new Map();
        const elementsByDbMap = new Map();
        const storeObject = {};
        const dbObject = {};

        elements.forEach((element) => {
            const xType = element.getAttribute('x-binding-type');

            if (elementsByType.has(xType)) {
                elementsByType.get(xType).push(element);
            } else {
                elementsByType.set(xType, [element]);
            }
        });
        elementsMap.forEach((element) => {
            const xDbMap = element.getAttribute('x-binding-key');

            if (xDbMap !== 'undefined' && xDbMap !== null) {
                if (elementsByDbMap.has(xDbMap)) {
                    elementsByDbMap.get(xDbMap).push(element);
                } else {
                    elementsByDbMap.set(xDbMap, [element]);
                }
            }
        });
        let count = 0;
        elementsByType.forEach((elements, xType) => {
            const logElements = (elements, xType) => {
                console.log(`Elements with x-type "${xType}":`, elements);

                elements.forEach((element) => {
                    if (xType == null) return;
                    count++;
                    storeObject[`${xType}-${count}`] = "";
                });
            };

            logElements(elements, xType);
        });
        elementsByDbMap.forEach((elements, xDbMap) => {
            const logElements = (elements, xDbMap) => {
                console.log(`Elements with x-db-map "${xDbMap}":`, elements);

                elements.forEach((element) => {
                    if (xDbMap == null ) return;
                    dbObject[`${xDbMap}`] = "";
                });
            };

            logElements(elements, xDbMap);
        });
        createEditControlsAfterFill(elementsByType, elementsByType, storeObject, dbObject);
    };
    tryQuerySelector();
    setTimeout(function() {
        MicroModal.init();
    }, 5000);
});