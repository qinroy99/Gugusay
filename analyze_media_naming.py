import sqlite3
import os
import re
from datetime import datetime
import json

def analyze_media_naming():
    """
    分析SR.db数据库中媒体文件的命名方式
    """
    # 确定数据库路径
    db_path = os.path.join('data', 'SR.db')
    
    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return
    
    # 连接到数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 查询包含媒体文件的记录
    cursor.execute("""
        SELECT id, datetime, content, channel, media_type, media_path 
        FROM JL 
        WHERE media_path IS NOT NULL AND media_path != ''
        ORDER BY datetime
    """)
    
    records = cursor.fetchall()
    
    if not records:
        print("数据库中没有包含媒体文件的记录")
        return
    
    print(f"找到 {len(records)} 条包含媒体文件的记录")
    print("\n" + "="*80)
    print("媒体文件命名方式分析报告")
    print("="*80)
    
    # 统计信息
    naming_patterns = {}
    media_extensions = {}
    media_counts_by_date = {}
    
    print(f"\n{'ID':<5} {'DateTime':<20} {'Channel':<15} {'MediaType':<12} {'MediaPath':<30}")
    print("-" * 80)
    
    for record in records:
        record_id, datetime_val, content, channel, media_type, media_path = record
        
        print(f"{record_id:<5} {datetime_val:<20} {channel or 'N/A':<15} {media_type or 'N/A':<12} {media_path:<30}")
        
        # 分析媒体文件路径和命名模式
        if media_path:
            # 提取文件扩展名
            _, ext = os.path.splitext(media_path)
            ext = ext.lower()
            media_extensions[ext] = media_extensions.get(ext, 0) + 1
            
            # 提取文件名（不含路径）
            filename = os.path.basename(media_path)
            
            # 分析命名模式
            # 检查是否符合时间戳_记录ID_序号.扩展名的模式
            match = re.match(r'^(\d+)_(\d+)_(\d+)(\.[^.]*)$', filename)
            if match:
                timestamp, record_id_part, index_part, extension = match.groups()
                pattern_key = "timestamp_recordid_index"
            else:
                # 尝试其他模式
                match = re.match(r'^(\d+)(\.[^.]*)$', filename)
                if match:
                    timestamp, extension = match.groups()
                    pattern_key = "timestamp_only"
                else:
                    pattern_key = "other"
            
            naming_patterns[pattern_key] = naming_patterns.get(pattern_key, 0) + 1
            
            # 按日期统计媒体数量
            if datetime_val:
                date_part = datetime_val.split(' ')[0] if ' ' in datetime_val else datetime_val
                media_counts_by_date[date_part] = media_counts_by_date.get(date_part, 0) + 1
    
    print("\n" + "-" * 80)
    print("命名模式统计:")
    print("-" * 80)
    for pattern, count in naming_patterns.items():
        print(f"{pattern:<20}: {count} 个文件")
    
    print("\n" + "-" * 80)
    print("媒体文件扩展名统计:")
    print("-" * 80)
    for ext, count in media_extensions.items():
        print(f"{ext:<10}: {count} 个文件")
    
    print("\n" + "-" * 80)
    print("媒体文件命名模式分析:")
    print("-" * 80)
    
    # 根据找到的模式进行详细分析
    if "timestamp_recordid_index" in naming_patterns:
        print("发现标准命名模式: 时间戳_记录ID_序号.扩展名")
        print("- 例如: 202312011430_5_1.jpg")
        print("  - 时间戳: YYYYMMDDHHMM 格式")
        print("  - 记录ID: 对应数据库中的记录ID")
        print("  - 序号: 同一记录中的媒体文件序号")
    
    if "timestamp_only" in naming_patterns:
        print("\n发现简化命名模式: 时间戳.扩展名")
        print("- 例如: 1672531200.jpg")
        print("  - 时间戳: Unix时间戳格式")
    
    if "other" in naming_patterns:
        print("\n发现其他命名模式，请进一步检查这些文件的命名。")
    
    print("\n" + "-" * 80)
    print("媒体文件数量按日期分布 (前10):")
    print("-" * 80)
    sorted_dates = sorted(media_counts_by_date.items(), key=lambda x: x[0], reverse=True)
    for date, count in sorted_dates[:10]:
        print(f"{date:<12}: {count} 个媒体文件")
    
    # 检查媒体文件是否存在
    print("\n" + "-" * 80)
    print("媒体文件存在性检查 (前20):")
    print("-" * 80)
    media_exists_count = 0
    media_missing_count = 0
    
    for i, record in enumerate(records[:20]):
        _, _, _, _, _, media_path = record
        if media_path:
            full_path = os.path.join('media', media_path.replace('media/', ''))
            if os.path.exists(full_path):
                status = "存在"
                media_exists_count += 1
            else:
                status = "缺失"
                media_missing_count += 1
            print(f"{os.path.basename(media_path):<30} -> {status}")
    
    print(f"\n总计: {media_exists_count} 个文件存在, {media_missing_count} 个文件缺失")
    
    # 关闭数据库连接
    conn.close()

if __name__ == "__main__":
    analyze_media_naming()