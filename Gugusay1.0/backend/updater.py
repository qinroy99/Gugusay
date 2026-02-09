# 在线更新服务模块
import os
import json
import urllib.request
import urllib.error
import hashlib
from pathlib import Path
from backend.config import DATA_DIR, MEDIA_DIR, DB_PATH

# 默认更新源配置
DEFAULT_UPDATE_URL = "https://raw.githubusercontent.com/yourusername/twitter-data/main"
UPDATE_CONFIG_FILE = os.path.join(DATA_DIR, "update_config.json")

class Updater:
    """在线更新管理器"""
    
    def __init__(self):
        self.update_url = self._load_update_url()
        self.version_info = None
    
    def _load_update_url(self):
        """加载更新源URL"""
        if os.path.exists(UPDATE_CONFIG_FILE):
            try:
                with open(UPDATE_CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    return config.get('update_url', DEFAULT_UPDATE_URL)
            except:
                pass
        return DEFAULT_UPDATE_URL
    
    def _save_update_url(self, url):
        """保存更新源URL"""
        config = {'update_url': url}
        try:
            with open(UPDATE_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"保存更新配置失败: {e}")
            return False
    
    def check_update(self):
        """检查是否有更新"""
        try:
            version_url = f"{self.update_url}/version.json"
            with urllib.request.urlopen(version_url, timeout=10) as response:
                self.version_info = json.loads(response.read().decode('utf-8'))
                
            local_version = self._get_local_version()
            remote_version = self.version_info.get('version', '0.0.0')
            
            return {
                'has_update': remote_version > local_version,
                'local_version': local_version,
                'remote_version': remote_version,
                'update_info': self.version_info.get('info', ''),
                'db_size': self.version_info.get('db_size', 0),
                'media_count': self.version_info.get('media_count', 0)
            }
        except Exception as e:
            return {
                'has_update': False,
                'error': str(e)
            }
    
    def _get_local_version(self):
        """获取本地版本"""
        version_file = os.path.join(DATA_DIR, 'version.txt')
        if os.path.exists(version_file):
            try:
                with open(version_file, 'r') as f:
                    return f.read().strip()
            except:
                pass
        return '0.0.0'
    
    def _save_local_version(self, version):
        """保存本地版本"""
        version_file = os.path.join(DATA_DIR, 'version.txt')
        try:
            with open(version_file, 'w') as f:
                f.write(version)
            return True
        except Exception as e:
            print(f"保存版本信息失败: {e}")
            return False
    
    def download_database(self, progress_callback=None):
        """下载并更新数据库文件"""
        try:
            db_url = f"{self.update_url}/data/SR.db"
            temp_db = DB_PATH + '.tmp'
            
            # 下载文件
            urllib.request.urlretrieve(db_url, temp_db)
            
            # 备份原数据库
            if os.path.exists(DB_PATH):
                backup_path = DB_PATH + '.backup'
                if os.path.exists(backup_path):
                    os.remove(backup_path)
                os.rename(DB_PATH, backup_path)
            
            # 替换为新数据库
            os.rename(temp_db, DB_PATH)
            
            # 保存新版本号
            if self.version_info:
                self._save_local_version(self.version_info.get('version', '0.0.0'))
            
            return {'success': True}
        except Exception as e:
            # 恢复备份
            backup_path = DB_PATH + '.backup'
            if os.path.exists(backup_path) and not os.path.exists(DB_PATH):
                os.rename(backup_path, DB_PATH)
            return {'success': False, 'error': str(e)}
    
    def download_media(self, progress_callback=None):
        """下载媒体文件（增补模式）"""
        try:
            if not self.version_info:
                return {'success': False, 'error': '未获取版本信息'}
            
            media_list = self.version_info.get('media_files', [])
            downloaded = 0
            failed = []
            
            for media_file in media_list:
                local_path = os.path.join(MEDIA_DIR, media_file)
                
                # 如果文件已存在，跳过
                if os.path.exists(local_path):
                    continue
                
                # 下载文件
                try:
                    media_url = f"{self.update_url}/media/{media_file}"
                    # 确保目录存在
                    os.makedirs(os.path.dirname(local_path), exist_ok=True)
                    urllib.request.urlretrieve(media_url, local_path)
                    downloaded += 1
                    
                    if progress_callback:
                        progress_callback(downloaded, len(media_list))
                        
                except Exception as e:
                    failed.append({'file': media_file, 'error': str(e)})
            
            return {
                'success': True,
                'downloaded': downloaded,
                'skipped': len(media_list) - downloaded - len(failed),
                'failed': failed
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def update_all(self, progress_callback=None):
        """执行完整更新"""
        results = {
            'db_updated': False,
            'media_updated': False
        }
        
        # 更新数据库
        db_result = self.download_database(progress_callback)
        results['db_result'] = db_result
        results['db_updated'] = db_result.get('success', False)
        
        # 更新媒体文件
        media_result = self.download_media(progress_callback)
        results['media_result'] = media_result
        results['media_updated'] = media_result.get('success', False)
        
        return results

# 全局更新器实例
updater = Updater()
