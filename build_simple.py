import os
import shutil
import sys
import subprocess
from pathlib import Path

def prepare_simple_version():
    """
    准备简化版本的文件
    """
    print("准备简化版本文件...")
    
    # 备份完整版本的 index.html
    if os.path.exists("index.html") and not os.path.exists("index-full.html"):
        shutil.copy("index.html", "index-full.html")
        print("已备份完整版本为 index-full.html")
    
    # 使用简化版本的 index-simple.html 作为 index.html
    if os.path.exists("index-simple.html"):
        shutil.copy("index-simple.html", "index.html")
        print("已切换到简化版本 (index-simple.html -> index.html)")
    else:
        print("错误: index-simple.html 不存在!")
        return False
    
    # 备份完整版本的 scripts.js
    if os.path.exists("scripts.js") and not os.path.exists("scripts-full.js"):
        shutil.copy("scripts.js", "scripts-full.js")
        print("已备份完整版本为 scripts-full.js")
    
    # 使用简化版本的 scripts-simple.js 作为 scripts.js
    if os.path.exists("scripts-simple.js"):
        shutil.copy("scripts-simple.js", "scripts.js")
        print("已切换到简化版本 (scripts-simple.js -> scripts.js)")
    else:
        print("错误: scripts-simple.js 不存在!")
        return False
    
    return True

def restore_full_version():
    """
    恢复完整版本的文件
    """
    print("\n恢复完整版本文件...")
    
    if os.path.exists("index-full.html"):
        shutil.copy("index-full.html", "index.html")
        print("已恢复完整版本 index.html")
    
    if os.path.exists("scripts-full.js"):
        shutil.copy("scripts-full.js", "scripts.js")
        print("已恢复完整版本 scripts.js")

def build_simple_version():
    """
    构建简化版本（不带编辑和删除按钮）
    """
    print("=" * 60)
    print("开始构建简化版本（不带编辑和删除按钮）...")
    print("=" * 60)
    
    # 检查是否安装了pyinstaller
    try:
        import PyInstaller
    except ImportError:
        print("正在安装PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"])
    
    # 准备简化版本文件
    if not prepare_simple_version():
        return False
    
    try:
        # 运行PyInstaller命令构建exe文件
        icon_path = "icons/Twitter.ico"
        if not Path(icon_path).exists():
            print(f"警告: 图标文件 {icon_path} 不存在，将使用默认图标")
            icon_param = []
        else:
            icon_param = ["--icon=icons/Twitter.ico"]
        
        pyinstaller_cmd = [
            "pyinstaller", 
            "--onefile", 
            "--windowed",
            *icon_param,
            "--add-data", "index.html;.", 
            "--add-data", "scripts.js;.", 
            "--add-data", "styles.css;.", 
            "--add-data", "sba.jpg;.", 
            "--add-data", "modules;modules", 
            "--add-data", "utils;utils", 
            "--add-data", "icons;icons", 
            "--name", "Twitter-Simple",
            "main.py"
        ]
        
        print("正在运行PyInstaller构建简化版本...")
        result = subprocess.run(pyinstaller_cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"PyInstaller构建失败: {result.stderr}")
            return False
        
        print("PyInstaller构建成功!")
        return True
    finally:
        # 恢复完整版本文件
        restore_full_version()

def create_portable_simple():
    """
    创建简化版本的绿色便携版
    """
    print("\n" + "=" * 60)
    print("创建简化版本绿色便携版...")
    print("=" * 60)
    
    portable_dir = Path("twitter-portable-simple")
    
    # 如果目录已存在，删除它
    if portable_dir.exists():
        try:
            shutil.rmtree(portable_dir)
        except PermissionError:
            print(f"无法删除目录 {portable_dir}")
            return False
    
    portable_dir.mkdir(parents=True, exist_ok=True)
    print(f"创建目录: {portable_dir}")
    
    # 准备简化版本文件
    if not prepare_simple_version():
        return False
    
    try:
        # 要复制的文件和目录（使用简化版本）
        items_to_copy = [
            "dist/Twitter-Simple.exe",
            "data",
            "media",
            "icons",
            "index.html",  # 这是简化版本
            "scripts.js",  # 这是简化版本
            "styles.css",
            "sba.jpg",
            "favicon.ico",
            "modules",
            "utils",
            "backend",
            "styles"
        ]
        
        for item in items_to_copy:
            source = Path(item)
            target = portable_dir / source.name
            
            if source.is_file():
                shutil.copy2(source, target)
                print(f"复制文件: {item}")
            elif source.is_dir():
                shutil.copytree(source, target)
                print(f"复制目录: {item}")
            else:
                if item in ["data", "media"]:
                    (portable_dir / item).mkdir(exist_ok=True)
                    print(f"创建空目录: {item}")
                else:
                    print(f"警告: {item} 不存在，已跳过。")
        
        # 重命名 exe 文件
        exe_source = portable_dir / "Twitter-Simple.exe"
        exe_target = portable_dir / "twitter.exe"
        if exe_source.exists():
            shutil.move(str(exe_source), str(exe_target))
            print("主程序已重命名: Twitter-Simple.exe -> twitter.exe")
        
        # 创建使用说明
        readme_content = """Twitter 简化版本 - 使用说明
========================

版本说明：
---------
此版本为简化版本，每条推文下方不显示编辑和删除按钮。
仅保留浏览、搜索、统计等基础功能。

使用说明：
---------
1. 双击 twitter.exe 启动应用
2. 所有数据保存在 data 目录下的 SR.db 文件中
3. 媒体文件保存在 media 目录中
4. 这是一个绿色便携版本，可以放到任何位置运行

功能说明：
---------
- 支持搜索推文内容
- 支持按年份、月份筛选
- 支持按渠道筛选
- 支持高级搜索
- 支持查看统计数据
- 支持图片点击放大查看
- 支持右键复制推文内容

注意事项：
---------
- 请勿删除 data 和 media 目录，否则数据将会丢失
- 此版本不支持编辑和删除推文
- 如需编辑功能，请使用完整版本

数据备份建议：
-------------
建议定期备份 data/SR.db 文件和 media 目录
"""
        readme_path = portable_dir / "使用说明.txt"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        print("创建使用说明文件: 使用说明.txt")
        
        print("\n" + "=" * 60)
        print(f"简化版本绿色便携版创建成功!")
        print(f"位置: {portable_dir.absolute()}")
        print("=" * 60)
        return True
    finally:
        # 恢复完整版本文件
        restore_full_version()

def main():
    if not build_simple_version():
        print("构建简化版本失败!")
        return False
    
    if not create_portable_simple():
        print("创建便携版本失败!")
        return False
    
    print("\n简化版本构建完成!")
    return True

if __name__ == "__main__":
    main()
