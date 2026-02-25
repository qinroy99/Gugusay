// 图片模态框模块

// 打开图片放大模态框
export function openImageModal(imgElement) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('image-modal-img');
    const captionText = document.getElementById('image-modal-caption');
    
    modal.style.display = 'block';
    modalImg.src = imgElement.src;
    
    const imageIndex = parseInt(imgElement.dataset.imageIndex) + 1;
    const imageCount = parseInt(imgElement.dataset.imageCount);
    const tweetId = imgElement.dataset.tweetId;
    
    captionText.innerHTML = `推文ID: ${tweetId} | 图片 ${imageIndex}/${imageCount}`;
}

// 关闭图片模态框
export function closeImageModal() {
    const imageModal = document.getElementById('image-modal');
    if (imageModal) {
        imageModal.style.display = 'none';
    }
}

export default {
    openImageModal,
    closeImageModal
};
