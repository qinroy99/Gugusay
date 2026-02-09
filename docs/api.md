# API 接口文档

## 基础信息

- **后端技术**: Python (http.server + pywebview)
- **基础URL**: `/api`
- **数据格式**: JSON (除文件上传外)
- **数据库**: SQLite (data/SR.db)

## 记录相关接口

### 获取记录总数

```
GET /api/total-count
```

**响应:**
```json
{
  "count": 42350,
  "totalPages": 4235
}
```

### 获取分页记录

```
GET /api/records?page=1&pageSize=10
```

**参数:**
- `page`: 页码 (默认: 1)
- `pageSize`: 每页记录数 (默认: 10)

**响应:**
```json
{
  "records": [
    {
      "id": 1,
      "datetime": "2023-01-01 12:00:00",
      "content": "推文内容",
      "channel": "web",
      "media_type": "text",
      "media_path": null
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 10,
  "totalPages": 10
}
```

### 搜索记录

```
GET /api/search?keyword=关键词&page=1&pageSize=10
```

**参数:**
- `keyword`: 搜索关键词
- `page`: 页码 (默认: 1)
- `pageSize`: 每页记录数 (默认: 10)

**响应:**
```json
{
  "records": [...],
  "total": 50,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

### 添加记录

```
POST /api/records
Content-Type: application/json
```

**请求体:**
```json
{
  "datetime": "2023-01-01 12:00:00",
  "content": "推文内容",
  "channel": "web",
  "media_type": "text",
  "media_path": null
}
```

**响应:**
```json
{
  "success": true,
  "id": 101
}
```

### 更新记录

```
PUT /api/records/<id>
Content-Type: application/json
```

**参数:**
- `id`: 记录ID (URL路径参数)

**请求体:**
```json
{
  "datetime": "2023-01-01 12:00:00",
  "content": "更新的内容",
  "channel": "web",
  "media_type": "text",
  "media_path": null
}
```

**响应:**
```json
{
  "success": true
}
```

### 删除记录

```
DELETE /api/records/<id>
```

**参数:**
- `id`: 记录ID (URL路径参数)

**响应:**
```json
{
  "success": true
}
```

## 统计相关接口

### 获取年份统计

```
GET /api/stats/year
```

**响应:**
```json
{
  "stats": [
    {
      "year": "2023",
      "count": 50
    }
  ]
}
```

### 获取渠道统计

```
GET /api/stats/channel
```

**响应:**
```json
{
  "stats": [
    {
      "channel": "web",
      "count": 50
    }
  ]
}
```

### 获取综合统计

```
GET /api/stats/combined
```

**响应:**
```json
{
  "stats": [
    {
      "year": "2023",
      "channel": "web",
      "count": 50,
      "char_count": 1000
    }
  ]
}
```

## 进度相关接口

### 获取年月数据

```
GET /api/year-months
```

**响应:**
```json
{
  "yearMonths": [
    {
      "year": "2023",
      "month": "01"
    }
  ]
}
```

### 获取指定年月的第一条记录所在的页面

```
GET /api/year-month/<year>/<month>/page?pageSize=10
```

**参数:**
- `year`: 年份 (URL路径参数)
- `month`: 月份 (URL路径参数)
- `pageSize`: 每页记录数 (查询参数, 默认: 10)

**响应:**
```json
{
  "page": 1
}
```

### 获取阅读进度

```
GET /api/reading-progress
```

**响应:**
```json
{
  "progress": {
    "last_viewed_id": 10,
    "last_viewed_datetime": "2023-01-01 12:00:00"
  }
}
```

### 更新阅读进度

```
POST /api/reading-progress
Content-Type: application/json
```

**请求体:**
```json
{
  "lastViewedId": 10,
  "lastViewedDatetime": "2023-01-01 12:00:00"
}
```

**响应:**
```json
{
  "success": true
}
```

### 获取指定记录ID所在的页面

```
GET /api/record/<id>/page?pageSize=10
```

**参数:**
- `id`: 记录ID (URL路径参数)
- `pageSize`: 每页记录数 (查询参数, 默认: 10)

**响应:**
```json
{
  "page": 1
}
```

### 获取最新记录所在的页面

```
GET /api/latest-page?pageSize=10
```

**参数:**
- `pageSize`: 每页记录数 (查询参数, 默认: 10)

**响应:**
```json
{
  "page": 4235
}
```

## 媒体相关接口

### 保存媒体文件

```
POST /api/save-media-file
Content-Type: multipart/form-data
```

**参数:**
- `file`: 上传的文件 (multipart/form-data)

**响应:**
```json
{
  "success": true,
  "message": "文件保存成功",
  "path": "media/filename.jpg"
}
```

**说明:**
- 文件保存到 `media/` 目录
- 文件名格式: `{datetime}_{id}_{index}.{ext}`
- 支持的文件类型: 图片、视频

### 上传媒体文件

```
POST /api/upload-media
Content-Type: multipart/form-data
```

**参数:**
- `file`: 上传的文件 (multipart/form-data)

**响应:**
```json
{
  "success": true,
  "message": "文件上传成功"
}
```

**说明:**
- 用于通过文件选择器上传媒体
- 文件会自动重命名并保存到 `media/` 目录

## 搜索历史相关接口

### 添加搜索历史记录

```
POST /api/search-history
Content-Type: application/json
```

**请求体:**
```json
{
  "keyword": "搜索关键词"
}
```

**响应:**
```json
{
  "success": true
}
```

### 获取搜索历史记录

```
GET /api/search-history?limit=10
```

**参数:**
- `limit`: 返回记录数 (查询参数, 默认: 10)

**响应:**
```json
{
  "history": [
    {
      "keyword": "搜索关键词",
      "search_datetime": "2023-01-01 12:00:00"
    }
  ]
}
```

### 删除搜索历史记录

```
DELETE /api/search-history/<keyword>
```

**参数:**
- `keyword`: 搜索关键词 (URL路径参数)

**响应:**
```json
{
  "success": true
}
```

## 错误响应

所有接口在发生错误时返回以下格式:

```
{
  "error": "错误描述信息"
}
```

**常见错误码:**
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 前端模块调用示例

### 使用 fetch 调用 API

```
// 获取记录
const response = await fetch('/api/records?page=1&pageSize=10');
const data = await response.json();

// 添加记录
const response = await fetch('/api/records', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    datetime: '2023-01-01 12:00:00',
    content: '推文内容',
    channel: 'web',
    media_type: 'text',
    media_path: null
  })
});
const data = await response.json();

// 上传文件
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const response = await fetch('/api/save-media-file', {
  method: 'POST',
  body: formData
});
const data = await response.json();
```

### 模块化调用

在新的模块化架构中，API调用分散在各个模块中:

- [`modules/pageLoader.js`](../modules/pageLoader.js): 加载记录、搜索记录
- [`modules/edit.js`](../modules/edit.js): 添加、更新、删除记录
- [`modules/mediaHandler.js`](../modules/mediaHandler.js): 保存和上传媒体文件
- [`modules/search.js`](../modules/search.js): 搜索历史管理
- [`modules/appInit.js`](../modules/appInit.js): 阅读进度、年月数据

## 性能优化

### 前端缓存

前端实现了基于Map的缓存机制，缓存时间为5分钟:

```
// globalState.js
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
```

### 分页加载

- 默认每页加载10条记录
- 支持动态调整每页记录数
- 使用DocumentFragment优化DOM渲染

### 搜索优化

- 搜索输入使用300ms防抖
- 搜索结果同样支持缓存
- "历史上的今天"搜索功能
