import os
import shutil
import sys
import subprocess
from pathlib import Path

def build_executable():
    """
    使用PyInstaller构建可执行文件
    """
    print("开始构建可执行文件...")
    
    # 检查是否安装了pyinstaller
    try:
        import PyInstaller
    except ImportError:
        print("正在安装PyInstaller...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"])
    
    # 运行PyInstaller命令构建exe文件，使用指定图标
    icon_path = "icons/Twitter.ico"
    if not Path(icon_path).exists():
        print(f"警告: 图标文件 {icon_path} 不存在，将使用默认图标")
        pyinstaller_cmd = [
            "pyinstaller", 
            "--onefile", 
            "--windowed", 
            "--add-data", "index.html;.", 
            "--add-data", "scripts.js;.", 
            "--add-data", "styles.css;.", 
            "--add-data", "sba.jpg;.", 
            "--add-data", "modules;modules", 
            "--add-data", "utils;utils", 
            "--add-data", "icons;icons", 
            "main.py"
        ]
    else:
        pyinstaller_cmd = [
            "pyinstaller", 
            "--onefile", 
            "--windowed", 
            "--icon=icons/Twitter.ico", 
            "--add-data", "index.html;.", 
            "--add-data", "scripts.js;.", 
            "--add-data", "styles.css;.", 
            "--add-data", "sba.jpg;.", 
            "--add-data", "modules;modules", 
            "--add-data", "utils;utils", 
            "--add-data", "icons;icons", 
            "main.py"
        ]
    
    print("正在运行PyInstaller命令...")
    result = subprocess.run(pyinstaller_cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"PyInstaller构建失败: {result.stderr}")
        return False
    else:
        print("PyInstaller构建成功!")
        return True

def build_portable_version():
    """
    构建绿色便携版本。
    此脚本假设你已经使用 PyInstaller 生成了 dist/main.exe（带有图标）。
    """
    print("开始构建绿色便携版本...")

    # 定义源文件和目标目录
    portable_dir = Path("twitter-portable")  # 便携版目录

    # 如果便携版目录已存在，则删除
    if portable_dir.exists():
        # 尝试删除目录，如果失败则重试
        try:
            shutil.rmtree(portable_dir)
        except PermissionError:
            print(f"无法删除目录 {portable_dir}，可能是因为文件被占用。请确保没有程序正在使用该目录中的文件。")
            print("请关闭可能使用这些文件的程序（如数据库查看器、文件管理器等），然后重试。")
            return False
    
    # 创建新的便携版目录
    portable_dir.mkdir(parents=True, exist_ok=True)
    print(f"创建目录: {portable_dir}")

    # 要复制的文件和目录列表（包括 dist/main.exe）
    items_to_copy = [
        "dist/main.exe",
        "data",
        "media",
        "icons",
        "index.html",
        "scripts.js",
        "styles.css",
        "sba.jpg",
        "modules",
        "utils",
        "backend"
    ]

    # 复制每个项目
    for item in items_to_copy:
        source = Path(item)
        # 对于 twitter.exe，我们稍后会重命名，所以先用原名复制
        target = portable_dir / source.name
        
        if source.is_file():
            shutil.copy2(source, target)
            print(f"复制文件: {item}")
        elif source.is_dir():
            shutil.copytree(source, target)
            print(f"复制目录: {item}")
        else:
            # 如果是 data 或 media 目录不存在，创建空目录
            if item in ["data", "media"]:
                (portable_dir / item).mkdir()
                print(f"创建空目录: {item}")
            else:
                print(f"警告: {item} 不存在，已跳过。")

    # 重命名 main.exe 为 twitter.exe
    main_exe_path = portable_dir / "main.exe"
    twitter_exe_path = portable_dir / "twitter.exe"
    if main_exe_path.exists():
        shutil.move(str(main_exe_path), twitter_exe_path)
        print("主程序已重命名: main.exe -> twitter.exe")

    # 创建使用说明文件
    readme_content = """使用说明
========

1. 双击 twitter.exe 启动应用
2. 所有数据保存在 data 目录下的 SR.db 文件中
3. 媒体文件保存在 media 目录中
4. 这是一个绿色便携版本，可以放到任何位置运行

注意：请勿删除 data 和 media 目录，否则数据将会丢失。
"""
    readme_path = portable_dir / "使用说明.txt"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("创建使用说明文件: 使用说明.txt")

    print("\n绿色便携版本已成功创建!")
    print(f"   位置: {portable_dir.absolute()}")
    return True


def main():
    # 首先构建可执行文件
    if not build_executable():
        print("构建可执行文件失败，停止构建便携版本。")
        return False
    
    # 然后构建便携版本
    return build_portable_version()


if __name__ == "__main__":
    main()