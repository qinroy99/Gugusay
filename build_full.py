import os
import shutil
import sys
import subprocess
from pathlib import Path

def build_full_version():
    """
    构建完整版本（带编辑和删除按钮）
    """
    print("=" * 60)
    print("开始构建完整版本（带编辑和删除按钮）...")
    print("=" * 60)
    
    # 检查是否安装了pyinstaller
    try:
        import PyInstaller
    except ImportError:
        print("正在安装PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"])
    
    # 确保使用完整版本的 index.html
    if os.path.exists("index.html"):
        # 备份当前的 index.html
        if os.path.exists("index.html.bak"):
            os.remove("index.html.bak")
        shutil.copy("index.html", "index.html.bak")
        print("已备份当前的 index.html")
    
    # 使用完整版本（当前已经是完整版本）
    print("使用完整版本配置...")
    
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
        "--name", "Twitter-Full",
        "main.py"
    ]
    
    print("正在运行PyInstaller构建完整版本...")
    result = subprocess.run(pyinstaller_cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"PyInstaller构建失败: {result.stderr}")
        return False
    
    print("PyInstaller构建成功!")
    return True

def create_portable_full():
    """
    创建完整版本的绿色便携版
    """
    print("\n" + "=" * 60)
    print("创建完整版本绿色便携版...")
    print("=" * 60)
    
    portable_dir = Path("twitter-portable-full")
    
    # 如果目录已存在，删除它
    if portable_dir.exists():
        try:
            shutil.rmtree(portable_dir)
        except PermissionError:
            print(f"无法删除目录 {portable_dir}")
            return False
    
    portable_dir.mkdir(parents=True, exist_ok=True)
    print(f"创建目录: {portable_dir}")
    
    # 要复制的文件和目录
    items_to_copy = [
        "dist/Twitter-Full.exe",
        "data",
        "media",
        "icons",
        "index.html",
        "scripts.js",
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
    exe_source = portable_dir / "Twitter-Full.exe"
    exe_target = portable_dir / "twitter.exe"
    if exe_source.exists():
        shutil.move(str(exe_source), str(exe_target))
        print("主程序已重命名: Twitter-Full.exe -> twitter.exe")
    
    # 创建使用说明
    readme_content = """Twitter 完整版本 - 使用说明
========================

版本说明：
---------
此版本为完整功能版本，每条推文下方显示：
  - 编辑按钮：可编辑推文内容、时间、渠道和媒体
  - 删除按钮：可删除推文

使用说明：
---------
1. 双击 twitter.exe 启动应用
2. 所有数据保存在 data 目录下的 SR.db 文件中
3. 媒体文件保存在 media 目录中
4. 这是一个绿色便携版本，可以放到任何位置运行

注意事项：
---------
- 请勿删除 data 和 media 目录，否则数据将会丢失
- 编辑推文时会弹出编辑窗口，支持修改文字和媒体
- 删除推文前会有确认提示

数据备份建议：
-------------
建议定期备份 data/SR.db 文件和 media 目录
"""
    readme_path = portable_dir / "使用说明.txt"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("创建使用说明文件: 使用说明.txt")
    
    print("\n" + "=" * 60)
    print(f"完整版本绿色便携版创建成功!")
    print(f"位置: {portable_dir.absolute()}")
    print("=" * 60)
    return True

def main():
    if not build_full_version():
        print("构建完整版本失败!")
        return False
    
    if not create_portable_full():
        print("创建便携版本失败!")
        return False
    
    print("\n完整版本构建完成!")
    return True

if __name__ == "__main__":
    main()
