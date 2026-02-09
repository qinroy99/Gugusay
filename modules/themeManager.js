// 字体和主题管理模块
import { globalState } from './globalState.js';

// 初始化字体大小
export function initFontSize() {
    // 从本地存储获取上次选择的字体大小
    const savedFontSize = localStorage.getItem('tweetFontSize');
    if (savedFontSize) {
        globalState.currentFontSize = savedFontSize;
    }
    
    // 应用字体大小
    applyFontSize();
    
    // 更新按钮激活状态
    updateActiveFontButton();
}

// 初始化主题
export function initTheme() {
    // 从本地存储获取上次选择的主题
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
        globalState.currentTheme = savedTheme;
    }
    
    // 应用主题
    applyTheme();
    
    // 更新按钮激活状态
    updateActiveThemeButton();
}

// 改变字体大小
export function changeFontSize(size) {
    globalState.currentFontSize = size;
    
    // 应用字体大小
    applyFontSize();
    
    // 更新按钮激活状态
    updateActiveFontButton();
    
    // 保存到本地存储
    localStorage.setItem('tweetFontSize', size);
}

// 应用字体大小
export function applyFontSize() {
    const tweetContents = document.querySelectorAll('.tweet-content');
    tweetContents.forEach(content => {
        // 移除所有字体大小类
        content.classList.remove('font-small', 'font-medium', 'font-large');
        
        // 添加当前字体大小类
        content.classList.add(`font-${globalState.currentFontSize}`);
    });
}

// 更新字体大小按钮的激活状态
function updateActiveFontButton() {
    // 移除所有按钮的激活状态
    const fontButtons = document.querySelectorAll('.font-size-btn');
    fontButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 为当前选中的按钮添加激活状态
    const activeButton = document.querySelector(`.font-size-btn[data-size="${globalState.currentFontSize}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// 改变主题
export function changeTheme(theme) {
    globalState.currentTheme = theme;
    
    // 应用主题
    applyTheme();
    
    // 更新按钮激活状态
    updateActiveThemeButton();
    
    // 保存到本地存储
    localStorage.setItem('appTheme', theme);
}

// 应用主题
export function applyTheme() {
    // 移除所有主题类
    document.body.classList.remove('theme-white', 'theme-black');
    
    // 添加当前主题类
    document.body.classList.add(`theme-${globalState.currentTheme}`);
}

// 更新主题按钮的激活状态
function updateActiveThemeButton() {
    // 移除所有按钮的激活状态
    const themeButtons = document.querySelectorAll('.color-theme-btn');
    themeButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 为当前选中的按钮添加激活状态
    const activeButton = document.querySelector(`.color-theme-btn[data-theme="${globalState.currentTheme}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

export default {
    initFontSize,
    initTheme,
    changeFontSize,
    applyFontSize,
    changeTheme,
    applyTheme
};
