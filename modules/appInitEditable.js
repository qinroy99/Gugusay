// 页面初始化模块 - 可编辑版本
import { globalState, frontendCache } from './globalState.js';
import { loadPage } from './pageLoader.js';
import { initFontSize, applyFontSize } from './themeManager.js';
import { initTheme, applyTheme } from './themeManager.js';
import { bindEventListeners } from './eventHandlersEditable.js';
import { loadNavigationTree } from './yearMonthTree.js';
import { updatePaginationInfo, renderTweets } from './tweetRendererEditable.js';

// 获取记录总数（优化版：使用合并API）
export async function getTotalRecordsCount() {
    try {
        const response = await fetch(`/api/total-count?pageSize=${globalState.pageSize}`);
        const data = await response.json();
        globalState.totalRecords = data.count;
        globalState.totalPages = data.totalPages || Math.ceil(globalState.totalRecords / globalState.pageSize);
        console.log(`总记录数: ${globalState.totalRecords}, 总页数: ${globalState.totalPages}`);
        updatePaginationInfo();
        return Promise.resolve();
    } catch (error) {
        console.error('获取总记录数失败:', error);
        return Promise.reject(error);
    }
}

// 恢复阅读进度
export async function restoreReadingProgress() {
    try {
        console.log('直接加载最新记录页面（不恢复阅读进度）');
        await loadLatestRecordPage();
    } catch (error) {
        console.error('加载最新记录页面失败:', error);
    }
}

// 加载最新记录所在的页面
export async function loadLatestRecordPage() {
    try {
        // 确保总页数已设置
        if (!globalState.totalPages || globalState.totalPages < 1) {
            console.log('总页数未设置，先获取总记录数');
            await getTotalRecordsCount();
        }
        
        const response = await fetch(`/api/latest-page?pageSize=${globalState.pageSize}`);
        const pageData = await response.json();
        
        console.log('API返回的最新页面数据:', pageData);
        
        if (pageData.page) {
            console.log(`加载最新记录页面: ${pageData.page}，总页数: ${globalState.totalPages}`);
            // 直接调用loadPage
            await loadPage(pageData.page);
        } else {
            console.log('获取最新记录页面失败，使用总页数作为当前页');
            // 如果API没有返回页面信息，使用总页数
            const lastPage = globalState.totalPages || 1;
            console.log(`使用总页数: ${lastPage}`);
            // 直接调用loadPage
            await loadPage(lastPage);
        }
    } catch (error) {
        console.error('获取最新记录页面失败:', error);
        console.log('获取最新记录页面失败，使用总页数作为当前页');
        // 如果获取失败，使用总页数
        const lastPage = globalState.totalPages || 1;
        console.log(`使用总页数: ${lastPage}`);
        // 直接调用loadPage
        await loadPage(lastPage);
    }
}

// 加载页面但不重置currentPage
async function loadPageWithoutReset(page, targetRecordId = null) {
    console.log(`loadPageWithoutReset: 加载页面 ${page}, 不重置currentPage`);
    
    // 确保使用window对象上的全局变量
    if (typeof window !== 'undefined') {
        globalState.currentChannel = window.currentChannel;
        globalState.currentSearch = window.currentSearch;
        globalState.currentYearMonth = window.currentYearMonth;
    }
    
    // 显示加载指示器
    showLoadingIndicator();
    
    // 构建请求URL
    let url = `/api/records?page=${page}&pageSize=${globalState.pageSize}`;
    
    // 添加年月过滤参数
    if (globalState.currentYearMonth !== null && globalState.currentYearMonth !== undefined) {
        url += `&yearMonth=${encodeURIComponent(globalState.currentYearMonth)}`;
    }
    
    // 添加渠道过滤参数
    if (globalState.currentChannel !== null && globalState.currentChannel !== undefined) {
        if (globalState.currentChannel === '') {
            url += `&channel=`;
        } else {
            url += `&channel=${encodeURIComponent(globalState.currentChannel)}`;
        }
    }
    
    console.log(`loadPageWithoutReset: 加载页面: ${page}, 渠道: ${globalState.currentChannel}, 年月: ${globalState.currentYearMonth}, 搜索: ${globalState.currentSearch}, URL: ${url}`);
    
    // 发送请求
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('API响应数据:', data);
           
            // 确保 records 数组存在
            const records = data.records || (data.results && data.results.records) || [];
            
            // 缓存数据
            const cacheKey = `page_${page}_search_${globalState.currentSearch}_channel_${globalState.currentChannel || 'null'}`;
            frontendCache.set(cacheKey, {
                records: records,
                totalRecords: data.total || globalState.totalRecords,
                totalPages: data.totalPages || globalState.totalPages
            });
           
            console.log(`渲染 ${records.length} 条记录`);
            renderTweets(records);
           
            // 如果是搜索结果、年月过滤或渠道过滤结果，更新totalRecords和totalPages
            if ((globalState.currentSearch || globalState.currentChannel !== null || globalState.currentYearMonth !== null) && data.total !== undefined && data.totalPages !== undefined) {
                globalState.totalRecords = data.total;
                globalState.totalPages = data.totalPages;
                console.log(`更新总记录数: ${globalState.totalRecords}, 总页数: ${globalState.totalPages}`);
            } else if (!globalState.currentSearch && globalState.currentChannel === null && globalState.currentYearMonth === null) {
                // 如果不是搜索结果也不是渠道过滤结果，获取总记录数
                // 使用API返回的总页数信息（如果可用）
                if (data.total !== undefined && data.totalPages !== undefined) {
                    globalState.totalRecords = data.total;
                    globalState.totalPages = data.totalPages;
                    console.log(`使用API返回的总记录数: ${globalState.totalRecords}, 总页数: ${globalState.totalPages}`);
                }
            }
           
            console.log(`loadPageWithoutReset完成，当前页: ${globalState.currentPage}, 总页数: ${globalState.totalPages}`);
            updatePaginationInfo();
            // 应用当前字体大小到新加载的推文
            applyFontSize();
           
            // 隐藏加载指示器
            hideLoadingIndicator();
           
            // 如果指定了目标记录ID，滚动到该记录
            if (targetRecordId) {
                setTimeout(() => {
                    const targetElement = document.querySelector(`[data-id="${targetRecordId}"]`);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        // 高亮显示目标记录
                        targetElement.classList.add('highlighted-record');
                        setTimeout(() => {
                            targetElement.classList.remove('highlighted-record');
                        }, 3000);
                    } else {
                        console.warn(`未找到ID为 ${targetRecordId} 的记录`);
                    }
                }, 500); // 增加延迟时间，确保DOM完全渲染
            }
           
            // 更新window对象上的变量
            if (typeof window !== 'undefined') {
                window.currentChannel = globalState.currentChannel;
                window.currentSearch = globalState.currentSearch;
                window.currentYearMonth = globalState.currentYearMonth;
            }
        })
        .catch(error => {
            console.error('加载数据失败:', error);
            // 隐藏加载指示器
            hideLoadingIndicator();
        });
}

// 记录阅读进度
function recordReadingProgress() {
    console.log('recordReadingProgress 被调用');
    
    // 获取第一个可见的推文元素
    const tweetElements = document.querySelectorAll('.tweet');
    if (tweetElements.length > 0) {
        const firstVisibleTweet = tweetElements[0];
        const lastViewedId = firstVisibleTweet.dataset.id;
        const lastViewedDatetime = firstVisibleTweet.dataset.datetime;
        
        console.log(`准备保存阅读进度: ID=${lastViewedId}, DateTime=${lastViewedDatetime}`);
        
        // 优先使用 pywebview API 保存（打包后的环境）
        if (window.pywebview && window.pywebview.api) {
            try {
                console.log('尝试通过 pywebview API 保存阅读进度');
                window.pywebview.api.save_progress(parseInt(lastViewedId), lastViewedDatetime);
                console.log('已通过 pywebview API 保存阅读进度');
            } catch (error) {
                console.error('通过 pywebview API 保存阅读进度失败:', error);
                // 失败时尝试使用 HTTP API
                saveProgressViaHTTP(parseInt(lastViewedId), lastViewedDatetime);
            }
        } else {
            console.log('pywebview API 不可用，使用 HTTP API 保存');
            // 使用 HTTP API 保存（开发环境）
            saveProgressViaHTTP(parseInt(lastViewedId), lastViewedDatetime);
        }
    } else {
        console.log('没有找到推文元素，无法保存阅读进度');
    }
}

// 通过 HTTP API 保存阅读进度
function saveProgressViaHTTP(lastViewedId, lastViewedDatetime) {
    console.log(`通过 HTTP API 保存阅读进度: ID=${lastViewedId}, DateTime=${lastViewedDatetime}`);
    
    fetch('/api/reading-progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            lastViewedId: lastViewedId,
            lastViewedDatetime: lastViewedDatetime
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('记录阅读进度失败:', data.error);
        } else {
            console.log('通过 HTTP API 成功保存阅读进度');
        }
    })
    .catch(error => {
        console.error('记录阅读进度时发生错误:', error);
    });
}

// 初始化应用（优化版：并行加载）
export async function initApp() {
    // 并行执行所有初始化操作
    const [totalRecordsResult, _] = await Promise.allSettled([
        getTotalRecordsCount(),
        restoreReadingProgress()
    ]);

    // 加载导航树（使用 requestIdleCallback 在浏览器空闲时加载）
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            loadNavigationTree();
        }, { timeout: 2000 }); // 最多等待2秒
    } else {
        // 降级方案：延迟加载
        setTimeout(() => {
            loadNavigationTree();
        }, 100);
    }
}

// DOM加载完成后初始化
export function initializeApp() {
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化字体大小
    initFontSize();
    
    // 初始化主题
    initTheme();
    
    // 初始化页面
    initApp();
    
    // 页面关闭前记录阅读位置
    window.addEventListener('beforeunload', function() {
        recordReadingProgress();
    });
    
    // 添加全局函数供 Python 端调用
    window.saveReadingProgressOnClose = function() {
        console.log('Python 端调用 saveReadingProgressOnClose');
        recordReadingProgress();
    };
}

export default {
    initApp,
    initializeApp,
    getTotalRecordsCount,
    restoreReadingProgress,
    recordReadingProgress,
    loadLatestRecordPage
};
