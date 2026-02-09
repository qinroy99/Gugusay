#!/usr/bin/env python
# -*- coding: utf-8 -*-
# 测试 favicon.ico 请求
import requests
import os

def test_favicon():
    """测试 favicon.ico 是否能正确加载"""
    try:
        response = requests.get('http://localhost:3000/favicon.ico')
        if response.status_code == 200:
            print("SUCCESS: favicon.ico 加载成功")
            print(f"  内容类型: {response.headers.get('Content-Type')}")
            print(f"  文件大小: {len(response.content)} 字节")
        else:
            print(f"FAIL: favicon.ico 加载失败，状态码: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("FAIL: 无法连接到服务器，请确保应用程序正在运行")
    except Exception as e:
        print(f"FAIL: 测试出错: {e}")

if __name__ == "__main__":
    test_favicon()