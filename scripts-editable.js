// 主入口文件 - 可编辑版本（带编辑和复制按钮）
// 导入所有模块
import { initializeApp } from './modules/appInit.js';
import { openImageModal, closeImageModal } from './modules/imageModal.js';
import { showCustomContextMenu, hideCustomContextMenu } from './modules/contextMenu.js';
import { handlePaste } from './modules/mediaHandler.js';
import { initAdvancedSearch } from './modules/advancedSearch.js';
import { initNavigationSidebar, openNavigationSidebar } from './modules/navigationSidebar.js';
import { showSettingsPanel, closeSettingsPanel } from './modules/settings.js';

// 将设置函数暴露到全局，供HTML调用
window.showSettingsPanel = showSettingsPanel;
window.closeSettingsPanel = closeSettingsPanel;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    initializeApp();
    
    // 初始化高级搜索功能
    initAdvancedSearch();
    
    // 初始化导航侧边栏
    initNavigationSidebar();
    
    // 修改导航按钮点击事件
    const navToggleBtn = document.getElementById('toggle-tree');
    if (navToggleBtn) {
        // 移除原有的事件监听器
        const newNavToggleBtn = navToggleBtn.cloneNode(true);
        navToggleBtn.parentNode.replaceChild(newNavToggleBtn, navToggleBtn);
        
        // 添加新的事件监听器
        newNavToggleBtn.addEventListener('click', function() {
            openNavigationSidebar();
        });
    }
    
    // 添加粘贴事件监听器
    document.addEventListener('paste', handlePaste);
    
    // 添加图片放大功能的事件监听器
    document.getElementById('tweets-container').addEventListener('click', function(e) {
        // 检查点击的是否是推文图片
        if (e.target.classList.contains('tweet-image')) {
            openImageModal(e.target);
        }
    });
    
    // 添加推文右键菜单事件监听器
    document.getElementById('tweets-container').addEventListener('contextmenu', function(e) {
        // 检查右键点击的是否是推文内容
        const tweetElement = e.target.closest('.tweet');
        if (tweetElement) {
            // 创建自定义右键菜单
            showCustomContextMenu(e, tweetElement);
            e.preventDefault();
        }
    });
    
    // 点击其他地方隐藏自定义右键菜单
    document.addEventListener('click', function() {
        hideCustomContextMenu();
    });
    
    // 添加ESC键隐藏自定义右键菜单
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideCustomContextMenu();
        }
    });
    
    // 添加图片模态框关闭事件监听器
    const imageModal = document.getElementById('image-modal');
    const imageModalClose = document.querySelector('.image-modal-close');
    
    // 点击关闭按钮关闭模态框
    imageModalClose.addEventListener('click', function() {
        imageModal.style.display = 'none';
    });
    
    // 点击模态框背景关闭模态框
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });
    
    // 按ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            imageModal.style.display = 'none';
            
            // 关闭统计弹窗
            const statsModal = document.getElementById('stats-modal');
            if (statsModal) {
                statsModal.classList.add('hidden');
            }
            
            // 关闭编辑弹窗
            const editModal = document.getElementById('edit-modal');
            if (editModal) {
                editModal.classList.add('hidden');
            }
        }
    });
});
