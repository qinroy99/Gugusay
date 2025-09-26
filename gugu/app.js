const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const multer = require('multer');

const app = express();

// 检测是否在 pkg 环境中运行
const isPkg = typeof process.pkg !== 'undefined';

// 获取正确的应用根目录路径
const getAppRoot = () => {
    if (isPkg) {
        // 在 pkg 环境中，使用进程执行路径
        return path.dirname(process.execPath);
    } else {
        // 在开发环境中，使用 __dirname
        return __dirname;
    }
};

// 配置 multer 存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 确保 media 文件夹存在
        const appRoot = getAppRoot();
        const mediaDir = path.join(appRoot, 'media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
        }
        cb(null, mediaDir);
    },
    filename: function (req, file, cb) {
        // 保持原始文件名
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(express.static(getAppRoot()));

// 处理表单数据和文件上传的中间件
app.use(express.urlencoded({ extended: true }));

// 提供 media 文件夹中的静态文件
app.use('/media', express.static(path.join(getAppRoot(), 'media')));

// API路由

// 获取总记录数
app.get('/api/total-count', (req, res) => {
    db.getTotalCount((err, result) => {
        if (err) {
            console.error('获取总记录数失败:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ count: (result && result.count) || 0 });
        }
    });
});

// 获取分页记录
app.get('/api/records', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    db.getPaginatedRecords(page, pageSize, (err, records) => {
        if (err) {
            console.error('获取分页记录失败:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ records: records || [] });
        }
    });
});

// 搜索记录
app.get('/api/search', (req, res) => {
    const keyword = req.query.keyword || '';
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    // 添加搜索历史记录
    if (keyword.trim()) {
        db.addSearchHistory(keyword.trim(), (err) => {
            if (err) {
                console.error('添加搜索历史记录失败:', err.message);
            }
        });
    }
    
    db.searchRecords(keyword, (err, records) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            // 分页处理
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedRecords = records.slice(startIndex, endIndex);
            
            res.json({ 
                records: paginatedRecords,
                total: records.length
            });
        }
    });
});

// 获取年份统计
app.get('/api/stats/year', (req, res) => {
    db.getStatsByYear((err, stats) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ stats });
        }
    });
});

// 获取渠道统计
app.get('/api/stats/channel', (req, res) => {
    db.getStatsByChannel((err, stats) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ stats });
        }
    });
});

// 获取综合统计
app.get('/api/stats/combined', (req, res) => {
    db.getCombinedStats((err, stats) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ stats });
        }
    });
});

// 获取年月数据
app.get('/api/year-months', (req, res) => {
    db.getYearMonths((err, yearMonths) => {
        if (err) {
            console.error('获取年月数据失败:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json({ yearMonths: yearMonths || [] });
        }
    });
});

// 获取指定年月的第一条记录所在的页面
app.get('/api/year-month/:year/:month/page', (req, res) => {
    const year = req.params.year;
    const month = req.params.month;
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    db.getPageForYearMonth(year, month, pageSize, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result);
        }
    });
});

// 保存媒体文件
app.post('/api/save-media-file', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: '没有文件上传' });
    }
    
    res.json({ 
        success: true, 
        message: '文件保存成功',
        path: `media/${req.file.filename}`
    });
});

// 上传媒体文件
app.post('/api/upload-media', (req, res) => {
    // 由于这是一个桌面应用，文件已经在前端处理并命名
    // 这里我们只是返回一个成功响应
    res.json({ success: true, message: '文件上传成功' });
});

// 保存媒体文件
app.post('/api/save-media', (req, res) => {
    // 由于这是一个桌面应用，实际文件处理由前端完成
    // 这里我们只是模拟保存过程
    const fileName = req.body.fileName;
    
    if (!fileName) {
        return res.status(400).json({ success: false, error: '文件名不能为空' });
    }
    
    // 检查 media 文件夹是否存在，如果不存在则创建
    const mediaDir = path.join(__dirname, 'media');
    if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
    }
    
    res.json({ success: true, message: '文件保存成功', path: `media/${fileName}` });
});

// 处理实际的文件上传（用于多文件上传）
app.post('/api/upload-files', (req, res) => {
    // 由于这是一个桌面应用，实际文件处理由前端完成
    // 这里我们只是返回一个模拟的成功响应
    res.json({ success: true, message: '文件上传成功' });
});

// 更新记录
app.put('/api/records/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { datetime, content, channel, media_type, media_path } = req.body;
    
    db.updateRecord(id, datetime, content, channel, media_type, media_path, (err) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// 删除记录
app.delete('/api/records/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    db.deleteRecord(id, (err) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// 添加记录
app.post('/api/records', (req, res) => {
    const { datetime, content, channel, media_type, media_path } = req.body;
    
    db.addRecord(datetime, content, channel, media_type, media_path, (err) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// 获取阅读进度
app.get('/api/reading-progress', (req, res) => {
    db.getReadingProgress((err, progress) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ progress: progress || null });
        }
    });
});

// 更新阅读进度
app.post('/api/reading-progress', (req, res) => {
    const { lastViewedId, lastViewedDatetime } = req.body;
    
    db.updateReadingProgress(lastViewedId, lastViewedDatetime, (err) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// 获取指定记录ID所在的页面
app.get('/api/record/:id/page', (req, res) => {
    const id = parseInt(req.params.id);
    const pageSize = parseInt(req.query.pageSize) || 10;
    
    db.getPageForRecordId(id, pageSize, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(result);
        }
    });
});

// 添加搜索历史记录
app.post('/api/search-history', (req, res) => {
    const { keyword } = req.body;
    
    if (!keyword) {
        return res.status(400).json({ success: false, error: '关键字不能为空' });
    }
    
    db.addSearchHistory(keyword, (err) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// 获取搜索历史记录
app.get('/api/search-history', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    db.getSearchHistory(limit, (err, history) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ history });
        }
    });
});

// 删除搜索历史记录
app.delete('/api/search-history/:keyword', (req, res) => {
    const keyword = decodeURIComponent(req.params.keyword);
    
    db.deleteSearchHistory(keyword, (err) => {
        if (err) {
            res.status(500).json({ success: false, error: err.message });
        } else {
            res.json({ success: true });
        }
    });
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;