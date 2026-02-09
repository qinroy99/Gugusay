// 设置和在线更新模块

// 显示设置面板
export function showSettingsPanel() {
    // 如果已存在设置面板，先关闭
    closeSettingsPanel();
    
    // 创建设置弹窗
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; width: 90%;">
            <div class="modal-header">
                <h2 style="margin: 0;">设置</h2>
                <button class="close" id="settings-close-btn" style="font-size: 28px; cursor: pointer; background: none; border: none; color: #aaa;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <div class="settings-section" style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                    <h3 style="margin-bottom: 15px; color: #333; font-size: 16px;">在线更新</h3>
                    <div class="update-info" id="update-info" style="background: #f7f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 5px 0; font-size: 14px;">点击"检查更新"按钮检查是否有新版本</p>
                    </div>
                    <div class="update-actions" style="display: flex; gap: 10px;">
                        <button id="check-update-btn" class="btn-primary" style="background: #1da1f2; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-size: 14px;">检查更新</button>
                        <button id="start-update-btn" class="btn-primary" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-size: 14px; display: none;">开始更新</button>
                    </div>
                    <div class="update-progress" id="update-progress" style="display: none; margin-top: 20px;">
                        <div class="progress-bar" style="width: 100%; height: 20px; background: #e1e8ed; border-radius: 10px; overflow: hidden; margin-bottom: 10px;">
                            <div class="progress-fill" id="progress-fill" style="height: 100%; background: #1da1f2; transition: width 0.3s ease; width: 0%;"></div>
                        </div>
                        <p class="progress-text" id="progress-text" style="text-align: center; font-size: 14px; color: #657786; margin: 0;">准备更新...</p>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3 style="margin-bottom: 15px; color: #333; font-size: 16px;">更新源配置</h3>
                    <div class="form-group" style="margin-bottom: 15px;">
                        <label for="update-url" style="display: block; margin-bottom: 5px; font-size: 14px; color: #333;">更新服务器地址:</label>
                        <input type="text" id="update-url" placeholder="https://example.com/updates" style="width: 100%; padding: 10px; border: 1px solid #e1e8ed; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                        <button id="save-url-btn" class="btn-secondary" style="margin-top: 10px; background: #e1e8ed; color: #657786; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 14px;">保存配置</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('settings-close-btn').addEventListener('click', closeSettingsPanel);
    document.getElementById('check-update-btn').addEventListener('click', checkUpdate);
    document.getElementById('start-update-btn').addEventListener('click', startUpdate);
    document.getElementById('save-url-btn').addEventListener('click', saveUpdateUrl);
    
    // 加载当前配置
    loadUpdateConfig();
    
    // 点击外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeSettingsPanel();
        }
    });
}

// 关闭设置面板
export function closeSettingsPanel() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.remove();
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 移除已有的通知
    const existingNotification = document.getElementById('app-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.id = 'app-notification';
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 10001;
        max-width: 300px;
        word-wrap: break-word;
        animation: slideIn 0.3s ease;
    `;
    
    // 根据类型设置颜色
    const colors = {
        info: '#1da1f2',
        success: '#28a745',
        error: '#e02020',
        warning: '#ffc107'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // 添加动画样式
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 加载更新配置
async function loadUpdateConfig() {
    try {
        const response = await fetch('/api/update/config');
        const data = await response.json();
        const urlInput = document.getElementById('update-url');
        if (urlInput && data.update_url) {
            urlInput.value = data.update_url;
        }
    } catch (error) {
        console.error('加载更新配置失败:', error);
    }
}

// 保存更新源配置
async function saveUpdateUrl() {
    const urlInput = document.getElementById('update-url');
    const url = urlInput.value.trim();
    
    if (!url) {
        showNotification('请输入更新服务器地址', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/update/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ update_url: url })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('配置已保存', 'success');
        } else {
            showNotification('保存失败', 'error');
        }
    } catch (error) {
        console.error('保存配置失败:', error);
        showNotification('保存失败: ' + error.message, 'error');
    }
}

// 检查更新
async function checkUpdate() {
    const checkBtn = document.getElementById('check-update-btn');
    const infoDiv = document.getElementById('update-info');
    
    checkBtn.disabled = true;
    checkBtn.textContent = '检查中...';
    
    try {
        const response = await fetch('/api/update/check');
        const data = await response.json();
        
        if (data.error) {
            infoDiv.innerHTML = `<p style="color: #e02020; margin: 5px 0; font-size: 14px;">检查更新失败: ${data.error}</p>`;
        } else if (data.has_update) {
            infoDiv.innerHTML = `
                <p style="color: #28a745; font-weight: bold; margin: 5px 0; font-size: 14px;">发现新版本!</p>
                <p style="margin: 5px 0; font-size: 14px;">当前版本: ${data.local_version}</p>
                <p style="margin: 5px 0; font-size: 14px;">最新版本: ${data.remote_version}</p>
                <p style="margin: 5px 0; font-size: 14px;">数据库大小: ${formatFileSize(data.db_size)}</p>
                <p style="margin: 5px 0; font-size: 14px;">媒体文件数量: ${data.media_count}</p>
                ${data.update_info ? `<p style="margin: 5px 0; font-size: 14px;">更新说明: ${data.update_info}</p>` : ''}
            `;
            document.getElementById('start-update-btn').style.display = 'inline-block';
        } else {
            infoDiv.innerHTML = `
                <p style="color: #28a745; font-weight: bold; margin: 5px 0; font-size: 14px;">当前已是最新版本</p>
                <p style="margin: 5px 0; font-size: 14px;">版本号: ${data.local_version}</p>
            `;
        }
    } catch (error) {
        console.error('检查更新失败:', error);
        infoDiv.innerHTML = `<p style="color: #e02020; margin: 5px 0; font-size: 14px;">检查更新失败: ${error.message}</p>`;
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = '检查更新';
    }
}

// 开始更新
async function startUpdate() {
    const startBtn = document.getElementById('start-update-btn');
    const progressDiv = document.getElementById('update-progress');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    
    startBtn.disabled = true;
    startBtn.textContent = '更新中...';
    progressDiv.style.display = 'block';
    
    try {
        // 更新数据库
        progressText.textContent = '正在下载数据库...';
        progressFill.style.width = '30%';
        
        const dbResponse = await fetch('/api/update/database', {
            method: 'POST'
        });
        const dbResult = await dbResponse.json();
        
        if (!dbResult.success) {
            throw new Error('数据库更新失败: ' + dbResult.error);
        }
        
        // 更新媒体文件
        progressText.textContent = '正在下载媒体文件...';
        progressFill.style.width = '70%';
        
        const mediaResponse = await fetch('/api/update/media', {
            method: 'POST'
        });
        const mediaResult = await mediaResponse.json();
        
        if (!mediaResult.success) {
            throw new Error('媒体文件更新失败: ' + mediaResult.error);
        }
        
        // 完成
        progressFill.style.width = '100%';
        progressText.textContent = `更新完成! 新增 ${mediaResult.downloaded} 个媒体文件`;
        
        showNotification('更新完成! 请刷新页面查看新内容', 'success');
        
        setTimeout(() => {
            closeSettingsPanel();
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('更新失败:', error);
        progressText.textContent = '更新失败: ' + error.message;
        progressFill.style.backgroundColor = '#e02020';
        startBtn.disabled = false;
        startBtn.textContent = '重试';
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
    showSettingsPanel,
    closeSettingsPanel
};
