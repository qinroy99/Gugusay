// 椤甸潰鍒濆鍖栨ā鍧?- 绠€鍖栫増鏈?
import { globalState, frontendCache } from './globalState.js';
import { loadPage } from './pageLoaderSimple.js';
import { initFontSize, applyFontSize } from './themeManager.js';
import { initTheme } from './themeManager.js';
import { bindEventListeners } from './eventHandlersSimple.js';
import { loadNavigationTree } from './yearMonthTree.js';
import { updatePaginationInfo, renderTweets } from './tweetRendererSimple.js';

function appendDebug(message) {
    void message;
}

// 鑾峰彇璁板綍鎬绘暟
export async function getTotalRecordsCount() {
    try {
        appendDebug('getTotalRecordsCount start');
        const response = await fetch(`/api/total-count?pageSize=${globalState.pageSize}`);
        const data = await response.json();
        globalState.totalRecords = data.count;
        globalState.totalPages = data.totalPages || Math.ceil(globalState.totalRecords / globalState.pageSize);
        console.log(`鎬昏褰曟暟: ${globalState.totalRecords}, 鎬婚〉鏁? ${globalState.totalPages}`);
        appendDebug(`getTotalRecordsCount done total=${globalState.totalRecords}`);
        updatePaginationInfo();
        return Promise.resolve();
    } catch (error) {
        console.error('鑾峰彇鎬昏褰曟暟澶辫触:', error);
        appendDebug(`getTotalRecordsCount error: ${error.message}`);
        return Promise.reject(error);
    }
}

// 鎭㈠闃呰杩涘害
export async function restoreReadingProgress() {
    try {
        console.log('loading latest record page');
        await loadLatestRecordPage();
    } catch (error) {
        console.error('鍔犺浇鏈€鏂拌褰曢〉闈㈠け璐?', error);
    }
}

// 鍔犺浇鏈€鏂拌褰曟墍鍦ㄧ殑椤甸潰
export async function loadLatestRecordPage() {
    try {
        appendDebug('loadLatestRecordPage start');
        if (!globalState.totalPages || globalState.totalPages < 1) {
            console.log('鎬婚〉鏁版湭璁剧疆锛屽厛鑾峰彇鎬昏褰曟暟');
            await getTotalRecordsCount();
        }
        
        const response = await fetch(`/api/latest-page?pageSize=${globalState.pageSize}`);
        const pageData = await response.json();
        
        console.log('API杩斿洖鐨勬渶鏂伴〉闈㈡暟鎹?', pageData);
        
        if (pageData.page) {
            console.log(`鍔犺浇鏈€鏂拌褰曢〉闈? ${pageData.page}`);
            await loadPage(pageData.page);
            appendDebug(`loadLatestRecordPage done page=${pageData.page}`);
        } else {
            const lastPage = globalState.totalPages || 1;
            await loadPage(lastPage);
            appendDebug(`loadLatestRecordPage fallback page=${lastPage}`);
        }
    } catch (error) {
        console.error('鑾峰彇鏈€鏂拌褰曢〉闈㈠け璐?', error);
        appendDebug(`loadLatestRecordPage error: ${error.message}`);
        const lastPage = globalState.totalPages || 1;
        await loadPage(lastPage);
    }
}

// 鍒濆鍖栧簲鐢?
// 鍚姩鏃舵鏌ュ苟搴旂敤鏇存柊
async function applyPendingUpdate() {
    return;
}

export async function initApp() {
    appendDebug('initApp start');
    try {
        // 棣栧厛妫€鏌ュ苟搴旂敤寰呭鐞嗙殑鏇存柊
        await applyPendingUpdate();
        
        await Promise.allSettled([
            getTotalRecordsCount(),
            restoreReadingProgress()
        ]);
    } catch (error) {
        appendDebug(`initApp error: ${error.message}`);
    }

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            loadNavigationTree();
        }, { timeout: 2000 });
    } else {
        setTimeout(() => {
            loadNavigationTree();
        }, 100);
    }

    // Debug fallback: if no tweets rendered yet, force-load first page.
    setTimeout(() => {
        const count = document.querySelectorAll('.tweet').length;
        appendDebug(`post-init tweet count=${count}`);
        if (count === 0) {
            appendDebug('force loadPage(1)');
            loadPage(1);
        }
    }, 2000);
}

// DOM鍔犺浇瀹屾垚鍚庡垵濮嬪寲
export function initializeApp() {
    window.addEventListener('error', function(e) {
        appendDebug(`window error: ${e.message}`);
    });
    window.addEventListener('unhandledrejection', function(e) {
        const msg = e.reason && e.reason.message ? e.reason.message : String(e.reason);
        appendDebug(`promise rejection: ${msg}`);
    });

    bindEventListeners();
    initFontSize();
    initTheme();
    initApp();
    
    window.addEventListener('beforeunload', function() {
        recordReadingProgress();
    });
    
    window.saveReadingProgressOnClose = function() {
        console.log('Python 绔皟鐢?saveReadingProgressOnClose');
        recordReadingProgress();
    };
}

// 璁板綍闃呰杩涘害
function recordReadingProgress() {
    console.log('recordReadingProgress called');
    
    const tweetElements = document.querySelectorAll('.tweet');
    if (tweetElements.length > 0) {
        const firstVisibleTweet = tweetElements[0];
        const lastViewedId = firstVisibleTweet.dataset.id;
        const lastViewedDatetime = firstVisibleTweet.dataset.datetime;
        
        console.log(`鍑嗗淇濆瓨闃呰杩涘害: ID=${lastViewedId}, DateTime=${lastViewedDatetime}`);
        
        if (window.pywebview && window.pywebview.api) {
            try {
                console.log('灏濊瘯閫氳繃 pywebview API 淇濆瓨闃呰杩涘害');
                window.pywebview.api.save_progress(parseInt(lastViewedId), lastViewedDatetime);
                console.log('宸查€氳繃 pywebview API 淇濆瓨闃呰杩涘害');
            } catch (error) {
                console.error('閫氳繃 pywebview API 淇濆瓨闃呰杩涘害澶辫触:', error);
                saveProgressViaHTTP(parseInt(lastViewedId), lastViewedDatetime);
            }
        } else {
            console.log('pywebview API 涓嶅彲鐢紝浣跨敤 HTTP API 淇濆瓨');
            saveProgressViaHTTP(parseInt(lastViewedId), lastViewedDatetime);
        }
    } else {
        console.log('no tweet elements found, skip saving progress');
    }
}

// 閫氳繃 HTTP API 淇濆瓨闃呰杩涘害
function saveProgressViaHTTP(lastViewedId, lastViewedDatetime) {
    console.log(`閫氳繃 HTTP API 淇濆瓨闃呰杩涘害: ID=${lastViewedId}, DateTime=${lastViewedDatetime}`);
    
    fetch('/api/progress', {
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
            console.error('璁板綍闃呰杩涘害澶辫触:', data.error);
        } else {
            console.log('閫氳繃 HTTP API 鎴愬姛淇濆瓨闃呰杩涘害');
        }
    })
    .catch(error => {
        console.error('璁板綍闃呰杩涘害鏃跺彂鐢熼敊璇?', error);
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


