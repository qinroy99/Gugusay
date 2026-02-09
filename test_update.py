#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试在线更新功能
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.updater import Updater

def test_updater():
    """测试更新器功能"""
    print("=" * 60)
    print("测试在线更新功能")
    print("=" * 60)
    
    updater = Updater()
    
    # 测试1: 检查更新
    print("\n1. 测试检查更新...")
    result = updater.check_update()
    print(f"   结果: {result}")
    
    # 测试2: 获取本地版本
    print("\n2. 测试获取本地版本...")
    version = updater._get_local_version()
    print(f"   本地版本: {version}")
    
    # 测试3: 获取更新URL
    print("\n3. 测试获取更新URL...")
    url = updater.update_url
    print(f"   更新URL: {url}")
    
    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)

if __name__ == "__main__":
    test_updater()
