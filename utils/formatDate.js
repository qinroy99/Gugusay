// 日期格式化工具函数

// 格式化日期为 YYYY-MM-DD HH:MM:SS 格式
const formatDateTime = (date) => {
    if (!date) return '';
    
    // 如果是字符串，尝试解析为日期对象
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // 如果不是有效日期，返回空字符串
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 格式化日期为 YYYY-MM-DD 格式
const formatDate = (date) => {
    if (!date) return '';
    
    // 如果是字符串，尝试解析为日期对象
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // 如果不是有效日期，返回空字符串
    if (!(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

module.exports = {
    formatDateTime,
    formatDate
};