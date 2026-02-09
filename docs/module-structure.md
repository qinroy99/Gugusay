# 模块化重构文档

## 概述

本项目已完成模块化重构，将原有的单一 [`scripts.js`](scripts.js:1) 文件（2035行）拆分为多个功能模块，提高了代码的可维护性和可读性。

## 模块结构

### 主入口文件
- **[`scripts.js`](scripts.js:1)** - 主入口文件，负责初始化应用和绑定基础事件监听器

### 核心模块

#### 1. [`modules/globalState.js`](modules/globalState.js:1)
全局变量和状态管理模块
- 管理全局状态变量（当前页码、搜索关键词、渠道等）
- 前端缓存功能
- 窗口对象同步

#### 2. [`modules/appInit.js`](modules/appInit.js:1)
页面初始化模块
- 应用初始化
- 获取总记录数
- 阅读进度管理（保存和恢复）
- 导航树加载

#### 3. [`modules/pageLoader.js`](modules/pageLoader.js:1)
页面加载模块
- 加载指定页面的数据
- 缓存管理
- 分页逻辑
- 为其他模块提供页面加载接口

#### 4. [`modules/tweetRenderer.js`](modules/tweetRenderer.js:1)
推文渲染模块
- 渲染推文列表
- 创建单条推文元素
- 媒体内容处理
- 加载指示器管理
- 分页信息更新
- 日期格式化和关键词高亮

#### 5. [`modules/search.js`](modules/search.js:1)
搜索功能模块
- 执行搜索
- 清除搜索
- "那年今日"搜索
- 搜索历史记录显示/隐藏

#### 6. [`modules/edit.js`](modules/edit.js:1)
编辑功能模块
- 打开编辑模态框
- 保存编辑的记录
- 删除记录

#### 7. [`modules/mediaHandler.js`](modules/mediaHandler.js:1)
媒体文件处理模块
- 切换媒体选择区域
- 处理媒体文件选择
- 处理粘贴事件
- 保存媒体文件

#### 8. [`modules/themeManager.js`](modules/themeManager.js:1)
字体和主题管理模块
- 字体大小初始化和切换
- 主题初始化和切换
- 本地存储管理

#### 9. [`modules/contextMenu.js`](modules/contextMenu.js:1)
右键菜单和复制功能模块
- 显示/隐藏自定义右键菜单
- 执行右键菜单操作
- 文本复制到剪贴板
- 通知消息显示

#### 10. [`modules/imageModal.js`](modules/imageModal.js:1)
图片模态框模块
- 打开图片放大模态框
- 关闭图片模态框

#### 11. [`modules/eventHandlers.js`](modules/eventHandlers.js:1)
事件处理器模块
- 绑定所有事件监听器
- 搜索按钮和输入框事件
- 统计按钮事件
- "那年今日"按钮事件
- 高级搜索事件
- 分页按钮事件
- 字体和主题按钮事件
- 编辑和复制按钮事件
- 键盘事件

### 现有模块（已存在）
- **[`modules/searchHistory.js`](modules/searchHistory.js:1)** - 搜索历史记录管理
- **[`modules/stats.js`](modules/stats.js:1)** - 统计功能
- **[`modules/yearMonthTree.js`](modules/yearMonthTree.js:1)** - 年月导航树

## 代码行数对比

| 文件 | 原始行数 | 新行数 |
|------|---------|--------|
| scripts.js | 2035 | 70 |
| modules/globalState.js | - | 67 |
| modules/appInit.js | - | 94 |
| modules/pageLoader.js | - | 109 |
| modules/tweetRenderer.js | - | 207 |
| modules/search.js | - | 92 |
| modules/edit.js | - | 110 |
| modules/mediaHandler.js | - | 236 |
| modules/themeManager.js | - | 93 |
| modules/contextMenu.js | - | 127 |
| modules/imageModal.js | - | 25 |
| modules/eventHandlers.js | - | 227 |
| **总计** | **2035** | **1457** |

## 优势

1. **模块化** - 每个模块负责单一功能，职责清晰
2. **可维护性** - 代码组织更清晰，易于定位和修改
3. **可重用性** - 模块可以在其他项目中重用
4. **可测试性** - 每个模块可以独立测试
5. **代码精简** - 主入口文件从2035行减少到70行

## 使用说明

### 添加新功能
1. 在相应的模块文件中添加功能代码
2. 在 [`scripts.js`](scripts.js:1) 中导入必要的模块（如需要）
3. 在 [`modules/eventHandlers.js`](modules/eventHandlers.js:1) 中添加事件监听器

### 修改现有功能
直接在对应的模块文件中进行修改，无需修改其他文件。

## 注意事项

1. 所有模块都使用 ES6 模块语法（`import`/`export`）
2. [`index.html`](index.html:1) 中的 `<script>` 标签需要添加 `type="module"` 属性
3. 全局状态通过 [`modules/globalState.js`](modules/globalState.js:1) 管理
4. 模块之间通过导入/导出进行通信
