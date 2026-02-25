import { loadPage } from './pageLoaderSimple.js';
import { globalState } from './globalState.js';
import { changeFontSize, changeTheme } from './themeManager.js';

const sidebar = document.getElementById('navigation-sidebar');
const closeBtn = document.getElementById('navigation-close');

let yearMonthData = [];
let channelData = [];
let favorites = [];
let isNavigationLoaded = false;
let updateRequestToken = '';

function buildUpdateSourceText(data) {
    const owner = data.owner || '';
    const repo = data.repo || '';
    const channel = data.channel || 'latest';
    if (!owner || !repo) return '';
    return `${owner}/${repo}/${channel}`;
}

function parseUpdateSourceText(text) {
    const parts = (text || '').split('/').map((x) => x.trim()).filter(Boolean);
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

export function openNavigationSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('hidden');
    if (!isNavigationLoaded) {
        loadNavigationData();
        isNavigationLoaded = true;
    }
}

export function closeNavigationSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('hidden');
}

async function loadNavigationData() {
    try {
        const [yearMonthsResponse, channelsResponse] = await Promise.all([
            fetch('/api/year-months'),
            fetch('/api/channels')
        ]);

        yearMonthData = (await yearMonthsResponse.json()).yearMonths || [];
        channelData = (await channelsResponse.json()).channels || [];

        loadFavorites();
        renderNavigationContent();
    } catch (error) {
        console.error('加载时光机数据失败:', error);
    }
}

function renderNavigationContent() {
    const content = document.getElementById('navigation-content');
    if (!content) return;

    content.innerHTML = `
        <div class="navigation-tabs">
            <button class="nav-tab-btn active" data-tab="timeline">时间线</button>
            <button class="nav-tab-btn" data-tab="channels">频道</button>
            <button class="nav-tab-btn" data-tab="favorites">收藏</button>
            <button class="nav-tab-btn" data-tab="settings">设置</button>
        </div>

        <div class="navigation-tab-content">
            <div id="nav-tab-timeline" class="tab-pane active">
                <div class="timeline-container">${renderTimelineHTML()}</div>
            </div>

            <div id="nav-tab-channels" class="tab-pane">
                <div class="channels-search">
                    <input type="text" id="channel-search-input" placeholder="搜索频道..." />
                </div>
                <div class="channels-container">${renderChannelsHTML()}</div>
            </div>

            <div id="nav-tab-favorites" class="tab-pane">
                <div class="favorites-container">${renderFavoritesHTML()}</div>
            </div>

            <div id="nav-tab-settings" class="tab-pane">
                <div class="settings-container">${renderSettingsHTML()}</div>
            </div>
        </div>

        <div class="navigation-footer">
            <button class="nav-footer-btn" id="nav-on-this-day-btn" title="那年今日">那年今日</button>
            <button class="nav-footer-btn" id="nav-random-btn" title="随机">随机</button>
        </div>
    `;

    bindNavigationEvents();
}

function renderTimelineHTML() {
    const groupedData = {};
    yearMonthData.forEach((item) => {
        if (!groupedData[item.year]) groupedData[item.year] = [];
        groupedData[item.year].push(item);
    });

    const sortedYears = Object.keys(groupedData).sort((a, b) => Number(b) - Number(a));

    let html = '';
    sortedYears.forEach((year, index) => {
        const isExpanded = index === 0;
        html += `
            <div class="timeline-year-section">
                <div class="year-header" data-year="${year}">
                    <div class="year-toggle">▾</div>
                    <div class="year-badge">${year}</div>
                    <div class="year-count">${groupedData[year].length} 个月</div>
                </div>
                <div class="timeline-items ${isExpanded ? 'expanded' : 'collapsed'}">
        `;

        const sortedMonths = groupedData[year].sort((a, b) => Number(b.month) - Number(a.month));
        sortedMonths.forEach((item) => {
            const monthName = getMonthName(item.month);
            html += `
                <div class="timeline-item" data-year="${item.year}" data-month="${item.month}">
                    <div class="timeline-card">
                        <div class="timeline-info">
                            <span class="timeline-month">${monthName}月</span>
                            <span class="timeline-stats">${item.count} 条</span>
                        </div>
                        <button class="timeline-fav" data-type="month" data-year="${item.year}" data-month="${item.month}" title="收藏">☆</button>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    return html;
}

function renderChannelsHTML() {
    let html = '';
    channelData.forEach((channel) => {
        const count = channel.count || 0;
        const fontSize = Math.min(Math.max(count, 10), 24);
        const channelName = channel.channel || '未分类';

        html += `
            <div class="channel-tag" data-channel="${channelName || ''}" style="font-size: ${fontSize}px;">
                <span class="channel-name">${channelName}</span>
                <span class="channel-count">(${count})</span>
                <button class="channel-fav" data-type="channel" data-channel="${channelName || ''}" title="收藏">☆</button>
            </div>
        `;
    });

    return html;
}

function renderFavoritesHTML() {
    if (favorites.length === 0) {
        return `
            <div class="empty-favorites">
                <p>暂无收藏</p>
                <small>你可以在时间线或频道中点击 ☆ 添加收藏</small>
            </div>
        `;
    }

    let html = '';
    favorites.forEach((fav, index) => {
        if (fav.type === 'month') {
            html += `
                <div class="favorite-item" data-index="${index}">
                    <span class="fav-label">${fav.year}年 ${getMonthName(fav.month)}月</span>
                    <button class="fav-remove-btn" data-index="${index}" title="删除">✕</button>
                </div>
            `;
        } else if (fav.type === 'channel') {
            html += `
                <div class="favorite-item" data-index="${index}">
                    <span class="fav-label">${fav.channel || '未分类'}</span>
                    <button class="fav-remove-btn" data-index="${index}" title="删除">✕</button>
                </div>
            `;
        }
    });

    return html;
}

function renderSettingsHTML() {
    return `
        <div class="settings-section">
            <div class="settings-group">
                <h3 class="settings-title">字体大小</h3>
                <div class="settings-buttons">
                    <button class="setting-btn font-size-btn" data-size="medium">小字体</button>
                    <button class="setting-btn font-size-btn" data-size="large">大字体</button>
                </div>
            </div>

            <div class="settings-group">
                <h3 class="settings-title">主题配色</h3>
                <div class="settings-buttons">
                    <button class="setting-btn color-theme-btn" data-theme="white">白色主题</button>
                    <button class="setting-btn color-theme-btn" data-theme="black">黑色主题</button>
                </div>
            </div>

            <div class="settings-group">
                <h3 class="settings-title">在线更新</h3>
                <div class="update-info" id="nav-update-info" style="background: #f7f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;">
                    <p style="margin: 5px 0;">点击“检查更新”查看是否有新版本</p>
                </div>
                <div class="settings-buttons" style="flex-direction: column; gap: 8px;">
                    <button class="setting-btn" id="nav-check-update-btn" style="width: 100%;">检查更新</button>
                    <button class="setting-btn" id="nav-start-update-btn" style="width: 100%; display: none; background: #28a745; color: white;">开始更新</button>
                </div>
                <div class="update-progress" id="nav-update-progress" style="display: none; margin-top: 15px;">
                    <div class="progress-bar" style="width: 100%; height: 20px; background: #e1e8ed; border-radius: 10px; overflow: hidden; margin-bottom: 8px;">
                        <div class="progress-fill" id="nav-progress-fill" style="height: 100%; background: #1da1f2; transition: width 0.3s ease; width: 0%;"></div>
                    </div>
                    <p class="progress-text" id="nav-progress-text" style="text-align: center; font-size: 13px; color: #657786; margin: 0;">准备更新...</p>
                </div>
                <div class="form-group" style="margin-top: 15px;">
                    <label for="nav-update-url" style="display: block; margin-bottom: 5px; font-size: 13px; color: #333;">更新源 (owner/repo/channel):</label>
                    <input type="text" id="nav-update-url" placeholder="owner/repo/latest" style="width: 100%; padding: 8px; border: 1px solid #e1e8ed; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                    <button class="setting-btn" id="nav-save-url-btn" style="margin-top: 8px; width: 100%;">保存配置</button>
                </div>
            </div>
        </div>
    `;
}

function bindNavigationEvents() {
    if (closeBtn) closeBtn.addEventListener('click', closeNavigationSidebar);

    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            tabBtns.forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            const pane = document.getElementById(`nav-tab-${tabId}`);
            if (pane) pane.classList.add('active');
        });
    });

    document.querySelectorAll('.year-header').forEach((header) => {
        header.addEventListener('click', () => {
            const toggle = header.querySelector('.year-toggle');
            const items = header.nextElementSibling;
            if (!toggle || !items) return;
            toggle.classList.toggle('collapsed');
            items.classList.toggle('collapsed');
            items.classList.toggle('expanded');
        });
    });

    document.querySelectorAll('.timeline-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('timeline-fav')) {
                navigateToYearMonth(item.dataset.year, item.dataset.month);
                closeNavigationSidebar();
            }
        });
        const favBtn = item.querySelector('.timeline-fav');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite('month', { year: item.dataset.year, month: item.dataset.month });
            });
        }
    });

    document.querySelectorAll('.channel-tag').forEach((tag) => {
        tag.addEventListener('click', (e) => {
            if (!e.target.classList.contains('channel-fav')) {
                navigateToChannel(tag.dataset.channel || '');
                closeNavigationSidebar();
            }
        });
        const favBtn = tag.querySelector('.channel-fav');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite('channel', { channel: tag.dataset.channel || '' });
            });
        }
    });

    const searchInput = document.getElementById('channel-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterChannels(e.target.value));
    }

    document.querySelectorAll('.favorite-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('fav-remove-btn')) {
                const index = Number(item.dataset.index);
                const fav = favorites[index];
                if (!fav) return;
                if (fav.type === 'month') navigateToYearMonth(fav.year, fav.month);
                if (fav.type === 'channel') navigateToChannel(fav.channel || '');
                closeNavigationSidebar();
            }
        });
        const removeBtn = item.querySelector('.fav-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = Number(item.dataset.index);
                favorites.splice(index, 1);
                saveFavorites();
                updateFavoritesPane();
            });
        }
    });

    const onThisDayBtn = document.getElementById('nav-on-this-day-btn');
    if (onThisDayBtn) {
        onThisDayBtn.addEventListener('click', () => {
            navigateOnThisDay();
            closeNavigationSidebar();
        });
    }

    const randomBtn = document.getElementById('nav-random-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            navigateToRandom();
            closeNavigationSidebar();
        });
    }

    const fontSizeBtns = document.querySelectorAll('.font-size-btn');
    fontSizeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const size = e.target.dataset.size;
            changeFontSize(size);
            fontSizeBtns.forEach((b) => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    const themeBtns = document.querySelectorAll('.color-theme-btn');
    themeBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            changeTheme(theme);
            themeBtns.forEach((b) => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    updateSettingsButtons();

    const checkUpdateBtn = document.getElementById('nav-check-update-btn');
    if (checkUpdateBtn) checkUpdateBtn.addEventListener('click', checkUpdateNav);
    const startUpdateBtn = document.getElementById('nav-start-update-btn');
    if (startUpdateBtn) startUpdateBtn.addEventListener('click', startUpdateNav);
    const saveUrlBtn = document.getElementById('nav-save-url-btn');
    if (saveUrlBtn) saveUrlBtn.addEventListener('click', saveUpdateUrlNav);

    loadUpdateConfigNav();
    updateFavButtons();
}

function updateSettingsButtons() {
    document.querySelectorAll('.font-size-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.size === globalState.currentFontSize);
    });
    document.querySelectorAll('.color-theme-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.theme === globalState.currentTheme);
    });
}

function filterChannels(keyword) {
    const k = (keyword || '').toLowerCase();
    document.querySelectorAll('.channel-tag').forEach((tag) => {
        const text = (tag.querySelector('.channel-name')?.textContent || '').toLowerCase();
        tag.style.display = text.includes(k) ? 'flex' : 'none';
    });
}

function loadFavorites() {
    const stored = localStorage.getItem('tweet_favorites');
    favorites = stored ? JSON.parse(stored) : [];
}

function saveFavorites() {
    localStorage.setItem('tweet_favorites', JSON.stringify(favorites));
}

function toggleFavorite(type, data) {
    const index = favorites.findIndex((fav) => {
        if (type === 'month') {
            return fav.type === 'month' && fav.year === data.year && fav.month === data.month;
        }
        return fav.type === 'channel' && fav.channel === data.channel;
    });

    if (index >= 0) favorites.splice(index, 1);
    else favorites.push({ type, ...data });

    saveFavorites();
    updateFavButtons();
    updateFavoritesPane();
}

function updateFavButtons() {
    document.querySelectorAll('.timeline-fav').forEach((btn) => {
        const exists = favorites.some((fav) => fav.type === 'month' && fav.year === btn.dataset.year && fav.month === btn.dataset.month);
        btn.classList.toggle('active', exists);
        btn.textContent = exists ? '★' : '☆';
    });

    document.querySelectorAll('.channel-fav').forEach((btn) => {
        const exists = favorites.some((fav) => fav.type === 'channel' && fav.channel === btn.dataset.channel);
        btn.classList.toggle('active', exists);
        btn.textContent = exists ? '★' : '☆';
    });
}

function updateFavoritesPane() {
    const pane = document.querySelector('#nav-tab-favorites .favorites-container');
    if (!pane) return;
    pane.innerHTML = renderFavoritesHTML();

    pane.querySelectorAll('.favorite-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('fav-remove-btn')) {
                const index = Number(item.dataset.index);
                const fav = favorites[index];
                if (!fav) return;
                if (fav.type === 'month') navigateToYearMonth(fav.year, fav.month);
                if (fav.type === 'channel') navigateToChannel(fav.channel || '');
                closeNavigationSidebar();
            }
        });

        const removeBtn = item.querySelector('.fav-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = Number(item.dataset.index);
                favorites.splice(index, 1);
                saveFavorites();
                updateFavoritesPane();
                updateFavButtons();
            });
        }
    });
}

function navigateToYearMonth(year, month) {
    globalState.currentSearch = '';
    globalState.currentChannel = null;
    globalState.currentYearMonth = `${year}-${String(month).padStart(2, '0')}`;
    globalState.currentPage = 1;
    loadPage(1);
}

function navigateToChannel(channel) {
    globalState.currentSearch = '';
    globalState.currentYearMonth = null;
    globalState.currentChannel = channel;
    globalState.currentPage = 1;
    loadPage(1);
}

function navigateOnThisDay() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    globalState.currentSearch = `${month}-${day}`;
    globalState.currentChannel = null;
    globalState.currentYearMonth = null;
    globalState.currentPage = 1;
    loadPage(1);
}

function navigateToRandom() {
    if (yearMonthData.length === 0) return;
    const randomItem = yearMonthData[Math.floor(Math.random() * yearMonthData.length)];
    navigateToYearMonth(randomItem.year, randomItem.month);
}

function getMonthName(month) {
    const normalized = String(month).padStart(2, '0');
    const monthNames = {
        '01': '1',
        '02': '2',
        '03': '3',
        '04': '4',
        '05': '5',
        '06': '6',
        '07': '7',
        '08': '8',
        '09': '9',
        '10': '10',
        '11': '11',
        '12': '12'
    };
    return monthNames[normalized] || String(month);
}

export function initNavigationSidebar() {
    document.addEventListener('click', (e) => {
        if (!sidebar) return;
        if (!sidebar.contains(e.target) && !e.target.closest('#toggle-tree')) {
            closeNavigationSidebar();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!sidebar) return;
        if (e.key === 'Escape' && !sidebar.classList.contains('hidden')) {
            closeNavigationSidebar();
        }
    });
}

async function checkUpdateNav() {
    const checkBtn = document.getElementById('nav-check-update-btn');
    const startBtn = document.getElementById('nav-start-update-btn');
    const infoDiv = document.getElementById('nav-update-info');
    if (!checkBtn || !infoDiv || !startBtn) return;

    checkBtn.disabled = true;
    checkBtn.textContent = '检查中...';

    try {
        const response = await fetch('/api/update/check', { headers: { ...updateHeaders() } });
        const data = await response.json();

        if (data.success && data.has_update) {
            infoDiv.innerHTML = `
                <p style="color: #28a745; font-weight: bold; margin: 5px 0; font-size: 13px;">发现新版本: ${data.remote_version}</p>
                <p style="margin: 5px 0; font-size: 13px;">当前版本: ${data.local_version}</p>
                <p style="margin: 5px 0; font-size: 13px;">更新文件数: ${data.asset_count || 0}</p>
            `;
            startBtn.style.display = 'block';
        } else if (data.success) {
            infoDiv.innerHTML = `
                <p style="color: #28a745; font-weight: bold; margin: 5px 0; font-size: 13px;">已是最新版本</p>
                <p style="margin: 5px 0; font-size: 13px;">版本: ${data.local_version || ''}</p>
            `;
            startBtn.style.display = 'none';
        } else {
            infoDiv.innerHTML = `<p style="color: #e02020; margin: 5px 0; font-size: 13px;">检查失败: ${data.error || data.message || 'unknown error'}</p>`;
            startBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('检查更新失败:', error);
        infoDiv.innerHTML = `<p style="color: #e02020; margin: 5px 0; font-size: 13px;">检查失败: ${error.message}</p>`;
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = '检查更新';
    }
}

async function startUpdateNav() {
    const startBtn = document.getElementById('nav-start-update-btn');
    const progressDiv = document.getElementById('nav-update-progress');
    const progressText = document.getElementById('nav-progress-text');
    const progressFill = document.getElementById('nav-progress-fill');
    if (!startBtn || !progressDiv || !progressText || !progressFill) return;

    startBtn.disabled = true;
    startBtn.textContent = '下载中...';
    progressDiv.style.display = 'block';
    progressText.textContent = '准备下载...';
    progressFill.style.width = '5%';

    try {
        const response = await fetch('/api/update/start', {
            method: 'POST',
            headers: { ...updateHeaders() }
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || result.error || '下载失败');
        }

        progressFill.style.width = '100%';
        progressText.textContent = result.message || '下载完成';

        const restartConfirm = confirm(
            '更新包已下载完成。\n\n' +
            '下次启动将自动应用更新。\n\n' +
            '点击“确定”立即重启，点击“取消”稍后重启。'
        );

        if (restartConfirm) {
            window.location.reload();
        } else {
            startBtn.textContent = '已下载';
            progressText.textContent = '更新已就绪，重启后生效';
        }
    } catch (error) {
        console.error('更新失败:', error);
        progressText.textContent = `更新失败: ${error.message}`;
        progressFill.style.backgroundColor = '#e02020';
        startBtn.disabled = false;
        startBtn.textContent = '重试';
    }
}

async function loadUpdateConfigNav() {
    try {
        const response = await fetch('/api/update/config');
        const data = await response.json();
        const urlInput = document.getElementById('nav-update-url');
        if (data.request_token) updateRequestToken = data.request_token;
        if (urlInput) urlInput.value = buildUpdateSourceText(data);
    } catch (error) {
        console.error('加载更新配置失败:', error);
    }
}

async function saveUpdateUrlNav() {
    const urlInput = document.getElementById('nav-update-url');
    if (!urlInput) return;
    const parsed = parseUpdateSourceText(urlInput.value.trim());

    if (!parsed) {
        alert('请输入 owner/repo/channel 格式');
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
        if (data.success) alert('配置已保存');
        else alert(`保存失败: ${data.error || 'unknown error'}`);
    } catch (error) {
        console.error('保存更新配置失败:', error);
        alert(`保存失败: ${error.message}`);
    }
}

export default {
    openNavigationSidebar,
    closeNavigationSidebar,
    initNavigationSidebar
};
