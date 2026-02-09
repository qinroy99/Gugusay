import sqlite3
import os

def analyze_id_datetime():
    """
    分析当前数据库中ID和datetime的关系，检查是否已经是按时间顺序排列
    """
    db_path = os.path.join('data', 'SR.db')
    
    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return
    
    # 连接到数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 查询前20条记录，按时间从早到晚排序
    cursor.execute("""
        SELECT id, datetime, media_path
        FROM JL 
        ORDER BY datetime ASC
        LIMIT 20
    """)
    
    records = cursor.fetchall()
    
    print("前20条记录（按时间排序）:")
    print(f"{'序号':<5} {'数据库ID':<8} {'时间':<20} {'媒体路径'}")
    print("-" * 80)
    
    for i, (db_id, datetime_val, media_path) in enumerate(records, 1):
        media_info = media_path if media_path else "无媒体"
        print(f"{i:<5} {db_id:<8} {datetime_val:<20} {media_info}")
    
    print("\n" + "="*80)
    
    # 检查所有记录是否按ID顺序排列
    cursor.execute("""
        SELECT id, datetime
        FROM JL 
        ORDER BY datetime ASC
    """)
    
    all_records = cursor.fetchall()
    
    # 检查ID是否已经按顺序排列
    ids_in_time_order = [record[0] for record in all_records]
    expected_ids = list(range(1, len(ids_in_time_order) + 1))
    
    is_sequential = ids_in_time_order == expected_ids
    
    print(f"总记录数: {len(all_records)}")
    print(f"ID是否已经按时间顺序排列: {is_sequential}")
    
    if not is_sequential:
        # 显示一些不匹配的示例
        print("\n前10个ID与预期ID的对比:")
        print(f"{'位置':<5} {'预期ID':<8} {'实际ID':<8}")
        print("-" * 30)
        for i in range(min(10, len(ids_in_time_order))):
            print(f"{i+1:<5} {i+1:<8} {ids_in_time_order[i]:<8}")
    
    # 检查ID的最大值和连续性
    max_id = max(ids_in_time_order) if ids_in_time_order else 0
    total_count = len(ids_in_time_order)
    
    print(f"\nID范围: 1 到 {max_id}")
    print(f"记录总数: {total_count}")
    print(f"ID是否连续: {'是' if max_id == total_count else '否'}")
    
    # 检查是否有缺失的ID
    if max_id != total_count:
        all_expected_ids = set(range(1, max_id + 1))
        actual_ids = set(ids_in_time_order)
        missing_ids = all_expected_ids - actual_ids
        extra_ids = actual_ids - all_expected_ids
        
        if missing_ids:
            print(f"缺失的ID (前10个): {sorted(list(missing_ids))[:10]}")
        if extra_ids:
            print(f"多余的ID (前10个): {sorted(list(extra_ids))[:10]}")
    
    conn.close()

if __name__ == "__main__":
    analyze_id_datetime()