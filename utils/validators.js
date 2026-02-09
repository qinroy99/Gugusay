// 验证工具函数

/**
 * 验证是否为空
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为空
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * 验证是否为非空
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为非空
 */
export function isNotEmpty(value) {
    return !isEmpty(value);
}

/**
 * 验证是否为数字
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为数字
 */
export function isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
}

/**
 * 验证是否为整数
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为整数
 */
export function isInteger(value) {
    return Number.isInteger(value);
}

/**
 * 验证是否为正数
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为正数
 */
export function isPositive(value) {
    return isNumber(value) && value > 0;
}

/**
 * 验证是否为负数
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为负数
 */
export function isNegative(value) {
    return isNumber(value) && value < 0;
}

/**
 * 验证是否为字符串
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为字符串
 */
export function isString(value) {
    return typeof value === 'string';
}

/**
 * 验证是否为布尔值
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为布尔值
 */
export function isBoolean(value) {
    return typeof value === 'boolean';
}

/**
 * 验证是否为数组
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为数组
 */
export function isArray(value) {
    return Array.isArray(value);
}

/**
 * 验证是否为对象
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为对象
 */
export function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 验证是否为函数
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为函数
 */
export function isFunction(value) {
    return typeof value === 'function';
}

/**
 * 验证是否为日期
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为日期
 */
export function isDate(value) {
    return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 验证是否为有效的日期时间字符串
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的日期时间字符串
 */
export function isValidDateString(value) {
    if (!isString(value)) return false;
    
    // 检查各种日期时间格式
    const patterns = [
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,  // YYYY-MM-DD HH:mm
        /^\d{4}-\d{2}-\d{2}$/,               // YYYY-MM-DD
        /^\d{4}\d{2}\d{2}\d{2}\d{2}$/       // YYYYMMDDHHmm
    ];
    
    return patterns.some(pattern => pattern.test(value));
}

/**
 * 验证是否为有效的日期时间格式（YYYY-MM-DD HH:mm）
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的日期时间格式
 */
export function isValidDateTimeFormat(value) {
    if (!isString(value)) return false;
    const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    return pattern.test(value);
}

/**
 * 验证是否为有效的日期格式（YYYY-MM-DD）
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的日期格式
 */
export function isValidDateFormat(value) {
    if (!isString(value)) return false;
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    return pattern.test(value);
}

/**
 * 验证是否为有效的年月格式（YYYY-MM）
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的年月格式
 */
export function isValidYearMonthFormat(value) {
    if (!isString(value)) return false;
    const pattern = /^\d{4}-\d{2}$/;
    if (!pattern.test(value)) return false;
    
    const [year, month] = value.split('-').map(Number);
    return year >= 1900 && year <= 2100 && month >= 1 && month <= 12;
}

/**
 * 验证是否为有效的月日格式（MM-DD）
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的月日格式
 */
export function isValidMonthDayFormat(value) {
    if (!isString(value)) return false;
    const pattern = /^\d{2}-\d{2}$/;
    if (!pattern.test(value)) return false;
    
    const [month, day] = value.split('-').map(Number);
    return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/**
 * 验证是否为有效的邮箱地址
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的邮箱地址
 */
export function isValidEmail(value) {
    if (!isString(value)) return false;
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value);
}

/**
 * 验证是否为有效的URL
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的URL
 */
export function isValidUrl(value) {
    if (!isString(value)) return false;
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * 验证是否为有效的手机号（中国大陆）
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的手机号
 */
export function isValidPhoneNumber(value) {
    if (!isString(value)) return false;
    const pattern = /^1[3-9]\d{9}$/;
    return pattern.test(value);
}

/**
 * 验证是否为有效的IP地址
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的IP地址
 */
export function isValidIpAddress(value) {
    if (!isString(value)) return false;
    const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!pattern.test(value)) return false;
    
    const parts = value.split('.');
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
    });
}

/**
 * 验证是否为有效的端口号
 * @param {any} value - 要验证的值
 * @returns {boolean} 返回是否为有效的端口号
 */
export function isValidPort(value) {
    const port = parseInt(value, 10);
    return isInteger(port) && port >= 0 && port <= 65535;
}

/**
 * 验证字符串长度
 * @param {string} value - 要验证的值
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @returns {boolean} 返回是否在长度范围内
 */
export function isValidLength(value, min = 0, max = Infinity) {
    if (!isString(value)) return false;
    return value.length >= min && value.length <= max;
}

/**
 * 验证数字范围
 * @param {number} value - 要验证的值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 返回是否在范围内
 */
export function isValidRange(value, min = -Infinity, max = Infinity) {
    if (!isNumber(value)) return false;
    return value >= min && value <= max;
}

/**
 * 验证是否为有效的文件名
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的文件名
 */
export function isValidFileName(value) {
    if (!isString(value)) return false;
    // Windows和Linux不允许的字符
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    return !invalidChars.test(value) && value.length > 0 && value.length <= 255;
}

/**
 * 验证是否为有效的文件扩展名
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的文件扩展名
 */
export function isValidFileExtension(value) {
    if (!isString(value)) return false;
    const pattern = /^\.[a-zA-Z0-9]{1,10}$/;
    return pattern.test(value);
}

/**
 * 验证是否为有效的图片文件扩展名
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的图片文件扩展名
 */
export function isValidImageExtension(value) {
    if (!isString(value)) return false;
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return validExtensions.includes(value.toLowerCase());
}

/**
 * 验证是否为有效的视频文件扩展名
 * @param {string} value - 要验证的值
 * @returns {boolean} 返回是否为有效的视频文件扩展名
 */
export function isValidVideoExtension(value) {
    if (!isString(value)) return false;
    const validExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return validExtensions.includes(value.toLowerCase());
}

/**
 * 验证记录数据
 * @param {object} data - 记录数据
 * @returns {object} 返回验证结果 {valid: boolean, errors: string[]}
 */
export function validateRecord(data) {
    const errors = [];
    
    // 验证datetime
    if (!data.datetime || !isValidDateTimeFormat(data.datetime)) {
        errors.push('日期时间格式无效，应为 YYYY-MM-DD HH:mm');
    }
    
    // 验证content
    if (!data.content || isEmpty(data.content)) {
        errors.push('内容不能为空');
    }
    
    // 验证channel（可选）
    if (data.channel !== undefined && data.channel !== null && !isString(data.channel)) {
        errors.push('渠道必须为字符串');
    }
    
    // 验证media_type（可选）
    if (data.media_type !== undefined && data.media_type !== null) {
        const validMediaTypes = ['text', 'image', 'video'];
        if (!validMediaTypes.includes(data.media_type)) {
            errors.push('媒体类型无效，应为 text、image 或 video');
        }
    }
    
    // 验证media_path（可选）
    if (data.media_path !== undefined && data.media_path !== null && !isString(data.media_path)) {
        errors.push('媒体路径必须为字符串');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 验证搜索参数
 * @param {object} params - 搜索参数
 * @returns {object} 返回验证结果 {valid: boolean, errors: string[]}
 */
export function validateSearchParams(params) {
    const errors = [];
    
    // 验证page
    if (params.page !== undefined && !isPositive(params.page)) {
        errors.push('页码必须为正整数');
    }
    
    // 验证pageSize
    if (params.pageSize !== undefined && !isPositive(params.pageSize)) {
        errors.push('每页大小必须为正整数');
    }
    
    // 验证keyword（可选）
    if (params.keyword !== undefined && params.keyword !== null && !isString(params.keyword)) {
        errors.push('搜索关键词必须为字符串');
    }
    
    // 验证channel（可选）
    if (params.channel !== undefined && params.channel !== null && !isString(params.channel)) {
        errors.push('渠道必须为字符串');
    }
    
    // 验证yearMonth（可选）
    if (params.yearMonth !== undefined && params.yearMonth !== null && !isValidYearMonthFormat(params.yearMonth)) {
        errors.push('年月格式无效，应为 YYYY-MM');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * 验证分页参数
 * @param {object} params - 分页参数
 * @returns {object} 返回验证结果 {valid: boolean, errors: string[]}
 */
export function validatePaginationParams(params) {
    const errors = [];
    
    // 验证page
    if (!params.page || !isPositive(params.page)) {
        errors.push('页码必须为正整数');
    }
    
    // 验证pageSize
    if (!params.pageSize || !isPositive(params.pageSize)) {
        errors.push('每页大小必须为正整数');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

export default {
    isEmpty,
    isNotEmpty,
    isNumber,
    isInteger,
    isPositive,
    isNegative,
    isString,
    isBoolean,
    isArray,
    isObject,
    isFunction,
    isDate,
    isValidDateString,
    isValidDateTimeFormat,
    isValidDateFormat,
    isValidYearMonthFormat,
    isValidMonthDayFormat,
    isValidEmail,
    isValidUrl,
    isValidPhoneNumber,
    isValidIpAddress,
    isValidPort,
    isValidLength,
    isValidRange,
    isValidFileName,
    isValidFileExtension,
    isValidImageExtension,
    isValidVideoExtension,
    validateRecord,
    validateSearchParams,
    validatePaginationParams
};
