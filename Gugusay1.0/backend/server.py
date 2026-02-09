# HTTP服务器模块
import os
import json
import urllib.parse
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from backend.config import APP_ROOT, SERVER_HOST, SERVER_PORT, MEDIA_DIR
from backend.database import db_manager

class RequestHandler(BaseHTTPRequestHandler):
    """HTTP请求处理器"""
    
    def log_message(self, format, *args):
        """禁用默认的日志输出"""
        pass
    
    def do_GET(self):
        """处理GET请求"""
        if self.path == '/' or self.path == '/index.html':
            file_path = os.path.join(APP_ROOT, 'index.html')
            self.serve_file(file_path, 'text/html')
        elif self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            # 处理静态文件
            relative_path = self.path.lstrip('/')
            file_path = os.path.join(APP_ROOT, relative_path)
            if os.path.exists(file_path) and not os.path.isdir(file_path):
                mime_type, _ = mimetypes.guess_type(file_path)
                if mime_type is None:
                    mime_type = 'application/octet-stream'
                self.serve_file(file_path, mime_type)
            else:
                self.send_error(404)
    
    def do_POST(self):
        """处理POST请求"""
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_error(404)
    
    def do_PUT(self):
        """处理PUT请求"""
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_error(404)
    
    def do_DELETE(self):
        """处理DELETE请求"""
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_error(404)
    
    def handle_api_request(self):
        """处理API请求"""
        parsed_path = urllib.parse.urlparse(self.path)
        path_parts = parsed_path.path.strip('/').split('/')
        
        if len(path_parts) >= 2 and path_parts[0] == 'api':
            if path_parts[1] == 'records':
                self.handle_records_api(path_parts, parsed_path)
            elif path_parts[1] == 'save-media-file' and self.command == 'POST':
                self.save_media_file()
            elif path_parts[1] == 'stats':
                self.handle_stats_api(path_parts)
            elif path_parts[1] == 'progress':
                self.handle_progress_api()
            elif path_parts[1] == 'search':
                self.handle_search_api(path_parts, parsed_path)
            elif path_parts[1] == 'search-history':
                self.handle_search_history_api(path_parts)
            elif path_parts[1] == 'year-months':
                self.send_json_response(db_manager.get_year_month_tree())
            elif path_parts[1] == 'channels':
                self.send_json_response(db_manager.get_channels())
            elif path_parts[1] == 'total-count':
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_size_str = query_params.get('pageSize', ['6'])[0]
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6
                self.send_json_response(db_manager.get_total_count(page_size))
            elif path_parts[1] == 'update':
                self.handle_update_api(path_parts)
            elif path_parts[1] == 'init-data':
                # 合并API：一次性返回初始化所需的所有数据
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_size_str = query_params.get('pageSize', ['6'])[0]
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6

                # 并行获取所有数据
                total_count_data = db_manager.get_total_count(page_size)
                latest_page_data = db_manager.get_latest_record_page(page_size)

                self.send_json_response({
                    'totalRecords': total_count_data['count'],
                    'totalPages': total_count_data['totalPages'],
                    'latestPage': latest_page_data['page']
                })
            elif path_parts[1] == 'on-this-day':
                query_params = urllib.parse.parse_qs(parsed_path.query)
                keyword = query_params.get('keyword', [''])[0]
                page_str = query_params.get('page', ['1'])[0]
                page_size_str = query_params.get('pageSize', ['6'])[0]
                page = int(page_str) if page_str and page_str != 'undefined' else 1
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6
                self.send_json_response(db_manager.get_on_this_day(keyword, page, page_size))
            elif path_parts[1] == 'year-month' and len(path_parts) >= 4:
                year = path_parts[2]
                month = path_parts[3]
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_size_str = query_params.get('pageSize', ['6'])[0]
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6
                self.send_json_response(db_manager.get_year_month_page(year, month, page_size))
            elif path_parts[1] == 'channel' and len(path_parts) >= 3:
                channel = '/'.join(path_parts[2:])
                # 解码URL编码的渠道名称
                channel = urllib.parse.unquote(channel)
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_size_str = query_params.get('pageSize', ['6'])[0]
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6
                self.send_json_response(db_manager.get_channel_page(channel, page_size))
            elif path_parts[1] == 'record' and len(path_parts) >= 3 and path_parts[2].isdigit():
                record_id = int(path_parts[2])
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_size_str = query_params.get('pageSize', ['6'])[0]
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6
                self.send_json_response(db_manager.get_record_page(record_id, page_size))
            elif path_parts[1] == 'latest-page':
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_size_str = query_params.get('pageSize', ['10'])[0]
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 10
                self.send_json_response(db_manager.get_latest_record_page(page_size))
            else:
                self.send_error(404)
        else:
            self.send_error(404)
    
    def handle_records_api(self, path_parts, parsed_path):
        """处理记录相关API"""
        if self.command == 'GET':
            if len(path_parts) == 3 and path_parts[2].isdigit():
                record_id = int(path_parts[2])
                record = db_manager.get_record(record_id)
                if record:
                    self.send_json_response(record)
                else:
                    self.send_error(404)
            else:
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_str = query_params.get('page', ['1'])[0]
                page_size_str = query_params.get('pageSize', ['6'])[0]
                page = int(page_str) if page_str and page_str != 'undefined' else 1
                page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6
                search = query_params.get('search', [''])[0]
                channel = query_params.get('channel', [''])[0]
                year_month = query_params.get('yearMonth', [''])[0]
                self.send_json_response(db_manager.get_records(page, page_size, search, channel, year_month))
        elif self.command == 'POST':
            self.add_record()
        elif len(path_parts) == 3 and path_parts[2].isdigit():
            record_id = int(path_parts[2])
            if self.command == 'PUT':
                self.update_record(record_id)
            elif self.command == 'DELETE':
                self.send_json_response(db_manager.delete_record(record_id))
    
    def handle_update_api(self, path_parts):
        """处理更新相关API"""
        from backend.updater import updater
        
        if len(path_parts) >= 3:
            action = path_parts[2]
            
            if action == 'check':
                # 检查更新
                result = updater.check_update()
                self.send_json_response(result)
                
            elif action == 'database' and self.command == 'POST':
                # 更新数据库
                result = updater.download_database()
                self.send_json_response(result)
                
            elif action == 'media' and self.command == 'POST':
                # 更新媒体文件
                result = updater.download_media()
                self.send_json_response(result)
                
            elif action == 'all' and self.command == 'POST':
                # 执行完整更新
                result = updater.update_all()
                self.send_json_response(result)
                
            elif action == 'config' and self.command == 'GET':
                # 获取更新配置
                self.send_json_response({
                    'update_url': updater.update_url
                })
                
            elif action == 'config' and self.command == 'PUT':
                # 更新配置
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                data = json.loads(put_data.decode('utf-8'))
                url = data.get('update_url', '')
                success = updater._save_update_url(url)
                updater.update_url = url
                self.send_json_response({'success': success})
            else:
                self.send_error(404)
        else:
            self.send_error(404)
    
    def handle_stats_api(self, path_parts):
        """处理统计相关API"""
        if len(path_parts) >= 3:
            if path_parts[2] == 'year-month':
                self.send_json_response(db_manager.get_year_month_tree())
            elif path_parts[2] == 'channels':
                self.send_json_response(db_manager.get_channels())
            elif path_parts[2] == 'summary':
                self.send_json_response(db_manager.get_summary_stats())
            elif path_parts[2] == 'combined':
                self.send_json_response(db_manager.get_combined_stats())
    
    def handle_progress_api(self):
        """处理阅读进度API"""
        if self.command == 'GET':
            self.send_json_response(db_manager.get_reading_progress())
        elif self.command == 'POST':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            last_viewed_id = data.get('lastViewedId')
            last_viewed_datetime = data.get('lastViewedDatetime')
            self.send_json_response(db_manager.update_reading_progress(last_viewed_id, last_viewed_datetime))
    
    def handle_search_api(self, path_parts, parsed_path):
        """处理搜索API"""
        if self.command == 'GET':
            query_params = urllib.parse.parse_qs(parsed_path.query)
            keyword = query_params.get('keyword', [''])[0]
            page_str = query_params.get('page', ['1'])[0]
            page_size_str = query_params.get('pageSize', ['6'])[0]
            page = int(page_str) if page_str and page_str != 'undefined' else 1
            page_size = int(page_size_str) if page_size_str and page_size_str != 'undefined' else 6
            if keyword:
                self.send_json_response(db_manager.search_records(keyword, page, page_size))
            else:
                self.send_json_response(db_manager.get_search_history())
        elif self.command == 'POST':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            keyword = data.get('keyword')
            self.send_json_response(db_manager.add_search_history(keyword))
    
    def handle_search_history_api(self, path_parts):
        """处理搜索历史API"""
        if self.command == 'GET':
            self.send_json_response(db_manager.get_search_history())
        elif self.command == 'POST':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            keyword = data.get('keyword')
            self.send_json_response(db_manager.add_search_history(keyword))
        elif self.command == 'DELETE' and len(path_parts) >= 3:
            keyword = '/'.join(path_parts[2:])
            keyword = urllib.parse.unquote(keyword)
            self.send_json_response(db_manager.delete_search_history(keyword))
    
    def add_record(self):
        """添加记录"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            datetime_val = data.get('datetime', '')
            content_val = data.get('content', '')
            channel_val = data.get('channel', '')
            media_type_val = data.get('media_type', 'text')
            media_path_val = data.get('media_path', '')
            
            if not datetime_val or not content_val:
                response = {
                    'success': False,
                    'error': '缺少必要字段: datetime 或 content'
                }
                self.send_json_response(response)
                return
            
            self.send_json_response(
                db_manager.add_record(datetime_val, content_val, channel_val, media_type_val, media_path_val)
            )
        except json.JSONDecodeError:
            response = {'success': False, 'error': '无效的JSON格式'}
            self.send_json_response(response)
        except Exception as e:
            response = {'success': False, 'error': f'服务器内部错误: {str(e)}'}
            self.send_json_response(response)
    
    def update_record(self, record_id):
        """更新记录"""
        content_length = int(self.headers['Content-Length'])
        put_data = self.rfile.read(content_length)
        data = json.loads(put_data.decode('utf-8'))
        
        datetime_val = data.get('datetime', '')
        content_val = data.get('content', '')
        channel_val = data.get('channel', '')
        media_type_val = data.get('media_type', 'text')
        media_path_val = data.get('media_path', '')
        
        self.send_json_response(
            db_manager.update_record(record_id, datetime_val, content_val, channel_val, media_type_val, media_path_val)
        )
    
    def save_media_file(self):
        """保存媒体文件"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        content_type = self.headers['Content-Type']
        if 'multipart/form-data' in content_type:
            boundary = content_type.split('boundary=')[1]
            self.handle_multipart_data(post_data, boundary)
        else:
            response = {'success': False, 'error': '不支持的内容类型'}
            self.send_json_response(response)
    
    def handle_multipart_data(self, post_data, boundary):
        """处理multipart数据"""
        import time
        
        boundary_bytes = boundary.encode('utf-8')
        parts = post_data.split(b'--' + boundary_bytes)
        
        file_data = None
        file_name = None
        datetime_val = None
        record_id = '1'
        
        for part in parts:
            if b'filename="' in part:
                name_start = part.find(b'name="') + 6
                name_end = part.find(b'"', name_start)
                field_name = part[name_start:name_end].decode('utf-8')
                
                filename_start = part.find(b'filename="') + 10
                filename_end = part.find(b'"', filename_start)
                file_name = part[filename_start:filename_end].decode('utf-8')
                
                content_start = part.find(b'\r\n\r\n') + 4
                content_end = part.rfind(b'\r\n')
                file_data = part[content_start:content_end]
            elif b'name="datetime"' in part:
                content_start = part.find(b'\r\n\r\n') + 4
                content_end = part.rfind(b'\r\n')
                datetime_val = part[content_start:content_end].decode('utf-8')
            elif b'name="recordId"' in part:
                content_start = part.find(b'\r\n\r\n') + 4
                content_end = part.rfind(b'\r\n')
                record_id = part[content_start:content_end].decode('utf-8')
        
        if file_data and file_name:
            timestamp = str(int(time.time()))
            if datetime_val:
                try:
                    date_part = datetime_val.split(' ')[0]
                    time_part = datetime_val.split(' ')[1]
                    
                    if date_part and time_part:
                        year = date_part.split('-')[0]
                        month = date_part.split('-')[1]
                        day = date_part.split('-')[2]
                        hour = time_part.split(':')[0]
                        minute = time_part.split(':')[1]
                        timestamp = f"{year}{month}{day}{hour}{minute}"
                except:
                    pass
            
            file_extension = os.path.splitext(file_name)[1]
            
            file_index = '1'
            try:
                base_name = os.path.splitext(file_name)[0]
                if '_' in base_name:
                    parts = base_name.split('_')
                    if len(parts) >= 3:
                        file_index = parts[-1]
            except:
                pass
            
            new_file_name = f"{timestamp}_{record_id}_{file_index}{file_extension}"
            file_path = os.path.join(MEDIA_DIR, new_file_name)
            
            try:
                with open(file_path, 'wb') as f:
                    f.write(file_data)
                
                response = {
                    'success': True,
                    'message': '文件保存成功',
                    'path': f'media/{new_file_name}'
                }
            except Exception as e:
                response = {
                    'success': False,
                    'error': f'保存文件时出错: {str(e)}'
                }
        else:
            response = {
                'success': False,
                'error': '没有接收到有效的文件数据'
            }
        
        self.send_json_response(response)
    
    def serve_file(self, file_path, content_type):
        """提供文件服务"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
        except (ConnectionAbortedError, BrokenPipeError):
            pass
    
    def send_json_response(self, data):
        """发送JSON响应"""
        try:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
        except (ConnectionAbortedError, BrokenPipeError):
            pass

def start_server():
    """启动HTTP服务器"""
    server_address = (SERVER_HOST, SERVER_PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f'服务器启动在 http://{SERVER_HOST}:{SERVER_PORT}')
    httpd.serve_forever()
