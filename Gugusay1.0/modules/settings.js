let updateRequestToken = '';

function buildUpdateSourceText(data) {
    const owner = data.owner || '';
    const repo = data.repo || '';
    const channel = data.channel || 'latest';
    if (!owner || !repo) return '';
    return `${owner}/${repo}/${channel}`;
}

function parseUpdateSourceText(text) {
    const parts = (text || '').split('/').map(x => x.trim()).filter(Boolean);
    if (parts.length < 2) return null;
    return {
        owner: parts[0],
        repo: parts[1],
        channel: parts[2] || 'latest'
    };
}

function updateHeaders() {
    return {
        'X-Update-Token': updateRequestToken
    };
}

export function showSettingsPanel() {
    closeSettingsPanel();
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
                        <p style="margin: 5px 0; font-size: 14px;">点击“检查更新”查看是否有新版本</p>
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
                        <label for="update-url" style="display: block; margin-bottom: 5px; font-size: 14px; color: #333;">GitHub 源（owner/repo/channel）:</label>
                        <input type="text" id="update-url" placeholder="owner/repo/latest" style="width: 100%; padding: 10px; border: 1px solid #e1e8ed; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                        <button id="save-url-btn" class="btn-secondary" style="margin-top: 10px; background: #e1e8ed; color: #657786; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 14px;">保存配置</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('settings-close-btn').addEventListener('click', closeSettingsPanel);
    document.getElementById('check-update-btn').addEventListener('click', checkUpdate);
    document.getElementById('start-update-btn').addEventListener('click', startUpdate);
    document.getElementById('save-url-btn').addEventListener('click', saveUpdateUrl);
    loadUpdateConfig();

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeSettingsPanel();
    });
}

export function closeSettingsPanel() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.remove();
}

function showNotification(message, type = 'info') {
    const existing = document.getElementById('app-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'app-notification';
    notification.textContent = message;
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
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#e02020' : '#1da1f2'};
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

async function loadUpdateConfig() {
    try {
        const response = await fetch('/api/update/config');
        const data = await response.json();
        if (data.request_token) {
            updateRequestToken = data.request_token;
        }
        const urlInput = document.getElementById('update-url');
        if (urlInput) {
            urlInput.value = buildUpdateSourceText(data);
        }
    } catch (error) {
        console.error('加载更新配置失败:', error);
    }
}

async function saveUpdateUrl() {
    const input = document.getElementById('update-url');
    const parsed = parseUpdateSourceText(input.value.trim());
    if (!parsed) {
        showNotification('请输入 owner/repo/channel', 'error');
        return;
    }
    try {
        const response = await fetch('/api/update/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...updateHeaders()
            },
            body: JSON.stringify(parsed)
        });
        const data = await response.json();
        if (data.success) {
            showNotification('配置已保存', 'success');
        } else {
            showNotification(data.error || '保存失败', 'error');
        }
    } catch (error) {
        showNotification('保存失败: ' + error.message, 'error');
    }
}

async function checkUpdate() {
    const checkBtn = document.getElementById('check-update-btn');
    const infoDiv = document.getElementById('update-info');
    checkBtn.disabled = true;
    checkBtn.textContent = '检查中...';
    try {
        const response = await fetch('/api/update/check', { headers: { ...updateHeaders() } });
        const data = await response.json();
        if (data.error) {
            infoDiv.innerHTML = `<p style="color:#e02020;margin:5px 0;font-size:14px;">检查更新失败: ${data.error}</p>`;
        } else if (data.has_update) {
            infoDiv.innerHTML = `
                <p style="color:#28a745;font-weight:bold;margin:5px 0;font-size:14px;">发现新版本</p>
                <p style="margin:5px 0;font-size:14px;">当前版本: ${data.local_version}</p>
                <p style="margin:5px 0;font-size:14px;">最新版本: ${data.remote_version}</p>
                <p style="margin:5px 0;font-size:14px;">资源数量: ${data.asset_count || 0}</p>
                ${data.notes ? `<p style="margin:5px 0;font-size:14px;">说明: ${data.notes}</p>` : ''}
            `;
            document.getElementById('start-update-btn').style.display = 'inline-block';
        } else {
            infoDiv.innerHTML = `<p style="color:#28a745;font-weight:bold;margin:5px 0;font-size:14px;">当前已是最新版本</p>`;
        }
    } catch (error) {
        infoDiv.innerHTML = `<p style="color:#e02020;margin:5px 0;font-size:14px;">检查更新失败: ${error.message}</p>`;
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = '检查更新';
    }
}

async function startUpdate() {
    const startBtn = document.getElementById('start-update-btn');
    const progressDiv = document.getElementById('update-progress');
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    startBtn.disabled = true;
    progressDiv.style.display = 'block';
    progressFill.style.width = '20%';
    progressText.textContent = '准备更新...';

    try {
        const response = await fetch('/api/update/start', {
            method: 'POST',
            headers: { ...updateHeaders() }
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || result.message || '更新失败');
        }
        progressFill.style.width = '100%';
        progressText.textContent = '更新器已启动，应用将退出并重启';
        setTimeout(() => window.close(), 800);
    } catch (error) {
        progressText.textContent = '更新失败: ' + error.message;
        progressFill.style.backgroundColor = '#e02020';
        startBtn.disabled = false;
    }
}

export default {
    showSettingsPanel,
    closeSettingsPanel
};
