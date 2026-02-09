// 事件处理器模块 - 可编辑版本（带编辑和复制按钮，无删除按钮）
import { globalState } from './globalState.js';
import { loadPage } from './pageLoader.js';
import { performSearch, clearSearch } from './search.js';
import { openEditModal, saveEditedRecord } from './edit.js';
import { toggleMediaSelection, handleMediaFileSelect } from './mediaHandler.js';
import { showCustomContextMenu, hideCustomContextMenu, copyTextToClipboard } from './contextMenu.js';
import { showStatsModal } from './stats.js';
import { toggleNavigationTree } from './yearMonthTree.js';
import { showLoadingIndicator, updatePaginationInfo, hideLoadingIndicator } from './tweetRendererEditable.js';
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
        searchInput.addEventListener('focus', showSearchHistory);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        searchInput.addEventListener('input', function() {
            if (globalState.searchDebounceTimer) {
                clearTimeout(globalState.searchDebounceTimer);
            }
            globalState.searchDebounceTimer = setTimeout(() => {
                const keyword = this.value.trim();
                if (keyword.length > 0) {
                    showSearchHistory();
                } else {
                    hideSearchHistory();
                }
            }, globalState.SEARCH_DEBOUNCE_TIME);
        });
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
        if (navigationTree && toggleTreeBtn) {
            const isClickInsideNavigation = navigationTree.contains(event.target);
            const isClickOnToggleBtn = toggleTreeBtn.contains(event.target);
            if (!isClickInsideNavigation && !isClickOnToggleBtn) {
                navigationTree.classList.add('collapsed');
                toggleTreeBtn.innerHTML = '时光机';
            }
        }
    });

    // 动态绑定编辑和复制按钮（可编辑版本无删除按钮）
    const tweetsContainer = document.getElementById('tweets-container');
    if (tweetsContainer) {
        tweetsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const id = e.target.dataset.id;
                openEditModal(id);
            } else if (e.target.classList.contains('copy-btn')) {
                const channel = e.target.dataset.channel;
                const datetime = e.target.dataset.datetime;
                const content = e.target.dataset.content;
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                if (globalState.currentPage > 1) {
                    loadPage(globalState.currentPage - 1);
                }
                break;
            case 'ArrowRight':
            case 'PageDown':
                if (globalState.currentPage < globalState.totalPages) {
                    loadPage(globalState.currentPage + 1);
                }
                break;
        }
    });
    
    // 编辑弹窗相关事件
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        const closeBtn = editModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                editModal.classList.add('hidden');
            });
        }
        editModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', function() {
                editModal.classList.add('hidden');
            });
        }
        const saveEditBtn = document.getElementById('save-edit-btn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', saveEditedRecord);
        }
        const addMediaBtn = document.getElementById('add-media-btn');
        if (addMediaBtn) {
            addMediaBtn.addEventListener('click', toggleMediaSelection);
        }
        const mediaFileInput = document.getElementById('edit-media-file');
        if (mediaFileInput) {
            mediaFileInput.addEventListener('change', handleMediaFileSelect);
        }
    }
}

async function showSearchHistory() {
    try {
        const searchHistoryModule = await import('./searchHistory.js');
        searchHistoryModule.showSearchHistory();
    } catch (error) {
        console.error('导入搜索历史模块失败:', error);
    }
}

async function hideSearchHistory() {
    try {
        const searchHistoryModule = await import('./searchHistory.js');
        searchHistoryModule.hideSearchHistory();
    } catch (error) {
        console.error('导入搜索历史模块失败:', error);
        const searchHistory = document.getElementById('search-history');
        if (searchHistory) {
            searchHistory.classList.add('hidden');
        }
    }
}

export default {
    bindEventListeners
};
