import json
import mimetypes
import os
import secrets
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from backend.config import APP_ROOT, MEDIA_DIR, SERVER_HOST, SERVER_PORT
from backend.database import db_manager
from backend.update_manager import update_manager

APP_ROOT_PATH = Path(APP_ROOT).resolve()
UPDATE_API_TOKEN = secrets.token_urlsafe(24)
LOCAL_ORIGINS = {f"http://{SERVER_HOST}:{SERVER_PORT}", "http://localhost:3000", "http://127.0.0.1:3000"}


class RequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        request_path = parsed.path

        if request_path == "/" or request_path == "/index.html":
            self.serve_file(APP_ROOT_PATH / "index.html", "text/html")
            return
        if request_path.startswith("/api/"):
            self.handle_api_request()
            return
        relative_path = urllib.parse.unquote(request_path.lstrip("/"))
        file_path = self.safe_path(APP_ROOT_PATH, relative_path)
        if file_path and file_path.exists() and file_path.is_file():
            mime_type, _ = mimetypes.guess_type(str(file_path))
            self.serve_file(file_path, mime_type or "application/octet-stream")
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path.startswith("/api/"):
            self.handle_api_request()
        else:
            self.send_error(404)

    def do_PUT(self):
        if self.path.startswith("/api/"):
            self.handle_api_request()
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith("/api/"):
            self.handle_api_request()
        else:
            self.send_error(404)

    def safe_path(self, root, relative_path):
        if not relative_path:
            return None
        candidate = (Path(root) / relative_path).resolve()
        try:
            candidate.relative_to(root)
        except ValueError:
            return None
        return candidate

    def parse_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return {}
        raw = self.rfile.read(content_length)
        return json.loads(raw.decode("utf-8"))

    def is_local_request(self):
        host = (self.headers.get("Host") or "").lower()
        origin = (self.headers.get("Origin") or "").lower()
        host_ok = host in {f"{SERVER_HOST}:{SERVER_PORT}", "localhost:3000", "127.0.0.1:3000"}
        origin_ok = (not origin) or origin in {x.lower() for x in LOCAL_ORIGINS}
        return host_ok and origin_ok

    def require_update_auth(self):
        if not self.is_local_request():
            self.send_json_response({"success": False, "error": "forbidden"}, status=403)
            return False
        token = self.headers.get("X-Update-Token", "")
        if token != UPDATE_API_TOKEN:
            self.send_json_response({"success": False, "error": "invalid token"}, status=403)
            return False
        return True

    def handle_api_request(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path_parts = parsed_path.path.strip("/").split("/")
        if len(path_parts) < 2 or path_parts[0] != "api":
            self.send_error(404)
            return

        resource = path_parts[1]
        if resource == "records":
            self.handle_records_api(path_parts, parsed_path)
        elif resource == "save-media-file" and self.command == "POST":
            self.save_media_file()
        elif resource == "stats":
            self.handle_stats_api(path_parts)
        elif resource in {"progress", "reading-progress"}:
            self.handle_progress_api()
        elif resource == "search":
            self.handle_search_api(path_parts, parsed_path)
        elif resource == "search-history":
            self.handle_search_history_api(path_parts)
        elif resource == "year-months":
            self.send_json_response(db_manager.get_year_month_tree())
        elif resource == "channels":
            self.send_json_response(db_manager.get_channels())
        elif resource == "total-count":
            query_params = urllib.parse.parse_qs(parsed_path.query)
            page_size_str = query_params.get("pageSize", ["6"])[0]
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
            self.send_json_response(db_manager.get_total_count(page_size))
        elif resource == "update":
            self.handle_update_api(path_parts)
        elif resource == "init-data":
            query_params = urllib.parse.parse_qs(parsed_path.query)
            page_size_str = query_params.get("pageSize", ["6"])[0]
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
            total_count_data = db_manager.get_total_count(page_size)
            latest_page_data = db_manager.get_latest_record_page(page_size)
            self.send_json_response(
                {
                    "totalRecords": total_count_data["count"],
                    "totalPages": total_count_data["totalPages"],
                    "latestPage": latest_page_data["page"],
                }
            )
        elif resource == "on-this-day":
            query_params = urllib.parse.parse_qs(parsed_path.query)
            keyword = query_params.get("keyword", [""])[0]
            page_str = query_params.get("page", ["1"])[0]
            page_size_str = query_params.get("pageSize", ["6"])[0]
            page = int(page_str) if page_str and page_str != "undefined" else 1
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
            self.send_json_response(db_manager.get_on_this_day(keyword, page, page_size))
        elif resource == "year-month" and len(path_parts) >= 4:
            year = path_parts[2]
            month = path_parts[3]
            query_params = urllib.parse.parse_qs(parsed_path.query)
            page_size_str = query_params.get("pageSize", ["6"])[0]
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
            self.send_json_response(db_manager.get_year_month_page(year, month, page_size))
        elif resource == "channel" and len(path_parts) >= 3:
            channel = urllib.parse.unquote("/".join(path_parts[2:]))
            query_params = urllib.parse.parse_qs(parsed_path.query)
            page_size_str = query_params.get("pageSize", ["6"])[0]
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
            self.send_json_response(db_manager.get_channel_page(channel, page_size))
        elif resource == "record" and len(path_parts) >= 3 and path_parts[2].isdigit():
            record_id = int(path_parts[2])
            query_params = urllib.parse.parse_qs(parsed_path.query)
            page_size_str = query_params.get("pageSize", ["6"])[0]
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
            self.send_json_response(db_manager.get_record_page(record_id, page_size))
        elif resource == "latest-page":
            query_params = urllib.parse.parse_qs(parsed_path.query)
            page_size_str = query_params.get("pageSize", ["10"])[0]
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 10
            self.send_json_response(db_manager.get_latest_record_page(page_size))
        else:
            self.send_error(404)

    def handle_records_api(self, path_parts, parsed_path):
        if self.command == "GET":
            if len(path_parts) == 3 and path_parts[2].isdigit():
                record_id = int(path_parts[2])
                record = db_manager.get_record(record_id)
                if record:
                    self.send_json_response(record)
                else:
                    self.send_error(404)
            else:
                query_params = urllib.parse.parse_qs(parsed_path.query)
                page_str = query_params.get("page", ["1"])[0]
                page_size_str = query_params.get("pageSize", ["6"])[0]
                page = int(page_str) if page_str and page_str != "undefined" else 1
                page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
                search = query_params.get("search", [""])[0]
                channel = query_params.get("channel", [""])[0]
                year_month = query_params.get("yearMonth", [""])[0]
                self.send_json_response(db_manager.get_records(page, page_size, search, channel, year_month))
        elif self.command == "POST":
            self.add_record()
        elif len(path_parts) == 3 and path_parts[2].isdigit():
            record_id = int(path_parts[2])
            if self.command == "PUT":
                self.update_record(record_id)
            elif self.command == "DELETE":
                self.send_json_response(db_manager.delete_record(record_id))

    def handle_update_api(self, path_parts):
        if len(path_parts) < 3:
            self.send_error(404)
            return
        action = path_parts[2]

        if action == "config" and self.command == "GET":
            if not self.is_local_request():
                self.send_json_response({"success": False, "error": "forbidden"}, status=403)
                return
            cfg = update_manager.get_config()
            cfg["request_token"] = UPDATE_API_TOKEN
            self.send_json_response(cfg)
            return

        if not self.require_update_auth():
            return

        if action == "check" and self.command == "GET":
            self.send_json_response(update_manager.check_update())
        elif action == "start" and self.command == "POST":
            self.send_json_response(update_manager.start_update())
        elif action == "config" and self.command == "PUT":
            data = self.parse_json_body()
            result = update_manager.update_config(
                (data.get("owner") or "").strip(),
                (data.get("repo") or "").strip(),
                (data.get("channel") or "").strip(),
            )
            self.send_json_response(result)
        else:
            self.send_error(404)

    def handle_stats_api(self, path_parts):
        if len(path_parts) >= 3:
            if path_parts[2] == "year-month":
                self.send_json_response(db_manager.get_year_month_tree())
            elif path_parts[2] == "channels":
                self.send_json_response(db_manager.get_channels())
            elif path_parts[2] == "summary":
                self.send_json_response(db_manager.get_summary_stats())
            elif path_parts[2] == "combined":
                self.send_json_response(db_manager.get_combined_stats())

    def handle_progress_api(self):
        if self.command == "GET":
            self.send_json_response(db_manager.get_reading_progress())
        elif self.command == "POST":
            data = self.parse_json_body()
            last_viewed_id = data.get("lastViewedId")
            last_viewed_datetime = data.get("lastViewedDatetime")
            self.send_json_response(db_manager.update_reading_progress(last_viewed_id, last_viewed_datetime))

    def handle_search_api(self, path_parts, parsed_path):
        if self.command == "GET":
            query_params = urllib.parse.parse_qs(parsed_path.query)
            keyword = query_params.get("keyword", [""])[0]
            page_str = query_params.get("page", ["1"])[0]
            page_size_str = query_params.get("pageSize", ["6"])[0]
            page = int(page_str) if page_str and page_str != "undefined" else 1
            page_size = int(page_size_str) if page_size_str and page_size_str != "undefined" else 6
            if keyword:
                self.send_json_response(db_manager.search_records(keyword, page, page_size))
            else:
                self.send_json_response(db_manager.get_search_history())
        elif self.command == "POST":
            data = self.parse_json_body()
            keyword = data.get("keyword")
            self.send_json_response(db_manager.add_search_history(keyword))

    def handle_search_history_api(self, path_parts):
        if self.command == "GET":
            self.send_json_response(db_manager.get_search_history())
        elif self.command == "POST":
            data = self.parse_json_body()
            keyword = data.get("keyword")
            self.send_json_response(db_manager.add_search_history(keyword))
        elif self.command == "DELETE" and len(path_parts) >= 3:
            keyword = urllib.parse.unquote("/".join(path_parts[2:]))
            self.send_json_response(db_manager.delete_search_history(keyword))

    def add_record(self):
        try:
            data = self.parse_json_body()
            datetime_val = data.get("datetime", "")
            content_val = data.get("content", "")
            channel_val = data.get("channel", "")
            media_type_val = data.get("media_type", "text")
            media_path_val = data.get("media_path", "")

            if not datetime_val or not content_val:
                self.send_json_response({"success": False, "error": "missing required fields"})
                return

            self.send_json_response(
                db_manager.add_record(datetime_val, content_val, channel_val, media_type_val, media_path_val)
            )
        except json.JSONDecodeError:
            self.send_json_response({"success": False, "error": "invalid json"})
        except Exception as e:
            self.send_json_response({"success": False, "error": str(e)})

    def update_record(self, record_id):
        data = self.parse_json_body()
        datetime_val = data.get("datetime", "")
        content_val = data.get("content", "")
        channel_val = data.get("channel", "")
        media_type_val = data.get("media_type", "text")
        media_path_val = data.get("media_path", "")
        self.send_json_response(
            db_manager.update_record(record_id, datetime_val, content_val, channel_val, media_type_val, media_path_val)
        )

    def save_media_file(self):
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)
        content_type = self.headers["Content-Type"]
        if "multipart/form-data" in content_type:
            boundary = content_type.split("boundary=")[1]
            self.handle_multipart_data(post_data, boundary)
        else:
            self.send_json_response({"success": False, "error": "unsupported content type"})

    def handle_multipart_data(self, post_data, boundary):
        import time

        boundary_bytes = boundary.encode("utf-8")
        parts = post_data.split(b"--" + boundary_bytes)
        file_data = None
        file_name = None
        datetime_val = None
        record_id = "1"

        for part in parts:
            if b'filename="' in part:
                filename_start = part.find(b'filename="') + 10
                filename_end = part.find(b'"', filename_start)
                file_name = part[filename_start:filename_end].decode("utf-8")
                content_start = part.find(b"\r\n\r\n") + 4
                content_end = part.rfind(b"\r\n")
                file_data = part[content_start:content_end]
            elif b'name="datetime"' in part:
                content_start = part.find(b"\r\n\r\n") + 4
                content_end = part.rfind(b"\r\n")
                datetime_val = part[content_start:content_end].decode("utf-8")
            elif b'name="recordId"' in part:
                content_start = part.find(b"\r\n\r\n") + 4
                content_end = part.rfind(b"\r\n")
                record_id = part[content_start:content_end].decode("utf-8")

        if not (file_data and file_name):
            self.send_json_response({"success": False, "error": "invalid file payload"})
            return

        timestamp = str(int(time.time()))
        if datetime_val:
            try:
                date_part, time_part = datetime_val.split(" ")
                year, month, day = date_part.split("-")
                hour, minute = time_part.split(":")[:2]
                timestamp = f"{year}{month}{day}{hour}{minute}"
            except Exception:
                pass

        file_extension = os.path.splitext(file_name)[1]
        file_index = "1"
        try:
            base_name = os.path.splitext(file_name)[0]
            if "_" in base_name:
                candidate = base_name.split("_")[-1]
                if candidate.isdigit():
                    file_index = candidate
        except Exception:
            pass

        new_file_name = f"{timestamp}_{record_id}_{file_index}{file_extension}"
        file_path = Path(MEDIA_DIR) / new_file_name
        try:
            with open(file_path, "wb") as f:
                f.write(file_data)
            self.send_json_response({"success": True, "message": "saved", "path": f"media/{new_file_name}"})
        except Exception as e:
            self.send_json_response({"success": False, "error": str(e)})

    def serve_file(self, file_path, content_type):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-type", content_type)
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404)
        except (ConnectionAbortedError, BrokenPipeError):
            pass

    def send_json_response(self, data, status=200):
        try:
            self.send_response(status)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
        except (ConnectionAbortedError, BrokenPipeError):
            pass


def start_server():
    server_address = (SERVER_HOST, SERVER_PORT)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"server started at http://{SERVER_HOST}:{SERVER_PORT}")
    httpd.serve_forever()
