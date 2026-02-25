// 右键菜单和复制功能模块

// 显示自定义右键菜单
export function showCustomContextMenu(event, tweetElement) {
    // 先隐藏已有的菜单
    hideCustomContextMenu();
    
    // 创建自定义右键菜单
    const contextMenu = document.createElement('div');
    contextMenu.id = 'custom-context-menu';
    contextMenu.className = 'custom-context-menu';
    contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="copy">复制推文内容</div>
        <div class="context-menu-item" data-action="copyWithDate">复制推文内容和时间</div>
    `;
    
    // 设置菜单位置
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    
    // 添加到页面
    document.body.appendChild(contextMenu);
    
    // 绑定菜单项事件
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const action = this.dataset.action;
            executeContextMenuAction(action, tweetElement);
            hideCustomContextMenu();
        });
    });
    
    // 阻止菜单事件冒泡
    contextMenu.addEventListener('contextmenu', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });
}

// 隐藏自定义右键菜单
export function hideCustomContextMenu() {
    const contextMenu = document.getElementById('custom-context-menu');
    if (contextMenu) {
        contextMenu.remove();
    }
}

// 执行右键菜单操作
function executeContextMenuAction(action, tweetElement) {
    const contentElement = tweetElement.querySelector('.tweet-content');
    const timeElement = tweetElement.querySelector('.tweet-time');
    const channelElement = tweetElement.querySelector('.tweet-channel');
    
    let textToCopy = '';
    
    switch (action) {
        case 'copy':
            // 只复制推文内容
            if (contentElement) {
                // 移除HTML标签，只获取纯文本
                textToCopy = contentElement.innerText || contentElement.textContent;
            }
            break;
            
        case 'copyWithDate':
            // 复制推文内容和时间
            const timeText = timeElement ? timeElement.textContent : '';
            const channelText = channelElement ? ` [${channelElement.textContent}]` : '';
            const contentText = contentElement ? (contentElement.innerText || contentElement.textContent) : '';
            
            textToCopy = `${timeText}${channelText}\n${contentText}`;
            break;
    }
    
    // 执行复制操作
    if (textToCopy) {
        copyTextToClipboard(textToCopy);
    }
}

// 复制文本到剪贴板
export function copyTextToClipboard(text) {
    // 使用现代 Clipboard API（如果支持）
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败: ', err);
            // 回退到传统方法
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // 回退到传统方法
        fallbackCopyTextToClipboard(text);
    }
}

// 传统复制方法
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('已复制到剪贴板');
        } else {
            showNotification('复制失败');
        }
    } catch (err) {
        console.error('复制失败: ', err);
        showNotification('复制失败');
    }
    
    document.body.removeChild(textArea);
}

// 显示通知消息
function showNotification(message) {
    // 创建或更新通知元素
    let notification = document.getElementById('copy-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'copy-notification';
        notification.className = 'copy-notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 3秒后隐藏通知
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

export default {
    showCustomContextMenu,
    hideCustomContextMenu,
    copyTextToClipboard
};
