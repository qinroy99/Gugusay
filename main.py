# 主程序文件（精简版）
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import webview
from threading import Thread
import atexit
from backend.config import WINDOW_TITLE, WINDOW_WIDTH, WINDOW_HEIGHT, WINDOW_MIN_SIZE
from backend.server import start_server
from backend.database import db_manager

# 全局变量，用于存储窗口引用
window_ref = None

# 创建窗口关闭事件处理函数
def on_closing():
    """窗口关闭事件处理"""
    print('窗口关闭事件触发，尝试保存阅读进度')
    if window_ref:
        try:
            # 调用前端的保存进度函数
            window_ref.evaluate_js('window.saveReadingProgressOnClose && window.saveReadingProgressOnClose()')
            print('已调用前端保存进度函数')
        except Exception as e:
            print(f'调用前端保存进度函数时出错: {e}')

# 窗口关闭事件处理函数（用于 pywebview）
def on_window_closed():
    """窗口关闭事件处理（pywebview）"""
    print('窗口关闭事件触发')
    on_closing()

# 创建API类
class Api:
    """pywebview API类"""
    
    def save_progress(self, last_viewed_id, last_viewed_datetime):
        """从前端调用，保存阅读进度"""
        try:
            db_manager.update_reading_progress(last_viewed_id, last_viewed_datetime)
            print(f'已保存阅读进度: ID={last_viewed_id}, DateTime={last_viewed_datetime}')
            return True
        except Exception as e:
            print(f'保存阅读进度时出错: {e}')
            return False

if __name__ == '__main__':
    print('正在启动服务器...')
    # 在单独的线程中启动HTTP服务器
    server_thread = Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()

    # 优化的服务器启动检测：使用指数退避策略
    import time
    import urllib.request
    import urllib.error

    print('等待服务器启动...')
    server_ready = False
    attempt = 0
    max_attempts = 15  # 最多尝试15次
    initial_delay = 0.05  # 初始延迟50ms

    while not server_ready and attempt < max_attempts:
        attempt += 1
        try:
            # 使用更短的超时时间
            urllib.request.urlopen('http://localhost:3000', timeout=0.3)
            server_ready = True
            print(f'服务器已启动 (尝试 {attempt}/{max_attempts})')
        except urllib.error.URLError:
            # 使用指数退避策略，逐渐增加等待时间
            delay = initial_delay * (2 ** min(attempt - 1, 3))  # 最多增加8倍
            time.sleep(delay)

    if not server_ready:
        print('警告: 服务器可能未完全启动，但继续创建窗口')

    print(f'创建窗口，访问 http://localhost:3000')
    # 使用pywebview创建窗口，并绑定API
    window_ref = webview.create_window(
        title=WINDOW_TITLE,
        url='http://localhost:3000',
        js_api=Api(),
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        min_size=WINDOW_MIN_SIZE
    )

    # 注册程序退出时的回调函数
    atexit.register(on_closing)

    print('启动pywebview...')
    # 启动窗口
    webview.start(debug=False)  # 关闭调试模式，提升性能

    # webview.start() 返回后，手动调用关闭处理
    print('应用已关闭')
    on_closing()