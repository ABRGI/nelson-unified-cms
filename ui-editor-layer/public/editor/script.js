window.addEventListener('DOMContentLoaded', function() {
    const createModal = (id, title, content) => {
        return `
            <div class="micromodal-slide modal" id="modal-${id}" aria-hidden="true" data-custom-close="">
                <div class="modal__overlay" tabindex="-1" data-micromodal-close="">
                    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-${id}-title">
                        <header class="modal__header">
                            <h2 class="modal__title" id="modal-${id}-title"> ${title} </h2>
                            <button class="modal__close" aria-label="Close modal" data-micromodal-close=""></button>
                        </header>
                        <div class="modal__content" id="modal-${id}-content">
                            ${content}
                        </div>
                        <footer class="modal__footer">
                            <button class="modal__btn modal__btn-primary modal-save-btn" id="modal-${id}-save">Save</button>
                            <button class="modal__btn" data-micromodal-close="" aria-label="Close this dialog window">Close</button>
                        </footer>
                    </div>
                </div>
            </div>`;
    }

    const createButton = (text, className) =>
        Object.assign(document.createElement('button'), { innerText: text, className });

    const createSectionTag = (text, className) =>
        Object.assign(document.createElement('div'), { innerText: text, className });

    const createEditControls = (div, xType, index, count) => {
        const editBtn = createButton('Edit', 'edit-btn');
        const aiBtn = createButton('AI magic', 'ai-btn');
        const sectionTag = createSectionTag('Section Name', 'section-tag');

        const updateStoreObject = (xType, count) => {
            let storeObject = JSON.parse(localStorage.getItem("storeObject"));
            const unwantedClasses = ['edit-btn', 'section-tag'];

            const spanContent = div.querySelector('span')?.innerHTML || [...div.childNodes]
            .filter(node => node.nodeType !== Node.ELEMENT_NODE || !unwantedClasses.some(cls => node.classList.contains(cls)))
            .map(node => node.outerHTML)
            .join('') || '';

            storeObject[`${xType}-${count}`] = spanContent;
            localStorage.setItem("storeObject", JSON.stringify(storeObject));
            console.log('storeObject after modification:', storeObject);
        }

        if (xType == "container") {
            div.append(editBtn, sectionTag);
            const images = div.querySelectorAll('.swiper-wrapper img')
            const content = div.querySelectorAll('.div-block div:not(.divider, .div-block-2, .grid-features, .ico-lg, .flex-h-xsm--wrap, .flex-h-sm--wrap), .div-block a');
            const allContentAsHTML = Array.prototype.reduce.call(content, (html, node) => html + node.outerHTML.replace(/(?<=class=")/, 'modal-user-content ').replace('>', ' contentEditable="true">') + '<br>', '');
            const allImagesAsHTML = Array.prototype.reduce.call(images, (html, node) => html + node.outerHTML.replace(/class="[^"]*"/g, 'class="modal-user-images"') + '<br>', '');
            editBtn.setAttribute('data-micromodal-trigger', `modal-${index}`);
            div.insertAdjacentHTML('afterend', createModal(index, 'Edit', `<div style="display: grid; grid-template-columns: 1fr 1fr; grid-gap: 100px;"><div>${allImagesAsHTML}</div><div>${allContentAsHTML}</div></div>`));

            // Add the event listener to the 'Save' button of the modal
            const modalSaveBtn = document.getElementById(`modal-${index}-save`);
            modalSaveBtn.addEventListener('click', function() {
                const modalContentDiv = document.getElementById(`modal-${index}-content`);
                const updatedContentElements = modalContentDiv.querySelectorAll('.modal-user-content');
                const updatedImageElements = modalContentDiv.querySelectorAll('.modal-user-images');
                let updatedContent = '';

                updatedContentElements.forEach(element => {
                    updatedContent += element.textContent + '<br>';
                });

                updateStoreObject(xType, count, updatedContent);

                // updating original content
                const originalContentElements = div.querySelectorAll('.div-block div:not(.divider, .div-block-2, .grid-features, .ico-lg, .flex-h-xsm--wrap, .flex-h-sm--wrap), .div-block a');
                originalContentElements.forEach((element, i) => {
                    if(updatedContentElements[i]) {
                        element.innerHTML = updatedContentElements[i].textContent;
                    }
                });

                // updating original images
                const originalImageElements = div.querySelectorAll('.swiper-wrapper img');
                originalImageElements.forEach((element, i) => {
                    if(updatedImageElements[i]) {
                        element.src = updatedImageElements[i].src;
                    }
                });

            }, false);


        } else {
            div.append(editBtn, sectionTag, aiBtn);
        }
        const setElementSectionTag = (div, xType) => {
            const elementSectionTag = div.querySelector('.section-tag');

            if (elementSectionTag) {
                elementSectionTag.textContent = xType ?? '';
            }
        }
        setElementSectionTag(div, xType);
        let elementsArray = [editBtn, sectionTag];
        const toggleElements = (elements, className) => elements.forEach(element => element.classList.toggle(className));

        aiBtn.onclick = (e) => {
            e.stopPropagation();
            const span = div.querySelector('span');
            if (!span) return; // Return early if the span doesn't exist
            const data = { text: div.querySelector('span').textContent, section: 'div' };
            fetch('', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(text => {
                    const cleanText = text.message.replace(/<[^>]+>/g, '').replace(/\\n/g, '\n');
                    const spanElement = div.querySelector('span');
                    if (spanElement) {
                        spanElement.textContent = cleanText;
                    }
                })
                .catch(error => console.error('Error:', error));
        };

        div.onclick = () => {
            if (editBtn.innerText === 'Save') return;
            let span;
            if (!div.querySelector('span')) {
                span = document.createElement('span');
                const extractContent = [...div.childNodes]
                    .filter(node => node !== editBtn && node !== sectionTag && node !== aiBtn)
                    .map(node => node.cloneNode(true));

                // Clear the div and add back the cloned elements inside the span
                while (div.firstChild && div.firstChild !== editBtn && div.firstChild !== sectionTag && div.firstChild !== aiBtn) {
                    div.firstChild.remove();
                }
                span.append(...extractContent);
                div.appendChild(span);
            } else {
                span = div.querySelector('span');
            }
            if (editBtn.innerText === 'Edit' && div.classList.contains('selected')) {
                div.classList.remove('selected');
                toggleElements(elementsArray, 'show');
                while(span.firstChild) {
                    div.insertBefore(span.firstChild, span);
                }
                span.remove();

                // Re-append the buttons to the div
                div.appendChild(editBtn);
                div.appendChild(sectionTag);
                div.appendChild(aiBtn);
            } else {
                div.classList.add('selected');
                toggleElements(elementsArray, 'show');
            }
        };
        editBtn.onclick = (e) => {
            e.stopPropagation();
            const span = div.querySelector('span');
            if (!span) return; // Return early if the span doesn't exist
            if (xType == "container") {
                const modalSaveBtn = document.querySelector(`#modal-${index} .modal-save-btn`);
                modalSaveBtn.addEventListener('click', () => {
                    if (xType === 'container') {
                        updateStoreObject(xType, count);
                    }
                }, false);
            } else {
                /* !TODO:
                 *   fix observer and how it mutates the elements, the lines are commented out for now.
                 *   Cause of error:
                 *   Press Element, Press Edit, Press Save, Press Element > observer doesnt know what to do once span has been removed (needs checking perhaps).
                 *
                 */
                /* let observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (span.textContent.trim().length === 0) {
                            let span = div.querySelector('span');
                            span.textContent = 'Add text';
                        }
                    });
                }); */
                if (editBtn.innerText === 'Edit') {
                    /* observer.observe(div, { childList: true, characterData: true, subtree: true }); */
                    span.contentEditable = 'true';
                    div.classList.add('editing');
                    editBtn.innerText = 'Save';
                    toggleElements([aiBtn], 'show');

                } else {
                    /* observer.disconnect();*/
                    span.contentEditable = 'false';
                    div.classList.remove('editing');
                    editBtn.innerText = 'Edit';
                    toggleElements([aiBtn], 'show');
                    updateStoreObject(xType, count)
                }
            }
        }
    }

    (function tryQuerySelector() {
        const elements = document.querySelectorAll('[x-type]');

        if (elements.length === 0) {
            setTimeout(tryQuerySelector, 10000);
            return;
        }

        const elementsByType = new Map();
        const storeObject = {};

        elements.forEach((element) => {
            const xType = element.getAttribute('x-type');

            if (elementsByType.has(xType)) {
                elementsByType.get(xType).push(element);
            } else {
                elementsByType.set(xType, [element]);
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
        createEditControlsAfterFill(elementsByType, storeObject);
    })();

    function createEditControlsAfterFill(elementsByType, storeObject) {
        const elementEntries = elementsByType.entries();
        let count = 0;
        const createEditControlsRecursive = () => {
            const nextEntry = elementEntries.next();
            if (nextEntry.done) {
                // All elements have been processed
                localStorage.setItem("storeObject", JSON.stringify(storeObject));
                console.log("storeObject:", storeObject);
                return;
            }

            const [xType, elements] = nextEntry.value;
            elements.forEach((element, index) => {
                count++;
                createEditControls(element, xType, index, count);
            });

            setTimeout(createEditControlsRecursive, 1000);
        };

        // Start recursive processing
        createEditControlsRecursive();
    }



});