// 全局变量
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let totalRecords = 0;
const pageSize = 10;
let currentEditId = null;
let yearMonthData = []; // 存储年月数据
let currentFontSize = 'medium'; // 默认字体大小
let currentTheme = 'white'; // 默认主题

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initApp();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化字体大小
    initFontSize();
    
    // 初始化主题
    initTheme();
});

// 初始化应用
function initApp() {
    // 获取总记录数
    getTotalRecordsCount();
    
    // 加载第一页数据
    loadPage(1);
    
    // 恢复阅读进度
    restoreReadingProgress();
    
    // 加载年月导航树
    loadYearMonthTree();
}

// 初始化字体大小
function initFontSize() {
    // 从本地存储获取上次选择的字体大小
    const savedFontSize = localStorage.getItem('tweetFontSize');
    if (savedFontSize) {
        currentFontSize = savedFontSize;
    }
    
    // 应用字体大小
    applyFontSize();
    
    // 更新按钮激活状态
    updateActiveFontButton();
}

// 初始化主题
function initTheme() {
    // 从本地存储获取上次选择的主题
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
        currentTheme = savedTheme;
    }
    
    // 应用主题
    applyTheme();
    
    // 更新按钮激活状态
    updateActiveThemeButton();
}

// 获取记录总数
function getTotalRecordsCount() {
    fetch('/api/total-count')
        .then(response => response.json())
        .then(data => {
            totalRecords = data.count;
            totalPages = Math.ceil(totalRecords / pageSize);
        })
        .catch(error => {
            console.error('获取总记录数失败:', error);
        });
}

// 加载指定页面的数据
function loadPage(page) {
    currentPage = page;
    
    // 确保页码在有效范围内
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    // 构建请求URL
    let url = `/api/records?page=${currentPage}&pageSize=${pageSize}`;
    if (currentSearch) {
        url = `/api/search?keyword=${encodeURIComponent(currentSearch)}&page=${currentPage}&pageSize=${pageSize}`;
    }
    
    // 发送请求
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // 确保 records 数组存在
            const records = data.records || (data.results && data.results.records) || [];
            renderTweets(records);
            updatePaginationInfo();
            // 应用当前字体大小到新加载的推文
            applyFontSize();
        })
        .catch(error => {
            console.error('加载数据失败:', error);
        });
}

// 渲染推文列表
function renderTweets(records) {
    const container = document.getElementById('tweets-container');
    container.innerHTML = '';
    
    // 检查是否有微博或推特渠道的推文
    const hasWeiboOrTwitter = records.some(record => 
        record.channel && (record.channel.startsWith('微博@') || record.channel.startsWith('推特@'))
    );
    
    // 根据是否有微博或推特渠道的推文应用不同的布局
    if (hasWeiboOrTwitter) {
        container.classList.add('masonry-layout');
        container.classList.remove('grid-layout');
    } else {
        container.classList.remove('masonry-layout', 'grid-layout');
    }
    
    if (records.length === 0) {
        container.innerHTML = '<p>没有找到相关记录</p>';
        return;
    }
    
    records.forEach(record => {
        const tweetElement = createTweetElement(record);
        container.appendChild(tweetElement);
    });
}

// 创建单条推文元素
function createTweetElement(record) {
    const tweetDiv = document.createElement('div');
    tweetDiv.className = 'tweet';
    tweetDiv.dataset.id = record.id;
    
    // 根据渠道添加特定的CSS类
    if (record.channel) {
        if (record.channel.startsWith('微博@')) {
            tweetDiv.classList.add('masonry-item');
        } else if (record.channel.startsWith('推特@')) {
            tweetDiv.classList.add('masonry-item');
        }
        // 天涯@ 渠道保持默认样式
    }
    
    // 格式化日期显示
    const formattedDate = formatDate(record.datetime);
    
    // 处理高亮关键词并去除前后空白
    const content = highlightKeywords(record.content.trim(), currentSearch);
    
    // 处理媒体内容
    let mediaContent = '';
    if (record.media_type === 'image' && record.media_path) {
        // 支持多个图片
        const paths = record.media_path.split(',');
        let imagesHtml = '<div class="tweet-media"><div class="media-container">';
        paths.forEach(path => {
            if (path.trim()) {
                imagesHtml += `<img src="${path.trim()}" style="max-width: 500px;" />`;
            }
        });
        imagesHtml += '</div></div>';
        mediaContent = imagesHtml;
    }
    
    tweetDiv.innerHTML = `<div class="tweet-header">` +
            `<span class="tweet-time">${formattedDate}</span>` +
            (record.channel ? `<span class="tweet-channel">${record.channel}</span>` : '') +
        `</div>` +
        `<div class="tweet-content">${content}</div>` +
        mediaContent +
        `<div class="tweet-actions">` +
            `<button class="edit-btn" data-id="${record.id}">编辑</button>` +
            `<button class="delete-btn" data-id="${record.id}">删除</button>` +
        `</div>`;
    
    return tweetDiv;
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
function updatePaginationInfo() {
    const pageInfo = document.getElementById('page-info');
    pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
    
    // 更新按钮状态
    const floatPrevBtn = document.getElementById('float-prev-btn');
    const floatNextBtn = document.getElementById('float-next-btn');
    
    if (floatPrevBtn) floatPrevBtn.disabled = (currentPage === 1);
    if (floatNextBtn) floatNextBtn.disabled = (currentPage === totalPages);
}

// 绑定事件监听器
function bindEventListeners() {
    // 搜索功能
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
    }
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // 当搜索框获得焦点时显示搜索历史记录
        searchInput.addEventListener('focus', function() {
            showSearchHistory();
            recordReadingProgress();
        });
        
        // 当搜索框失去焦点时隐藏搜索历史记录（延迟执行，确保点击历史记录项能正常工作）
        searchInput.addEventListener('blur', function() {
            setTimeout(hideSearchHistory, 200);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // 清除搜索
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearSearch();
        });
    }
    
    // 统计按钮
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', function() {
            showStatsModal();
        });
    }
    
    // 浮动分页按钮
    const floatPrevBtn = document.getElementById('float-prev-btn');
    if (floatPrevBtn) {
        floatPrevBtn.addEventListener('click', function() {
            loadPage(currentPage - 1);
        });
    }
    
    const floatNextBtn = document.getElementById('float-next-btn');
    if (floatNextBtn) {
        floatNextBtn.addEventListener('click', function() {
            loadPage(currentPage + 1);
        });
    }
    
    // 统计弹窗关闭按钮
    const statsModal = document.getElementById('stats-modal');
    if (statsModal) {
        const closeBtn = statsModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                statsModal.classList.add('hidden');
            });
        }
        
        // 点击弹窗外部关闭弹窗
        statsModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    }
    
    // 编辑弹窗相关事件
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        // 关闭按钮事件
        const closeBtn = editModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                editModal.classList.add('hidden');
            });
        }
        
        // 点击弹窗外部关闭弹窗
        editModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
        
        // 取消按钮事件
        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', function() {
                editModal.classList.add('hidden');
            });
        }
        
        // 保存按钮事件
        const saveEditBtn = document.getElementById('save-edit-btn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', saveEditedRecord);
        }
        
        // 添加/移除图片按钮事件
        const addMediaBtn = document.getElementById('add-media-btn');
        if (addMediaBtn) {
            addMediaBtn.addEventListener('click', toggleMediaSelection);
        }
        
        // 图片选择事件
        const mediaFileInput = document.getElementById('edit-media-file');
        if (mediaFileInput) {
            mediaFileInput.addEventListener('change', handleMediaFileSelect);
        }
    }
    
    // 年月导航树相关事件
    const toggleTreeBtn = document.getElementById('toggle-tree');
    if (toggleTreeBtn) {
        toggleTreeBtn.addEventListener('click', toggleYearMonthTree);
    }
    
    // 字体大小调节按钮事件
    const fontButtons = document.querySelectorAll('.font-size-btn');
    fontButtons.forEach(button => {
        button.addEventListener('click', function() {
            const size = this.dataset.size;
            changeFontSize(size);
        });
    });
    
    // 配色方案按钮事件
    const themeButtons = document.querySelectorAll('.color-theme-btn');
    themeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const theme = this.dataset.theme;
            changeTheme(theme);
        });
    });
    
    // 动态绑定编辑和删除按钮
    const tweetsContainer = document.getElementById('tweets-container');
    if (tweetsContainer) {
        tweetsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-btn')) {
                const id = e.target.dataset.id;
                openEditModal(id);
            } else if (e.target.classList.contains('delete-btn')) {
                const id = e.target.dataset.id;
                deleteRecord(id);
            }
        });
    }
    
    // 键盘事件监听器
    document.addEventListener('keydown', function(e) {
        // 只有在不在输入框中时才处理键盘事件
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                // 上一页
                if (currentPage > 1) {
                    loadPage(currentPage - 1);
                }
                break;
            case 'ArrowRight':
            case 'PageDown':
                // 下一页
                if (currentPage < totalPages) {
                    loadPage(currentPage + 1);
                }
                break;
        }
    });
    
    // 页面关闭前记录阅读位置
    window.addEventListener('beforeunload', function() {
        recordReadingProgress();
    });
}

// 执行搜索
function performSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        const keyword = searchInput.value.trim();
        if (keyword) {
            currentSearch = keyword;
            currentPage = 1;
            loadPage(currentPage);
            // 添加搜索历史记录
            addSearchHistory(keyword);
        }
    }
}

// 清除搜索
function clearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    currentSearch = '';
    currentPage = 1;
    
    // 恢复到上次的阅读位置
    restoreReadingProgress();
}

// 显示统计弹窗
function showStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.remove('hidden');
        loadCombinedStats();
    }
}

// 加载综合统计数据
function loadCombinedStats() {
    fetch('/api/stats/combined')
        .then(response => response.json())
        .then(data => {
            renderCombinedStats(data.stats);
        })
        .catch(error => {
            console.error('加载综合统计失败:', error);
        });
}

// 渲染综合统计
function renderCombinedStats(stats) {
    const statsTable = document.getElementById('combined-stats');
    if (!statsTable) return;
    
    const tbody = statsTable.querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let totalRecords = 0;
    let totalChars = 0;
    
    stats.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stat.year}</td>
            <td>${stat.channel || '无'}</td>
            <td>${stat.count}</td>
            <td>${stat.char_count}</td>
        `;
        tbody.appendChild(row);
        
        totalRecords += stat.count;
        totalChars += stat.char_count;
    });
    
    // 添加汇总行
    const tfoot = statsTable.querySelector('tfoot');
    if (tfoot) {
        tfoot.remove();
    }
    
    const newTfoot = document.createElement('tfoot');
    newTfoot.innerHTML = `
        <tr>
            <td colspan="2">总计</td>
            <td>${totalRecords}</td>
            <td>${totalChars}</td>
        </tr>
    `;
    statsTable.appendChild(newTfoot);
}

// 打开编辑模态框
function openEditModal(id) {
    // 获取推文数据
    fetch(`/api/records?page=${currentPage}&pageSize=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            const record = data.records.find(r => r.id == id);
            if (record) {
                // 填充表单数据
                document.getElementById('edit-id').value = record.id;
                document.getElementById('edit-datetime').value = record.datetime || '';
                document.getElementById('edit-content').value = record.content || '';
                document.getElementById('edit-channel').value = record.channel || '';
                document.getElementById('edit-media-type').value = record.media_type || 'text';
                document.getElementById('edit-media-path').value = record.media_path || '';
                
                // 处理媒体类型
                const mediaSelection = document.getElementById('media-selection');
                const addMediaBtn = document.getElementById('add-media-btn');
                const currentMediaPreview = document.getElementById('current-media-preview');
                
                if (record.media_type === 'image') {
                    mediaSelection.style.display = 'block';
                    addMediaBtn.textContent = '移除图片';
                    
                    // 显示当前图片预览
                    if (record.media_path) {
                        // 如果有多个图片，media_path 可能包含多个路径，用逗号分隔
                        const paths = record.media_path.split(',').filter(path => path.trim());
                        if (paths.length > 0) {
                            let imagesHtml = '<div style="margin-top: 10px;"><p>当前图片:</p>';
                            paths.forEach(path => {
                                if (path.trim()) {
                                    imagesHtml += `<img src="${path.trim()}" style="max-width: 200px; height: auto; border-radius: 5px; margin: 5px;" />`;
                                }
                            });
                            imagesHtml += '</div>';
                            currentMediaPreview.innerHTML = imagesHtml;
                        }
                    }
                } else {
                    mediaSelection.style.display = 'none';
                    addMediaBtn.textContent = '添加图片';
                    currentMediaPreview.innerHTML = '';
                }
                
                // 显示模态框
                const editModal = document.getElementById('edit-modal');
                if (editModal) {
                    editModal.classList.remove('hidden');
                }
            }
        })
        .catch(error => {
            console.error('获取推文数据失败:', error);
            alert('获取推文数据时发生错误');
        });
}

// 保存编辑的记录
function saveEditedRecord() {
    const id = document.getElementById('edit-id').value;
    const datetime = document.getElementById('edit-datetime').value;
    const content = document.getElementById('edit-content').value;
    const channel = document.getElementById('edit-channel').value;
    const mediaType = document.getElementById('edit-media-type').value;
    const mediaPath = document.getElementById('edit-media-path').value;
    
    // 发送更新请求
    fetch('/api/records/' + id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ datetime, content, channel, media_type: mediaType, media_path: mediaPath })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 关闭模态框
            const editModal = document.getElementById('edit-modal');
            if (editModal) {
                editModal.classList.add('hidden');
            }
            
            // 重新加载当前页面以显示更新后的数据
            loadPage(currentPage);
        } else {
            alert('保存失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('保存记录失败:', error);
        alert('保存记录时发生错误');
    });
}

// 删除记录
function deleteRecord(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }
    
    fetch('/api/records/' + id, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 重新加载当前页面
            loadPage(currentPage);
        } else {
            alert('删除失败: ' + data.error);
        }
    })
    .catch(error => {
        console.error('删除记录失败:', error);
        alert('删除记录时发生错误');
    });
}

// 记录阅读进度
function recordReadingProgress() {
    // 获取第一个可见的推文元素
    const tweetElements = document.querySelectorAll('.tweet');
    if (tweetElements.length > 0) {
        const firstVisibleTweet = tweetElements[0];
        const lastViewedId = firstVisibleTweet.dataset.id;
        const lastViewedDatetime = new Date().toISOString();
        
        // 发送到后端保存
        fetch('/api/reading-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lastViewedId: parseInt(lastViewedId),
                lastViewedDatetime: lastViewedDatetime
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('记录阅读进度失败:', data.error);
            }
        })
        .catch(error => {
            console.error('记录阅读进度时发生错误:', error);
        });
    }
}

// 恢复阅读进度
function restoreReadingProgress() {
    fetch('/api/reading-progress')
        .then(response => response.json())
        .then(data => {
            if (data.progress && data.progress.last_viewed_id) {
                // 获取该记录所在的页面
                fetch(`/api/record/${data.progress.last_viewed_id}/page?pageSize=${pageSize}`)
                    .then(response => response.json())
                    .then(pageData => {
                        if (pageData.page) {
                            loadPage(pageData.page);
                        }
                    })
                    .catch(error => {
                        console.error('获取记录页面失败:', error);
                    });
            }
        })
        .catch(error => {
            console.error('恢复阅读进度失败:', error);
        });
}

// 加载年月导航树
function loadYearMonthTree() {
    fetch('/api/year-months')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 确保yearMonths存在且为数组
            yearMonthData = (data && data.yearMonths) || [];
            renderYearMonthTree();
        })
        .catch(error => {
            console.error('加载年月数据失败:', error);
            // 即使加载失败也确保yearMonthData为数组
            yearMonthData = [];
            renderYearMonthTree();
        });
}

// 渲染年月导航树
function renderYearMonthTree() {
    const treeList = document.getElementById('year-month-list');
    if (!treeList) return;
    
    // 按年份分组
    const groupedData = {};
    yearMonthData.forEach(item => {
        if (!groupedData[item.year]) {
            groupedData[item.year] = [];
        }
        groupedData[item.year].push(item.month);
    });
    
    // 清空现有内容
    treeList.innerHTML = '';
    
    // 渲染年份和月份（默认折叠状态）
    Object.keys(groupedData).forEach(year => {
        const yearItem = document.createElement('li');
        
        const yearDiv = document.createElement('div');
        yearDiv.className = 'year-item'; // 默认不展开
        yearDiv.textContent = `${year}年`;
        yearDiv.dataset.year = year;
        
        const monthList = document.createElement('ul');
        monthList.className = 'month-list'; // 默认不展开月份列表
        
        groupedData[year].forEach(month => {
            const monthItem = document.createElement('li');
            monthItem.className = 'month-item';
            monthItem.textContent = getMonthName(month);
            monthItem.dataset.year = year;
            monthItem.dataset.month = month;
            monthList.appendChild(monthItem);
        });
        
        yearItem.appendChild(yearDiv);
        yearItem.appendChild(monthList);
        treeList.appendChild(yearItem);
        
        // 绑定年份点击事件
        yearDiv.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('expanded');
            monthList.classList.toggle('expanded');
        });
        
        // 绑定月份点击事件
        monthList.addEventListener('click', function(e) {
            if (e.target.classList.contains('month-item')) {
                const year = e.target.dataset.year;
                const month = e.target.dataset.month;
                navigateToYearMonth(year, month);
            }
        });
    });
}

// 获取月份名称
function getMonthName(month) {
    const monthNames = {
        '01': '一月', '02': '二月', '03': '三月', '04': '四月',
        '05': '五月', '06': '六月', '07': '七月', '08': '八月',
        '09': '九月', '10': '十月', '11': '十一月', '12': '十二月'
    };
    return monthNames[month] || month;
}

// 导航到指定年月
function navigateToYearMonth(year, month) {
    fetch(`/api/year-month/${year}/${month}/page?pageSize=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (data.page) {
                loadPage(data.page);
                // 隐藏导航树
                const tree = document.getElementById('year-month-tree');
                if (tree) {
                    tree.classList.add('collapsed');
                    const toggleBtn = document.getElementById('toggle-tree');
                    if (toggleBtn) {
                        toggleBtn.textContent = '▼';
                    }
                }
            }
        })
        .catch(error => {
            console.error('导航到年月失败:', error);
        });
}

// 切换年月导航树显示/隐藏
function toggleYearMonthTree() {
    const tree = document.getElementById('year-month-tree');
    const toggleBtn = document.getElementById('toggle-tree');
    
    if (tree && toggleBtn) {
        tree.classList.toggle('collapsed');
        toggleBtn.textContent = tree.classList.contains('collapsed') ? '▼' : '▲';
    }
}

// 显示搜索历史记录
function showSearchHistory() {
    const searchHistory = document.getElementById('search-history');
    if (searchHistory) {
        // 获取搜索历史记录
        fetch('/api/search-history')
            .then(response => response.json())
            .then(data => {
                renderSearchHistory(data.history);
                searchHistory.classList.remove('hidden');
            })
            .catch(error => {
                console.error('获取搜索历史记录失败:', error);
            });
    }
}

// 隐藏搜索历史记录
function hideSearchHistory() {
    const searchHistory = document.getElementById('search-history');
    if (searchHistory) {
        searchHistory.classList.add('hidden');
    }
}

// 渲染搜索历史记录
function renderSearchHistory(history) {
    const historyList = document.getElementById('search-history-list');
    if (!historyList) return;
    
    // 清空现有内容
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = '暂无搜索历史';
        emptyItem.style.color = '#999';
        emptyItem.style.textAlign = 'center';
        historyList.appendChild(emptyItem);
        return;
    }
    
    // 渲染历史记录
    history.forEach(item => {
        const listItem = document.createElement('li');
        
        const keywordSpan = document.createElement('span');
        keywordSpan.className = 'keyword';
        keywordSpan.textContent = item.keyword;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = '删除';
        deleteBtn.dataset.keyword = item.keyword;
        
        listItem.appendChild(keywordSpan);
        listItem.appendChild(deleteBtn);
        historyList.appendChild(listItem);
        
        // 绑定点击事件
        keywordSpan.addEventListener('click', function() {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = item.keyword;
                performSearch();
                hideSearchHistory();
            }
        });
        
        // 绑定删除事件
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const keyword = this.dataset.keyword;
            deleteSearchHistory(keyword);
        });
    });
}

// 添加搜索历史记录
function addSearchHistory(keyword) {
    fetch('/api/search-history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('添加搜索历史记录失败:', data.error);
        }
    })
    .catch(error => {
        console.error('添加搜索历史记录时发生错误:', error);
    });
}

// 删除搜索历史记录
function deleteSearchHistory(keyword) {
    fetch(`/api/search-history/${encodeURIComponent(keyword)}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 重新加载搜索历史记录
            showSearchHistory();
        } else {
            console.error('删除搜索历史记录失败:', data.error);
        }
    })
    .catch(error => {
        console.error('删除搜索历史记录时发生错误:', error);
    });
}

// 改变字体大小
function changeFontSize(size) {
    currentFontSize = size;
    
    // 应用字体大小
    applyFontSize();
    
    // 更新按钮激活状态
    updateActiveFontButton();
    
    // 保存到本地存储
    localStorage.setItem('tweetFontSize', size);
}

// 应用字体大小
function applyFontSize() {
    const tweetContents = document.querySelectorAll('.tweet-content');
    tweetContents.forEach(content => {
        // 移除所有字体大小类
        content.classList.remove('font-small', 'font-medium', 'font-large');
        
        // 添加当前字体大小类
        content.classList.add(`font-${currentFontSize}`);
    });
}

// 更新字体大小按钮的激活状态
function updateActiveFontButton() {
    // 移除所有按钮的激活状态
    const fontButtons = document.querySelectorAll('.font-size-btn');
    fontButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 为当前选中的按钮添加激活状态
    const activeButton = document.querySelector(`.font-size-btn[data-size="${currentFontSize}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// 改变主题
function changeTheme(theme) {
    currentTheme = theme;
    
    // 应用主题
    applyTheme();
    
    // 更新按钮激活状态
    updateActiveThemeButton();
    
    // 保存到本地存储
    localStorage.setItem('appTheme', theme);
}

// 应用主题
function applyTheme() {
    // 移除所有主题类
    document.body.classList.remove('theme-white', 'theme-green', 'theme-black');
    
    // 添加当前主题类
    document.body.classList.add(`theme-${currentTheme}`);
}

// 更新主题按钮的激活状态
function updateActiveThemeButton() {
    // 移除所有按钮的激活状态
    const themeButtons = document.querySelectorAll('.color-theme-btn');
    themeButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 为当前选中的按钮添加激活状态
    const activeButton = document.querySelector(`.color-theme-btn[data-theme="${currentTheme}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// 切换媒体选择区域显示
function toggleMediaSelection() {
    const mediaSelection = document.getElementById('media-selection');
    const mediaTypeInput = document.getElementById('edit-media-type');
    const addMediaBtn = document.getElementById('add-media-btn');
    const currentMediaPreview = document.getElementById('current-media-preview');
    
    if (mediaSelection.style.display === 'none' || mediaSelection.style.display === '') {
        // 显示媒体选择区域
        mediaSelection.style.display = 'block';
        mediaTypeInput.value = 'image';
        addMediaBtn.textContent = '移除图片';
        currentMediaPreview.innerHTML = '';
    } else {
        // 隐藏媒体选择区域
        mediaSelection.style.display = 'none';
        mediaTypeInput.value = 'text';
        addMediaBtn.textContent = '添加图片';
        document.getElementById('edit-media-path').value = '';
        document.getElementById('edit-media-file').value = '';
        currentMediaPreview.innerHTML = '';
    }
}

// 处理媒体文件选择
function handleMediaFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 获取已有的媒体路径（例如在编辑已有记录时）
    const existingMediaPath = document.getElementById('edit-media-path').value;
    const mediaPaths = existingMediaPath ? existingMediaPath.split(',').map(path => path.trim()).filter(path => path) : [];

    const previewContainer = document.getElementById('current-media-preview');
    previewContainer.innerHTML = '<div style="margin-top: 10px;"><p>当前及新增图片:</p></div>';

    // 处理所有新选择的文件
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 检查文件类型
        if (!file.type.match('image.*')) {
            alert('请选择图片文件');
            continue;
        }

        // 生成时间戳文件名
        const timestamp = new Date().getTime();
        const extension = file.name.split('.').pop();
        const newFileName = `media_${timestamp}_${i}.${extension}`;
        const mediaPath = `media/${newFileName}`;
        mediaPaths.push(mediaPath);

        // 显示预览
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'max-width: 200px; height: auto; border-radius: 5px; margin: 5px;';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);

        // 实际保存文件到 media 文件夹
        saveMediaFile(file, newFileName);
    }

    // 更新表单中的媒体路径（多个路径用逗号分隔）
    document.getElementById('edit-media-path').value = mediaPaths.join(',');
}

// 实际保存媒体文件到 media 文件夹
function saveMediaFile(file, fileName) {
    // 创建 FormData 对象用于发送文件
    const formData = new FormData();
    formData.append('file', file, fileName);
    
    // 发送到后端保存文件
    fetch('/api/save-media-file', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('保存媒体文件失败:', data.error);
            alert('保存图片失败: ' + data.error);
        } else {
            console.log('文件保存成功:', data.path);
        }
    })
    .catch(error => {
        console.error('保存媒体文件错误:', error);
        alert('保存图片时发生错误');
    });
}
