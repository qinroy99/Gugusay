// 统计功能模块

/**
 * 显示统计弹窗
 */
export function showStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.remove('hidden');
        loadCombinedStats();
        
        // 添加关闭事件监听器
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            // 移除之前可能添加的事件监听器，避免重复绑定
            closeBtn.removeEventListener('click', closeStatsModal);
            // 添加新的关闭事件监听器
            closeBtn.addEventListener('click', closeStatsModal);
        }
        
        // 点击弹窗外部关闭弹窗
        modal.removeEventListener('click', handleStatsModalClick);
        modal.addEventListener('click', handleStatsModalClick);
    }
}

/**
 * 关闭统计弹窗
 */
function closeStatsModal() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * 处理点击统计弹窗事件
 */
function handleStatsModalClick(e) {
    const modal = document.getElementById('stats-modal');
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
}

/**
 * 加载综合统计数据
 */
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

/**
 * 渲染综合统计
 */
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

// 导出函数
export default {
    showStatsModal
};