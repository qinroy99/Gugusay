#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
服务器诊断脚本 - 用于隔离和诊断服务器启动问题
"""

import sys
import os
import traceback
import socket
import logging
from datetime import datetime

# 设置日志记录
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server_diagnosis.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def check_port_available(host, port):
    """检查端口是否可用"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex((host, port))
            return result != 0  # 0 表示连接成功，意味着端口被占用
    except Exception as e:
        logger.error(f"检查端口时出错: {e}")
        return False

def check_directories():
    """检查必要的目录是否存在"""
    try:
        # 添加项目根目录到Python路径
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        from backend.config import APP_ROOT, DATA_DIR, MEDIA_DIR
        
        dirs_to_check = [
            ("应用根目录", APP_ROOT),
            ("数据目录", DATA_DIR),
            ("媒体目录", MEDIA_DIR)
        ]
        
        for name, path in dirs_to_check:
            if os.path.exists(path):
                logger.info(f"✓ {name}存在: {path}")
                if os.access(path, os.R_OK | os.W_OK):
                    logger.info(f"✓ {name}可读写")
                else:
                    logger.warning(f"⚠ {name}权限不足")
            else:
                logger.error(f"✗ {name}不存在: {path}")
                return False
        
        return True
    except Exception as e:
        logger.error(f"检查目录时出错: {e}")
        traceback.print_exc()
        return False

def check_database():
    """检查数据库连接和初始化"""
    try:
        logger.info("开始检查数据库...")
        
        # 导入数据库模块
        from backend.config import DB_PATH
        logger.info(f"数据库路径: {DB_PATH}")
        
        # 检查数据库文件是否存在
        if os.path.exists(DB_PATH):
            logger.info("✓ 数据库文件存在")
            if os.access(DB_PATH, os.R_OK):
                logger.info("✓ 数据库文件可读")
            else:
                logger.error("✗ 数据库文件不可读")
                return False
        else:
            logger.warning("⚠ 数据库文件不存在，将尝试创建")
        
        # 尝试初始化数据库管理器
        from backend.database import DatabaseManager
        db_manager = DatabaseManager()
        logger.info("✓ 数据库管理器初始化成功")
        
        # 尝试执行一个简单的查询
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM JL")
            count = cursor.fetchone()[0]
            logger.info(f"✓ 数据库查询成功，JL表中有 {count} 条记录")
        
        return True
    except Exception as e:
        logger.error(f"检查数据库时出错: {e}")
        traceback.print_exc()
        return False

def check_imports():
    """检查必要的模块导入"""
    try:
        logger.info("开始检查模块导入...")
        
        # 检查标准库模块
        standard_modules = ['os', 'sys', 'json', 'urllib.parse', 'mimetypes', 'http.server', 'socket', 'sqlite3', 'threading', 'webview']
        for module in standard_modules:
            try:
                __import__(module)
                logger.info(f"✓ 标准库模块 {module} 导入成功")
            except ImportError as e:
                logger.error(f"✗ 标准库模块 {module} 导入失败: {e}")
                return False
        
        # 检查项目模块
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        project_modules = ['backend.config', 'backend.server', 'backend.database']
        for module in project_modules:
            try:
                __import__(module)
                logger.info(f"✓ 项目模块 {module} 导入成功")
            except ImportError as e:
                logger.error(f"✗ 项目模块 {module} 导入失败: {e}")
                traceback.print_exc()
                return False
        
        return True
    except Exception as e:
        logger.error(f"检查模块导入时出错: {e}")
        traceback.print_exc()
        return False

def test_server_initialization():
    """测试服务器初始化"""
    try:
        logger.info("开始测试服务器初始化...")
        
        from backend.config import SERVER_HOST, SERVER_PORT
        from backend.server import start_server
        
        logger.info(f"服务器配置: {SERVER_HOST}:{SERVER_PORT}")
        
        # 检查端口是否可用
        if not check_port_available(SERVER_HOST, SERVER_PORT):
            logger.error(f"✗ 端口 {SERVER_HOST}:{SERVER_PORT} 已被占用")
            return False
        else:
            logger.info(f"✓ 端口 {SERVER_HOST}:{SERVER_PORT} 可用")
        
        # 尝试创建服务器实例（但不启动）
        from http.server import HTTPServer
        from backend.server import RequestHandler
        
        server_address = (SERVER_HOST, SERVER_PORT)
        httpd = HTTPServer(server_address, RequestHandler)
        logger.info("✓ HTTP服务器实例创建成功")
        
        # 关闭服务器
        httpd.server_close()
        logger.info("✓ HTTP服务器实例关闭成功")
        
        return True
    except Exception as e:
        logger.error(f"测试服务器初始化时出错: {e}")
        traceback.print_exc()
        return False

def run_server_with_timeout(timeout=5):
    """尝试运行服务器一段时间后自动停止"""
    try:
        logger.info(f"尝试运行服务器 {timeout} 秒...")
        
        import threading
        import time
        
        from backend.server import start_server
        
        # 在单独的线程中启动服务器
        server_thread = threading.Thread(target=start_server)
        server_thread.daemon = True
        server_thread.start()
        
        # 等待服务器启动
        time.sleep(1)
        
        # 检查服务器是否响应
        from backend.config import SERVER_HOST, SERVER_PORT
        if check_port_available(SERVER_HOST, SERVER_PORT):
            logger.error("✗ 服务器启动后端口仍然可用，可能启动失败")
            return False
        else:
            logger.info("✓ 服务器已成功占用端口")
        
        # 等待指定时间
        time.sleep(timeout - 1)
        
        logger.info("✓ 服务器运行测试完成")
        return True
    except Exception as e:
        logger.error(f"运行服务器测试时出错: {e}")
        traceback.print_exc()
        return False

def main():
    """主诊断函数"""
    logger.info("=" * 50)
    logger.info("开始服务器诊断")
    logger.info("=" * 50)
    
    # 记录环境信息
    logger.info(f"Python版本: {sys.version}")
    logger.info(f"当前工作目录: {os.getcwd()}")
    logger.info(f"脚本目录: {os.path.dirname(os.path.abspath(__file__))}")
    logger.info(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 执行各项检查
    checks = [
        ("模块导入检查", check_imports),
        ("目录结构检查", check_directories),
        ("数据库检查", check_database),
        ("服务器初始化检查", test_server_initialization),
        ("服务器运行测试", run_server_with_timeout)
    ]
    
    results = {}
    for name, check_func in checks:
        logger.info(f"\n--- {name} ---")
        try:
            results[name] = check_func()
        except Exception as e:
            logger.error(f"{name} 执行时出错: {e}")
            traceback.print_exc()
            results[name] = False
    
    # 输出总结
    logger.info("\n" + "=" * 50)
    logger.info("诊断结果总结")
    logger.info("=" * 50)
    
    all_passed = True
    for name, result in results.items():
        status = "✓ 通过" if result else "✗ 失败"
        logger.info(f"{name}: {status}")
        if not result:
            all_passed = False
    
    if all_passed:
        logger.info("\n所有检查通过，服务器应该可以正常启动。")
    else:
        logger.error("\n部分检查失败，请查看上述日志了解详细问题。")
    
    logger.info("\n诊断完成，详细日志已保存到 server_diagnosis.log")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())