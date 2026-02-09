// 媒体文件处理模块

// 切换媒体选择区域显示
export function toggleMediaSelection() {
    const mediaSelection = document.getElementById('media-selection');
    const mediaTypeInput = document.getElementById('edit-media-type');
    const addMediaBtn = document.getElementById('add-media-btn');
    const currentMediaPreview = document.getElementById('current-media-preview');
    
    if (mediaSelection.style.display === 'none' || mediaSelection.style.display === '') {
        // 显示媒体选择区域
        mediaSelection.style.display = 'block';
        mediaTypeInput.value = 'image';
        addMediaBtn.textContent = '移除媒体';
        currentMediaPreview.innerHTML = '';
    } else {
        // 隐藏媒体选择区域
        mediaSelection.style.display = 'none';
        mediaTypeInput.value = 'text';
        addMediaBtn.textContent = '添加媒体';
        document.getElementById('edit-media-path').value = '';
        document.getElementById('edit-media-file').value = '';
        currentMediaPreview.innerHTML = '';
    }
}

// 处理媒体文件选择
export function handleMediaFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 获取datetime值用于文件命名
    const datetimeInput = document.getElementById('edit-datetime').value;
    let timestamp = new Date().getTime(); // 默认使用当前时间戳
    
    // 如果datetime有值，则使用它来生成时间戳
    if (datetimeInput) {
        // datetime格式: YYYY-MM-DD HH:MM
        const datePart = datetimeInput.split(' ')[0]; // YYYY-MM-DD
        const timePart = datetimeInput.split(' ')[1]; // HH:MM
        
        if (datePart && timePart) {
            // 转换为YYYYMMDDHHMM格式
            const year = datePart.split('-')[0];
            const month = datePart.split('-')[1];
            const day = datePart.split('-')[2];
            const hour = timePart.split(':')[0];
            const minute = timePart.split(':')[1];
            timestamp = `${year}${month}${day}${hour}${minute}`;
        }
    }

    // 获取已有的媒体路径（例如在编辑已有记录时）
    const existingMediaPath = document.getElementById('edit-media-path').value;
    const mediaPaths = existingMediaPath ? existingMediaPath.split(',').map(path => path.trim()).filter(path => path) : [];

    const previewContainer = document.getElementById('current-media-preview');
    previewContainer.innerHTML = '<div style="margin-top: 10px;"><p>当前及新增媒体:</p></div>';

    // 处理所有新选择的文件
    const newMediaPaths = []; // 用于存储新文件的路径
    let fileProcessCount = 0; // 已处理的文件数量
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 检查文件类型
        if (!file.type.match('image.*') && !file.type.match('video.*')) {
            alert('请选择图片或视频文件');
            continue;
        }

        // 生成基于datetime的文件名，确保每个文件有不同的索引
        const extension = file.name.split('.').pop();
        // 计算文件索引：已存在的文件数量 + 新文件索引 + 1
        const fileIndex = mediaPaths.length + newMediaPaths.length + 1;
        const newFileName = `${timestamp}_${getCurrentRecordId() || '1'}_${fileIndex}.${extension}`;
        const mediaPath = `media/${newFileName}`;
        newMediaPaths.push(mediaPath); // 添加到新文件路径数组

        // 显示预览
        const reader = new FileReader();
        reader.onload = function(e) {
            if (file.type.match('image.*')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.cssText = 'max-width: 200px; height: auto; border-radius: 5px; margin: 5px;';
                previewContainer.appendChild(img);
            } else if (file.type.match('video.*')) {
                const video = document.createElement('video');
                video.src = e.target.result;
                video.controls = true;
                video.style.cssText = 'max-width: 200px; height: auto; border-radius: 5px; margin: 5px;';
                previewContainer.appendChild(video);
            }
            
            // 每次处理完一个文件就递增计数器
            fileProcessCount++;
            
            // 当所有文件都处理完毕后，更新表单中的媒体路径
            if (fileProcessCount === files.length) {
                // 合并已有的媒体路径和新的媒体路径
                const allMediaPaths = [...mediaPaths, ...newMediaPaths];
                
                // 更新表单中的媒体路径（多个路径用逗号分隔）
                document.getElementById('edit-media-path').value = allMediaPaths.join(',');
            }
        };
        reader.readAsDataURL(file);

        // 实际保存文件到 media 文件夹，同时传递datetime和recordId参数
        const formData = new FormData();
        formData.append('file', file, newFileName);
        formData.append('datetime', datetimeInput); // 添加datetime参数
        formData.append('recordId', getCurrentRecordId() || '1'); // 添加recordId参数
        
        // 发送到后端保存文件
        fetch('/api/save-media-file', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('保存媒体文件失败:', data.error);
                alert('保存图片失败: ' + data.error);
            } else {
                console.log('文件保存成功:', data.path);
            }
        })
        .catch(error => {
            console.error('保存媒体文件错误:', error);
            alert('保存图片时发生错误');
        });
    }

    // 如果没有文件需要处理，也要更新表单中的媒体路径
    if (files.length === 0) {
        // 合并已有的媒体路径和新的媒体路径
        const allMediaPaths = [...mediaPaths, ...newMediaPaths];
        
        // 更新表单中的媒体路径（多个路径用逗号分隔）
        document.getElementById('edit-media-path').value = allMediaPaths.join(',');
    }
}

// 处理粘贴事件
export function handlePaste(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    
    // 检查是否有文件在剪贴板中
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // 检查是否为图片类型
        if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            
            // 检查是否在编辑模态框打开时粘贴
            const editModal = document.getElementById('edit-modal');
            if (editModal && !editModal.classList.contains('hidden')) {
                event.preventDefault();
                handlePastedImage(file);
            }
        }
    }
}

// 处理粘贴的图片
function handlePastedImage(file) {
    if (!file) return;

    // 获取datetime值用于文件命名
    const datetimeInput = document.getElementById('edit-datetime').value;
    let timestamp = new Date().getTime(); // 默认使用当前时间戳
    
    // 如果datetime有值，则使用它来生成时间戳
    if (datetimeInput) {
        // datetime格式: YYYY-MM-DD HH:MM
        const datePart = datetimeInput.split(' ')[0]; // YYYY-MM-DD
        const timePart = datetimeInput.split(' ')[1]; // HH:MM
        
        if (datePart && timePart) {
            // 转换为YYYYMMDDHHMM格式
            const year = datePart.split('-')[0];
            const month = datePart.split('-')[1];
            const day = datePart.split('-')[2];
            const hour = timePart.split(':')[0];
            const minute = timePart.split(':')[1];
            timestamp = `${year}${month}${day}${hour}${minute}`;
        }
    }

    // 获取已有的媒体路径（例如在编辑已有记录时）
    const existingMediaPath = document.getElementById('edit-media-path').value;
    const mediaPaths = existingMediaPath ? existingMediaPath.split(',').map(path => path.trim()).filter(path => path) : [];

    const previewContainer = document.getElementById('current-media-preview');
    
    // 如果还没有显示媒体选择区域，则显示它
    const mediaSelection = document.getElementById('media-selection');
    const mediaTypeInput = document.getElementById('edit-media-type');
    const addMediaBtn = document.getElementById('add-media-btn');
    
    if (mediaSelection.style.display === 'none' || mediaSelection.style.display === '') {
        mediaSelection.style.display = 'block';
        mediaTypeInput.value = file.type.match('image.*') ? 'image' : 'video';
        addMediaBtn.textContent = '移除媒体';
        previewContainer.innerHTML = '<div style="margin-top: 10px;"><p>当前及新增媒体:</p></div>';
    }

    // 生成基于datetime的文件名，确保每个文件有不同的索引
    const extension = file.name.split('.').pop() || 'png';
    // 计算文件索引：已存在的文件数量 + 1
    const fileIndex = mediaPaths.length + 1;
    const newFileName = `${timestamp}_${getCurrentRecordId() || '1'}_${fileIndex}.${extension}`;
    const mediaPath = `media/${newFileName}`;
    mediaPaths.push(mediaPath);

    // 显示预览
    const reader = new FileReader();
    reader.onload = function(e) {
        if (file.type.match('image.*')) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'max-width: 200px; height: auto; border-radius: 5px; margin: 5px;';
            previewContainer.appendChild(img);
        } else if (file.type.match('video.*')) {
            const video = document.createElement('video');
            video.src = e.target.result;
            video.controls = true;
            video.style.cssText = 'max-width: 200px; height: auto; border-radius: 5px; margin: 5px;';
            previewContainer.appendChild(video);
        }
        
        // 更新表单中的媒体路径（多个路径用逗号分隔）
        document.getElementById('edit-media-path').value = mediaPaths.join(',');
    };
    reader.readAsDataURL(file);
    
    // 实际保存文件到 media 文件夹，同时传递datetime和recordId参数
    const formData = new FormData();
    formData.append('file', file, newFileName);
    formData.append('datetime', datetimeInput); // 添加datetime参数
    formData.append('recordId', getCurrentRecordId() || '1'); // 添加recordId参数
    
    // 发送到后端保存文件
    fetch('/api/save-media-file', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('保存媒体文件失败:', data.error);
            alert('保存图片失败: ' + data.error);
        } else {
            console.log('文件保存成功:', data.path);
        }
    })
    .catch(error => {
        console.error('保存媒体文件错误:', error);
        alert('保存图片时发生错误');
    });
}

// 获取当前记录ID（用于媒体文件命名）
function getCurrentRecordId() {
    // 获取当前正在编辑的记录ID
    const editModal = document.getElementById('edit-modal');
    if (editModal && !editModal.classList.contains('hidden')) {
        // 如果是编辑模式，从隐藏字段获取ID
        const idInput = document.getElementById('edit-id');
        if (idInput && idInput.value) {
            return idInput.value;
        }
    }
    // 如果是新建记录，返回null或默认值
    return null;
}

// 实际保存媒体文件到 media 文件夹
export function saveMediaFile(file, fileName) {
    // 获取datetime值用于文件命名
    const datetimeInput = document.getElementById('edit-datetime').value;
    
    // 创建 FormData 对象用于发送文件
    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('datetime', datetimeInput); // 添加datetime参数
    formData.append('recordId', getCurrentRecordId() || '1'); // 添加recordId参数
    
    // 发送到后端保存文件
    fetch('/api/save-media-file', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('保存媒体文件失败:', data.error);
            alert('保存图片失败: ' + data.error);
        } else {
            console.log('文件保存成功:', data.path);
        }
    })
    .catch(error => {
        console.error('保存媒体文件错误:', error);
        alert('保存图片时发生错误');
    });
}

export default {
    toggleMediaSelection,
    handleMediaFileSelect,
    handlePaste,
    saveMediaFile
};
