// 页面初始化模块 - 简化版本
import { globalState, frontendCache } from './globalState.js';
import { loadPage } from './pageLoaderSimple.js';
import { initFontSize, applyFontSize } from './themeManager.js';
import { initTheme } from './themeManager.js';
import { bindEventListeners } from './eventHandlersSimple.js';
import { loadNavigationTree } from './yearMonthTree.js';
import { updatePaginationInfo, renderTweets } from './tweetRendererSimple.js';

// 获取记录总数
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
        console.log('直接加载最新记录页面');
        await loadLatestRecordPage();
    } catch (error) {
        console.error('加载最新记录页面失败:', error);
    }
}

// 加载最新记录所在的页面
export async function loadLatestRecordPage() {
    try {
        if (!globalState.totalPages || globalState.totalPages < 1) {
            console.log('总页数未设置，先获取总记录数');
            await getTotalRecordsCount();
        }
        
        const response = await fetch(`/api/latest-page?pageSize=${globalState.pageSize}`);
        const pageData = await response.json();
        
        console.log('API返回的最新页面数据:', pageData);
        
        if (pageData.page) {
            console.log(`加载最新记录页面: ${pageData.page}`);
            await loadPage(pageData.page);
        } else {
            const lastPage = globalState.totalPages || 1;
            await loadPage(lastPage);
        }
    } catch (error) {
        console.error('获取最新记录页面失败:', error);
        const lastPage = globalState.totalPages || 1;
        await loadPage(lastPage);
    }
}

// 初始化应用
export async function initApp() {
    const [totalRecordsResult, _] = await Promise.allSettled([
        getTotalRecordsCount(),
        restoreReadingProgress()
    ]);

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            loadNavigationTree();
        }, { timeout: 2000 });
    } else {
        setTimeout(() => {
            loadNavigationTree();
        }, 100);
    }
}

// DOM加载完成后初始化
export function initializeApp() {
    bindEventListeners();
    initFontSize();
    initTheme();
    initApp();
    
    window.addEventListener('beforeunload', function() {
        recordReadingProgress();
    });
    
    window.saveReadingProgressOnClose = function() {
        console.log('Python 端调用 saveReadingProgressOnClose');
        recordReadingProgress();
    };
}

// 记录阅读进度
function recordReadingProgress() {
    console.log('recordReadingProgress 被调用');
    
    const tweetElements = document.querySelectorAll('.tweet');
    if (tweetElements.length > 0) {
        const firstVisibleTweet = tweetElements[0];
        const lastViewedId = firstVisibleTweet.dataset.id;
        const lastViewedDatetime = firstVisibleTweet.dataset.datetime;
        
        console.log(`准备保存阅读进度: ID=${lastViewedId}, DateTime=${lastViewedDatetime}`);
        
        if (window.pywebview && window.pywebview.api) {
            try {
                console.log('尝试通过 pywebview API 保存阅读进度');
                window.pywebview.api.save_progress(parseInt(lastViewedId), lastViewedDatetime);
                console.log('已通过 pywebview API 保存阅读进度');
            } catch (error) {
                console.error('通过 pywebview API 保存阅读进度失败:', error);
                saveProgressViaHTTP(parseInt(lastViewedId), lastViewedDatetime);
            }
        } else {
            console.log('pywebview API 不可用，使用 HTTP API 保存');
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

export default {
    initApp,
    initializeApp,
    getTotalRecordsCount,
    restoreReadingProgress,
    recordReadingProgress,
    loadLatestRecordPage
};
