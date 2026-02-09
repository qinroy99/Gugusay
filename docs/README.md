# Twitter App 绿色便携版

## 简介
这是一个基于 Node.js 和 SQLite 的轻量级 Twitter 应用，支持本地部署和绿色便携式运行。前端采用模块化架构，代码清晰易维护。

## 目录结构
```
├── main.py                 # Python 主程序入口
├── index.html              # 主页面
├── scripts.js              # 前端主入口文件（已模块化）
├── styles.css              # 样式文件
├── sba.jpg                 # 默认头像
├── Twitter.ico             # 图标文件
├── modules/                # 前端模块目录
│   ├── globalState.js      # 全局状态和缓存管理
│   ├── appInit.js         # 应用初始化
│   ├── pageLoader.js      # 页面加载和分页
│   ├── tweetRenderer.js   # 推文渲染
│   ├── search.js          # 搜索功能
│   ├── edit.js            # 编辑功能
│   ├── mediaHandler.js    # 媒体文件处理
│   ├── themeManager.js    # 主题和字体管理
│   ├── contextMenu.js     # 右键菜单
│   ├── imageModal.js      # 图片模态框
│   ├── eventHandlers.js   # 事件处理器
│   ├── searchHistory.js   # 搜索历史
│   ├── stats.js          # 统计功能
│   └── yearMonthTree.js   # 年月导航树
├── controllers/            # 后端控制器
│   └── recordController.js
├── routes/                # 后端路由
│   ├── media.js
│   ├── progress.js
│   ├── records.js
│   ├── search.js
│   └── stats.js
├── services/              # 后端服务
│   └── cacheService.js
├── middlewares/           # 中间件
│   ├── errorHandler.js
│   ├── logger.js
│   └── security.js
├── data/                  # 数据库文件目录
│   ├── SR.db            # 主数据库文件
│   └── SR_backup.db      # 数据库备份
├── media/                 # 媒体文件目录
│   └── ...             # 图片等媒体文件
├── icons/                 # 图标文件目录
│   └── Twitter.ico
└── docs/                  # 文档目录
    ├── README.md
    ├── api.md
    ├── database.md
    ├── frontend-optimization.md
    ├── module-structure.md
    └── optimize.md
```

## 运行方式

### 方法一：使用 Python 运行（推荐）
1. 确保已安装 Python 3.x
2. 在终端中执行：`python main.py`

### 方法二：使用可执行文件
1. 双击对应平台的可执行文件：
   - Windows: `main.exe`

### 方法三：直接使用 Node.js 运行
1. 确保已安装 Node.js
2. 在终端中执行：`node main.js`（如果存在）

## 使用说明
1. 应用启动后会自动在本地开启服务，默认端口为3000
2. 在浏览器中访问 http://localhost:3000 即可使用
3. 所有数据都保存在本地 SQLite 数据库中，无需网络连接

## 前端模块化架构

### 模块说明
- **globalState.js** - 管理全局状态和前端缓存
- **appInit.js** - 应用初始化和阅读进度管理
- **pageLoader.js** - 页面加载、分页逻辑和缓存管理
- **tweetRenderer.js** - 推文列表渲染和UI更新
- **search.js** - 搜索功能和"那年今日"
- **edit.js** - 编辑和删除记录
- **mediaHandler.js** - 媒体文件上传、粘贴处理
- **themeManager.js** - 字体大小和主题切换
- **contextMenu.js** - 右键菜单和复制功能
- **imageModal.js** - 图片放大查看
- **eventHandlers.js** - 所有事件监听器绑定

### 模块化优势
1. **代码组织清晰** - 每个模块职责单一，易于理解和维护
2. **可重用性** - 模块可在其他项目中复用
3. **可测试性** - 每个模块可独立测试
4. **可维护性** - 修改某个功能只需编辑对应模块

## 注意事项
1. 请勿删除 data 目录中的数据库文件，否则会丢失所有数据
2. media 目录用于存储上传的图片文件
3. 如需更换端口，可在 main.py 中修改配置
4. 本应用为单机版，数据仅保存在本地
5. 前端使用 ES6 模块，需要现代浏览器支持

## 故障排除

### 问题1：复制到其他位置后无法运行
如果将整个文件夹复制到其他位置或磁盘后无法运行，请确保：
1. 保持文件夹内所有文件的相对位置不变
2. 确保 main.exe、index.html 和 data 文件夹在同一目录下
3. 如果仍然无法运行，可以尝试以管理员身份运行

### 问题2：浏览器没有自动打开
如果应用已经启动但浏览器没有自动打开：
1. 手动打开浏览器并访问 http://localhost:3000
2. 等待几秒钟让服务完全启动后再尝试访问

### 问题3：数据无法加载或保存
如果发现数据无法加载或保存：
1. 确保 data 文件夹存在且包含数据库文件
2. 确保应用有对 data 文件夹的读写权限

### 问题4：前端模块加载失败
如果前端模块加载失败：
1. 确保浏览器支持 ES6 模块（Chrome 61+, Firefox 60+, Safari 10.1+）
2. 检查 index.html 中的 script 标签是否包含 `type="module"` 属性
3. 检查浏览器控制台是否有跨域错误

## 技术栈
- **前端**：HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **后端**：Node.js, Express
- **数据库**：SQLite
- **打包工具**：PyInstaller (Python), pkg (Node.js)

## 跨平台支持
- Windows 7 及以上版本
- Linux (需要 glibc 2.17+)
- macOS 10.12+

## 开发者信息
- 项目基于 Node.js 和 SQLite 构建
- 前端采用模块化架构，代码清晰易维护
- 支持绿色便携式部署，无需安装额外依赖
- 详见 [模块化架构文档](module-structure.md)
