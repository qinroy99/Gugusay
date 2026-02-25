// 全局变量和状态管理模块
export const globalState = {
    currentPage: 1,
    totalPages: 1,
    currentSearch: '',
    currentChannel: null,
    currentYearMonth: null,  // 添加年月过滤状态
    totalRecords: 0,
    pageSize: 6,
    currentEditId: null,
    yearMonthData: [],
    currentFontSize: 'medium',
    currentTheme: 'white',
    searchDebounceTimer: null,
    isAdvancedSearchSidebarOpen: false,
    SEARCH_DEBOUNCE_TIME: 300
};

// 确保全局变量在window对象上可用
if (typeof window !== 'undefined') {
    window.currentChannel = window.currentChannel || null;
    window.currentSearch = window.currentSearch || '';
    window.currentYearMonth = window.currentYearMonth || null;
    
    // 创建getter和setter以保持同步
    Object.defineProperty(window, 'currentChannel', {
        get: function() {
            return globalState.currentChannel;
        },
        set: function(value) {
            globalState.currentChannel = value;
        }
    });
    
    Object.defineProperty(window, 'currentSearch', {
        get: function() {
            return globalState.currentSearch;
        },
        set: function(value) {
            globalState.currentSearch = value;
        }
    });
    
    Object.defineProperty(window, 'currentYearMonth', {
        get: function() {
            return globalState.currentYearMonth;
        },
        set: function(value) {
            globalState.currentYearMonth = value;
        }
    });
}

// 前端缓存
export const frontendCache = {
    data: new Map(),
    ttl: 5 * 60 * 1000, // 5分钟缓存时间
    
    set: function(key, value) {
        const item = {
            value: value,
            timestamp: Date.now()
        };
        this.data.set(key, item);
    },
    
    get: function(key) {
        const item = this.data.get(key);
        if (!item) {
            return null;
        }
        
        // 检查是否过期
        if (Date.now() - item.timestamp > this.ttl) {
            this.data.delete(key);
            return null;
        }
        
        return item.value;
    },
    
    clear: function() {
        this.data.clear();
        console.log('前端缓存已清除');
    }
};

// 清除前端缓存
export function clearFrontendCache() {
    frontendCache.clear();
}

// 导出全局状态
export default globalState;
