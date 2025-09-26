# Twitter App 绿色便携版

## 简介
这是一个基于 Node.js 和 SQLite 的轻量级 Twitter 应用，支持本地部署和绿色便携式运行。

## 目录结构
`-- pkg-dist/
  |-- twitter-app-win.exe     # Windows 可执行文件
  |-- twitter-app-linux       # Linux 可执行文件
  |-- twitter-app-macos       # macOS 可执行文件
  |-- app.js                  # 应用主文件
  |-- db.js                   # 数据库操作模块
  |-- index.html              # 主页面
  |-- scripts.js              # 前端 JavaScript
  |-- styles.css              # 样式文件
  |-- sba.jpg                 # 默认头像
  |-- Twitter.ico             # 图标文件
  |-- Twitter.png             # 图标文件
  |-- start.bat               # Windows 启动脚本
  |-- start.sh                # Linux/macOS 启动脚本
  |-- stop.bat                # Windows 停止脚本
  |-- start-minimized.bat     # Windows 最小化启动脚本
  |-- data/                   # 数据库文件目录
  |   |-- SR.db               # 主数据库文件
  |   |-- ...                 # 其他数据库文件
  |-- media/                  # 媒体文件目录
  |   |-- ...                 # 图片等媒体文件
  |-- icons/                  # 图标文件目录
  |   |-- ...                 # 图标文件
  |-- node_modules/           # Node.js 模块目录
      |-- sqlite3/            # SQLite3 原生模块
          |-- ...             # 模块文件

## 运行方式

### 方法一：使用可执行文件（推荐）
1. 双击对应平台的可执行文件：
   - Windows: `twitter-app-win.exe`
   - Linux: `twitter-app-linux`
   - macOS: `twitter-app-macos`

### 方法二：使用脚本启动
1. Windows系统：双击 `start.bat`
2. Linux/macOS系统：运行 `./start.sh`

### 方法三：直接使用 Node.js 运行
1. 确保已安装 Node.js
2. 在终端中执行：`node app.js`

## 使用说明
1. 应用启动后会自动在本地开启服务，默认端口为3000
2. 在浏览器中访问 http://localhost:3000 即可使用
3. 所有数据都保存在本地 SQLite 数据库中，无需网络连接

## 注意事项
1. 请勿删除 data 目录中的数据库文件，否则会丢失所有数据
2. media 目录用于存储上传的图片文件
3. 如需更换端口，可在 app.js 中修改 PORT 变量
4. 本应用为单机版，数据仅保存在本地

## 故障排除

### 问题1：复制到其他位置后无法运行
如果将整个 pkg-dist 文件夹复制到其他位置或磁盘后无法运行，请确保：
1. 保持文件夹内所有文件的相对位置不变
2. 确保 [twitter-app-win.exe](file:///d:/my_vscode/Twitter3.0/pkg-dist/twitter-app-win.exe)、[app.js](file:///d:/my_vscode/Twitter3.0/pkg-dist/app.js) 和 [data](file:///d:/my_vscode/Twitter3.0/dist/data) 文件夹在同一目录下
3. 如果仍然无法运行，可以尝试以管理员身份运行 [start.bat](file:///d:/my_vscode/Twitter3.0/pkg-dist/start.bat)

### 问题2：浏览器没有自动打开
如果应用已经启动但浏览器没有自动打开：
1. 手动打开浏览器并访问 http://localhost:3000
2. 等待几秒钟让服务完全启动后再尝试访问

### 问题3：数据无法加载或保存
如果发现数据无法加载或保存：
1. 确保 [data](file:///d:/my_vscode/Twitter3.0/dist/data) 文件夹存在且包含数据库文件
2. 确保应用有对 [data](file:///d:/my_vscode/Twitter3.0/dist/data) 文件夹的读写权限

### 问题4：出现"Could not locate the bindings file"错误
这是由于sqlite3原生模块的绑定文件未正确打包导致的。请确保：
1. [node_modules/sqlite3](file:///d:/my_vscode/Twitter3.0/pkg-dist/node_modules/sqlite3) 文件夹已包含在打包目录中
2. 如果仍然报错，请尝试使用 [start.bat](file:///d:/my_vscode/Twitter3.0/pkg-dist/start.bat) 脚本启动而不是直接运行可执行文件

## 技术栈
- 前端：HTML5, CSS3, Vanilla JavaScript
- 后端：Node.js, Express
- 数据库：SQLite
- 打包工具：pkg

## 跨平台支持
- Windows 7 及以上版本
- Linux (需要 glibc 2.17+)
- macOS 10.12+

## 开发者信息
- 项目基于 Node.js 和 SQLite 构建
- 支持绿色便携式部署，无需安装额外依赖
