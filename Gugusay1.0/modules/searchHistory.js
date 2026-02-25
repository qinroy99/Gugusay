// 搜索历史记录模块
import { performSearch } from './search.js';

/**
 * 显示搜索历史记录
 */
export function showSearchHistory() {
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

/**
 * 隐藏搜索历史记录
 */
export function hideSearchHistory() {
    const searchHistory = document.getElementById('search-history');
    if (searchHistory) {
        searchHistory.classList.add('hidden');
    }
}

/**
 * 渲染搜索历史记录
 */
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
                // 使用导入的搜索函数
                performSearch();
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

/**
 * 添加搜索历史记录
 */
export function addSearchHistory(keyword) {
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

/**
 * 删除搜索历史记录
 */
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

// 导出所有函数
export default {
    showSearchHistory,
    hideSearchHistory,
    addSearchHistory
};