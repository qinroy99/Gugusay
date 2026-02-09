#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
构建脚本：生成两个版本的绿色便携exe文件
1. 完整版本：带编辑和删除按钮
2. 简化版本：不带编辑和删除按钮
"""

import os
import shutil
import sys
import subprocess
from pathlib import Path

def check_pyinstaller():
    """检查是否安装了PyInstaller"""
    try:
        import PyInstaller
        return True
    except ImportError:
        print("正在安装PyInstaller...")
        result = subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], 
                              capture_output=True, text=True)
        return result.returncode == 0

def build_version(version_name, index_file, scripts_file, output_name):
    """
    构建指定版本
    
    Args:
        version_name: 版本名称（用于显示）
        index_file: 使用的index.html文件
        scripts_file: 使用的scripts.js文件
        output_name: 输出的exe名称
    """
    print("\n" + "=" * 70)
    print(f"开始构建: {version_name}")
    print("=" * 70)
    
    # 备份原始文件
    if os.path.exists("index.html") and index_file != "index.html":
        shutil.copy("index.html", "index.html.tempbak")
    if os.path.exists("scripts.js") and scripts_file != "scripts.js":
        shutil.copy("scripts.js", "scripts.js.tempbak")
    
    try:
        # 复制版本特定文件（仅在文件不同时）
        if index_file != "index.html":
            shutil.copy(index_file, "index.html")
        if scripts_file != "scripts.js":
            shutil.copy(scripts_file, "scripts.js")
        print(f"已切换至 {version_name} 配置")
        
        # 构建exe
        icon_path = "icons/Twitter.ico"
        icon_param = ["--icon=icons/Twitter.ico"] if Path(icon_path).exists() else []
        
        pyinstaller_cmd = [
            "pyinstaller", 
            "--onefile", 
            "--windowed",
            "--clean",
            *icon_param,
            "--add-data", "index.html;.", 
            "--add-data", "scripts.js;.", 
            "--add-data", "styles.css;.", 
            "--add-data", "sba.jpg;.", 
            "--add-data", "favicon.ico;.",
            "--add-data", "modules;modules", 
            "--add-data", "utils;utils", 
            "--add-data", "icons;icons",
            "--add-data", "styles;styles",
            "--name", output_name,
            "main.py"
        ]
        
        print(f"正在构建 {output_name}.exe ...")
        result = subprocess.run(pyinstaller_cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"构建失败: {result.stderr}")
            return False
        
        print(f"{output_name}.exe 构建成功!")
        return True
        
    finally:
        # 恢复原始文件
        if os.path.exists("index.html.tempbak"):
            shutil.move("index.html.tempbak", "index.html")
        if os.path.exists("scripts.js.tempbak"):
            shutil.move("scripts.js.tempbak", "scripts.js")
        print("已恢复原始配置")

def create_portable_folder(version_name, exe_name, folder_name, readme_content):
    """
    创建便携版文件夹
    
    Args:
        version_name: 版本名称
        exe_name: exe文件名
        folder_name: 输出文件夹名
        readme_content: 使用说明内容
    """
    print(f"\n创建 {version_name} 便携版文件夹...")
    
    portable_dir = Path(folder_name)
    
    # 删除已存在的目录
    if portable_dir.exists():
        try:
            shutil.rmtree(portable_dir)
        except PermissionError:
            print(f"警告: 无法删除已存在的目录 {folder_name}")
    
    portable_dir.mkdir(parents=True, exist_ok=True)
    
    # 复制文件
    items_to_copy = [
        f"dist/{exe_name}.exe",
        "data",
        "media",
        "icons",
        "styles",
        "favicon.ico",
        "backend"
    ]
    
    for item in items_to_copy:
        source = Path(item)
        target = portable_dir / source.name
        
        if source.is_file():
            if source.exists():
                shutil.copy2(source, target)
                print(f"  复制: {item}")
        elif source.is_dir():
            if source.exists():
                shutil.copytree(source, target)
                print(f"  复制目录: {item}")
            else:
                # 创建空目录
                target.mkdir(exist_ok=True)
                print(f"  创建目录: {item}")
    
    # 复制版本特定的前端文件
    if "完整" in version_name:
        shutil.copy("index.html", portable_dir / "index.html")
        shutil.copy("scripts-editable.js", portable_dir / "scripts.js")
    else:
        shutil.copy("index-simple.html", portable_dir / "index.html")
        shutil.copy("scripts-simple.js", portable_dir / "scripts.js")
    
    shutil.copy("styles.css", portable_dir / "styles.css")
    shutil.copy("sba.jpg", portable_dir / "sba.jpg")
    shutil.copytree("modules", portable_dir / "modules", dirs_exist_ok=True)
    shutil.copytree("utils", portable_dir / "utils", dirs_exist_ok=True)
    
    print(f"  复制: 前端文件")
    
    # 重命名exe
    exe_source = portable_dir / f"{exe_name}.exe"
    exe_target = portable_dir / "twitter.exe"
    if exe_source.exists():
        shutil.move(str(exe_source), str(exe_target))
        print(f"  重命名: {exe_name}.exe -> twitter.exe")
    
    # 创建使用说明
    readme_path = portable_dir / "使用说明.txt"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print(f"  创建: 使用说明.txt")
    
    return portable_dir

def main():
    print("=" * 70)
    print("Twitter 绿色便携版构建工具")
    print("将生成两个版本：")
    print("  1. 完整版本 - 带编辑和删除按钮")
    print("  2. 简化版本 - 不带编辑和删除按钮")
    print("=" * 70)
    
    # 检查PyInstaller
    if not check_pyinstaller():
        print("错误: 无法安装PyInstaller")
        return False
    
    # 清理旧的构建
    print("\n清理旧构建文件...")
    for folder in ["dist", "build"]:
        if os.path.exists(folder):
            shutil.rmtree(folder)
            print(f"  删除: {folder}/")
    
    # 构建完整版本
    if not build_version(
        "完整版本（带编辑和删除按钮）",
        "index.html",
        "scripts-editable.js",
        "Twitter-Full"
    ):
        print("\n完整版本构建失败!")
        return False
    
    # 构建简化版本
    if not build_version(
        "简化版本（不带编辑和删除按钮）",
        "index-simple.html",
        "scripts-simple.js",
        "Twitter-Simple"
    ):
        print("\n简化版本构建失败!")
        return False
    
    # 创建便携版文件夹
    print("\n" + "=" * 70)
    print("创建绿色便携版文件夹...")
    print("=" * 70)
    
    # 完整版本使用说明
    readme_full = """Twitter 完整版本 - 使用说明
========================

版本说明：
---------
此版本为完整功能版本，每条推文下方显示：
  [编辑] [删除] 按钮

功能特点：
---------
- 浏览推文列表（瀑布流布局）
- 搜索推文内容
- 按年份、月份筛选
- 按渠道筛选
- 高级搜索功能
- 查看统计数据
- 图片点击放大查看
- 右键复制推文内容
- 编辑推文（内容、时间、渠道、媒体）
- 删除推文

使用说明：
---------
1. 双击 twitter.exe 启动应用
2. 所有数据保存在 data/SR.db 文件中
3. 媒体文件保存在 media 目录中
4. 绿色便携，可放到任何位置运行

注意事项：
---------
- 请勿删除 data 和 media 目录
- 编辑推文时会弹出编辑窗口
- 删除推文前会有确认提示

数据备份：
---------
建议定期备份 data/SR.db 和 media/ 目录
"""
    
    # 简化版本使用说明
    readme_simple = """Twitter 简化版本 - 使用说明
========================

版本说明：
---------
此版本为简化版本，每条推文下方不显示编辑和删除按钮。
仅保留浏览、搜索等基础功能。

功能特点：
---------
- 浏览推文列表（瀑布流布局）
- 搜索推文内容
- 按年份、月份筛选
- 按渠道筛选
- 高级搜索功能
- 查看统计数据
- 图片点击放大查看
- 右键复制推文内容

使用说明：
---------
1. 双击 twitter.exe 启动应用
2. 所有数据保存在 data/SR.db 文件中
3. 媒体文件保存在 media 目录中
4. 绿色便携，可放到任何位置运行

注意事项：
---------
- 请勿删除 data 和 media 目录
- 此版本不支持编辑和删除推文
- 如需编辑功能，请使用完整版本

数据备份：
---------
建议定期备份 data/SR.db 和 media/ 目录
"""
    
    # 创建完整版本便携版
    full_dir = create_portable_folder(
        "完整版本",
        "Twitter-Full",
        "twitter-portable-full",
        readme_full
    )
    
    # 创建简化版本便携版
    simple_dir = create_portable_folder(
        "简化版本",
        "Twitter-Simple",
        "twitter-portable-simple",
        readme_simple
    )
    
    # 输出总结
    print("\n" + "=" * 70)
    print("构建完成!")
    print("=" * 70)
    print(f"\n完整版本: {full_dir.absolute()}")
    print(f"简化版本: {simple_dir.absolute()}")
    print("\n每个文件夹包含:")
    print("  - twitter.exe (主程序)")
    print("  - data/ (数据库目录)")
    print("  - media/ (媒体文件目录)")
    print("  - 使用说明.txt")
    print("\n可以直接复制文件夹到任何地方使用!")
    print("=" * 70)
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n用户取消构建")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n构建过程出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
