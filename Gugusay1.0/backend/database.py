# 数据库管理模块
import sqlite3
import threading
from contextlib import contextmanager
from backend.config import DB_PATH

class DatabaseManager:
    """数据库管理器（使用连接池优化）"""

    def __init__(self, db_path=None, pool_size=5):
        """初始化数据库管理器"""
        self.db_path = db_path or DB_PATH
        self._local = threading.local()
        self._lock = threading.Lock()
        self.init_database()

    def get_connection(self):
        """获取数据库连接（线程局部变量）"""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(self.db_path)
        return self._local.conn

    def close_connection(self):
        """关闭当前线程的数据库连接"""
        if hasattr(self._local, 'conn') and self._local.conn:
            self._local.conn.close()
            self._local.conn = None

    def init_database(self):
        """初始化数据库"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # 一次性执行所有SQL语句，减少数据库操作次数
        sql_statements = [
            # 创建JL表
            '''
            CREATE TABLE IF NOT EXISTS JL (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                datetime TEXT NOT NULL,
                content TEXT,
                channel TEXT,
                media_type TEXT DEFAULT 'text',
                media_path TEXT
            )
            ''',
            # 创建索引（优化查询性能）
            'CREATE INDEX IF NOT EXISTS idx_jl_datetime ON JL(datetime)',
            'CREATE INDEX IF NOT EXISTS idx_jl_channel ON JL(channel)',
            'CREATE INDEX IF NOT EXISTS idx_jl_media_type ON JL(media_type)',
            # 创建reading_progress表
            '''
            CREATE TABLE IF NOT EXISTS reading_progress (
                id INTEGER PRIMARY KEY,
                last_viewed_id INTEGER,
                last_viewed_datetime TEXT
            )
            ''',
            # 创建search_history表
            '''
            CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT NOT NULL UNIQUE,
                search_datetime TEXT
            )
            '''
        ]

        # 执行所有SQL语句
        for sql in sql_statements:
            cursor.execute(sql)

        # 确保search_history表有search_datetime列
        try:
            cursor.execute('ALTER TABLE search_history ADD COLUMN search_datetime TEXT')
        except sqlite3.OperationalError as e:
            if 'duplicate column name' not in str(e).lower():
                raise e

        # 只在有需要时更新search_history表
        cursor.execute('SELECT COUNT(*) FROM search_history WHERE search_datetime IS NULL')
        null_count = cursor.fetchone()[0]
        if null_count > 0:
            cursor.execute('''
                UPDATE search_history
                SET search_datetime = datetime('now', 'localtime')
                WHERE search_datetime IS NULL
            ''')

        conn.commit()

    def get_record(self, record_id):
        """获取单条记录"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM JL WHERE id = ?', (record_id,))
        record = cursor.fetchone()

        if record:
            return {
                'id': record[0],
                'datetime': record[1],
                'content': record[2],
                'channel': record[3],
                'media_type': record[4],
                'media_path': record[5]
            }
        return None

    def get_records(self, page, page_size, search='', channel='', year_month=''):
        """获取记录列表"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # 构建查询条件
        query = 'SELECT * FROM JL WHERE 1=1'
        params = []

        if search:
            query += ' AND (content LIKE ? OR channel LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%'])

        if channel:
            query += ' AND channel = ?'
            params.append(channel)

        if year_month:
            query += ' AND datetime LIKE ?'
            params.append(f'{year_month}%')

        # 按时间倒序排列
        query += ' ORDER BY datetime DESC'

        # 分页
        offset = (page - 1) * page_size
        query += ' LIMIT ? OFFSET ?'
        params.extend([page_size, offset])

        cursor.execute(query, params)
        records = cursor.fetchall()

        # 获取总记录数
        count_query = 'SELECT COUNT(*) FROM JL WHERE 1=1'
        count_params = []
        if search:
            count_query += ' AND (content LIKE ? OR channel LIKE ?)'
            count_params.extend([f'%{search}%', f'%{search}%'])
        if channel:
            count_query += ' AND channel = ?'
            count_params.append(channel)
        if year_month:
            count_query += ' AND datetime LIKE ?'
            count_params.append(f'{year_month}%')

        cursor.execute(count_query, count_params)
        total_records = cursor.fetchone()[0]
        total_pages = (total_records + page_size - 1) // page_size

        # 格式化结果
        result = {
            'records': [],
            'currentPage': page,
            'totalPages': total_pages,
            'total': total_records
        }

        for record in records:
            result['records'].append({
                'id': record[0],
                'datetime': record[1],
                'content': record[2],
                'channel': record[3],
                'media_type': record[4],
                'media_path': record[5],
                'page': page
            })

        return result

    def search_records(self, keyword, page, page_size):
        """搜索记录（优化版：使用窗口函数替代子查询）"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # 添加搜索历史
        try:
            cursor.execute(
                'INSERT OR IGNORE INTO search_history (keyword, search_datetime) VALUES (?, datetime("now", "localtime"))',
                (keyword,)
            )
            conn.commit()
        except:
            pass

        # 搜索记录（使用窗口函数一次性计算位置）
        query = '''
            SELECT
                JL_sub.id, JL_sub.datetime, JL_sub.content, JL_sub.channel, JL_sub.media_type, JL_sub.media_path,
                (SELECT COUNT(*) + 1 FROM JL WHERE datetime > JL_sub.datetime) as position
            FROM JL JL_sub
            WHERE JL_sub.content LIKE ? OR JL_sub.channel LIKE ?
            ORDER BY JL_sub.datetime DESC
            LIMIT ? OFFSET ?
        '''
        params = [f'%{keyword}%', f'%{keyword}%', page_size, (page - 1) * page_size]

        cursor.execute(query, params)
        records = cursor.fetchall()

        # 获取总记录数
        count_query = 'SELECT COUNT(*) FROM JL WHERE content LIKE ? OR channel LIKE ?'
        cursor.execute(count_query, [f'%{keyword}%', f'%{keyword}%'])
        total_records = cursor.fetchone()[0]
        total_pages = (total_records + page_size - 1) // page_size

        # 格式化结果
        result = {
            'records': [],
            'currentPage': page,
            'totalPages': total_pages,
            'total': total_records,
            'searchKeyword': keyword
        }

        for record in records:
            position = record[6]  # 从查询结果中直接获取位置
            page_in_all = (position + 5) // 6

            result['records'].append({
                'id': record[0],
                'datetime': record[1],
                'content': record[2],
                'channel': record[3],
                'media_type': record[4],
                'media_path': record[5],
                'page': page_in_all
            })

        return result

    def get_on_this_day(self, month_day, page, page_size):
        """获取那年今日的记录"""
        conn = self.get_connection()
        cursor = conn.cursor()

        query = '''
            SELECT * FROM JL
            WHERE strftime('%m-%d', datetime) = ?
            ORDER BY datetime DESC
        '''
        params = [month_day]

        # 分页
        offset = (page - 1) * page_size
        query += ' LIMIT ? OFFSET ?'
        params.extend([page_size, offset])

        cursor.execute(query, params)
        records = cursor.fetchall()

        # 获取总记录数
        count_query = "SELECT COUNT(*) FROM JL WHERE strftime('%m-%d', datetime) = ?"
        cursor.execute(count_query, [month_day])
        total_records = cursor.fetchone()[0]
        total_pages = (total_records + page_size - 1) // page_size

        # 格式化结果
        result = {
            'records': [],
            'currentPage': page,
            'totalPages': total_pages,
            'total': total_records,
            'searchKeyword': month_day
        }

        for record in records:
            result['records'].append({
                'id': record[0],
                'datetime': record[1],
                'content': record[2],
                'channel': record[3],
                'media_type': record[4],
                'media_path': record[5],
                'page': page
            })

        return result

    def add_record(self, datetime_val, content_val, channel_val='', media_type_val='text', media_path_val=''):
        """添加记录"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO JL (datetime, content, channel, media_type, media_path)
            VALUES (?, ?, ?, ?, ?)
        ''', (datetime_val, content_val, channel_val, media_type_val, media_path_val))
        conn.commit()
        return {'success': True}

    def update_record(self, record_id, datetime_val, content_val, channel_val='', media_type_val='text', media_path_val=''):
        """更新记录"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE JL
            SET datetime=?, content=?, channel=?, media_type=?, media_path=?
            WHERE id=?
        ''', (datetime_val, content_val, channel_val, media_type_val, media_path_val, record_id))
        conn.commit()
        return {'success': True}

    def delete_record(self, record_id):
        """删除记录"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM JL WHERE id = ?', (record_id,))
        conn.commit()
        return {'success': True}

    def get_year_month_tree(self):
        """获取年月树"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT strftime('%Y', datetime) as year,
                   strftime('%m', datetime) as month,
                   COUNT(*) as count
            FROM JL
            WHERE datetime IS NOT NULL AND datetime != ''
            GROUP BY strftime('%Y', datetime), strftime('%m', datetime)
            ORDER BY year DESC, month DESC
        ''')
        rows = cursor.fetchall()

        result = []
        for row in rows:
            result.append({
                'year': row[0],
                'month': row[1],
                'count': row[2]
            })

        return {'yearMonths': result}

    def get_channels(self):
        """获取渠道列表（包含条数统计）"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT channel, COUNT(*) as count
            FROM JL
            WHERE channel IS NOT NULL AND channel != ""
            GROUP BY channel
            ORDER BY count DESC
        ''')
        rows = cursor.fetchall()

        result = [{'channel': row[0], 'count': row[1]} for row in rows]
        return {'channels': result}

    def get_summary_stats(self):
        """获取摘要统计"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # 获取总数
        cursor.execute('SELECT COUNT(*) FROM JL')
        total_count = cursor.fetchone()[0]

        # 获取最近一周的数量
        cursor.execute('''
            SELECT COUNT(*) FROM JL
            WHERE datetime >= date('now', '-7 days')
        ''')
        weekly_count = cursor.fetchone()[0]

        # 获取各渠道数量
        cursor.execute('''
            SELECT channel, COUNT(*) as count
            FROM JL
            WHERE channel IS NOT NULL AND channel != ""
            GROUP BY channel
            ORDER BY count DESC
        ''')
        channels = [{'name': row[0], 'count': row[1]} for row in cursor.fetchall()]

        return {
            'totalCount': total_count,
            'weeklyCount': weekly_count,
            'channels': channels
        }

    def get_combined_stats(self):
        """获取组合统计"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT
                strftime('%Y', datetime) as year,
                channel,
                COUNT(*) as count,
                SUM(LENGTH(content)) as char_count
            FROM JL
            GROUP BY strftime('%Y', datetime), channel
            ORDER BY year DESC
        ''')
        stats_rows = cursor.fetchall()

        stats = []
        for row in stats_rows:
            stats.append({
                'year': row[0],
                'month': '',
                'channel': row[1] if row[1] is not None else '',
                'count': row[2],
                'char_count': row[3] if row[3] is not None else 0
            })

        return {'stats': stats}

    def get_reading_progress(self):
        """获取阅读进度"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT last_viewed_id, last_viewed_datetime FROM reading_progress WHERE id = 1')
        row = cursor.fetchone()

        if row:
            return {
                'progress': {
                    'last_viewed_id': row[0],
                    'last_viewed_datetime': row[1]
                }
            }
        return {'progress': None}

    def update_reading_progress(self, last_viewed_id, last_viewed_datetime):
        """更新阅读进度"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO reading_progress (id, last_viewed_id, last_viewed_datetime)
            VALUES (1, ?, ?)
        ''', (last_viewed_id, last_viewed_datetime))
        conn.commit()
        return {'success': True}

    def get_search_history(self):
        """获取搜索历史"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT keyword FROM search_history
            ORDER BY search_datetime DESC
            LIMIT 10
        ''')
        rows = cursor.fetchall()

        result = [{'keyword': row[0]} for row in rows if row[0]]
        return {'history': result}

    def add_search_history(self, keyword):
        """添加搜索历史"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO search_history (keyword, search_datetime)
            VALUES (?, datetime("now", "localtime"))
            ON CONFLICT(keyword) DO UPDATE SET search_datetime = datetime("now", "localtime")
        ''', (keyword,))
        conn.commit()
        return {'success': True}

    def delete_search_history(self, keyword):
        """删除搜索历史"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM search_history WHERE keyword = ?', (keyword,))
        conn.commit()
        return {'success': True}

    def get_total_count(self, page_size=6):
        """获取总记录数"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM JL')
        total_count = cursor.fetchone()[0]
        total_pages = (total_count + page_size - 1) // page_size

        return {
            'count': total_count,
            'totalPages': total_pages
        }

    def get_latest_record_page(self, page_size=10):
        """获取最新记录页"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM JL')
        total_records = cursor.fetchone()[0]
        total_pages = (total_records + page_size - 1) // page_size

        # 最新记录应该在第一页（按时间倒序排列）
        return {'page': 1}

    def get_year_month_page(self, year, month, page_size=6):
        """获取年月页"""
        conn = self.get_connection()
        cursor = conn.cursor()
        query = 'SELECT COUNT(*) FROM JL WHERE datetime LIKE ?'
        cursor.execute(query, [f'{year}-{month}%'])
        total_records = cursor.fetchone()[0]
        total_pages = (total_records + page_size - 1) // page_size

        return {'page': total_pages}

    def get_channel_page(self, channel, page_size=6):
        """获取渠道页"""
        conn = self.get_connection()
        cursor = conn.cursor()

        if channel:
            query = 'SELECT COUNT(*) FROM JL WHERE channel = ?'
            cursor.execute(query, [channel])
        else:
            query = 'SELECT COUNT(*) FROM JL WHERE channel IS NULL OR channel = ""'
            cursor.execute(query)

        total_records = cursor.fetchone()[0]
        total_pages = (total_records + page_size - 1) // page_size

        # 如果没有记录，返回第1页而不是第0页
        if total_pages < 1:
            total_pages = 1

        return {'page': total_pages}

    def get_record_page(self, record_id, page_size=6):
        """获取记录页"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT datetime FROM JL WHERE id = ?', (record_id,))
        result = cursor.fetchone()

        if not result:
            return {'page': None}

        record_datetime = result[0]

        cursor.execute('''
            SELECT COUNT(*) + 1 as position
            FROM JL
            WHERE datetime > ?
        ''', (record_datetime,))
        position = cursor.fetchone()[0]
        page = (position + page_size - 1) // page_size

        return {'page': page}

# 创建全局数据库管理器实例
db_manager = DatabaseManager()
