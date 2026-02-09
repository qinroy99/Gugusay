// 事件处理器模块
import { globalState } from './globalState.js';
import { loadPage } from './pageLoader.js';
import { performSearch, clearSearch, searchOnThisDay } from './search.js';
import { openEditModal, saveEditedRecord, deleteRecord } from './edit.js';
import { toggleMediaSelection, handleMediaFileSelect, handlePaste } from './mediaHandler.js';
import { changeFontSize, changeTheme } from './themeManager.js';
import { showCustomContextMenu, hideCustomContextMenu, copyTextToClipboard } from './contextMenu.js';
import { openImageModal } from './imageModal.js';
import { showStatsModal } from './stats.js';
import { loadNavigationTree, toggleNavigationTree } from './yearMonthTree.js';
import { showLoadingIndicator, renderTweets, updatePaginationInfo, hideLoadingIndicator } from './tweetRenderer.js';
import { applyFontSize } from './themeManager.js';
import { openAdvancedSearch } from './advancedSearch.js';

// 绑定事件监听器
export function bindEventListeners() {
    // 搜索按钮
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // 搜索输入框事件监听器
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // 显示搜索历史记录
        searchInput.addEventListener('focus', showSearchHistory);

        // 回车键触发搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // 输入事件处理（添加防抖）
        searchInput.addEventListener('input', function() {
            // 清除之前的防抖计时器
            if (globalState.searchDebounceTimer) {
                clearTimeout(globalState.searchDebounceTimer);
            }

            // 设置新的防抖计时器
            globalState.searchDebounceTimer = setTimeout(() => {
                const keyword = this.value.trim();
                if (keyword.length > 0) {
                    // 显示搜索历史记录
                    showSearchHistory();
                } else {
                    // 隐藏搜索历史记录
                    hideSearchHistory();
                }
            }, globalState.SEARCH_DEBOUNCE_TIME);
        });
        
        // 点击其他地方隐藏搜索历史
        document.addEventListener('click', function(event) {
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer && !searchContainer.contains(event.target)) {
                hideSearchHistory();
            }
        });
    }
    
    // 清除搜索
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }
    
    // 统计按钮
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', showStatsModal);
    }

    // 高级搜索按钮事件
    const advancedSearchBtnMain = document.getElementById('advanced-search-btn-main');
    if (advancedSearchBtnMain) {
        advancedSearchBtnMain.addEventListener('click', openAdvancedSearch);
    }
    
    // 浮动分页按钮
    const floatPrevBtn = document.getElementById('float-prev-btn');
    if (floatPrevBtn) {
        floatPrevBtn.addEventListener('click', function() {
            loadPage(globalState.currentPage - 1);
        });
    }
    
    const floatNextBtn = document.getElementById('float-next-btn');
    if (floatNextBtn) {
        floatNextBtn.addEventListener('click', function() {
            loadPage(globalState.currentPage + 1);
        });
    }
    
    // 年月导航树切换按钮
    const toggleTreeBtn = document.getElementById('toggle-tree');
    if (toggleTreeBtn) {
        toggleTreeBtn.addEventListener('click', toggleNavigationTree);
    }
    
    // 点击页面其他位置时隐藏导航菜单
    document.addEventListener('click', function(event) {
        const navigationTree = document.getElementById('navigation-tree');
        const toggleTreeBtn = document.getElementById('toggle-tree');
        
        // 检查点击的目标是否在导航树或切换按钮内
        if (navigationTree && toggleTreeBtn) {
            const isClickInsideNavigation = navigationTree.contains(event.target);
            const isClickOnToggleBtn = toggleTreeBtn.contains(event.target);
            
            // 如果点击不在导航树和切换按钮内，则隐藏时光机
            if (!isClickInsideNavigation && !isClickOnToggleBtn) {
                navigationTree.classList.add('collapsed');
                toggleTreeBtn.innerHTML = '时光机';
            }
        }
    });

    // 动态绑定编辑、删除和复制按钮
    const tweetsContainer = document.getElementById('tweets-container');
    if (tweetsContainer) {
        tweetsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const id = e.target.dataset.id;
                openEditModal(id);
            } else if (e.target.classList.contains('delete-btn')) {
                const id = e.target.dataset.id;
                deleteRecord(id);
            } else if (e.target.classList.contains('copy-btn')) {
                const channel = e.target.dataset.channel;
                const datetime = e.target.dataset.datetime;
                const content = e.target.dataset.content;
                
                // 组合要复制的内容：channel、datetime、content，用换行符分隔
                let textToCopy = '';
                if (channel) {
                    textToCopy += channel + '\n';
                }
                textToCopy += datetime + '\n';
                textToCopy += content;
                
                copyTextToClipboard(textToCopy);
            }
        });
    }
    
    // 键盘事件监听器
    document.addEventListener('keydown', function(e) {
        // 只有在不在输入框中时才处理键盘事件
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                // 上一页
                if (globalState.currentPage > 1) {
                    loadPage(globalState.currentPage - 1);
                }
                break;
            case 'ArrowRight':
            case 'PageDown':
                // 下一页
                if (globalState.currentPage < globalState.totalPages) {
                    loadPage(globalState.currentPage + 1);
                }
                break;
        }
    });
    
    // 编辑弹窗相关事件
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        // 关闭按钮事件
        const closeBtn = editModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                editModal.classList.add('hidden');
            });
        }
        
        // 点击弹窗外部关闭弹窗
        editModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
        
        // 取消按钮事件
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', function() {
                editModal.classList.add('hidden');
            });
        }
        
        // 保存按钮事件
        const saveEditBtn = document.getElementById('save-edit-btn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', saveEditedRecord);
        }
        
        // 添加/移除图片按钮事件
        const addMediaBtn = document.getElementById('add-media-btn');
        if (addMediaBtn) {
            addMediaBtn.addEventListener('click', toggleMediaSelection);
        }
        
        // 图片选择事件
        const mediaFileInput = document.getElementById('edit-media-file');
        if (mediaFileInput) {
            mediaFileInput.addEventListener('change', handleMediaFileSelect);
        }
    }
}

// 显示搜索历史记录（动态导入模块）
async function showSearchHistory() {
    try {
        const searchHistoryModule = await import('./searchHistory.js');
        searchHistoryModule.showSearchHistory();
    } catch (error) {
        console.error('导入搜索历史模块失败:', error);
    }
}

// 隐藏搜索历史记录（动态导入模块）
async function hideSearchHistory() {
    try {
        const searchHistoryModule = await import('./searchHistory.js');
        searchHistoryModule.hideSearchHistory();
    } catch (error) {
        console.error('导入搜索历史模块失败:', error);
        
        // 备用实现
        const searchHistory = document.getElementById('search-history');
        if (searchHistory) {
            searchHistory.classList.add('hidden');
        }
    }
}

export default {
    bindEventListeners
};
