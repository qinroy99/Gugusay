# 数据库设计文档

## 概述

本项目使用 **SQLite** 作为本地数据库，存储推文记录、阅读进度和搜索历史等数据。

- **数据库文件**: `data/SR.db`
- **备份文件**: `data/SR_backup.db`
- **Python模块**: 使用 `sqlite3` 标准库进行数据库操作

## 数据表结构

### 1. JL 表（推文记录表）

存储用户发布的推文记录。

```sql
CREATE TABLE JL (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datetime TEXT NOT NULL,
    content TEXT,
    channel TEXT,
    media_type TEXT DEFAULT 'text',
    media_path TEXT
);
```

**字段说明:**

| 字段名 | 类型 | 允许空 | 描述 |
|--------|------|--------|------|
| id | INTEGER | 否 | 主键，自增ID |
| datetime | TEXT | 否 | 发布时间，格式: YYYY-MM-DD HH:MM:SS |
| content | TEXT | 是 | 推文内容，支持关键词高亮显示 |
| channel | TEXT | 是 | 发布渠道（如: web, android, iphone等） |
| media_type | TEXT | 是 | 媒体类型（默认: text，可选: image, video） |
| media_path | TEXT | 是 | 媒体文件路径，格式: media/{datetime}_{id}_{index}.{ext} |

**相关前端模块:**
- [`modules/tweetRenderer.js`](../modules/tweetRenderer.js) - 渲染推文列表
- [`modules/edit.js`](../modules/edit.js) - 添加、更新、删除记录
- [`modules/pageLoader.js`](../modules/pageLoader.js) - 分页加载记录

### 2. reading_progress 表（阅读进度表）

存储用户的阅读进度信息，用于记录用户最后浏览的推文位置。

```sql
CREATE TABLE reading_progress (
    id INTEGER PRIMARY KEY,
    last_viewed_id INTEGER,
    last_viewed_datetime TEXT
);
```

**字段说明:**

| 字段名 | 类型 | 允许空 | 描述 |
|--------|------|--------|------|
| id | INTEGER | 否 | 主键，固定值为1 |
| last_viewed_id | INTEGER | 是 | 最后浏览的记录ID |
| last_viewed_datetime | TEXT | 是 | 最后浏览的时间 |

**相关前端模块:**
- [`modules/appInit.js`](../modules/appInit.js) - 初始化时加载阅读进度
- [`modules/pageLoader.js`](../modules/pageLoader.js) - 更新阅读进度

### 3. search_history 表（搜索历史表）

存储用户的搜索历史记录，用于提供搜索建议。

```sql
CREATE TABLE search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE,
    search_datetime TEXT
);
```

**字段说明:**

| 字段名 | 类型 | 允许空 | 描述 |
|--------|------|--------|------|
| id | INTEGER | 否 | 主键，自增ID |
| keyword | TEXT | 否 | 搜索关键词（唯一约束） |
| search_datetime | TEXT | 否 | 搜索时间，格式: YYYY-MM-DD HH:MM:SS |

**相关前端模块:**
- [`modules/search.js`](../modules/search.js) - 管理搜索历史

## 索引

为了提高查询性能，建议创建以下索引：

### 1. 时间索引

```sql
CREATE INDEX idx_jl_datetime ON JL(datetime);
```

**用途:** 加速按时间排序的查询，如获取最新推文、分页查询等。

### 2. 内容搜索索引

```sql
CREATE INDEX idx_jl_content ON JL(content);
```

**用途:** 加速内容搜索查询。

### 3. 渠道索引

```sql
CREATE INDEX idx_jl_channel ON JL(channel);
```

**用途:** 加速按渠道筛选的查询。

### 4. 搜索历史关键词索引

```sql
CREATE UNIQUE INDEX idx_search_history_keyword ON search_history(keyword);
```

**用途:** 确保关键词唯一性，加速关键词查询。

## 数据库操作最佳实践

### 1. 使用参数化查询

防止 SQL 注入攻击：

```python
# 正确做法
cursor.execute("SELECT * FROM JL WHERE content LIKE ?", ('%keyword%',))

# 错误做法（不要这样做）
cursor.execute(f"SELECT * FROM JL WHERE content LIKE '%{keyword}%'")
```

### 2. 错误处理

对所有数据库操作进行错误处理：

```python
try:
    cursor.execute("SELECT * FROM JL")
    results = cursor.fetchall()
except sqlite3.Error as e:
    print(f"数据库错误: {e}")
    return None
```

### 3. 数据验证

对查询结果进行验证，确保数据结构符合预期：

```python
results = cursor.fetchall()
if results and len(results) > 0:
    # 处理结果
    pass
```

### 4. 使用事务

在需要多个操作时使用事务确保数据一致性：

```python
conn = sqlite3.connect('data/SR.db')
try:
    cursor = conn.cursor()
    conn.execute("BEGIN TRANSACTION")
    
    # 多个数据库操作
    cursor.execute("INSERT INTO JL ...")
    cursor.execute("UPDATE reading_progress ...")
    
    conn.commit()
except Exception as e:
    conn.rollback()
    print(f"事务失败: {e}")
finally:
    conn.close()
```

### 5. 连接管理

及时关闭数据库连接：

```python
conn = sqlite3.connect('data/SR.db')
try:
    # 数据库操作
    pass
finally:
    conn.close()
```

或使用上下文管理器：

```python
with sqlite3.connect('data/SR.db') as conn:
    cursor = conn.cursor()
    # 数据库操作
```

## 数据备份策略

### 备份文件

项目包含备份文件 `data/SR_backup.db`，建议定期备份数据库。

### 备份方法

使用 SQLite 命令行工具：

```bash
sqlite3 data/SR.db ".backup data/SR_backup.db"
```

或使用 Python 代码：

```python
import shutil
import sqlite3

# 方法1: 直接复制文件
shutil.copy('data/SR.db', 'data/SR_backup.db')

# 方法2: 使用SQLite API
source = sqlite3.connect('data/SR.db')
backup = sqlite3.connect('data/SR_backup.db')
source.backup(backup)
backup.close()
source.close()
```

## 数据库维护

### 1. 定期清理搜索历史

```sql
DELETE FROM search_history WHERE search_datetime < datetime('now', '-30 days');
```

### 2. 优化数据库

```sql
VACUUM;
```

### 3. 分析查询性能

```sql
EXPLAIN QUERY PLAN SELECT * FROM JL WHERE content LIKE '%keyword%';
```

## 前端与数据库交互

### API 端点映射

| 功能 | API端点 | 数据库操作 | 前端模块 |
|------|---------|-----------|----------|
| 获取记录 | `GET /api/records` | `SELECT * FROM JL` | [`pageLoader.js`](../modules/pageLoader.js) |
| 搜索记录 | `GET /api/search` | `SELECT * FROM JL WHERE content LIKE` | [`search.js`](../modules/search.js) |
| 添加记录 | `POST /api/records` | `INSERT INTO JL` | [`edit.js`](../modules/edit.js) |
| 更新记录 | `PUT /api/records/<id>` | `UPDATE JL` | [`edit.js`](../modules/edit.js) |
| 删除记录 | `DELETE /api/records/<id>` | `DELETE FROM JL` | [`edit.js`](../modules/edit.js) |
| 获取进度 | `GET /api/reading-progress` | `SELECT * FROM reading_progress` | [`appInit.js`](../modules/appInit.js) |
| 更新进度 | `POST /api/reading-progress` | `UPDATE reading_progress` | [`pageLoader.js`](../modules/pageLoader.js) |
| 搜索历史 | `GET /api/search-history` | `SELECT * FROM search_history` | [`search.js`](../modules/search.js) |

### 前端缓存

前端实现了基于 Map 的缓存机制，减少数据库查询：

```javascript
// modules/globalState.js
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
```

缓存的数据包括：
- 分页记录列表
- 搜索结果
- 统计数据

## 性能优化建议

### 1. 批量操作

对于大量数据操作，使用批量插入：

```python
data = [
    ('2023-01-01 12:00:00', 'content1', 'web', 'text', None),
    ('2023-01-02 12:00:00', 'content2', 'web', 'text', None),
]
cursor.executemany("INSERT INTO JL (datetime, content, channel, media_type, media_path) VALUES (?, ?, ?, ?, ?)", data)
```

### 2. 使用连接池

对于高频访问，使用连接池减少连接开销。

### 3. 限制返回结果

使用 LIMIT 和 OFFSET 实现分页：

```sql
SELECT * FROM JL ORDER BY datetime DESC LIMIT 10 OFFSET 0;
```

### 4. 避免全表扫描

确保查询使用索引：

```sql
-- 使用索引
SELECT * FROM JL WHERE datetime >= '2023-01-01';

-- 避免全表扫描
SELECT * FROM JL WHERE content LIKE '%keyword%';
```

## 数据库迁移

如果需要修改数据库结构，建议使用迁移脚本：

```python
def migrate_database():
    conn = sqlite3.connect('data/SR.db')
    cursor = conn.cursor()
    
    # 检查是否需要迁移
    cursor.execute("PRAGMA table_info(JL)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'new_column' not in columns:
        cursor.execute("ALTER TABLE JL ADD COLUMN new_column TEXT")
        conn.commit()
    
    conn.close()
```

## 安全建议

1. **文件权限**: 确保数据库文件具有适当的访问权限
2. **输入验证**: 在后端验证所有输入数据
3. **SQL注入**: 始终使用参数化查询
4. **备份**: 定期备份数据库文件
5. **日志**: 记录数据库操作日志以便审计
