// 导航树模块
import { loadPage } from './pageLoader.js';
import { globalState } from './globalState.js';

let yearMonthData = []; // 存储年月数据
let channelData = []; // 存储渠道数据
const pageSize = 6;
let isNavigationTreeLoaded = false; // 防止重复加载

/**
 * 加载导航树
 */
export function loadNavigationTree() {
    // 防止重复加载
    if (isNavigationTreeLoaded) {
        console.log('导航树已加载，跳过重复加载');
        return;
    }
    
    isNavigationTreeLoaded = true;
    
    // 使用setTimeout延迟加载，不阻塞页面显示
    setTimeout(() => {
        // 并行加载年月数据和渠道数据
        const yearMonthsPromise = fetch('/api/year-months')
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
        
        const channelsPromise = fetch('/api/channels')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // 确保channels存在且为数组
                channelData = (data && data.channels) || [];
                renderChannelTree();
            })
            .catch(error => {
                console.error('加载渠道数据失败:', error);
                // 即使加载失败也确保channelData为数组
                channelData = [];
                renderChannelTree();
            });
        
        // 等待两个请求都完成
        Promise.all([yearMonthsPromise, channelsPromise])
            .then(() => {
                console.log('导航树数据加载完成');
            })
            .catch(error => {
                console.error('导航树数据加载出错:', error);
            });
    }, 200); // 延迟200ms加载，让页面先显示
}

/**
 * 渲染年月导航树
 */
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

/**
 * 渲染渠道导航树
 */
function renderChannelTree() {
    const treeList = document.getElementById('channel-list');
    if (!treeList) return;

    // 清空现有内容（这会移除所有子元素和事件监听器）
    treeList.innerHTML = '';

    // 使用文档片段提高性能
    const fragment = document.createDocumentFragment();

    // 渲染渠道
    channelData.forEach(channel => {
        const channelItem = document.createElement('li');
        channelItem.className = 'channel-item';
        channelItem.textContent = channel.channel || '无渠道';
        channelItem.dataset.channel = channel.channel || '';
        fragment.appendChild(channelItem);

        // 绑定渠道点击事件
        channelItem.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            e.preventDefault(); // 阻止默认行为
            const channel = this.dataset.channel;
            console.log('点击渠道:', channel);
            navigateToChannel(channel);
        });
    });

    // 一次性添加所有渠道项
    treeList.appendChild(fragment);
    
    // 渲染设置选项
    renderSettingsOption();
}

/**
 * 获取月份名称
 */
function getMonthName(month) {
    const monthNames = {
        '01': '一月', '02': '二月', '03': '三月', '04': '四月',
        '05': '五月', '06': '六月', '07': '七月', '08': '八月',
        '09': '九月', '10': '十月', '11': '十一月', '12': '十二月'
    };
    return monthNames[month] || month;
}

/**
 * 导航到指定年月
 */
function navigateToYearMonth(year, month) {
    // 设置当前年月、渠道和搜索状态
    globalState.currentYearMonth = `${year}-${month}`;
    globalState.currentChannel = null;
    globalState.currentSearch = '';
    
    // 同步到window对象
    if (typeof window !== 'undefined') {
        window.currentYearMonth = globalState.currentYearMonth;
        window.currentChannel = globalState.currentChannel;
        window.currentSearch = globalState.currentSearch;
    }
    
    fetch(`/api/year-month/${year}/${month}/page?pageSize=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (data.page) {
                // 使用导入的loadPage函数加载页面
                loadPage(data.page);
                
                // 隐藏时光机
                const tree = document.getElementById('navigation-tree');
                if (tree) {
                    tree.classList.add('collapsed');
                    const toggleBtn = document.getElementById('toggle-tree');
                    if (toggleBtn) {
                        toggleBtn.innerHTML = '时光机';
                    }
                }
            }
        })
        .catch(error => {
            console.error('导航到年月失败:', error);
        });
}

/**
 * 导航到指定渠道
 */
function navigateToChannel(channel) {
    console.log('navigateToChannel被调用, 渠道:', channel);
    
    // 使用和年月导航相同的页面跳转方式，定位到该渠道的最早推文页面
    const channelParam = channel || '';
    const apiUrl = `/api/channel/${encodeURIComponent(channelParam)}/page?pageSize=${pageSize}`;
    console.log('请求渠道页码API:', apiUrl);
    
    fetch(apiUrl)
        .then(response => {
            console.log('渠道页码API响应状态:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('渠道页码API返回:', data);
            if (data.page) {
                console.log('准备调用loadPage, 页码:', data.page);
                
                // 设置当前渠道、年月和搜索状态
                globalState.currentChannel = channel || null;
                globalState.currentYearMonth = null;
                globalState.currentSearch = '';
                
                // 同步到window对象
                if (typeof window !== 'undefined') {
                    window.currentChannel = globalState.currentChannel;
                    window.currentYearMonth = globalState.currentYearMonth;
                    window.currentSearch = globalState.currentSearch;
                }
                
                console.log('设置globalState.currentChannel为:', globalState.currentChannel);
                
                // 使用导入的loadPage函数加载页面
                loadPage(data.page);
                
                // 隐藏时光机
                const tree = document.getElementById('navigation-tree');
                if (tree) {
                    tree.classList.add('collapsed');
                    const toggleBtn = document.getElementById('toggle-tree');
                    if (toggleBtn) {
                        toggleBtn.innerHTML = '时光机';
                    }
                }
            } else {
                console.error('渠道页码API返回的数据中没有page字段:', data);
            }
        })
        .catch(error => {
            console.error('导航到渠道失败:', error);
        });
}

/**
 * 切换时光机显示/隐藏
 */
export function toggleNavigationTree() {
    const tree = document.getElementById('navigation-tree');
    const toggleBtn = document.getElementById('toggle-tree');

    if (tree && toggleBtn) {
        tree.classList.toggle('collapsed');
        toggleBtn.innerHTML = tree.classList.contains('collapsed') ? '时光机▼' : '时光机▲';
    }
}

/**
 * 渲染设置选项
 */
function renderSettingsOption() {
    const treeList = document.getElementById('channel-list');
    if (!treeList) return;
    
    // 添加分隔线
    const divider = document.createElement('li');
    divider.className = 'channel-divider';
    divider.innerHTML = '<hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">';
    treeList.appendChild(divider);
    
    // 添加设置选项
    const settingsItem = document.createElement('li');
    settingsItem.className = 'channel-item settings-item';
    settingsItem.innerHTML = '⚙️ 设置';
    settingsItem.style.fontWeight = 'bold';
    settingsItem.style.cursor = 'pointer';
    settingsItem.style.color = '#1da1f2';
    
    settingsItem.addEventListener('click', function(e) {
        e.stopPropagation();
        // 导入并显示设置面板
        import('./settings.js').then(module => {
            module.showSettingsPanel();
        });
    });
    
    treeList.appendChild(settingsItem);
}

// 导出函数
export default {
    loadNavigationTree,
    toggleNavigationTree
};