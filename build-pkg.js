const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { mkdirSync } = require('fs');

console.log('Building portable Twitter application with pkg...');

// 创建目录结构
function createDirectoryStructure() {
    console.log('Creating directory structure...');
    
    // 创建主目录
    const dirs = ['pkg-dist', 'pkg-dist/data', 'pkg-dist/media', 'pkg-dist/icons'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
}

// 复制文件到目标目录
function copyFiles() {
    console.log('Copying files...');
    
    // 需要复制的文件列表
    const filesToCopy = [
        'app.js',
        'db.js',
        'index.html',
        'scripts.js',
        'styles.css',
        'sba.jpg',
        'Twitter.ico',
        'Twitter.png'
    ];
    
    // 复制主要文件
    filesToCopy.forEach(file => {
        if (fs.existsSync(file)) {
            const targetPath = path.join('pkg-dist', file);
            fs.copyFileSync(file, targetPath);
            console.log(`Copied ${file} to ${targetPath}`);
        }
    });
    
    // 复制数据库文件
    const dbFiles = fs.readdirSync('.').filter(file => file.endsWith('.db'));
    dbFiles.forEach(file => {
        const targetPath = path.join('pkg-dist/data', file);
        fs.copyFileSync(file, targetPath);
        console.log(`Copied database ${file} to ${targetPath}`);
    });
    
    // 复制媒体文件
    if (fs.existsSync('media')) {
        const mediaFiles = fs.readdirSync('media');
        mediaFiles.forEach(file => {
            const sourcePath = path.join('media', file);
            const targetPath = path.join('pkg-dist/media', file);
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`Copied media ${file} to ${targetPath}`);
        });
    }
    
    // 复制图标文件
    if (fs.existsSync('icons')) {
        const iconFiles = fs.readdirSync('icons');
        iconFiles.forEach(file => {
            const sourcePath = path.join('icons', file);
            const targetPath = path.join('pkg-dist/icons', file);
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`Copied icon ${file} to ${targetPath}`);
        });
    }
    
    // 复制sqlite3原生模块
    const nodeModulesPath = path.join('node_modules', 'sqlite3');
    if (fs.existsSync(nodeModulesPath)) {
        const targetPath = path.join('pkg-dist', 'node_modules', 'sqlite3');
        fs.mkdirSync(path.join('pkg-dist', 'node_modules'), { recursive: true });
        copyFolderRecursiveSync(nodeModulesPath, path.join('pkg-dist', 'node_modules', 'sqlite3'));
        console.log('Copied sqlite3 native module to pkg-dist/node_modules/sqlite3');
    } else {
        console.log('sqlite3 module not found in node_modules');
    }
}

// 递归复制文件夹
function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }
    
    if (fs.lstatSync(source).isDirectory()) {
        const files = fs.readdirSync(source);
        files.forEach(function (file) {
            const curSource = path.join(source, file);
            const curTarget = path.join(target, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, curTarget);
            } else {
                fs.copyFileSync(curSource, curTarget);
            }
        });
    }
}

// 创建启动脚本
function createStartScripts() {
    console.log('Creating start scripts...');
    
    // Windows启动脚本
    const windowsScript = `@echo off
setlocal

TITLE Twitter App

echo Twitter App is starting...
echo.

REM Check if executable file exists
if exist "twitter-app-win.exe" (
    echo Starting Twitter App service...
    start "Twitter App Server" /min twitter-app-win.exe
    set APP_TYPE=exe
) else if exist "app.js" (
    echo Starting Twitter App service...
    start "Twitter App Server" /min node app.js
    set APP_TYPE=node
) else (
    echo Error: Executable file not found
    echo Please make sure twitter-app-win.exe or app.js exists in current directory
    pause
    exit /b 1
)

REM Wait for service to start
echo Waiting for service to start...
timeout /t 3 /nobreak >nul

REM Check if port is listening
echo Checking if service is running...
netstat -an | findstr :3000 >nul
if %errorlevel% == 0 (
    echo Service is running, opening browser...
) else (
    echo Warning: Service may still be starting...
)

REM Open browser to access the app
echo Opening browser to http://localhost:3000 ...
start "" http://localhost:3000

echo.
echo Twitter App has been started successfully!
echo If browser does not open automatically, please manually visit http://localhost:3000
echo.
echo Do not close this window, closing it will stop the service
echo.

pause`;

    fs.writeFileSync('pkg-dist/start.bat', windowsScript);
    console.log('Created Windows start script: start.bat');
    
    // Linux/macOS启动脚本
    const unixScript = `#!/bin/bash
echo "Twitter App starting..."

node app.js

echo "Press any key to continue..."
read -n 1`;

    fs.writeFileSync('pkg-dist/start.sh', unixScript);
    fs.chmodSync('pkg-dist/start.sh', '755'); // 添加执行权限
    console.log('Created Unix start script: start.sh');
}

// 使用pkg打包应用
function buildWithPkg() {
    return new Promise((resolve, reject) => {
        console.log('Building with pkg...');
        
        // 先检查是否安装了pkg
        exec('npx pkg --version', (error, stdout, stderr) => {
            if (error) {
                console.log('pkg not found, installing...');
                exec('npm install pkg --save-dev', (installError, installStdout, installStderr) => {
                    if (installError) {
                        reject('Failed to install pkg: ' + installError.message);
                        return;
                    }
                    console.log('pkg installed successfully');
                    runPkgBuild(resolve, reject);
                });
            } else {
                console.log(`pkg version: ${stdout.trim()}`);
                runPkgBuild(resolve, reject);
            }
        });
    });
}

function runPkgBuild(resolve, reject) {
    // 使用pkg打包应用，添加更多针对sqlite3的配置选项
    const pkgCommand = 'npx pkg app.js --targets node16-win-x64,node16-linux-x64,node16-macos-x64 ' +
                      '--output pkg-dist/twitter-app ' +
                      '--options no-warnings ' +
                      '--public ' +
                      '--public-packages "*" ' +
                      '--assets "node_modules/sqlite3/**/*" ' +
                      '--assets "node_modules/sqlite3/lib/binding/*" ' +
                      '--assets "node_modules/sqlite3/build/Release/*" ' +
                      '--assets "data/*.db"';
    
    console.log('Running pkg command:', pkgCommand);
    
    const pkgProcess = exec(pkgCommand, 
        (error, stdout, stderr) => {
            if (error) {
                console.error(`pkg build error: ${error.message}`);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.error(`pkg build stderr: ${stderr}`);
            }
            
            console.log(`pkg build stdout: ${stdout}`);
            resolve();
        });
    
    pkgProcess.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    
    pkgProcess.stderr.on('data', (data) => {
        console.error(data.toString());
    });
}

// 创建README文件
function createReadme() {
    console.log('Creating README.md...');
    
    const readmeContent = `# Twitter App 绿色便携版

## 简介
这是一个基于 Node.js 和 SQLite 的轻量级 Twitter 应用，支持本地部署和绿色便携式运行。

## 目录结构
\`-- pkg-dist/
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
   - Windows: \`twitter-app-win.exe\`
   - Linux: \`twitter-app-linux\`
   - macOS: \`twitter-app-macos\`

### 方法二：使用脚本启动
1. Windows系统：双击 \`start.bat\`
2. Linux/macOS系统：运行 \`./start.sh\`

### 方法三：直接使用 Node.js 运行
1. 确保已安装 Node.js
2. 在终端中执行：\`node app.js\`

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
`;

    fs.writeFileSync('pkg-dist/README.md', readmeContent);
    console.log('Created README.md');
}

// 主构建函数
async function buildPortableAppWithPkg() {
    try {
        createDirectoryStructure();
        copyFiles();
        createStartScripts();
        await buildWithPkg();
        createReadme();
        console.log('Build completed successfully!');
        console.log('Portable application has been created in the "pkg-dist" directory.');
        console.log('See pkg-dist/README.md for detailed usage instructions.');
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

// 运行构建过程
buildPortableAppWithPkg();