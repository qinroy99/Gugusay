# 配置管理模块
import os
import sys

# 获取应用根目录
def get_app_root():
    """获取应用根目录"""
    if getattr(sys, 'frozen', False):
        # 如果是打包后的exe文件，返回exe所在目录
        return os.path.dirname(sys.executable)
    else:
        # 如果是直接运行Python脚本，返回项目根目录（backend目录的父目录）
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 获取应用根目录
APP_ROOT = get_app_root()

# 数据目录
DATA_DIR = os.path.join(APP_ROOT, 'data')

# 媒体目录
MEDIA_DIR = os.path.join(APP_ROOT, 'media')

# 数据库路径
DB_PATH = os.path.join(DATA_DIR, 'SR.db')

# 服务器配置
SERVER_HOST = 'localhost'
SERVER_PORT = 3000

# 窗口配置
WINDOW_TITLE = '姑射山人2011'
WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 900
WINDOW_MIN_SIZE = (800, 600)

# 分页配置
DEFAULT_PAGE_SIZE = 6

# 搜索历史限制
SEARCH_HISTORY_LIMIT = 10

# 确保目录存在
def ensure_directories():
    """确保必要的目录存在"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    if not os.path.exists(MEDIA_DIR):
        os.makedirs(MEDIA_DIR)

# 初始化目录
ensure_directories()
