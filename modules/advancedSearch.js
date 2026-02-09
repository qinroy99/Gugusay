/**
 * 高级搜索模块
 * 提供高级搜索侧边栏功能，显示搜索结果列表
 * 点击结果可跳转到对应页面
 */

import { loadPage } from './pageLoader.js';
import { frontendCache } from './globalState.js';

// 侧边栏元素
const sidebar = document.getElementById('advanced-search-sidebar');
const searchInput = document.getElementById('advanced-search-input');
const searchBtn = document.getElementById('advanced-search-btn');
const resultsList = document.getElementById('advanced-search-results');
const closeBtn = document.getElementById('advanced-search-close');

// 每页显示的记录数
const PAGE_SIZE = 10;
// 高级搜索结果分页大小
const SEARCH_PAGE_SIZE = 10;
// 当前搜索结果页
let currentSearchPage = 1;
// 总搜索结果数
let totalSearchResults = 0;
// 当前搜索关键词
let currentSearchKeyword = '';

/**
 * 打开高级搜索侧边栏
 */
export function openAdvancedSearch() {
    sidebar.classList.remove('hidden');
    searchInput.focus();
}

/**
 * 关闭高级搜索侧边栏
 */
export function closeAdvancedSearch() {
    sidebar.classList.add('hidden');
    searchInput.value = '';
    resultsList.innerHTML = '';
}

/**
 * 执行高级搜索
 */
export async function performAdvancedSearch(page = 1) {
    let keyword = searchInput.value.trim();
    
    // 如果没有关键词但之前有搜索过的关键词，使用之前的
    if (!keyword && currentSearchKeyword) {
        keyword = currentSearchKeyword;
        searchInput.value = keyword; // 恢复输入框的值
    }
    
    if (!keyword) {
        showNotification('请输入搜索关键词');
        return;
    }

    // 保存当前搜索关键词
    currentSearchKeyword = keyword;
    currentSearchPage = page;

    // 显示加载状态
    resultsList.innerHTML = '<div class="search-loading">搜索中...</div>';

    try {
        // 获取匹配的记录（分页）
        const searchResult = await searchRecords(keyword, page);
        
        if (searchResult.records.length === 0) {
            resultsList.innerHTML = '<div class="search-no-results">未找到匹配的记录</div>';
            return;
        }

        // 保存总结果数
        totalSearchResults = searchResult.total;

        // 直接渲染搜索结果（后端已计算页码）
        renderSearchResults(searchResult.records, searchResult.total, page);
    } catch (error) {
        console.error('高级搜索失败:', error);
        resultsList.innerHTML = '<div class="search-error">搜索失败，请重试</div>';
    }
}

/**
 * 搜索匹配的记录（分页）
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @returns {Promise<Object>} 包含记录列表和总数的对象
 */
async function searchRecords(keyword, page) {
    // 检查缓存
    const cacheKey = `search_${keyword}_page_${page}`;
    const cached = frontendCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // 获取分页记录
    const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${SEARCH_PAGE_SIZE}`);
    const data = await response.json();

    if (!data.records) {
        return { records: [], total: 0 };
    }

    const result = {
        records: data.records,
        total: data.total || 0
    };

    // 缓存结果（5分钟）
    frontendCache.set(cacheKey, result);

    return result;
}


/**
 * 渲染搜索结果列表
 * @param {Array} results - 搜索结果列表
 * @param {number} totalResults - 总结果数
 * @param {number} currentPage - 当前页码
 */
function renderSearchResults(results, totalResults, currentPage) {
    resultsList.innerHTML = '';

    if (results.length === 0) {
        resultsList.innerHTML = '<div class="search-no-results">未找到匹配的记录</div>';
        return;
    }

    // 显示结果数量
    const resultCount = document.createElement('div');
    resultCount.className = 'search-result-count';
    resultCount.textContent = `找到 ${totalResults} 条记录，当前第 ${currentPage} 页`;
    resultsList.appendChild(resultCount);

    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.setAttribute('data-record-id', result.id);
        resultItem.setAttribute('data-page', result.page);

        // 格式化日期
        const date = new Date(result.datetime);
        const formattedDate = date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // 处理内容显示（CSS已限制为2行）
        const contentPreview = result.content || '（无内容）';

        resultItem.innerHTML = `
            <div class="result-header">
                <span class="result-page">第 ${result.page} 页</span>
                <span class="result-date">${formattedDate}</span>
            </div>
            <div class="result-content">${contentPreview}</div>
        `;

        // 点击事件：跳转到对应页面
        resultItem.addEventListener('click', () => {
            jumpToPage(result.page, false, result.id); // 不关闭侧边栏，传递记录ID
        });

        resultsList.appendChild(resultItem);
    });

    // 添加分页控件
    addPaginationControls(totalResults, currentPage);
}

/**
 * 截取内容（最多指定行数）
 * @param {string} content - 原始内容
 * @param {number} maxLines - 最大行数
 * @returns {string} 截取后的内容
 */
function truncateContent(content, maxLines) {
    if (!content) {
        return '（无内容）';
    }

    // 按换行符分割
    const lines = content.split('\n');
    
    // 取前maxLines行
    const truncatedLines = lines.slice(0, maxLines);
    
    // 如果超过maxLines行，添加省略号
    if (lines.length > maxLines) {
        truncatedLines[maxLines - 1] = truncatedLines[maxLines - 1] + '...';
    }

    return truncatedLines.join('\n');
}

/**
 * 添加分页控件
 * @param {number} totalResults - 总结果数
 * @param {number} currentPage - 当前页码
 */
function addPaginationControls(totalResults, currentPage) {
    const totalPages = Math.ceil(totalResults / SEARCH_PAGE_SIZE);
    
    // 如果只有一页，不需要分页控件
    if (totalPages <= 1) return;
    
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'search-pagination';
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'search-pagination-btn';
    prevBtn.textContent = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡，防止关闭侧边栏
        if (currentPage > 1) {
            performAdvancedSearch(currentPage - 1);
        }
    });
    
    // 页码显示
    const pageInfo = document.createElement('span');
    pageInfo.className = 'search-page-info';
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = 'search-pagination-btn';
    nextBtn.textContent = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡，防止关闭侧边栏
        if (currentPage < totalPages) {
            performAdvancedSearch(currentPage + 1);
        }
    });
    
    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextBtn);
    
    resultsList.appendChild(paginationContainer);
}

/**
 * 跳转到指定页面
 * @param {number} page - 页码
 * @param {boolean} closeSidebar - 是否关闭侧边栏
 * @param {number} recordId - 记录ID
 */
async function jumpToPage(page, closeSidebar = true, recordId = null) {
    if (closeSidebar) {
        // 关闭侧边栏
        closeAdvancedSearch();
    }

    // 获取当前搜索状态
    const { globalState } = await import('./globalState.js');

    // 如果指定了记录ID，我们需要加载该记录所在的普通页面（非搜索结果页）
    if (recordId) {
        // 清除搜索状态，加载普通页面
        globalState.currentSearch = '';
        globalState.currentChannel = null;
        globalState.currentYearMonth = null;

        if (typeof window !== 'undefined') {
            window.currentSearch = '';
            window.currentChannel = null;
            window.currentYearMonth = null;
        }

        // 确保页码是有效的
        if (page < 1) page = 1;

        // 加载指定页面，并传递记录ID以便滚动到该记录
        await loadPage(page, recordId);
    } else {
        // 如果没有指定记录ID，跳转到该页面并保持搜索状态
        await loadPage(page, null);
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'search-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * 初始化高级搜索功能
 */
export function initAdvancedSearch() {
    // 搜索按钮点击事件
    searchBtn.addEventListener('click', () => performAdvancedSearch(1));

    // 搜索输入框回车事件
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performAdvancedSearch(1);
        }
    });

    // 关闭按钮点击事件
    closeBtn.addEventListener('click', closeAdvancedSearch);

    // 点击侧边栏外部关闭
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !e.target.closest('#advanced-search-btn-main')) {
            closeAdvancedSearch();
        }
    });

    // ESC键关闭侧边栏
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sidebar.classList.contains('hidden')) {
            closeAdvancedSearch();
        }
    });
}
