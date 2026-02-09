// API调用工具模块
import { globalState } from '../modules/globalState.js';

/**
 * API基础配置
 */
const API_BASE = '/api';

/**
 * 通用API请求函数
 * @param {string} endpoint - API端点
 * @param {object} options - 请求选项
 * @returns {Promise} 返回Promise对象
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API请求失败 [${endpoint}]:`, error);
        throw error;
    }
}

/**
 * 获取记录列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页大小
 * @param {string} search - 搜索关键词
 * @param {string} channel - 渠道
 * @param {string} yearMonth - 年月
 * @returns {Promise} 返回记录列表
 */
export async function getRecords(page, pageSize, search = '', channel = '', yearMonth = '') {
    let url = `/records?page=${page}&pageSize=${pageSize}`;
    
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    if (channel !== null && channel !== undefined) {
        url += `&channel=${encodeURIComponent(channel)}`;
    }
    if (yearMonth) {
        url += `&yearMonth=${encodeURIComponent(yearMonth)}`;
    }
    
    return apiRequest(url);
}

/**
 * 获取单条记录
 * @param {number} recordId - 记录ID
 * @returns {Promise} 返回记录详情
 */
export async function getRecord(recordId) {
    return apiRequest(`/records/${recordId}`);
}

/**
 * 添加记录
 * @param {object} data - 记录数据
 * @returns {Promise} 返回操作结果
 */
export async function addRecord(data) {
    return apiRequest('/records', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * 更新记录
 * @param {number} recordId - 记录ID
 * @param {object} data - 记录数据
 * @returns {Promise} 返回操作结果
 */
export async function updateRecord(recordId, data) {
    return apiRequest(`/records/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * 删除记录
 * @param {number} recordId - 记录ID
 * @returns {Promise} 返回操作结果
 */
export async function deleteRecord(recordId) {
    return apiRequest(`/records/${recordId}`, {
        method: 'DELETE'
    });
}

/**
 * 搜索记录
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @param {number} pageSize - 每页大小
 * @returns {Promise} 返回搜索结果
 */
export async function searchRecords(keyword, page, pageSize) {
    return apiRequest(`/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`);
}

/**
 * 获取那年今日的记录
 * @param {string} keyword - 月日（格式：MM-DD）
 * @param {number} page - 页码
 * @param {number} pageSize - 每页大小
 * @returns {Promise} 返回那年今日的记录
 */
export async function getOnThisDay(keyword, page, pageSize) {
    return apiRequest(`/on-this-day?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`);
}

/**
 * 获取年月树
 * @returns {Promise} 返回年月树数据
 */
export async function getYearMonthTree() {
    return apiRequest('/year-months');
}

/**
 * 获取渠道列表
 * @returns {Promise} 返回渠道列表
 */
export async function getChannels() {
    return apiRequest('/channels');
}

/**
 * 获取总记录数
 * @returns {Promise} 返回总记录数和总页数
 */
export async function getTotalCount() {
    return apiRequest('/total-count');
}

/**
 * 获取最新记录页
 * @param {number} pageSize - 每页大小
 * @returns {Promise} 返回最新记录页码
 */
export async function getLatestRecordPage(pageSize) {
    return apiRequest(`/latest-page?pageSize=${pageSize}`);
}

/**
 * 获取年月页
 * @param {string} year - 年份
 * @param {string} month - 月份
 * @param {number} pageSize - 每页大小
 * @returns {Promise} 返回年月页码
 */
export async function getYearMonthPage(year, month, pageSize) {
    return apiRequest(`/year-month/${year}/${month}?pageSize=${pageSize}`);
}

/**
 * 获取渠道页
 * @param {string} channel - 渠道名称
 * @param {number} pageSize - 每页大小
 * @returns {Promise} 返回渠道页码
 */
export async function getChannelPage(channel, pageSize) {
    return apiRequest(`/channel/${encodeURIComponent(channel)}?pageSize=${pageSize}`);
}

/**
 * 获取记录页
 * @param {number} recordId - 记录ID
 * @param {number} pageSize - 每页大小
 * @returns {Promise} 返回记录页码
 */
export async function getRecordPage(recordId, pageSize) {
    return apiRequest(`/record/${recordId}?pageSize=${pageSize}`);
}

/**
 * 获取摘要统计
 * @returns {Promise} 返回摘要统计数据
 */
export async function getSummaryStats() {
    return apiRequest('/stats/summary');
}

/**
 * 获取组合统计
 * @returns {Promise} 返回组合统计数据
 */
export async function getCombinedStats() {
    return apiRequest('/stats/combined');
}

/**
 * 获取阅读进度
 * @returns {Promise} 返回阅读进度
 */
export async function getReadingProgress() {
    return apiRequest('/progress', {
        method: 'GET'
    });
}

/**
 * 更新阅读进度
 * @param {number} lastViewedId - 最后查看的记录ID
 * @param {string} lastViewedDatetime - 最后查看的日期时间
 * @returns {Promise} 返回操作结果
 */
export async function updateReadingProgress(lastViewedId, lastViewedDatetime) {
    return apiRequest('/progress', {
        method: 'POST',
        body: JSON.stringify({
            lastViewedId: lastViewedId,
            lastViewedDatetime: lastViewedDatetime
        })
    });
}

/**
 * 获取搜索历史
 * @returns {Promise} 返回搜索历史
 */
export async function getSearchHistory() {
    return apiRequest('/search-history', {
        method: 'GET'
    });
}

/**
 * 添加搜索历史
 * @param {string} keyword - 搜索关键词
 * @returns {Promise} 返回操作结果
 */
export async function addSearchHistory(keyword) {
    return apiRequest('/search-history', {
        method: 'POST',
        body: JSON.stringify({ keyword: keyword })
    });
}

/**
 * 删除搜索历史
 * @param {string} keyword - 搜索关键词
 * @returns {Promise} 返回操作结果
 */
export async function deleteSearchHistory(keyword) {
    return apiRequest(`/search-history/${encodeURIComponent(keyword)}`, {
        method: 'DELETE'
    });
}

/**
 * 保存媒体文件
 * @param {FormData} formData - 表单数据
 * @returns {Promise} 返回操作结果
 */
export async function saveMediaFile(formData) {
    try {
        const response = await fetch('/api/save-media-file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('保存媒体文件失败:', error);
        throw error;
    }
}

/**
 * 计算总页数（前端计算）
 * @param {number} totalRecords - 总记录数
 * @param {number} pageSize - 每页大小
 * @returns {number} 返回总页数
 */
export function calculateTotalPages(totalRecords, pageSize) {
    return Math.ceil(totalRecords / pageSize);
}

/**
 * 格式化记录数据（前端处理）
 * @param {Array} records - 原始记录数据
 * @returns {Array} 返回格式化后的记录数据
 */
export function formatRecords(records) {
    return records.map(record => ({
        id: record.id,
        datetime: record.datetime,
        content: record.content,
        channel: record.channel,
        media_type: record.media_type,
        media_path: record.media_path,
        page: record.page || 1
    }));
}

export default {
    apiRequest,
    getRecords,
    getRecord,
    addRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
    getOnThisDay,
    getYearMonthTree,
    getChannels,
    getTotalCount,
    getLatestRecordPage,
    getYearMonthPage,
    getChannelPage,
    getRecordPage,
    getSummaryStats,
    getCombinedStats,
    getReadingProgress,
    updateReadingProgress,
    getSearchHistory,
    addSearchHistory,
    deleteSearchHistory,
    saveMediaFile,
    calculateTotalPages,
    formatRecords
};
