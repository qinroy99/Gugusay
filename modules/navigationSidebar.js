/**
 * 导航侧边栏模块
 * 参考高级搜索，提供右侧边栏形式的导航功能
 */

import { loadPage } from './pageLoader.js';
import { globalState } from './globalState.js';
import { renderTweets } from './tweetRenderer.js';
import { updatePaginationInfo } from './tweetRenderer.js';
import { changeFontSize, changeTheme, initFontSize, initTheme } from './themeManager.js';

// 侧边栏元素
const sidebar = document.getElementById('navigation-sidebar');
const closeBtn = document.getElementById('navigation-close');

// 数据存储
let yearMonthData = [];
let channelData = [];
let favorites = [];
let isNavigationLoaded = false;

/**
 * 打开导航侧边栏
 */
export function openNavigationSidebar() {
    if (sidebar) {
        sidebar.classList.remove('hidden');

        // 首次打开时加载数据
        if (!isNavigationLoaded) {
            loadNavigationData();
            isNavigationLoaded = true;
        }
    }
}

/**
 * 关闭导航侧边栏
 */
export function closeNavigationSidebar() {
    if (sidebar) {
        sidebar.classList.add('hidden');
    }
}

/**
 * 加载导航数据
 */
async function loadNavigationData() {
    try {
        const [yearMonthsResponse, channelsResponse] = await Promise.all([
            fetch('/api/year-months'),
            fetch('/api/channels')
        ]);

        yearMonthData = (await yearMonthsResponse.json()).yearMonths || [];
        channelData = (await channelsResponse.json()).channels || [];

        // 加载收藏
        loadFavorites();

        // 渲染导航内容
        renderNavigationContent();
    } catch (error) {
        console.error('加载导航数据失败:', error);
    }
}

/**
 * 渲染导航内容
 */
function renderNavigationContent() {
    const content = document.getElementById('navigation-content');
    if (!content) return;

    content.innerHTML = `
        <div class="navigation-tabs">
            <button class="nav-tab-btn active" data-tab="timeline">📅 时间线</button>
            <button class="nav-tab-btn" data-tab="channels">🏷️ 渠道</button>
            <button class="nav-tab-btn" data-tab="favorites">⭐ 收藏</button>
            <button class="nav-tab-btn" data-tab="settings">⚙️ 设置</button>
        </div>

        <div class="navigation-tab-content">
            <div id="nav-tab-timeline" class="tab-pane active">
                <div class="timeline-container">
                    ${renderTimelineHTML()}
                </div>
            </div>

            <div id="nav-tab-channels" class="tab-pane">
                <div class="channels-search">
                    <input type="text" id="channel-search-input" placeholder="搜索渠道..." />
                </div>
                <div class="channels-container">
                    ${renderChannelsHTML()}
                </div>
            </div>

            <div id="nav-tab-favorites" class="tab-pane">
                <div class="favorites-container">
                    ${renderFavoritesHTML()}
                </div>
            </div>

            <div id="nav-tab-settings" class="tab-pane">
                <div class="settings-container">
                    ${renderSettingsHTML()}
                </div>
            </div>
        </div>

        <div class="navigation-footer">
            <button class="nav-footer-btn" id="nav-on-this-day-btn" title="那年今日">📅 那年今日</button>
            <button class="nav-footer-btn" id="nav-random-btn" title="随机">🎲 随机</button>
        </div>
    `;

    // 绑定事件
    bindNavigationEvents();
}

/**
 * 渲染时间线 HTML（支持年份折叠展开）
 */
function renderTimelineHTML() {
    // 按年份分组
    const groupedData = {};
    yearMonthData.forEach(item => {
        if (!groupedData[item.year]) {
            groupedData[item.year] = [];
        }
        groupedData[item.year].push(item);
    });

    // 排序年份
    const sortedYears = Object.keys(groupedData).sort((a, b) => b - a);

    let html = '';
    sortedYears.forEach((year, index) => {
        const isExpanded = index === 0; // 默认展开第一年
        html += `
            <div class="timeline-year-section">
                <div class="year-header" data-year="${year}">
                    <div class="year-toggle">▼</div>
                    <div class="year-badge">${year}</div>
                    <div class="year-count">${groupedData[year].length}个月</div>
                </div>
                <div class="timeline-items ${isExpanded ? 'expanded' : 'collapsed'}">
        `;

        // 排序月份
        const sortedMonths = groupedData[year].sort((a, b) => b.month - a.month);
        sortedMonths.forEach(item => {
            const monthName = getMonthName(item.month);
            html += `
                <div class="timeline-item" data-year="${item.year}" data-month="${item.month}">
                    <div class="timeline-card">
                        <div class="timeline-info">
                            <span class="timeline-month">${monthName}</span>
                            <span class="timeline-stats">${item.count}条</span>
                        </div>
                        <button class="timeline-fav" data-type="month" data-year="${item.year}" data-month="${item.month}" title="收藏">⭐</button>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    return html;
}

/**
 * 渲染渠道 HTML
 */
function renderChannelsHTML() {
    let html = '';
    channelData.forEach(channel => {
        const count = channel.count || 0;
        // 根据数量设置标签大小
        const fontSize = Math.min(Math.max(count, 10), 24);
        const channelName = channel.channel || '无渠道';

        html += `
            <div class="channel-tag" data-channel="${channelName || ''}" style="font-size: ${fontSize}px;">
                <span class="channel-name">${channelName}</span>
                <span class="channel-count">(${count})</span>
                <button class="channel-fav" data-type="channel" data-channel="${channelName || ''}" title="收藏">⭐</button>
            </div>
        `;
    });

    return html;
}

/**
 * 渲染收藏 HTML
 */
function renderFavoritesHTML() {
    if (favorites.length === 0) {
        return `
            <div class="empty-favorites">
                <p>暂无收藏</p>
                <small>点击时间线或渠道上的⭐添加收藏</small>
            </div>
        `;
    }

    let html = '';
    favorites.forEach((fav, index) => {
        if (fav.type === 'month') {
            const monthName = getMonthName(fav.month);
            html += `
                <div class="favorite-item" data-index="${index}">
                    <span class="fav-label">${fav.year}年 ${monthName}</span>
                    <button class="fav-remove-btn" data-index="${index}" title="删除">✕</button>
                </div>
            `;
        } else if (fav.type === 'channel') {
            html += `
                <div class="favorite-item" data-index="${index}">
                    <span class="fav-label">${fav.channel || '无渠道'}</span>
                    <button class="fav-remove-btn" data-index="${index}" title="删除">✕</button>
                </div>
            `;
        }
    });

    return html;
}

/**
 * 渲染设置 HTML
 */
function renderSettingsHTML() {
    return `
        <div class="settings-section">
            <div class="settings-group">
                <h3 class="settings-title">📝 字体大小</h3>
                <div class="settings-buttons">
                    <button class="setting-btn font-size-btn" data-size="medium">小字体</button>
                    <button class="setting-btn font-size-btn" data-size="large">大字体</button>
                </div>
            </div>

            <div class="settings-group">
                <h3 class="settings-title">🎨 主题配色</h3>
                <div class="settings-buttons">
                    <button class="setting-btn color-theme-btn" data-theme="white">白色主题</button>
                    <button class="setting-btn color-theme-btn" data-theme="black">黑色主题</button>
                </div>
            </div>

            <div class="settings-group">
                <h3 class="settings-title">🔄 在线更新</h3>
                <div class="update-info" id="nav-update-info" style="background: #f7f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px;">
                    <p style="margin: 5px 0;">点击"检查更新"按钮检查是否有新版本</p>
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
                    <label for="nav-update-url" style="display: block; margin-bottom: 5px; font-size: 13px; color: #333;">更新服务器地址:</label>
                    <input type="text" id="nav-update-url" placeholder="https://example.com/updates" style="width: 100%; padding: 8px; border: 1px solid #e1e8ed; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                    <button class="setting-btn" id="nav-save-url-btn" style="margin-top: 8px; width: 100%;">保存配置</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * 绑定导航事件
 */
function bindNavigationEvents() {
    // 关闭按钮
    if (closeBtn) {
        closeBtn.addEventListener('click', closeNavigationSidebar);
    }

    // 标签页切换
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有激活状态
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            // 激活当前标签
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`nav-tab-${tabId}`).classList.add('active');
        });
    });

    // 年份折叠/展开
    document.querySelectorAll('.year-header').forEach(header => {
        header.addEventListener('click', () => {
            const toggle = header.querySelector('.year-toggle');
            const items = header.nextElementSibling;
            toggle.classList.toggle('collapsed');
            items.classList.toggle('collapsed');
            items.classList.toggle('expanded');
        });
    });

    // 时间线点击
    document.querySelectorAll('.timeline-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('timeline-fav')) {
                const year = item.dataset.year;
                const month = item.dataset.month;
                navigateToYearMonth(year, month);
                closeNavigationSidebar();
            }
        });

        // 收藏按钮
        const favBtn = item.querySelector('.timeline-fav');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite('month', {
                    year: item.dataset.year,
                    month: item.dataset.month
                });
            });
        }
    });

    // 渠道点击
    document.querySelectorAll('.channel-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            if (!e.target.classList.contains('channel-fav')) {
                const channel = tag.dataset.channel || '';
                navigateToChannel(channel);
                closeNavigationSidebar();
            }
        });

        // 收藏按钮
        const favBtn = tag.querySelector('.channel-fav');
        if (favBtn) {
            favBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite('channel', {
                    channel: tag.dataset.channel || ''
                });
            });
        }
    });

    // 渠道搜索
    const searchInput = document.getElementById('channel-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterChannels(e.target.value);
        });
    }

    // 收藏项点击
    document.querySelectorAll('.favorite-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('fav-remove-btn')) {
                const index = parseInt(item.dataset.index);
                const fav = favorites[index];
                if (fav.type === 'month') {
                    navigateToYearMonth(fav.year, fav.month);
                } else if (fav.type === 'channel') {
                    navigateToChannel(fav.channel || '');
                }
                closeNavigationSidebar();
            }
        });

        // 删除按钮
        const removeBtn = item.querySelector('.fav-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                favorites.splice(index, 1);
                saveFavorites();
                updateFavoritesPane();
            });
        }
    });

    // 那年今日按钮
    const onThisDayBtn = document.getElementById('nav-on-this-day-btn');
    if (onThisDayBtn) {
        onThisDayBtn.addEventListener('click', () => {
            navigateOnThisDay();
            closeNavigationSidebar();
        });
    }

    // 随机按钮
    const randomBtn = document.getElementById('nav-random-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            navigateToRandom();
            closeNavigationSidebar();
        });
    }

    // 字体大小按钮
    const fontSizeBtns = document.querySelectorAll('.font-size-btn');
    fontSizeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const size = e.target.dataset.size;
            changeFontSize(size);
            // 更新按钮状态
            fontSizeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // 主题切换按钮
    const themeBtns = document.querySelectorAll('.color-theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = e.target.dataset.theme;
            changeTheme(theme);
            // 更新按钮状态
            themeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    // 初始化设置按钮状态
    updateSettingsButtons();

    // 在线更新按钮
    const checkUpdateBtn = document.getElementById('nav-check-update-btn');
    if (checkUpdateBtn) {
        checkUpdateBtn.addEventListener('click', checkUpdateNav);
    }

    const startUpdateBtn = document.getElementById('nav-start-update-btn');
    if (startUpdateBtn) {
        startUpdateBtn.addEventListener('click', startUpdateNav);
    }

    const saveUrlBtn = document.getElementById('nav-save-url-btn');
    if (saveUrlBtn) {
        saveUrlBtn.addEventListener('click', saveUpdateUrlNav);
    }

    // 加载更新配置
    loadUpdateConfigNav();
}

/**
 * 更新设置按钮状态
 */
function updateSettingsButtons() {
    // 更新字体大小按钮状态
    const fontSizeBtns = document.querySelectorAll('.font-size-btn');
    fontSizeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === globalState.currentFontSize);
    });

    // 更新主题按钮状态
    const themeBtns = document.querySelectorAll('.color-theme-btn');
    themeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === globalState.currentTheme);
    });
}

/**
 * 过滤渠道
 */
function filterChannels(keyword) {
    const container = document.querySelector('.channels-container');
    if (!container) return;

    const tags = container.querySelectorAll('.channel-tag');
    tags.forEach(tag => {
        const channelName = tag.querySelector('.channel-name').textContent.toLowerCase();
        const matches = channelName.includes(keyword.toLowerCase());
        tag.style.display = matches ? 'flex' : 'none';
    });
}

/**
 * 加载收藏
 */
function loadFavorites() {
    const stored = localStorage.getItem('tweet_favorites');
    favorites = stored ? JSON.parse(stored) : [];
}

/**
 * 保存收藏
 */
function saveFavorites() {
    localStorage.setItem('tweet_favorites', JSON.stringify(favorites));
}

/**
 * 更新收藏面板
 */
function updateFavoritesPane() {
    const favoritesPane = document.getElementById('nav-tab-favorites');
    if (favoritesPane) {
        favoritesPane.innerHTML = renderFavoritesHTML();
    }
}

/**
 * 切换收藏状态
 */
function toggleFavorite(type, data) {
    let exists = false;
    let index = -1;

    favorites.forEach((fav, i) => {
        if (fav.type === type) {
            if (type === 'month' && fav.year === data.year && fav.month === data.month) {
                exists = true;
                index = i;
            } else if (type === 'channel' && fav.channel === data.channel) {
                exists = true;
                index = i;
            }
        }
    });

    if (exists) {
        favorites.splice(index, 1);
    } else {
        favorites.push({ type, ...data });
    }

    saveFavorites();

    // 更新收藏按钮状态
    updateFavButtons();
    updateFavoritesPane();
}

/**
 * 更新收藏按钮状态
 */
function updateFavButtons() {
    // 时间线收藏按钮
    document.querySelectorAll('.timeline-fav').forEach(btn => {
        const year = btn.dataset.year;
        const month = btn.dataset.month;
        const exists = favorites.some(fav =>
            fav.type === 'month' && fav.year === year && fav.month === month
        );
        btn.classList.toggle('active', exists);
        btn.textContent = exists ? '★' : '⭐';
    });

    // 渠道收藏按钮
    document.querySelectorAll('.channel-fav').forEach(btn => {
        const channel = btn.dataset.channel;
        const exists = favorites.some(fav =>
            fav.type === 'channel' && fav.channel === channel
        );
        btn.classList.toggle('active', exists);
        btn.textContent = exists ? '★' : '⭐';
    });
}

/**
 * 导航到指定年月
 */
function navigateToYearMonth(year, month) {
    globalState.currentYearMonth = `${year}-${month}`;
    globalState.currentChannel = null;
    globalState.currentSearch = '';

    fetch(`/api/year-month/${year}/${month}/page?pageSize=${globalState.pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (data.page) {
                loadPage(data.page);
            }
        })
        .catch(error => console.error('导航失败:', error));
}

/**
 * 导航到指定渠道
 */
function navigateToChannel(channel) {
    globalState.currentChannel = channel || null;
    globalState.currentYearMonth = null;
    globalState.currentSearch = '';

    fetch(`/api/channel/${encodeURIComponent(channel)}/page?pageSize=${globalState.pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (data.page) {
                loadPage(data.page);
            }
        })
        .catch(error => console.error('导航失败:', error));
}

/**
 * 那年今日导航
 */
function navigateOnThisDay() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const monthDay = `${month}-${day}`;

    globalState.currentYearMonth = null;
    globalState.currentChannel = null;
    globalState.currentSearch = monthDay;

    fetch(`/api/on-this-day?keyword=${encodeURIComponent(monthDay)}&page=1&pageSize=${globalState.pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (data.records || data.page !== undefined) {
                globalState.currentPage = data.page || 1;
                globalState.totalPages = data.totalPages || 1;
                globalState.totalRecords = data.total || 0;
                renderTweets(data.records || []);
                updatePaginationInfo();
            }
        })
        .catch(error => console.error('导航失败:', error));
}

/**
 * 随机导航
 */
function navigateToRandom() {
    if (yearMonthData.length === 0) return;

    const randomItem = yearMonthData[Math.floor(Math.random() * yearMonthData.length)];
    navigateToYearMonth(randomItem.year, randomItem.month);
}

/**
 * 获取月份名称
 */
function getMonthName(month) {
    const monthNames = {
        '01': '1月', '02': '2月', '03': '3月', '04': '4月',
        '05': '5月', '06': '6月', '07': '7月', '08': '8月',
        '09': '9月', '10': '10月', '11': '11月', '12': '12月'
    };
    return monthNames[month] || month;
}

/**
 * 初始化导航功能
 */
export function initNavigationSidebar() {
    // 点击外部关闭
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !e.target.closest('#toggle-tree')) {
            closeNavigationSidebar();
        }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sidebar.classList.contains('hidden')) {
            closeNavigationSidebar();
        }
    });
}

/**
 * 检查更新（导航侧边栏版本）
 */
async function checkUpdateNav() {
    const checkBtn = document.getElementById('nav-check-update-btn');
    const infoDiv = document.getElementById('nav-update-info');

    checkBtn.disabled = true;
    checkBtn.textContent = '检查中...';

    try {
        const response = await fetch('/api/update/check');
        const data = await response.json();

        if (data.error) {
            infoDiv.innerHTML = `<p style="color: #e02020; margin: 5px 0; font-size: 13px;">检查更新失败: ${data.error}</p>`;
        } else if (data.has_update) {
            infoDiv.innerHTML = `
                <p style="color: #28a745; font-weight: bold; margin: 5px 0; font-size: 13px;">发现新版本!</p>
                <p style="margin: 5px 0; font-size: 13px;">当前版本: ${data.local_version}</p>
                <p style="margin: 5px 0; font-size: 13px;">最新版本: ${data.remote_version}</p>
                <p style="margin: 5px 0; font-size: 13px;">数据库大小: ${formatFileSize(data.db_size)}</p>
                <p style="margin: 5px 0; font-size: 13px;">媒体文件数量: ${data.media_count}</p>
                ${data.update_info ? `<p style="margin: 5px 0; font-size: 13px;">更新说明: ${data.update_info}</p>` : ''}
            `;
            document.getElementById('nav-start-update-btn').style.display = 'block';
        } else {
            infoDiv.innerHTML = `
                <p style="color: #28a745; font-weight: bold; margin: 5px 0; font-size: 13px;">当前已是最新版本</p>
                <p style="margin: 5px 0; font-size: 13px;">版本号: ${data.local_version}</p>
            `;
        }
    } catch (error) {
        console.error('检查更新失败:', error);
        infoDiv.innerHTML = `<p style="color: #e02020; margin: 5px 0; font-size: 13px;">检查更新失败: ${error.message}</p>`;
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = '检查更新';
    }
}

/**
 * 开始更新（导航侧边栏版本）
 */
async function startUpdateNav() {
    const startBtn = document.getElementById('nav-start-update-btn');
    const progressDiv = document.getElementById('nav-update-progress');
    const progressText = document.getElementById('nav-progress-text');
    const progressFill = document.getElementById('nav-progress-fill');

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

        // 显示成功提示
        setTimeout(() => {
            alert('更新完成! 请刷新页面查看新内容');
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('更新失败:', error);
        progressText.textContent = '更新失败: ' + error.message;
        progressFill.style.backgroundColor = '#e02020';
        startBtn.disabled = false;
        startBtn.textContent = '重试';
    }
}

/**
 * 加载更新配置（导航侧边栏版本）
 */
async function loadUpdateConfigNav() {
    try {
        const response = await fetch('/api/update/config');
        const data = await response.json();
        const urlInput = document.getElementById('nav-update-url');
        if (urlInput && data.update_url) {
            urlInput.value = data.update_url;
        }
    } catch (error) {
        console.error('加载更新配置失败:', error);
    }
}

/**
 * 保存更新源配置（导航侧边栏版本）
 */
async function saveUpdateUrlNav() {
    const urlInput = document.getElementById('nav-update-url');
    const url = urlInput.value.trim();

    if (!url) {
        alert('请输入更新服务器地址');
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
            alert('配置已保存');
        } else {
            alert('保存失败');
        }
    } catch (error) {
        console.error('保存配置失败:', error);
        alert('保存失败: ' + error.message);
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
    openNavigationSidebar,
    closeNavigationSidebar,
    initNavigationSidebar
};
