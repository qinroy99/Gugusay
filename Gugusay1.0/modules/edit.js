// 编辑功能模块
import { globalState } from './globalState.js';
import { loadPage } from './pageLoader.js';
import { clearFrontendCache } from './globalState.js';
import { toggleMediaSelection, handleMediaFileSelect } from './mediaHandler.js';

// 打开编辑模态框
export function openEditModal(id) {
    // 获取推文数据
    fetch(`/api/records?page=${globalState.currentPage}&pageSize=${globalState.pageSize}`)
        .then(response => response.json())
        .then(data => {
            const record = data.records.find(r => r.id == id);
            if (record) {
                // 填充表单数据
                document.getElementById('edit-id').value = record.id;
                document.getElementById('edit-datetime').value = record.datetime || '';
                document.getElementById('edit-content').value = record.content || '';
                document.getElementById('edit-channel').value = record.channel || '';
                document.getElementById('edit-media-type').value = record.media_type || 'text';
                document.getElementById('edit-media-path').value = record.media_path || '';
                
                // 处理媒体类型
                const mediaSelection = document.getElementById('media-selection');
                const addMediaBtn = document.getElementById('add-media-btn');
                const currentMediaPreview = document.getElementById('current-media-preview');
                
                if (record.media_type === 'image' && record.media_path) {
                    mediaSelection.style.display = 'block';
                    addMediaBtn.textContent = '移除图片';
                    
                    // 显示当前图片预览
                    if (record.media_path) {
                        // 如果有多个图片，media_path 可能包含多个路径，用逗号分隔
                        const paths = record.media_path.split(',').filter(path => path.trim());
                        if (paths.length > 0) {
                            let imagesHtml = '<div style="margin-top: 10px;"><p>当前图片:</p>';
                            paths.forEach(path => {
                                if (path.trim()) {
                                    // 确保路径格式正确
                                    imagesHtml += `<img src="${path.trim()}" style="max-width: 200px; height: auto; border-radius: 5px; margin: 5px;" />`;
                                }
                            });
                            imagesHtml += '</div>';
                            currentMediaPreview.innerHTML = imagesHtml;
                        }
                    }
                } else {
                    mediaSelection.style.display = 'none';
                    addMediaBtn.textContent = '添加图片';
                    currentMediaPreview.innerHTML = '';
                }
                
                // 显示模态框
                const editModal = document.getElementById('edit-modal');
                if (editModal) {
                    editModal.classList.remove('hidden');
                }
            }
        })
        .catch(error => {
            console.error('获取推文数据失败:', error);
            alert('获取推文数据时发生错误');
        });
}

// 保存编辑的记录
export function saveEditedRecord() {
    const id = document.getElementById('edit-id').value;
    const datetime = document.getElementById('edit-datetime').value;
    const content = document.getElementById('edit-content').value;
    const channel = document.getElementById('edit-channel').value;
    const mediaType = document.getElementById('edit-media-type').value;
    const mediaPath = document.getElementById('edit-media-path').value;
    
    // 发送更新请求
    fetch('/api/records/' + id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ datetime, content, channel, media_type: mediaType, media_path: mediaPath })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // 关闭模态框
            const editModal = document.getElementById('edit-modal');
            if (editModal) {
                editModal.classList.add('hidden');
            }
            
            // 重新加载当前页面以显示更新后的数据
            loadPage(globalState.currentPage);
            
            // 清除前端缓存
            clearFrontendCache();
        } else {
            alert('保存失败: ' + (data.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('保存记录失败:', error);
        alert('保存记录时发生错误: ' + error.message);
    });
}

// 删除记录
export function deleteRecord(id) {
    if (confirm('确定要删除这条记录吗？')) {
        fetch(`/api/records/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                // 清除缓存
                clearFrontendCache();
                // 重新加载当前页面
                loadPage(globalState.currentPage);
            } else {
                throw new Error('删除失败');
            }
        })
        .catch(error => {
            console.error('删除记录失败:', error);
            alert('删除记录失败');
        });
    }
}

export default {
    openEditModal,
    saveEditedRecord,
    deleteRecord
};
