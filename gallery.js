const galleryItems = [...document.querySelectorAll('.gallery-item, .role-preview')];
const galleryModal = document.querySelector('.gallery-modal');
const modalImage = galleryModal?.querySelector('img');
const modalCaption = galleryModal?.querySelector('figcaption');
let activeGalleryIndex = 0;
let activeGalleryItems = galleryItems;

function showGalleryItem(index) {
  activeGalleryIndex = (index + activeGalleryItems.length) % activeGalleryItems.length;
  const item = activeGalleryItems[activeGalleryIndex];
  modalImage.src = item.dataset.full;
  modalImage.alt = item.querySelector('img').alt;
  modalCaption.textContent = item.dataset.caption;
}

galleryItems.forEach((item) => item.addEventListener('click', () => {
  const group = item.dataset.galleryGroup || (item.classList.contains('role-preview') ? 'roles' : 'insights');
  activeGalleryItems = galleryItems.filter((candidate) => (candidate.dataset.galleryGroup || (candidate.classList.contains('role-preview') ? 'roles' : 'insights')) === group);
  showGalleryItem(activeGalleryItems.indexOf(item));
  galleryModal.showModal();
}));

galleryModal?.querySelector('.gallery-close').addEventListener('click', () => galleryModal.close());
galleryModal?.querySelector('.gallery-prev').addEventListener('click', () => showGalleryItem(activeGalleryIndex - 1));
galleryModal?.querySelector('.gallery-next').addEventListener('click', () => showGalleryItem(activeGalleryIndex + 1));
galleryModal?.addEventListener('click', (event) => { if (event.target === galleryModal) galleryModal.close(); });
document.addEventListener('keydown', (event) => {
  if (!galleryModal?.open) return;
  if (event.key === 'ArrowRight') showGalleryItem(activeGalleryIndex - 1);
  if (event.key === 'ArrowLeft') showGalleryItem(activeGalleryIndex + 1);
});
