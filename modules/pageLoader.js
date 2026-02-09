// 页面加载模块
import { globalState, frontendCache } from './globalState.js';
import { renderTweets, updatePaginationInfo, hideLoadingIndicator, showLoadingIndicator } from './tweetRenderer.js';
import { applyFontSize } from './themeManager.js';
import { clearFrontendCache } from './globalState.js';
import { getTotalRecordsCount } from './appInit.js';

// 加载指定页面的数据
export function loadPage(page, targetRecordId = null) {
    // 确保使用window对象上的全局变量
    if (typeof window !== 'undefined') {
        globalState.currentChannel = window.currentChannel;
        globalState.currentSearch = window.currentSearch;
        globalState.currentYearMonth = window.currentYearMonth;
    }
    
    console.log(`开始加载页面: ${page}, 当前渠道: ${globalState.currentChannel}, 当前年月: ${globalState.currentYearMonth}, 目标记录ID: ${targetRecordId}`);
    console.log(`当前globalState.currentPage: ${globalState.currentPage}, 要加载的页面: ${page}`);
    
    // 只有当传入的页面与当前页面不同时才更新
    if (globalState.currentPage !== page) {
        globalState.currentPage = page;
        console.log(`更新当前页码为: ${globalState.currentPage}, 总页数: ${globalState.totalPages}`);
    }
    
    // 检查缓存
    const cacheKey = `page_${page}_search_${globalState.currentSearch}_channel_${globalState.currentChannel || 'null'}_yearmonth_${globalState.currentYearMonth || 'null'}`;
    const cachedData = frontendCache.get(cacheKey);
    if (cachedData) {
        console.log(`从缓存加载页面: ${page}`);
        renderTweets(cachedData.records);
        globalState.totalRecords = cachedData.totalRecords;
        globalState.totalPages = cachedData.totalPages;
        // 确保更新当前页码
        globalState.currentPage = page;
        updatePaginationInfo();
        applyFontSize();
        hideLoadingIndicator();
        return;
    }
    
    // 确保页码在有效范围内
    if (globalState.currentPage < 1) globalState.currentPage = 1;
    // 对于搜索结果，使用搜索返回的totalPages；否则使用全局totalPages
    const maxPage = globalState.totalPages;
    if (globalState.currentPage > maxPage) globalState.currentPage = maxPage;
    
    // 显示加载指示器
    showLoadingIndicator();
    
    // 构建请求URL
    let url = `/api/records?page=${globalState.currentPage}&pageSize=${globalState.pageSize}`;
    
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
    
    console.log('loadPage构建的URL:', url);
    console.log('loadPage当前状态:', {
        currentPage: globalState.currentPage,
        currentChannel: globalState.currentChannel,
        currentYearMonth: globalState.currentYearMonth,
        currentSearch: globalState.currentSearch
    });
    
    if (globalState.currentSearch) {
        // 检查是否是"那年今日"的搜索（格式为 MM-DD）
        if (/^\d{2}-\d{2}$/.test(globalState.currentSearch)) {
            // 使用"那年今日"专用API
            url = `/api/on-this-day?keyword=${encodeURIComponent(globalState.currentSearch)}&page=${globalState.currentPage}&pageSize=${globalState.pageSize}`;
        } else {
            // 使用通用搜索API
            url = `/api/search?keyword=${encodeURIComponent(globalState.currentSearch)}&page=${globalState.currentPage}&pageSize=${globalState.pageSize}`;
        }
        
        // 搜索时也添加渠道参数
        if (globalState.currentChannel !== null && globalState.currentChannel !== undefined) {
            if (globalState.currentChannel === '') {
                url += `&channel=`;
            } else {
                url += `&channel=${encodeURIComponent(globalState.currentChannel)}`;
            }
        }
    }
    
    console.log(`加载页面: ${globalState.currentPage}, 渠道: ${globalState.currentChannel}, 年月: ${globalState.currentYearMonth}, 搜索: ${globalState.currentSearch}, URL: ${url}`);
    
    // 发送请求
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('API响应数据:', data);
            
            // 确保 records 数组存在
            const records = data.records || (data.results && data.results.records) || [];
            
            // 缓存数据
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
                    // 立即更新分页信息
                    updatePaginationInfo();
                } else {
                    // 异步获取总记录数并等待完成
                    getTotalRecordsCount().then(() => {
                        console.log('获取总记录数完成，当前页码:', globalState.currentPage, '总页数:', globalState.totalPages);
                        updatePaginationInfo();
                    });
                }
            }
            
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


// 为模块提供页面加载接口
window.loadPageFromModule = function(page, channel = null, targetRecordId = null) {
    console.log(`从模块加载页面: ${page}, 渠道: ${channel}, 目标记录ID: ${targetRecordId}`);
    // 设置全局渠道变量
    if (channel !== null) {
        globalState.currentChannel = channel;
    } else {
        globalState.currentChannel = null;
    }
    
    // 同步到window对象
    if (typeof window !== 'undefined') {
        window.currentChannel = globalState.currentChannel;
        window.currentSearch = globalState.currentSearch;
    }
    
    loadPage(page, targetRecordId);
};

// 加载指定页面（供其他模块调用）
export function loadPageFromModule(page, targetRecordId = null) {
    loadPage(page, targetRecordId);
}

// 将loadPage函数绑定到window对象
if (typeof window !== 'undefined') {
    window.loadPage = loadPage;
}

export default {
    loadPage,
    loadPageFromModule
};
