// 推文渲染模块 - 简化版本（不显示编辑和删除按钮）
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
    
    container.innerHTML = '';
    
    for (let i = 0; i < globalState.pageSize; i++) {
        const skeletonTweet = document.createElement('div');
        skeletonTweet.className = 'skeleton-tweet';
        skeletonTweet.innerHTML = `
            <div class="skeleton-header">
                <div class="skeleton-time"></div>
                <div class="skeleton-channel"></div>
            </div>
            <div class="skeleton-content"></div>
        `;
        container.appendChild(skeletonTweet);
    }
    
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
    
    container.innerHTML = '';
    container.classList.remove('masonry-layout', 'grid-layout');
    
    if (!records || records.length === 0) {
        console.log('没有记录可显示');
        container.innerHTML = '<p class="no-records">没有找到相关记录</p>';
        hideLoadingIndicator();
        return;
    }
    
    console.log(`准备渲染 ${records.length} 条记录`);
    const fragment = document.createDocumentFragment();
    records.forEach((record, index) => {
        console.log(`渲染第 ${index + 1} 条记录，ID: ${record.id}`);
        const tweetElement = createTweetElement(record);
        fragment.appendChild(tweetElement);
    });
    
    container.appendChild(fragment);
    console.log('推文渲染完成');
    hideLoadingIndicator();
}

// 创建单条推文元素 - 简化版本，不显示操作按钮
function createTweetElement(record) {
    const tweetDiv = document.createElement('div');
    tweetDiv.className = 'tweet selectable';
    tweetDiv.dataset.id = record.id;
    tweetDiv.setAttribute('role', 'article');
    tweetDiv.setAttribute('aria-label', `推文，发布于 ${formatDate(record.datetime)}`);
    tweetDiv.setAttribute('tabindex', '0');
    tweetDiv.classList.add('masonry-item');
    
    const formattedDate = formatDate(record.datetime);
    const content = highlightKeywords(record.content.trim(), globalState.currentSearch);
    const mediaContent = createMediaContent(record);
    
    // 简化版本：不显示 tweet-actions 区域
    tweetDiv.innerHTML = `<div class="tweet-header">` +
            `<span class="tweet-time" aria-label="发布时间">${formattedDate}</span>` +
            (record.channel ? `<span class="tweet-channel" aria-label="发布渠道">${record.channel}</span>` : '') +
        `</div>` +
        `<div class="tweet-content" aria-label="推文内容">${content}</div>` +
        mediaContent;
    
    tweetDiv.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'a') {
            selectTweetText(this);
            e.preventDefault();
        }
    });
    
    return tweetDiv;
}

// 创建媒体内容
function createMediaContent(record) {
    if ((record.media_type !== 'image' && record.media_type !== 'video') || !record.media_path) {
        return '';
    }
    
    const paths = record.media_path.split(',');
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
            const normalizedPath = fullPath.startsWith('/') ? fullPath : '/' + fullPath;
            const fileExtension = fullPath.split('.').pop().toLowerCase();
            
            const videoExtensions = ['mp4', 'webm', 'ogg'];
            if (videoExtensions.includes(fileExtension)) {
                mediaHtml += `<div class="media-item"><video src="${normalizedPath}" controls class="tweet-video" aria-label="推文视频"></video></div>`;
            } else {
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
    content = content.trim();
    
    if (!keyword) return content.replace(/\n/g, '<br>');
    
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    
    return content.replace(/\n/g, '<br>')
                 .replace(regex, '<span class="highlight">$1</span>');
}

// 更新分页信息
export function updatePaginationInfo() {
    const pageInfo = document.getElementById('page-info');
    
    console.log(`更新分页信息 - 当前页: ${globalState.currentPage}, 总页数: ${globalState.totalPages}`);
    
    if (pageInfo) {
        pageInfo.textContent = `第 ${globalState.currentPage} 页，共 ${globalState.totalPages} 页`;
    }
    
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
