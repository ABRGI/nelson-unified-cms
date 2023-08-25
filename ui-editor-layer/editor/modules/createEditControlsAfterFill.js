import {createEditControls} from "./createEditControls";

export const createEditControlsAfterFill = (elementsByType, elementsByDbMap, storeObject, dbObject) => {
	const elementEntries = elementsByType.entries();
	let count = 0;
	const createEditControlsRecursive = () => {
		const nextEntry = elementEntries.next();
		if (nextEntry.done) {
			let objForLocalStorage = {};
			for (let key in dbObject) {
				const element = document.querySelector(`[x-db-map="${key}"]`);
				let content = element.innerHTML;
				const breakPointIndex = content.indexOf('<button');
				if (breakPointIndex !== -1) {
					content = content.substring(0, breakPointIndex).trim();
				}
				// Capture the trimmed content
				objForLocalStorage[key]  = content;
			}
			localStorage.setItem("storeObject", JSON.stringify(objForLocalStorage));
			console.log("storeObject:", objForLocalStorage);
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
};