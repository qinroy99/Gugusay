// 推文渲染模块
import { globalState } from './globalState.js';
import { applyFontSize } from './themeManager.js';
import { openImageModal } from './imageModal.js';

// 显示加载指示器
export function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const tweetsContainer = document.getElementById('tweets-container');
    
    if (loadingIndicator && tweetsContainer) {
        loadingIndicator.classList.remove('hidden');
        tweetsContainer.classList.add('hidden');
    }
}

// 隐藏加载指示器
export function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const tweetsContainer = document.getElementById('tweets-container');
    
    if (loadingIndicator && tweetsContainer) {
        loadingIndicator.classList.add('hidden');
        tweetsContainer.classList.remove('hidden');
    }
}

// 显示骨架屏
export function showSkeletonScreens() {
    const container = document.getElementById('tweets-container');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 添加骨架屏元素
    for (let i = 0; i < globalState.pageSize; i++) {
        const skeletonTweet = document.createElement('div');
        skeletonTweet.className = 'skeleton-tweet';
        skeletonTweet.innerHTML = `
            <div class="skeleton-header">
                <div class="skeleton-time"></div>
                <div class="skeleton-channel"></div>
            </div>
            <div class="skeleton-content"></div>
            <div class="skeleton-actions">
                <div class="skeleton-button"></div>
                <div class="skeleton-button"></div>
            </div>
        `;
        container.appendChild(skeletonTweet);
    }
    
    // 隐藏加载指示器并显示骨架屏
    hideLoadingIndicator();
}

// 渲染推文列表
export function renderTweets(records) {
    console.log(`开始渲染推文，记录数: ${records ? records.length : 0}`);
    const container = document.getElementById('tweets-container');
    if (!container) {
        console.error('找不到推文容器元素');
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 移除之前的布局类
    container.classList.remove('masonry-layout', 'grid-layout');
    
    // 如果没有记录，显示提示信息
    if (!records || records.length === 0) {
        console.log('没有记录可显示');
        container.innerHTML = '<p class="no-records">没有找到相关记录</p>';
        hideLoadingIndicator();
        return;
    }
    
    console.log(`准备渲染 ${records.length} 条记录`);
    // 使用DocumentFragment优化DOM操作性能
    const fragment = document.createDocumentFragment();
    records.forEach((record, index) => {
        console.log(`渲染第 ${index + 1} 条记录，ID: ${record.id}`);
        const tweetElement = createTweetElement(record);
        fragment.appendChild(tweetElement);
    });
    
    container.appendChild(fragment);
    console.log('推文渲染完成');
    
    // 隐藏加载指示器
    hideLoadingIndicator();
}

// 创建单条推文元素
function createTweetElement(record) {
    const tweetDiv = document.createElement('div');
    tweetDiv.className = 'tweet selectable';
    tweetDiv.dataset.id = record.id;
    tweetDiv.setAttribute('role', 'article');
    tweetDiv.setAttribute('aria-label', `推文，发布于 ${formatDate(record.datetime)}`);
    tweetDiv.setAttribute('tabindex', '0');
    
    // 所有推文都使用瀑布流布局
    tweetDiv.classList.add('masonry-item');
    
    // 格式化日期显示
    const formattedDate = formatDate(record.datetime);
    
    // 处理高亮关键词并去除前后空白
    const content = highlightKeywords(record.content.trim(), globalState.currentSearch);
    
    // 处理媒体内容
    const mediaContent = createMediaContent(record);
    
    // 准备复制按钮的数据属性
    const channelAttr = record.channel ? `data-channel="${escapeHtml(record.channel)}"` : '';
    const datetimeAttr = `data-datetime="${escapeHtml(record.datetime || '')}"`;
    const contentAttr = `data-content="${escapeHtml(record.content || '')}"`;
    
    tweetDiv.innerHTML = `<div class="tweet-header">` +
            `<span class="tweet-time" aria-label="发布时间">${formattedDate}</span>` +
            (record.channel ? `<span class="tweet-channel" aria-label="发布渠道">${record.channel}</span>` : '') +
        `</div>` +
        `<div class="tweet-content" aria-label="推文内容">${content}</div>` +
        mediaContent +
        `<div class="tweet-actions" role="toolbar" aria-label="操作工具栏">
            <button class="edit-btn" data-id="${record.id}" aria-label="编辑推文">编辑</button>
            <button class="delete-btn" data-id="${record.id}" aria-label="删除推文">删除</button>
        </div>`;
    
    // 添加键盘事件支持文本选择
    tweetDiv.addEventListener('keydown', function(e) {
        // Ctrl+A 全选当前推文
        if (e.ctrlKey && e.key === 'a') {
            selectTweetText(this);
            e.preventDefault();
        }
    });
    
    return tweetDiv;
}

// HTML转义函数，防止XSS攻击
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// 创建媒体内容
function createMediaContent(record) {
    if ((record.media_type !== 'image' && record.media_type !== 'video') || !record.media_path) {
        return '';
    }
    
    // 支持多个媒体文件
    const paths = record.media_path.split(',');
    // 根据图片数量确定使用的CSS类
    let containerClass = 'media-container';
    if (paths.length === 1) {
        containerClass += ' single-image';
    } else if (paths.length === 2) {
        containerClass += ' two-images';
    }
    
    let mediaHtml = `<div class="tweet-media" role="region" aria-label="媒体内容"><div class="${containerClass}">`;
    paths.forEach((path, index) => {
        if (path.trim()) {
            const fullPath = path.trim();
            // 确保路径是相对于网站根目录的
            const normalizedPath = fullPath.startsWith('/') ? fullPath : '/' + fullPath;
            const fileExtension = fullPath.split('.').pop().toLowerCase();
            
            // 判断是否为视频文件
            const videoExtensions = ['mp4', 'webm', 'ogg'];
            if (videoExtensions.includes(fileExtension)) {
                // 视频播放器
                mediaHtml += `<div class="media-item"><video src="${normalizedPath}" controls class="tweet-video" aria-label="推文视频"></video></div>`;
            } else {
                // 图片显示
                const currentPath = path.trim();
                const currentNormalizedPath = currentPath.startsWith('/') ? currentPath : '/' + currentPath;
                mediaHtml += `<div class="media-item"><img src="${currentNormalizedPath}" class="tweet-image" data-tweet-id="${record.id}" data-image-index="${index}" data-image-count="${paths.length}" loading="lazy" decoding="async" alt="推文图片" /></div>`;
            }
        }
    });
    mediaHtml += '</div></div>';
    return mediaHtml;
}

// 选择推文中的全部文本
function selectTweetText(tweetElement) {
    const range = document.createRange();
    const selection = window.getSelection();
    
    // 选择推文内容区域的文本
    const contentElement = tweetElement.querySelector('.tweet-content');
    if (contentElement) {
        range.selectNodeContents(contentElement);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// 格式化日期显示
function formatDate(datetimeStr) {
    if (!datetimeStr) return '未知时间';
    
    // 解析日期字符串 (YYYY-MM-DD HH:MM)
    const parts = datetimeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (parts) {
        const year = parts[1];
        const month = parts[2];
        const day = parts[3];
        const hour = parts[4];
        const minute = parts[5];
        return `${year}年${month}月${day}日 ${hour}:${minute}`;
    }
    
    return datetimeStr;
}

// 高亮搜索关键词
function highlightKeywords(content, keyword) {
    // 去除内容前后的空白字符
    content = content.trim();
    
    if (!keyword) return content.replace(/\n/g, '<br>');
    
    // 转义特殊字符
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    
    return content.replace(/\n/g, '<br>')
                 .replace(regex, '<span class="highlight">$1</span>');
}

// 更新分页信息
export function updatePaginationInfo() {
    const pageInfo = document.getElementById('page-info');
    
    console.log(`更新分页信息 - 当前页: ${globalState.currentPage}, 总页数: ${globalState.totalPages}`);
    
    // 直接使用全局状态中的页码信息
    if (pageInfo) {
        pageInfo.textContent = `第 ${globalState.currentPage} 页，共 ${globalState.totalPages} 页`;
    }
    
    // 更新按钮状态
    const floatPrevBtn = document.getElementById('float-prev-btn');
    const floatNextBtn = document.getElementById('float-next-btn');
    
    if (floatPrevBtn) {
        floatPrevBtn.disabled = (globalState.currentPage === 1);
        floatPrevBtn.setAttribute('aria-disabled', globalState.currentPage === 1);
    }
    if (floatNextBtn) {
        floatNextBtn.disabled = (globalState.currentPage === globalState.totalPages);
        floatNextBtn.setAttribute('aria-disabled', globalState.currentPage === globalState.totalPages);
    }
}

// 导出格式化日期函数供其他模块使用
export { formatDate, highlightKeywords };

export default {
    showLoadingIndicator,
    hideLoadingIndicator,
    showSkeletonScreens,
    renderTweets,
    updatePaginationInfo,
    formatDate,
    highlightKeywords
};
