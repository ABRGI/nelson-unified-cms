export const createButton = (text, className) =>
	Object.assign(document.createElement('button'), { innerText: text, className });

export const createSectionTag = (text, className) =>
	Object.assign(document.createElement('div'), { innerText: text, className });