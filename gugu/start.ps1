# PowerShell启动脚本
Write-Host "Twitter App PowerShell启动脚本" -ForegroundColor Green
Write-Host "当前目录: $(Get-Location)" -ForegroundColor Yellow
Write-Host "目录内容:" -ForegroundColor Yellow
Get-ChildItem

Write-Host ""
if (Test-Path "twitter-app-win.exe") {
    Write-Host "找到 twitter-app-win.exe，正在启动..." -ForegroundColor Green
    Start-Process -FilePath ".\twitter-app-win.exe" -WindowStyle Minimized -PassThru
    Start-Sleep -Seconds 2
    $process = Get-Process -Name "twitter-app-win" -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "Twitter App服务已成功启动" -ForegroundColor Green
    } else {
        Write-Host "警告：Twitter App服务启动失败" -ForegroundColor Red
    }
} elseif (Test-Path "app.js") {
    Write-Host "找到 app.js，正在使用Node.js启动..." -ForegroundColor Green
    Start-Process -FilePath "node" -ArgumentList ".\app.js" -WindowStyle Minimized -PassThru
    Start-Sleep -Seconds 2
    $process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*app.js*" }
    if ($process) {
        Write-Host "Twitter App服务已成功启动(Node.js)" -ForegroundColor Green
    } else {
        Write-Host "警告：Twitter App服务启动失败(Node.js)" -ForegroundColor Red
    }
} else {
    Write-Host "错误：未找到可执行文件" -ForegroundColor Red
    Write-Host "请确保 twitter-app-win.exe 或 app.js 存在于当前目录中"
    Write-Host ""
    Write-Host "文件查找结果:"
    Write-Host "twitter-app-win.exe: $(if (Test-Path 'twitter-app-win.exe') { '找到' } else { '未找到' })"
    Write-Host "app.js: $(if (Test-Path 'app.js') { '找到' } else { '未找到' })"
}

Write-Host ""
Write-Host "等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "检查端口3000是否正在监听..." -ForegroundColor Yellow
$portListening = netstat -an | Select-String ":3000"
if ($portListening) {
    Write-Host "服务正在运行，正在打开浏览器..." -ForegroundColor Green
    Start-Process "http://localhost:3000"
} else {
    Write-Host "警告：服务可能仍在启动或启动失败..." -ForegroundColor Red
    Write-Host "请检查端口3000是否可用且未被防火墙阻止"
}

Write-Host ""
Write-Host "Twitter App已启动！" -ForegroundColor Green
Write-Host "如果浏览器未自动打开，请手动访问 http://localhost:3000"
Write-Host "请勿关闭此窗口，关闭将停止服务"
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")