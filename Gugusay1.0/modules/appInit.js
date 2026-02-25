// 椤甸潰鍒濆鍖栨ā鍧?
import { globalState, frontendCache } from './globalState.js';
import { loadPage } from './pageLoader.js';
import { initFontSize, applyFontSize } from './themeManager.js';
import { initTheme, applyTheme } from './themeManager.js';
import { bindEventListeners } from './eventHandlers.js';
import { loadNavigationTree } from './yearMonthTree.js';
import { updatePaginationInfo, renderTweets } from './tweetRenderer.js';

// 鑾峰彇璁板綍鎬绘暟锛堜紭鍖栫増锛氫娇鐢ㄥ悎骞禔PI锛?
export async function getTotalRecordsCount() {
    try {
        const response = await fetch(`/api/total-count?pageSize=${globalState.pageSize}`);
        const data = await response.json();
        globalState.totalRecords = data.count;
        globalState.totalPages = data.totalPages || Math.ceil(globalState.totalRecords / globalState.pageSize);
        console.log(`鎬昏褰曟暟: ${globalState.totalRecords}, 鎬婚〉鏁? ${globalState.totalPages}`);
        updatePaginationInfo();
        return Promise.resolve();
    } catch (error) {
        console.error('鑾峰彇鎬昏褰曟暟澶辫触:', error);
        return Promise.reject(error);
    }
}

// 鎭㈠闃呰杩涘害
export async function restoreReadingProgress() {
    try {
        console.log('鐩存帴鍔犺浇鏈€鏂拌褰曢〉闈紙涓嶆仮澶嶉槄璇昏繘搴︼級');
        await loadLatestRecordPage();
    } catch (error) {
        console.error('鍔犺浇鏈€鏂拌褰曢〉闈㈠け璐?', error);
    }
}

// 鍔犺浇鏈€鏂拌褰曟墍鍦ㄧ殑椤甸潰
export async function loadLatestRecordPage() {
    try {
        // 纭繚鎬婚〉鏁板凡璁剧疆
        if (!globalState.totalPages || globalState.totalPages < 1) {
            console.log('鎬婚〉鏁版湭璁剧疆锛屽厛鑾峰彇鎬昏褰曟暟');
            await getTotalRecordsCount();
        }
        
        const response = await fetch(`/api/latest-page?pageSize=${globalState.pageSize}`);
        const pageData = await response.json();
        
        console.log('API杩斿洖鐨勬渶鏂伴〉闈㈡暟鎹?', pageData);
        
        if (pageData.page) {
            console.log(`鍔犺浇鏈€鏂拌褰曢〉闈? ${pageData.page}锛屾€婚〉鏁? ${globalState.totalPages}`);
            // 鐩存帴璋冪敤loadPage
            await loadPage(pageData.page);
        } else {
            console.log('鑾峰彇鏈€鏂拌褰曢〉闈㈠け璐ワ紝浣跨敤鎬婚〉鏁颁綔涓哄綋鍓嶉〉');
            // 濡傛灉API娌℃湁杩斿洖椤甸潰淇℃伅锛屼娇鐢ㄦ€婚〉鏁?
            const lastPage = globalState.totalPages || 1;
            console.log(`浣跨敤鎬婚〉鏁? ${lastPage}`);
            // 鐩存帴璋冪敤loadPage
            await loadPage(lastPage);
        }
    } catch (error) {
        console.error('鑾峰彇鏈€鏂拌褰曢〉闈㈠け璐?', error);
        console.log('鑾峰彇鏈€鏂拌褰曢〉闈㈠け璐ワ紝浣跨敤鎬婚〉鏁颁綔涓哄綋鍓嶉〉');
        // 濡傛灉鑾峰彇澶辫触锛屼娇鐢ㄦ€婚〉鏁?
        const lastPage = globalState.totalPages || 1;
        console.log(`浣跨敤鎬婚〉鏁? ${lastPage}`);
        // 鐩存帴璋冪敤loadPage
        await loadPage(lastPage);
    }
}

// 鍔犺浇椤甸潰浣嗕笉閲嶇疆currentPage
async function loadPageWithoutReset(page, targetRecordId = null) {
    console.log(`loadPageWithoutReset: 鍔犺浇椤甸潰 ${page}, 涓嶉噸缃甤urrentPage`);
    
    // 纭繚浣跨敤window瀵硅薄涓婄殑鍏ㄥ眬鍙橀噺
    if (typeof window !== 'undefined') {
        globalState.currentChannel = window.currentChannel;
        globalState.currentSearch = window.currentSearch;
        globalState.currentYearMonth = window.currentYearMonth;
    }
    
    // 鏄剧ず鍔犺浇鎸囩ず鍣?
    showLoadingIndicator();
    
    // 鏋勫缓璇锋眰URL
    let url = `/api/records?page=${page}&pageSize=${globalState.pageSize}`;
    
    // 娣诲姞骞存湀杩囨护鍙傛暟
    if (globalState.currentYearMonth !== null && globalState.currentYearMonth !== undefined) {
        url += `&yearMonth=${encodeURIComponent(globalState.currentYearMonth)}`;
    }
    
    // 娣诲姞娓犻亾杩囨护鍙傛暟
    if (globalState.currentChannel !== null && globalState.currentChannel !== undefined) {
        if (globalState.currentChannel === '') {
            url += `&channel=`;
        } else {
            url += `&channel=${encodeURIComponent(globalState.currentChannel)}`;
        }
    }
    
    console.log(`loadPageWithoutReset: 鍔犺浇椤甸潰: ${page}, 娓犻亾: ${globalState.currentChannel}, 骞存湀: ${globalState.currentYearMonth}, 鎼滅储: ${globalState.currentSearch}, URL: ${url}`);
    
    // 鍙戦€佽姹?
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('API鍝嶅簲鏁版嵁:', data);
           
            // 纭繚 records 鏁扮粍瀛樺湪
            const records = data.records || (data.results && data.results.records) || [];
            
            // 缂撳瓨鏁版嵁
            const cacheKey = `page_${page}_search_${globalState.currentSearch}_channel_${globalState.currentChannel || 'null'}`;
            frontendCache.set(cacheKey, {
                records: records,
                totalRecords: data.total || globalState.totalRecords,
                totalPages: data.totalPages || globalState.totalPages
            });
           
            console.log(`render records count=${records.length}`);
            renderTweets(records);
           
            // 濡傛灉鏄悳绱㈢粨鏋溿€佸勾鏈堣繃婊ゆ垨娓犻亾杩囨护缁撴灉锛屾洿鏂皌otalRecords鍜宼otalPages
            if ((globalState.currentSearch || globalState.currentChannel !== null || globalState.currentYearMonth !== null) && data.total !== undefined && data.totalPages !== undefined) {
                globalState.totalRecords = data.total;
                globalState.totalPages = data.totalPages;
                console.log(`鏇存柊鎬昏褰曟暟: ${globalState.totalRecords}, 鎬婚〉鏁? ${globalState.totalPages}`);
            } else if (!globalState.currentSearch && globalState.currentChannel === null && globalState.currentYearMonth === null) {
                // 濡傛灉涓嶆槸鎼滅储缁撴灉涔熶笉鏄笭閬撹繃婊ょ粨鏋滐紝鑾峰彇鎬昏褰曟暟
                // 浣跨敤API杩斿洖鐨勬€婚〉鏁颁俊鎭紙濡傛灉鍙敤锛?
                if (data.total !== undefined && data.totalPages !== undefined) {
                    globalState.totalRecords = data.total;
                    globalState.totalPages = data.totalPages;
                    console.log(`浣跨敤API杩斿洖鐨勬€昏褰曟暟: ${globalState.totalRecords}, 鎬婚〉鏁? ${globalState.totalPages}`);
                }
            }
           
            console.log(`loadPageWithoutReset瀹屾垚锛屽綋鍓嶉〉: ${globalState.currentPage}, 鎬婚〉鏁? ${globalState.totalPages}`);
            updatePaginationInfo();
            // 搴旂敤褰撳墠瀛椾綋澶у皬鍒版柊鍔犺浇鐨勬帹鏂?
            applyFontSize();
           
            // 闅愯棌鍔犺浇鎸囩ず鍣?
            hideLoadingIndicator();
           
            // 濡傛灉鎸囧畾浜嗙洰鏍囪褰旾D锛屾粴鍔ㄥ埌璇ヨ褰?
            if (targetRecordId) {
                setTimeout(() => {
                    const targetElement = document.querySelector(`[data-id="${targetRecordId}"]`);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        // 楂樹寒鏄剧ず鐩爣璁板綍
                        targetElement.classList.add('highlighted-record');
                        setTimeout(() => {
                            targetElement.classList.remove('highlighted-record');
                        }, 3000);
                    } else {
                        console.warn(`target record not found id=${targetRecordId}`);
                    }
                }, 500); // 澧炲姞寤惰繜鏃堕棿锛岀‘淇滵OM瀹屽叏娓叉煋
            }
           
            // 鏇存柊window瀵硅薄涓婄殑鍙橀噺
            if (typeof window !== 'undefined') {
                window.currentChannel = globalState.currentChannel;
                window.currentSearch = globalState.currentSearch;
                window.currentYearMonth = globalState.currentYearMonth;
            }
        })
        .catch(error => {
            console.error('鍔犺浇鏁版嵁澶辫触:', error);
            // 闅愯棌鍔犺浇鎸囩ず鍣?
            hideLoadingIndicator();
        });
}

// 璁板綍闃呰杩涘害
function recordReadingProgress() {
    console.log('recordReadingProgress called');
    
    // 鑾峰彇绗竴涓彲瑙佺殑鎺ㄦ枃鍏冪礌
    const tweetElements = document.querySelectorAll('.tweet');
    if (tweetElements.length > 0) {
        const firstVisibleTweet = tweetElements[0];
        const lastViewedId = firstVisibleTweet.dataset.id;
        const lastViewedDatetime = firstVisibleTweet.dataset.datetime;
        
        console.log(`鍑嗗淇濆瓨闃呰杩涘害: ID=${lastViewedId}, DateTime=${lastViewedDatetime}`);
        
        // 浼樺厛浣跨敤 pywebview API 淇濆瓨锛堟墦鍖呭悗鐨勭幆澧冿級
        if (window.pywebview && window.pywebview.api) {
            try {
                console.log('灏濊瘯閫氳繃 pywebview API 淇濆瓨闃呰杩涘害');
                window.pywebview.api.save_progress(parseInt(lastViewedId), lastViewedDatetime);
                console.log('宸查€氳繃 pywebview API 淇濆瓨闃呰杩涘害');
            } catch (error) {
                console.error('閫氳繃 pywebview API 淇濆瓨闃呰杩涘害澶辫触:', error);
                // 澶辫触鏃跺皾璇曚娇鐢?HTTP API
                saveProgressViaHTTP(parseInt(lastViewedId), lastViewedDatetime);
            }
        } else {
            console.log('pywebview API 涓嶅彲鐢紝浣跨敤 HTTP API 淇濆瓨');
            // 浣跨敤 HTTP API 淇濆瓨锛堝紑鍙戠幆澧冿級
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

// 鍚姩鏃舵鏌ュ苟搴旂敤鏇存柊
async function applyPendingUpdate() {
    return;
}

// 鍒濆鍖栧簲鐢紙浼樺寲鐗堬細骞惰鍔犺浇锛?
export async function initApp() {
    // 棣栧厛妫€鏌ュ苟搴旂敤寰呭鐞嗙殑鏇存柊
    await applyPendingUpdate();
    
    // 骞惰鎵ц鎵€鏈夊垵濮嬪寲鎿嶄綔
    const [totalRecordsResult, _] = await Promise.allSettled([
        getTotalRecordsCount(),
        restoreReadingProgress()
    ]);

    // 鍔犺浇瀵艰埅鏍戯紙浣跨敤 requestIdleCallback 鍦ㄦ祻瑙堝櫒绌洪棽鏃跺姞杞斤級
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            loadNavigationTree();
        }, { timeout: 2000 }); // 鏈€澶氱瓑寰?绉?
    } else {
        // 闄嶇骇鏂规锛氬欢杩熷姞杞?
        setTimeout(() => {
            loadNavigationTree();
        }, 100);
    }
}

// DOM鍔犺浇瀹屾垚鍚庡垵濮嬪寲
export function initializeApp() {
    // 缁戝畾浜嬩欢鐩戝惉鍣?
    bindEventListeners();
    
    // 鍒濆鍖栧瓧浣撳ぇ灏?
    initFontSize();
    
    // 鍒濆鍖栦富棰?
    initTheme();
    
    // 鍒濆鍖栭〉闈?
    initApp();
    
    // 椤甸潰鍏抽棴鍓嶈褰曢槄璇讳綅缃?
    window.addEventListener('beforeunload', function() {
        recordReadingProgress();
    });
    
    // 娣诲姞鍏ㄥ眬鍑芥暟渚?Python 绔皟鐢?
    window.saveReadingProgressOnClose = function() {
        console.log('Python 绔皟鐢?saveReadingProgressOnClose');
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


