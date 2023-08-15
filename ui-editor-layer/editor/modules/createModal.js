export const createModal = (id, title, content) => {
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