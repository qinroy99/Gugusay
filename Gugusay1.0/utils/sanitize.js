// HTML转义工具函数

// XSS防护 - 转义HTML特殊字符
const escapeHTML = (str) => {
    if (!str) return str;
    return str.replace(/[&<>"']/g, function (match) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escapeMap[match];
    });
};

// 反转义HTML特殊字符
const unescapeHTML = (str) => {
    if (!str) return str;
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
};

module.exports = {
    escapeHTML,
    unescapeHTML
};