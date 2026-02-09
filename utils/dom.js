// DOM操作工具函数

/**
 * 查询元素
 * @param {string} selector - 选择器
 * @param {Element} context - 上下文元素
 * @returns {Element|null} 返回元素或null
 */
export function query(selector, context = document) {
    return context.querySelector(selector);
}

/**
 * 查询所有元素
 * @param {string} selector - 选择器
 * @param {Element} context - 上下文元素
 * @returns {NodeList} 返回元素列表
 */
export function queryAll(selector, context = document) {
    return context.querySelectorAll(selector);
}

/**
 * 创建元素
 * @param {string} tag - 标签名
 * @param {object} attributes - 属性对象
 * @param {string} content - 内容
 * @returns {Element} 返回创建的元素
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // 设置属性
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            for (const [dataKey, dataValue] of Object.entries(value)) {
                element.dataset[dataKey] = dataValue;
            }
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.substring(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else {
            element.setAttribute(key, value);
        }
    }
    
    // 设置内容
    if (content) {
        element.innerHTML = content;
    }
    
    return element;
}

/**
 * 添加类名
 * @param {Element} element - 元素
 * @param {...string} classNames - 类名
 */
export function addClass(element, ...classNames) {
    if (element && element.classList) {
        element.classList.add(...classNames);
    }
}

/**
 * 移除类名
 * @param {Element} element - 元素
 * @param {...string} classNames - 类名
 */
export function removeClass(element, ...classNames) {
    if (element && element.classList) {
        element.classList.remove(...classNames);
    }
}

/**
 * 切换类名
 * @param {Element} element - 元素
 * @param {string} className - 类名
 * @param {boolean} force - 强制添加或移除
 * @returns {boolean} 返回类名是否存在
 */
export function toggleClass(element, className, force) {
    if (element && element.classList) {
        return element.classList.toggle(className, force);
    }
    return false;
}

/**
 * 检查类名是否存在
 * @param {Element} element - 元素
 * @param {string} className - 类名
 * @returns {boolean} 返回类名是否存在
 */
export function hasClass(element, className) {
    return element && element.classList && element.classList.contains(className);
}

/**
 * 获取元素属性
 * @param {Element} element - 元素
 * @param {string} attribute - 属性名
 * @returns {string|null} 返回属性值
 */
export function getAttribute(element, attribute) {
    return element ? element.getAttribute(attribute) : null;
}

/**
 * 设置元素属性
 * @param {Element} element - 元素
 * @param {string} attribute - 属性名
 * @param {string} value - 属性值
 */
export function setAttribute(element, attribute, value) {
    if (element) {
        element.setAttribute(attribute, value);
    }
}

/**
 * 移除元素属性
 * @param {Element} element - 元素
 * @param {string} attribute - 属性名
 */
export function removeAttribute(element, attribute) {
    if (element) {
        element.removeAttribute(attribute);
    }
}

/**
 * 获取元素数据属性
 * @param {Element} element - 元素
 * @param {string} key - 数据键名
 * @returns {string|null} 返回数据值
 */
export function getData(element, key) {
    return element ? element.dataset[key] : null;
}

/**
 * 设置元素数据属性
 * @param {Element} element - 元素
 * @param {string} key - 数据键名
 * @param {string} value - 数据值
 */
export function setData(element, key, value) {
    if (element) {
        element.dataset[key] = value;
    }
}

/**
 * 显示元素
 * @param {Element} element - 元素
 */
export function show(element) {
    if (element) {
        element.style.display = '';
    }
}

/**
 * 隐藏元素
 * @param {Element} element - 元素
 */
export function hide(element) {
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * 检查元素是否可见
 * @param {Element} element - 元素
 * @returns {boolean} 返回是否可见
 */
export function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * 添加事件监听器
 * @param {Element|Window|Document} target - 目标元素
 * @param {string} event - 事件名
 * @param {Function} handler - 处理函数
 * @param {object} options - 选项
 */
export function on(target, event, handler, options = {}) {
    if (target) {
        target.addEventListener(event, handler, options);
    }
}

/**
 * 移除事件监听器
 * @param {Element|Window|Document} target - 目标元素
 * @param {string} event - 事件名
 * @param {Function} handler - 处理函数
 * @param {object} options - 选项
 */
export function off(target, event, handler, options = {}) {
    if (target) {
        target.removeEventListener(event, handler, options);
    }
}

/**
 * 触发事件
 * @param {Element} element - 元素
 * @param {string} event - 事件名
 * @param {object} detail - 事件详情
 */
export function trigger(element, event, detail = {}) {
    if (element) {
        const customEvent = new CustomEvent(event, { detail });
        element.dispatchEvent(customEvent);
    }
}

/**
 * 滚动到元素
 * @param {Element} element - 元素
 * @param {object} options - 滚动选项
 */
export function scrollToElement(element, options = {}) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            ...options
        });
    }
}

/**
 * 获取元素位置
 * @param {Element} element - 元素
 * @returns {object} 返回位置信息
 */
export function getElementPosition(element) {
    if (!element) return { top: 0, left: 0 };
    
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
        width: rect.width,
        height: rect.height
    };
}

/**
 * 获取元素尺寸
 * @param {Element} element - 元素
 * @returns {object} 返回尺寸信息
 */
export function getElementSize(element) {
    if (!element) return { width: 0, height: 0 };
    
    const rect = element.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height
    };
}

/**
 * 设置元素样式
 * @param {Element} element - 元素
 * @param {object} styles - 样式对象
 */
export function setStyle(element, styles) {
    if (element && styles) {
        Object.assign(element.style, styles);
    }
}

/**
 * 获取元素样式
 * @param {Element} element - 元素
 * @param {string} property - 样式属性
 * @returns {string} 返回样式值
 */
export function getStyle(element, property) {
    if (!element) return '';
    return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * 插入元素
 * @param {Element} element - 要插入的元素
 * @param {Element} target - 目标元素
 * @param {string} position - 插入位置（beforebegin, afterbegin, beforeend, afterend）
 */
export function insertElement(element, target, position = 'beforeend') {
    if (element && target) {
        target.insertAdjacentElement(position, element);
    }
}

/**
 * 插入HTML
 * @param {string} html - HTML字符串
 * @param {Element} target - 目标元素
 * @param {string} position - 插入位置
 */
export function insertHTML(html, target, position = 'beforeend') {
    if (html && target) {
        target.insertAdjacentHTML(position, html);
    }
}

/**
 * 移除元素
 * @param {Element} element - 元素
 */
export function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

/**
 * 清空元素内容
 * @param {Element} element - 元素
 */
export function clearElement(element) {
    if (element) {
        element.innerHTML = '';
    }
}

/**
 * 替换元素
 * @param {Element} newElement - 新元素
 * @param {Element} oldElement - 旧元素
 */
export function replaceElement(newElement, oldElement) {
    if (newElement && oldElement && oldElement.parentNode) {
        oldElement.parentNode.replaceChild(newElement, oldElement);
    }
}

/**
 * 克隆元素
 * @param {Element} element - 元素
 * @param {boolean} deep - 是否深度克隆
 * @returns {Element} 返回克隆的元素
 */
export function cloneElement(element, deep = true) {
    return element ? element.cloneNode(deep) : null;
}

/**
 * 检查元素是否包含另一个元素
 * @param {Element} parent - 父元素
 * @param {Element} child - 子元素
 * @returns {boolean} 返回是否包含
 */
export function contains(parent, child) {
    return parent && child && parent.contains(child);
}

/**
 * 获取元素文本内容
 * @param {Element} element - 元素
 * @returns {string} 返回文本内容
 */
export function getText(element) {
    return element ? element.textContent : '';
}

/**
 * 设置元素文本内容
 * @param {Element} element - 元素
 * @param {string} text - 文本内容
 */
export function setText(element, text) {
    if (element) {
        element.textContent = text;
    }
}

/**
 * 获取元素HTML内容
 * @param {Element} element - 元素
 * @returns {string} 返回HTML内容
 */
export function getHTML(element) {
    return element ? element.innerHTML : '';
}

/**
 * 设置元素HTML内容
 * @param {Element} element - 元素
 * @param {string} html - HTML内容
 */
export function setHTML(element, html) {
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * 焦点管理
 */
export const focus = {
    /**
     * 设置焦点
     * @param {Element} element - 元素
     */
    set(element) {
        if (element) {
            element.focus();
        }
    },
    
    /**
     * 移除焦点
     */
    blur() {
        if (document.activeElement) {
            document.activeElement.blur();
        }
    },
    
    /**
     * 检查是否有焦点
     * @param {Element} element - 元素
     * @returns {boolean} 返回是否有焦点
     */
    has(element) {
        return document.activeElement === element;
    }
};

export default {
    query,
    queryAll,
    createElement,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    getAttribute,
    setAttribute,
    removeAttribute,
    getData,
    setData,
    show,
    hide,
    isVisible,
    on,
    off,
    trigger,
    scrollToElement,
    getElementPosition,
    getElementSize,
    setStyle,
    getStyle,
    insertElement,
    insertHTML,
    removeElement,
    clearElement,
    replaceElement,
    cloneElement,
    contains,
    getText,
    setText,
    getHTML,
    setHTML,
    focus
};
