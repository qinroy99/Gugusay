const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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

// 确保数据目录存在
const appRoot = getAppRoot();
const dataDir = path.join(appRoot, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 连接到 SQLite 数据库
const dbPath = path.join(dataDir, 'SR.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // 创建reading_progress表
        createReadingProgressTable();
        // 创建搜索历史记录表
        createSearchHistoryTable();
    }
});

// 创建reading_progress表
function createReadingProgressTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS reading_progress (
            id INTEGER PRIMARY KEY,
            last_viewed_id INTEGER,
            last_viewed_datetime TEXT
        )
    `;
    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating reading_progress table:', err.message);
        } else {
            console.log('Reading progress table ready.');
        }
    });
}

// 创建搜索历史记录表
function createSearchHistoryTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            keyword TEXT UNIQUE,
            search_datetime TEXT
        )
    `;
    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating search_history table:', err.message);
        } else {
            console.log('Search history table ready.');
            // 创建唯一索引确保关键字不重复
            createSearchHistoryIndex();
        }
    });
}

// 创建搜索历史记录唯一索引
function createSearchHistoryIndex() {
    const sql = `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_search_history_keyword 
        ON search_history(keyword)
    `;
    db.run(sql, (err) => {
        if (err) {
            console.error('Error creating search history index:', err.message);
        }
    });
}

// 添加记录
function addRecord(datetime, content, channel, media_type, media_path, callback) {
    const sql = `
        INSERT INTO JL (datetime, content, channel, media_type, media_path)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(sql, [datetime, content, channel, media_type || 'text', media_path || null], callback);
}

// 获取记录总数
function getTotalCount(callback) {
    const sql = 'SELECT COUNT(*) as count FROM JL';
    db.get(sql, (err, row) => {
        if (err) {
            // 如果查询出错，返回默认值而不是undefined
            callback(err, { count: 0 });
        } else {
            // 确保即使没有数据也返回默认值
            callback(null, row || { count: 0 });
        }
    });
}

// 获取分页数据
function getPaginatedRecords(page, pageSize, callback) {
    const offset = (page - 1) * pageSize;
    const sql = `
        SELECT id, datetime, content, channel, media_type, media_path FROM JL 
        ORDER BY datetime DESC 
        LIMIT ? OFFSET ?
    `;
    db.all(sql, [pageSize, offset], (err, rows) => {
        if (err) {
            // 如果查询出错，返回空数组而不是undefined
            callback(err, []);
        } else {
            // 确保即使没有数据也返回空数组
            callback(null, rows || []);
        }
    });
}

// 搜索记录
function searchRecords(keyword, callback) {
    const sql = `
        SELECT id, datetime, content, channel, media_type, media_path FROM JL 
        WHERE datetime LIKE ? OR content LIKE ? 
        ORDER BY datetime DESC
    `;
    const searchKeyword = `%${keyword}%`;
    db.all(sql, [searchKeyword, searchKeyword], callback);
}

// 获取统计信息 - 按年份
function getStatsByYear(callback) {
    const sql = `
        SELECT 
            SUBSTR(datetime, 1, 4) as year,
            COUNT(*) as count
        FROM JL 
        WHERE datetime IS NOT NULL
        GROUP BY SUBSTR(datetime, 1, 4)
        ORDER BY year
    `;
    db.all(sql, callback);
}

// 获取统计信息 - 按渠道
function getStatsByChannel(callback) {
    const sql = `
        SELECT 
            channel,
            COUNT(*) as count
        FROM JL 
        WHERE channel IS NOT NULL
        GROUP BY channel
        ORDER BY count DESC
    `;
    db.all(sql, callback);
}

// 获取综合统计信息 - 按年份和渠道
function getCombinedStats(callback) {
    const sql = `
        SELECT 
            SUBSTR(datetime, 1, 4) as year,
            channel,
            COUNT(*) as count,
            SUM(LENGTH(content)) as char_count
        FROM JL 
        WHERE datetime IS NOT NULL
        GROUP BY SUBSTR(datetime, 1, 4), channel
        ORDER BY year, channel
    `;
    db.all(sql, callback);
}

// 获取年月数据
function getYearMonths(callback) {
    const sql = `
        SELECT DISTINCT 
            strftime('%Y', datetime) as year,
            strftime('%m', datetime) as month
        FROM JL 
        WHERE datetime IS NOT NULL
        ORDER BY year DESC, month DESC
    `;
    db.all(sql, (err, rows) => {
        if (err) {
            // 如果查询出错，返回空数组而不是undefined
            callback(err, []);
        } else {
            // 确保即使没有数据也返回空数组
            callback(null, rows || []);
        }
    });
}

// 获取指定年月的第一条记录所在的页面
function getPageForYearMonth(year, month, pageSize, callback) {
    const sql = `
        SELECT COUNT(*) as record_count
        FROM JL 
        WHERE datetime >= (
            SELECT datetime 
            FROM JL 
            WHERE strftime('%Y', datetime) = ? AND strftime('%m', datetime) = ?
            ORDER BY datetime ASC 
            LIMIT 1
        )
    `;
    db.get(sql, [year, month], (err, result) => {
        if (err) {
            callback(err);
        } else {
            const page = Math.ceil(result.record_count / pageSize);
            callback(null, { page });
        }
    });
}

// 更新记录
function updateRecord(id, datetime, content, channel, media_type, media_path, callback) {
    const sql = `
        UPDATE JL 
        SET datetime = ?, content = ?, channel = ?, media_type = ?, media_path = ?
        WHERE id = ?
    `;
    db.run(sql, [datetime, content, channel, media_type || 'text', media_path || null, id], callback);
}

// 删除记录
function deleteRecord(id, callback) {
    const sql = 'DELETE FROM JL WHERE id = ?';
    db.run(sql, [id], callback);
}

// 获取阅读进度
function getReadingProgress(callback) {
    const sql = 'SELECT last_viewed_id, last_viewed_datetime FROM reading_progress WHERE id = 1';
    db.get(sql, callback);
}

// 更新阅读进度
function updateReadingProgress(lastViewedId, lastViewedDatetime, callback) {
    const sql = `
        INSERT OR REPLACE INTO reading_progress (id, last_viewed_id, last_viewed_datetime)
        VALUES (1, ?, ?)
    `;
    db.run(sql, [lastViewedId, lastViewedDatetime], callback);
}

// 获取指定ID记录所在的页面
function getPageForRecordId(recordId, pageSize, callback) {
    if (!recordId) {
        callback(null, { page: 1 });
        return;
    }
    
    const sql = `
        SELECT COUNT(*) as record_count
        FROM JL 
        WHERE datetime >= (SELECT datetime FROM JL WHERE id = ?)
    `;
    db.get(sql, [recordId], (err, result) => {
        if (err) {
            callback(err);
        } else {
            const page = Math.ceil(result.record_count / pageSize);
            callback(null, { page });
        }
    });
}

// 添加搜索历史记录
function addSearchHistory(keyword, callback) {
    const sql = `
        INSERT OR REPLACE INTO search_history (keyword, search_datetime)
        VALUES (?, datetime('now'))
    `;
    db.run(sql, [keyword], callback);
}

// 获取搜索历史记录
function getSearchHistory(limit = 10, callback) {
    const sql = `
        SELECT keyword, search_datetime
        FROM search_history
        ORDER BY search_datetime DESC
        LIMIT ?
    `;
    db.all(sql, [limit], callback);
}

// 删除搜索历史记录
function deleteSearchHistory(keyword, callback) {
    const sql = 'DELETE FROM search_history WHERE keyword = ?';
    db.run(sql, [keyword], callback);
}

module.exports = {
    getTotalCount,
    getPaginatedRecords,
    searchRecords,
    getStatsByYear,
    getStatsByChannel,
    getCombinedStats,
    getYearMonths,
    getPageForYearMonth,
    updateRecord,
    deleteRecord,
    addRecord,
    getReadingProgress,
    updateReadingProgress,
    getPageForRecordId,
    addSearchHistory,
    getSearchHistory,
    deleteSearchHistory
};