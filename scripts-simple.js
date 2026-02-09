// 主入口文件 - 简化版本（不显示编辑和删除按钮）
import { initializeApp } from './modules/appInitSimple.js';
import { openImageModal } from './modules/imageModal.js';
import { showCustomContextMenu, hideCustomContextMenu } from './modules/contextMenu.js';
import { handlePaste } from './modules/mediaHandler.js';
import { initAdvancedSearch } from './modules/advancedSearch.js';
import { initNavigationSidebar, openNavigationSidebar } from './modules/navigationSidebar.js';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initAdvancedSearch();
    initNavigationSidebar();
    
    const navToggleBtn = document.getElementById('toggle-tree');
    if (navToggleBtn) {
        const newNavToggleBtn = navToggleBtn.cloneNode(true);
        navToggleBtn.parentNode.replaceChild(newNavToggleBtn, navToggleBtn);
        newNavToggleBtn.addEventListener('click', function() {
            openNavigationSidebar();
        });
    }
    
    document.addEventListener('paste', handlePaste);
    
    document.getElementById('tweets-container').addEventListener('click', function(e) {
        if (e.target.classList.contains('tweet-image')) {
            openImageModal(e.target);
        }
    });
    
    document.getElementById('tweets-container').addEventListener('contextmenu', function(e) {
        const tweetElement = e.target.closest('.tweet');
        if (tweetElement) {
            showCustomContextMenu(e, tweetElement);
            e.preventDefault();
        }
    });
    
    document.addEventListener('click', function() {
        hideCustomContextMenu();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideCustomContextMenu();
        }
    });
    
    const imageModal = document.getElementById('image-modal');
    const imageModalClose = document.querySelector('.image-modal-close');
    
    imageModalClose.addEventListener('click', function() {
        imageModal.style.display = 'none';
    });
    
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            imageModal.style.display = 'none';
            
            const statsModal = document.getElementById('stats-modal');
            if (statsModal) {
                statsModal.classList.add('hidden');
            }
        }
    });
});
