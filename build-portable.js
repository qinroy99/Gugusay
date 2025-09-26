const { exec, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Building portable Twitter application...');

// 检查是否安装了 Tauri CLI
function checkTauriCLI() {
    return new Promise((resolve, reject) => {
        exec('npx tauri --version', (error, stdout, stderr) => {
            if (error) {
                reject('Tauri CLI not found. Please install it with: npm install @tauri-apps/cli --save-dev');
                return;
            }
            console.log(`Tauri CLI version: ${stdout.trim()}`);
            resolve();
        });
    });
}

// 检查 Tauri 配置文件
function checkTauriConfig() {
    const configFiles = ['tauri.conf.json', 'tauri.conf.json5', 'Tauri.toml'];
    return configFiles.some(file => fs.existsSync(path.join(__dirname, file)));
}

// 初始化 Tauri 项目（如果需要）
function initTauriProject() {
    return new Promise((resolve, reject) => {
        if (checkTauriConfig()) {
            console.log('Tauri configuration found.');
            resolve();
            return;
        }

        console.log('No Tauri configuration found. Initializing...');
        const initProcess = exec('npx tauri init --ci', (error, stdout, stderr) => {
            if (error) {
                console.error(`Initialization error: ${error.message}`);
                reject(error);
                return;
            }
            
            if (stderr) {
                console.error(`Initialization stderr: ${stderr}`);
            }
            
            console.log('Tauri project initialized successfully.');
            resolve();
        });

        initProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        initProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });
    });
}

// 构建便携式应用程序
async function buildPortableApp() {
    try {
        // 检查 Tauri CLI
        await checkTauriCLI();
        
        // 初始化 Tauri 项目（如果需要）
        await initTauriProject();
        
        console.log('Starting Tauri build process...');
        
        // 执行 Tauri 构建命令
        const buildProcess = exec('npx tauri build', (error, stdout, stderr) => {
            if (error) {
                console.error(`Build error: ${error.message}`);
                return;
            }
            
            if (stderr) {
                console.error(`Build stderr: ${stderr}`);
                return;
            }
            
            console.log(`Build stdout: ${stdout}`);
        });
        
        // 监听构建过程的输出
        buildProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        
        buildProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });
        
        // 构建完成后处理
        buildProcess.on('close', (code) => {
            if (code === 0) {
                console.log('Build completed successfully!');
                console.log('Portable application has been created in the "dist" directory.');
            } else {
                console.error(`Build process exited with code ${code}`);
            }
        });
        
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

// 运行构建过程
buildPortableApp();