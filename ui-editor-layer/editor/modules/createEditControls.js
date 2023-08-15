import {createButton, createSectionTag} from "./createElements";
import {createModal} from "./createModal";

export const createEditControls = (div, xType, index, count) => {
	const editBtn = createButton('Edit', 'edit-btn');
	const aiBtn = createButton('AI magic', 'ai-btn');
	const sectionTag = createSectionTag('Section Name', 'section-tag');

	const updateStoreObject = (div, xType, count) => {
		const dbMap = div.getAttribute('x-db-map');
		let storeObject = JSON.parse(localStorage.getItem("storeObject"));
		const unwantedClasses = ['edit-btn', 'section-tag'];

		const spanContent = div.querySelector('span')?.innerHTML || [...div.childNodes]
		.filter(node => node.nodeType !== Node.ELEMENT_NODE || !unwantedClasses.some(cls => node.classList.contains(cls)))
		.map(node => node.outerHTML)
		.join('') || '';

		storeObject[`${dbMap}`] = spanContent;
		localStorage.setItem("storeObject", JSON.stringify(storeObject));
		console.log('storeObject after modification:', storeObject);
	}
	if (xType === "ai-block") {
		div.append(editBtn, sectionTag);
        editBtn.setAttribute('data-micromodal-trigger', `modal-${index+1}`);
        div.insertAdjacentHTML('afterend', createModal(index+1, 'Edit', `
        	<input type="text" id="givenLocation" placeholder="Enter location (e.g., Helsinki)">
			<button id="modal-btn-fetch">Fetch Data</button>
			<p id="result"></p>
        `));
		const modalFetchBtn = document.getElementById(`modal-btn-fetch`);
		modalFetchBtn.addEventListener('click', async function() {
				const givenLocation = document.getElementById('givenLocation').value;
				const url = ''+ givenLocation;

				try {
					const response = await fetch(url);
					const data = await response.json();
					document.getElementById('result').innerText = JSON.stringify(data, null, 2);
				} catch (error) {
					console.error('Error fetching data:', error);
					document.getElementById('result').innerText = 'Error fetching data. Please try again later.';
				}
		})

        // Add the event listener to the 'Save' button of the modal
        const modalSaveBtn = document.getElementById(`modal-${index+1}-save`);
        modalSaveBtn.addEventListener('click', function() {
            updateStoreObject(div, xType, count);
        }, false);
	}
	if (xType === "container") {
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

			updateStoreObject(div,xType, count, updatedContent);

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
		const data = { text: div.querySelector('span').textContent, section: div.querySelector('.section-tag.show').textContent };
		fetch('http://localhost:3001/', {
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
		if (xType == "container" || xType === "ai-block") {
			const modalSaveBtn = document.querySelector(`#modal-${index} .modal-save-btn`);
			modalSaveBtn.addEventListener('click', () => {
				if (xType === 'container') {
					updateStoreObject(div, xType, count);
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
				updateStoreObject(div, xType, count)
			}
		}
	}
}