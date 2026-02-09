# Twitter-pywebview

这是一个本地优先的类 Twitter 应用，数据存储于本地 SQLite 数据库。

## 技术栈

- 前端：HTML/CSS/JavaScript
- 后端：Python + pywebview
- 数据库：SQLite

## 文件结构

```
Twitter-pywebview/
├── data/               # 数据库存储目录
├── media/              # 媒体文件存储目录
├── app.js              # Web服务器
├── db.js               # 数据库模块
├── main.py             # pywebview主程序
├── index.html          # 主页面
├── scripts.js          # 前端JavaScript
├── styles.css          # 样式表
└── README.md           # 说明文档
```

## 安装与运行

### pywebview版本

1. 安装依赖：
   ```
   pip install pywebview
   ```

2. 运行应用：
   ```
   python main.py
   ```

## 功能特性

- 本地存储推文记录
- 支持文本、图片和视频内容
- 搜索功能
- 按年月和渠道分类浏览
- 统计信息展示
- 阅读进度保存
- 响应式设计

## 打包

### pywebview版本

使用pyinstaller打包为可执行文件：
```
pip install pyinstaller
pyinstaller --onefile --windowed main.py
```

## 注意事项

- 数据库存储在`data/SR.db`文件中
- 媒体文件存储在`media/`目录中
- 应用启动时会自动创建所需的目录和数据库表