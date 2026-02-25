// 通用辅助工具函数

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 返回防抖后的函数
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 返回节流后的函数
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 格式化日期时间
 * @param {string} datetime - 日期时间字符串
 * @param {string} format - 格式化模板
 * @returns {string} 返回格式化后的日期时间
 */
export function formatDateTime(datetime, format = 'YYYY-MM-DD HH:mm') {
    if (!datetime) return '';
    
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return datetime;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 解析日期时间
 * @param {string} datetime - 日期时间字符串
 * @returns {Date} 返回Date对象
 */
export function parseDateTime(datetime) {
    if (!datetime) return null;
    
    // 尝试解析各种格式
    const formats = [
        /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/,
        /^(\d{4})-(\d{2})-(\d{2})$/,
        /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/
    ];
    
    for (const format of formats) {
        const match = datetime.match(format);
        if (match) {
            const [, year, month, day, hours = 0, minutes = 0] = match;
            return new Date(year, month - 1, day, hours, minutes);
        }
    }
    
    return new Date(datetime);
}

/**
 * 检查是否是有效的日期时间
 * @param {string} datetime - 日期时间字符串
 * @returns {boolean} 返回是否有效
 */
export function isValidDateTime(datetime) {
    if (!datetime) return false;
    
    const date = parseDateTime(datetime);
    return date && !isNaN(date.getTime());
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 返回格式化后的文件大小
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 返回文件扩展名
 */
export function getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * 检查是否是图片文件
 * @param {string} filename - 文件名
 * @returns {boolean} 返回是否是图片
 */
export function isImageFile(filename) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const ext = getFileExtension(filename);
    return imageExtensions.includes(ext);
}

/**
 * 检查是否是视频文件
 * @param {string} filename - 文件名
 * @returns {boolean} 返回是否是视频
 */
export function isVideoFile(filename) {
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
    const ext = getFileExtension(filename);
    return videoExtensions.includes(ext);
}

/**
 * 截断文本
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀（默认为...）
 * @returns {string} 返回截断后的文本
 */
export function truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 转义HTML
 * @param {string} text - 文本
 * @returns {string} 返回转义后的HTML
 */
export function escapeHtml(text) {
    if (!text) return '';
    
    const map = {
        '&': '&',
        '<': '<',
        '>': '>',
        '"': '"',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 高亮搜索关键词
 * @param {string} text - 文本
 * @param {string} keyword - 关键词
 * @returns {string} 返回高亮后的HTML
 */
export function highlightKeyword(text, keyword) {
    if (!text || !keyword) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const escapedKeyword = escapeHtml(keyword);
    
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return escapedText.replace(regex, '<mark>$1</mark>');
}

/**
 * 深度克隆对象
 * @param {object} obj - 对象
 * @returns {object} 返回克隆后的对象
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 合并对象
 * @param {object} target - 目标对象
 * @param {...object} sources - 源对象
 * @returns {object} 返回合并后的对象
 */
export function mergeObjects(target, ...sources) {
    if (!target || typeof target !== 'object') return {};
    
    const result = { ...target };
    
    for (const source of sources) {
        if (source && typeof source === 'object') {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                        result[key] = mergeObjects(result[key] || {}, source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
        }
    }
    
    return result;
}

/**
 * 生成唯一ID
 * @returns {string} 返回唯一ID
 */
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 延迟执行
 * @param {number} ms - 延迟时间（毫秒）
 * @returns {Promise} 返回Promise对象
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 * @param {Function} func - 要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise} 返回Promise对象
 */
export async function retry(func, maxRetries = 3, delayMs = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await func();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await delay(delayMs);
            }
        }
    }
    
    throw lastError;
}

/**
 * 本地存储工具
 */
export const storage = {
    /**
     * 设置本地存储
     * @param {string} key - 键
     * @param {any} value - 值
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('设置本地存储失败:', error);
        }
    },
    
    /**
     * 获取本地存储
     * @param {string} key - 键
     * @param {any} defaultValue - 默认值
     * @returns {any} 返回存储的值
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('获取本地存储失败:', error);
            return defaultValue;
        }
    },
    
    /**
     * 删除本地存储
     * @param {string} key - 键
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('删除本地存储失败:', error);
        }
    },
    
    /**
     * 清空本地存储
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('清空本地存储失败:', error);
        }
    }
};

export default {
    debounce,
    throttle,
    formatDateTime,
    parseDateTime,
    isValidDateTime,
    formatFileSize,
    getFileExtension,
    isImageFile,
    isVideoFile,
    truncateText,
    escapeHtml,
    highlightKeyword,
    deepClone,
    mergeObjects,
    generateUniqueId,
    delay,
    retry,
    storage
};
