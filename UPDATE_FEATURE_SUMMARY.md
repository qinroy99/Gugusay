# 在线更新功能实现总结

## 功能概述
已成功实现"时光机"-"设置"中的"在线更新"功能，支持自动下载更新 SR.db 数据库和媒体文件。

## 实现内容

### 1. 后端模块 (backend/updater.py)
- **Updater 类**: 管理在线更新流程
- **check_update()**: 检查远程版本，对比本地版本
- **download_database()**: 下载并替换 SR.db（自动备份原数据库）
- **download_media()**: 增补模式下载媒体文件（跳过已存在文件）
- **update_all()**: 执行完整更新流程
- **配置管理**: 支持自定义更新服务器地址

### 2. API 端点 (backend/server.py)
新增以下 API 端点：
- `GET /api/update/check` - 检查更新
- `POST /api/update/database` - 更新数据库
- `POST /api/update/media` - 更新媒体文件
- `POST /api/update/all` - 执行完整更新
- `GET /api/update/config` - 获取更新配置
- `PUT /api/update/config` - 保存更新配置

### 3. 前端设置模块 (modules/settings.js)
- **showSettingsPanel()**: 显示设置面板
- **checkUpdate()**: 检查更新并显示结果
- **startUpdate()**: 执行更新，显示进度条
- **saveUpdateUrl()**: 保存更新服务器配置
- **通知系统**: 显示操作结果通知

### 4. 时光机导航集成 (modules/yearMonthTree.js)
- 在渠道列表底部添加"⚙️ 设置"选项
- 点击打开设置面板

### 5. 主入口文件 (scripts.js)
- 导入设置模块
- 暴露全局函数供HTML调用

## 使用方法

### 1. 打开设置
1. 点击顶部导航栏的"时光机"按钮
2. 在导航面板底部点击"⚙️ 设置"

### 2. 配置更新源（首次使用）
1. 在"更新源配置"中输入更新服务器地址
2. 点击"保存配置"

### 3. 检查并执行更新
1. 点击"检查更新"按钮
2. 如果有新版本，点击"开始更新"
3. 等待更新完成，页面自动刷新

## 更新服务器配置

### 目录结构
```
update_server/
├── version.json          # 版本信息
├── data/
│   └── SR.db            # 数据库文件
└── media/               # 媒体文件
    └── ...
```

### version.json 格式
```json
{
  "version": "1.0.1",
  "info": "更新说明",
  "db_size": 10485760,
  "media_count": 100,
  "media_files": ["file1.jpg", "file2.png"]
}
```

## 安全机制
1. **数据库备份**: 更新前自动备份 SR.db 为 SR.db.backup
2. **错误恢复**: 更新失败时自动恢复原数据库
3. **增量更新**: 媒体文件只下载本地不存在的文件
4. **版本对比**: 只更新比本地版本高的远程版本

## 文件清单

### 新增文件
- `backend/updater.py` - 更新服务模块
- `modules/settings.js` - 设置面板模块
- `docs/version_template.json` - 版本信息模板
- `docs/UPDATE_GUIDE.md` - 使用说明文档
- `test_update.py` - 测试脚本

### 修改文件
- `backend/server.py` - 添加更新API端点
- `modules/yearMonthTree.js` - 添加设置入口
- `scripts.js` - 导入设置模块

## 测试验证
运行 `python test_update.py` 可测试更新模块功能。

## 注意事项
1. 默认更新URL为示例地址，使用前需配置实际服务器
2. 更新过程需要稳定的网络连接
3. 首次更新可能耗时较长
4. 建议在更新前手动备份重要数据
