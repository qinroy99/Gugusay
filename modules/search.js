// 搜索功能模块
import { globalState } from './globalState.js';
import { loadPage } from './pageLoader.js';
import { renderTweets, updatePaginationInfo, hideLoadingIndicator } from './tweetRenderer.js';
import { applyFontSize } from './themeManager.js';

// 执行搜索
export async function performSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const keyword = searchInput.value.trim();
        if (keyword) {
            globalState.currentSearch = keyword;
            globalState.currentChannel = null; // 清除渠道过滤
            globalState.currentYearMonth = null; // 清除年月过滤
            
            // 同步到window对象
            if (typeof window !== 'undefined') {
                window.currentSearch = keyword;
                window.currentChannel = null;
                window.currentYearMonth = null;
            }
            
            globalState.currentPage = 1;
            loadPage(globalState.currentPage);
            
            // 动态导入搜索历史模块并添加搜索历史记录
            try {
                const searchHistoryModule = await import('./searchHistory.js');
                searchHistoryModule.addSearchHistory(keyword);
            } catch (error) {
                console.error('导入搜索历史模块失败:', error);
            }
            
            // 隐藏搜索历史下拉框
            hideSearchHistory();
        }
    }
}

// 清除搜索
export function clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 清除搜索、渠道和年月状态
    globalState.currentSearch = '';
    globalState.currentChannel = null;
    globalState.currentYearMonth = null;
    
    // 同步到window对象
    if (typeof window !== 'undefined') {
        window.currentSearch = '';
        window.currentChannel = null;
        window.currentYearMonth = null;
    }
    
    // 重置页码
    globalState.currentPage = 1;
    
    // 重新加载数据
    loadPage(1);
    
    // 隐藏搜索历史记录
    hideSearchHistory();
}

// 搜索那年今日的数据
export function searchOnThisDay(keyword) {
    // 清除年月和渠道过滤状态
    globalState.currentYearMonth = null;
    globalState.currentChannel = null;
    
    // 同步到window对象
    if (typeof window !== 'undefined') {
        window.currentYearMonth = null;
        window.currentChannel = null;
    }
    
    globalState.currentSearch = keyword;
    globalState.currentPage = 1;
    
    const url = `/api/on-this-day?keyword=${encodeURIComponent(keyword)}&page=${globalState.currentPage}&pageSize=${globalState.pageSize}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 确保 records 数组存在
            const records = data.records || (data.results && data.results.records) || [];
            renderTweets(records);
            
            // 更新totalRecords和totalPages
            if (data.total !== undefined && data.totalPages !== undefined) {
                globalState.totalRecords = data.total;
                globalState.totalPages = data.totalPages;
            }
            
            updatePaginationInfo();
            applyFontSize();
        })
        .catch(error => {
            console.error('加载数据失败:', error);
            hideLoadingIndicator();
        });
}

// 为模块提供搜索接口
window.performSearchFromModule = function(keyword) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = keyword;
        globalState.currentSearch = keyword;
        globalState.currentChannel = null; // 清除渠道过滤
        globalState.currentYearMonth = null; // 清除年月过滤
        
        // 同步到window对象
        if (typeof window !== 'undefined') {
            window.currentSearch = keyword;
            window.currentChannel = null;
            window.currentYearMonth = null;
        }
        
        globalState.currentPage = 1;
        loadPage(globalState.currentPage);
    }
};

// 显示搜索历史记录（动态导入模块）
export async function showSearchHistory() {
    try {
        const searchHistoryModule = await import('./searchHistory.js');
        searchHistoryModule.showSearchHistory();
    } catch (error) {
        console.error('导入搜索历史模块失败:', error);
    }
}

// 隐藏搜索历史记录（动态导入模块）
export async function hideSearchHistory() {
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
    performSearch,
    clearSearch,
    searchOnThisDay,
    showSearchHistory,
    hideSearchHistory
};
