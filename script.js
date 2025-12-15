// script.js - 增强版制作页面的逻辑

// 情绪数据 - 添加一个自定义情绪用于测试
let emotions = [
    { id: 'happy', emoji: '😊', name: '开心', messages: [], isCustom: false },
    { id: 'sad', emoji: '😢', name: '伤心', messages: [], isCustom: false },
    { id: 'angry', emoji: '😠', name: '生气', messages: [], isCustom: false },
    { id: 'love', emoji: '🥰', name: '爱你', messages: [], isCustom: false },
    { id: 'cool', emoji: '😎', name: '得意', messages: [], isCustom: false },
    { id: 'think', emoji: '🤔', name: '思考', messages: [], isCustom: false },
    { id: 'laugh', emoji: '😂', name: '大笑', messages: [], isCustom: false },
    { id: 'surprise', emoji: '😲', name: '惊讶', messages: [], isCustom: false },
    { id: 'sleepy', emoji: '😴', name: '困倦', messages: [], isCustom: false },
    { id: 'sick', emoji: '🤒', name: '生病', messages: [], isCustom: false },
    { id: 'celebrate', emoji: '🎉', name: '庆祝', messages: [], isCustom: false },
    { id: 'thankful', emoji: '🙏', name: '感恩', messages: [], isCustom: false },
    { id: 'excited', emoji: '🤩', name: '兴奋', messages: [], isCustom: true } // 添加一个自定义情绪
];

// 盒子数据
let boxDesign = {
    title: '我的情绪盒子',
    color: '#ff6b8b',
    customImage: null,
    creatorName: ''
};

let currentEmotionIndex = 0;
let rotationY = -20; // 3D盒子旋转角度
let rotationX = -10;

// 拖拽排序功能
let isSortMode = false;
let draggedEmotion = null;
let hideEmptyEmotions = false;

// 纸条编辑功能
let editingMessageIndex = -1;
let selectedMessages = new Set();

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initDesignSection();
    initEmotionSection();
    initShareSection();
    initBoxPreview();
    initBatchActions();
    updatePreview();
    setupTextareaHint(); // 添加提示文本
});

// 设置textarea提示文本
function setupTextareaHint() {
    const textarea = document.getElementById('messageInput');
    if (textarea) {
        textarea.placeholder = "写下你的心里话... (按 Ctrl+Enter 快速添加)";
    }
}

// 设计区域初始化
function initDesignSection() {
    // 盒子名称输入
    const boxTitleInput = document.getElementById('boxTitle');
    boxTitleInput.addEventListener('input', function() {
        boxDesign.title = this.value;
        updatePreview();
        updateCurrentSettings();
    });
    
    // 制作者名称
    const creatorNameInput = document.getElementById('creatorName');
    creatorNameInput.addEventListener('input', function() {
        boxDesign.creatorName = this.value;
    });
    
    // 预设颜色选择
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            boxDesign.color = this.dataset.color;
            document.getElementById('colorPicker').value = boxDesign.color;
            document.getElementById('currentColorHex').textContent = boxDesign.color;
            updatePreview();
            updateCurrentSettings();
        });
    });
    
    // 调色盘切换
    document.getElementById('toggleColorPicker').addEventListener('click', function() {
        const picker = document.getElementById('colorPicker');
        picker.classList.toggle('active');
        if (picker.classList.contains('active')) {
            picker.focus();
        }
    });
    
    // 调色盘选择
    document.getElementById('colorPicker').addEventListener('input', function() {
        boxDesign.color = this.value;
        document.getElementById('currentColorHex').textContent = boxDesign.color;
        
        // 更新激活的预设颜色（如果有匹配的）
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.color === boxDesign.color) {
                opt.classList.add('active');
            }
        });
        
        updatePreview();
        updateCurrentSettings();
    });
    
    // 图片上传
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('click', () => {
        document.getElementById('imageUpload').click();
    });
    
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('请上传图片文件！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            boxDesign.customImage = e.target.result;
            
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <img src="${e.target.result}" class="preview-image" alt="盒子贴纸">
                </div>
                <button class="btn btn-secondary" id="removeImageBtn">
                    <i class="fas fa-trash"></i> 移除贴纸
                </button>
            `;
            
            // 绑定移除按钮
            document.getElementById('removeImageBtn').addEventListener('click', function() {
                boxDesign.customImage = null;
                document.getElementById('imagePreview').innerHTML = '';
                document.getElementById('imageUpload').value = '';
                updatePreview();
            });
            
            updatePreview();
        };
        reader.readAsDataURL(file);
    });
    
    // 下一步按钮
    document.getElementById('nextToEmotions').addEventListener('click', function() {
        const title = document.getElementById('boxTitle').value.trim();
        if (!title) {
            alert('请为情绪盒子起一个名字！');
            return;
        }
        
        boxDesign.title = title;
        boxDesign.creatorName = document.getElementById('creatorName').value.trim();
        
        // 切换到情绪填写区域
        document.getElementById('designSection').classList.remove('active');
        document.getElementById('emotionSection').classList.add('active');
        updateStepIndicator(2);
        
        // 初始化情绪网格
        initEmotionGrid();
    });
}

// 初始化情绪网格
function initEmotionGrid() {
    const container = document.getElementById('emotionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    emotions.forEach((emotion, index) => {
        const messageCount = emotion.messages.length;
        const hasMessages = messageCount > 0;
        
        const card = document.createElement('div');
        card.className = `emotion-card ${index === currentEmotionIndex ? 'active' : ''} ${!hasMessages ? 'empty' : ''} ${hideEmptyEmotions && !hasMessages ? 'hidden' : ''}`;
        card.dataset.index = index;
        card.dataset.emotionId = emotion.id;
        
        card.innerHTML = `
            <div class="emotion-card-content">
                <div class="emotion-card-emoji">${emotion.emoji}</div>
                <div class="emotion-card-info">
                    <div class="emotion-card-name">
                        ${emotion.name}
                        ${emotion.isCustom ? '<span style="font-size:0.8rem; color:#888; margin-left:8px;">(自定义)</span>' : ''}
                    </div>
                    <div class="emotion-card-count">
                        <span><i class="fas fa-sticky-note"></i> ${messageCount} 张纸条</span>
                        ${!hasMessages ? '<span style="color:#ff9800;"><i class="fas fa-exclamation-triangle"></i> 暂无纸条</span>' : ''}
                    </div>
                </div>
                <div class="emotion-card-actions">
                    <button class="emotion-action-btn move" title="拖动排序" data-action="move">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    ${emotion.isCustom ? `
                        <button class="emotion-action-btn delete" title="删除情绪" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // 点击选择情绪
        card.addEventListener('click', (e) => {
            if (e.target.closest('.emotion-card-actions')) return;
            if (isSortMode) return;
            
            selectEmotion(index);
        });
        
        // 绑定动作按钮
        const moveBtn = card.querySelector('[data-action="move"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        
        if (moveBtn) {
            moveBtn.addEventListener('mousedown', (e) => {
                if (!isSortMode) return;
                e.preventDefault();
                startDragging(card, index);
            });
            
            // 添加拖拽事件监听器
            card.setAttribute('draggable', 'true');
            card.addEventListener('dragstart', (e) => {
                if (!isSortMode) return;
                e.dataTransfer.setData('text/plain', index);
                card.classList.add('dragging');
                draggedEmotion = card;
            });
            
            card.addEventListener('dragend', () => {
                if (!isSortMode) return;
                card.classList.remove('dragging');
                draggedEmotion = null;
                updateEmotionOrder();
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteEmotion(index);
            });
        }
        
        container.appendChild(card);
    });
    
    // 初始化拖拽排序
    initDragAndDrop();
    
    // 更新当前情绪显示
    if (emotions.length > 0) {
        selectEmotion(currentEmotionIndex);
    }
}

// 初始化拖拽排序
function initDragAndDrop() {
    const container = document.getElementById('emotionsContainer');
    if (!container) return;
    
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (!isSortMode || !draggedEmotion) return;
        
        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement) {
            container.insertBefore(draggedEmotion, afterElement);
        } else {
            container.appendChild(draggedEmotion);
        }
    });
}

// 开始拖拽
function startDragging(element, index) {
    if (!isSortMode) return;
    
    draggedEmotion = element;
    draggedEmotion.classList.add('dragging');
}

// 获取拖拽后的元素
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.emotion-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 更新情绪顺序
function updateEmotionOrder() {
    const container = document.getElementById('emotionsContainer');
    if (!container) return;
    
    const cards = container.querySelectorAll('.emotion-card');
    const newOrder = [];
    
    cards.forEach((card, index) => {
        const emotionIndex = parseInt(card.dataset.index);
        newOrder.push(emotionIndex);
    });
    
    // 重新排序emotions数组
    const sortedEmotions = newOrder.map(index => emotions[index]);
    emotions = sortedEmotions;
    
    // 更新卡片的数据索引
    cards.forEach((card, index) => {
        card.dataset.index = index;
        if (index === currentEmotionIndex) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    
    showMessage('情绪顺序已更新', 'success');
}

// 选择情绪
function selectEmotion(index) {
    currentEmotionIndex = index;
    
    // 更新网格激活状态
    document.querySelectorAll('.emotion-card').forEach((card, i) => {
        card.classList.toggle('active', i === index);
    });
    
    // 更新当前情绪显示
    const emotion = emotions[index];
    document.getElementById('currentEmoji').textContent = emotion.emoji;
    document.getElementById('currentName').textContent = emotion.name;
    document.getElementById('currentEmotionNameDisplay').textContent = emotion.name;
    
    // 清空选择的纸条
    selectedMessages.clear();
    updateBatchActionsBar();
    
    // 更新纸条计数和列表
    updateMessageCount();
    renderMessagesList();
}

// 删除情绪
function deleteEmotion(index) {
    const emotion = emotions[index];
    
    if (!emotion.isCustom) {
        alert('预设情绪无法删除，但可以隐藏。\n\n提示：使用"隐藏无纸条的情绪"功能可以隐藏没有纸条的情绪。');
        return;
    }
    
    if (emotion.messages.length > 0) {
        const confirmDelete = confirm(`"${emotion.name}"情绪还有${emotion.messages.length}张纸条，确定要删除吗？\n\n所有相关的纸条也会被删除。`);
        if (!confirmDelete) return;
    }
    
    emotions.splice(index, 1);
    
    // 如果删除的是当前选中的情绪，选择第一个情绪
    if (index === currentEmotionIndex) {
        currentEmotionIndex = 0;
    } else if (index < currentEmotionIndex) {
        currentEmotionIndex--;
    }
    
    initEmotionGrid();
    showMessage(`已删除情绪"${emotion.name}"`, 'success');
}

// 显示/隐藏无纸条的情绪
function toggleEmptyEmotions() {
    hideEmptyEmotions = !hideEmptyEmotions;
    const toggleBtn = document.getElementById('toggleEmptyEmotions');
    
    if (hideEmptyEmotions) {
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i> 显示所有情绪';
        // 隐藏无纸条的情绪
        document.querySelectorAll('.emotion-card.empty').forEach(card => {
            card.classList.add('hidden');
        });
        showMessage('已隐藏无纸条的情绪', 'info');
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏无纸条的情绪';
        // 显示所有情绪
        document.querySelectorAll('.emotion-card').forEach(card => {
            card.classList.remove('hidden');
        });
        showMessage('已显示所有情绪', 'info');
    }
}

// 排序模式切换
function toggleSortMode() {
    isSortMode = !isSortMode;
    const sortBtn = document.getElementById('sortEmotionsBtn');
    const container = document.getElementById('emotionsContainer');
    
    if (isSortMode) {
        sortBtn.innerHTML = '<i class="fas fa-check"></i> 完成排序';
        sortBtn.style.background = '#4CAF50';
        sortBtn.style.color = 'white';
        if (container) container.style.cursor = 'move';
        showMessage('排序模式已开启，拖动情绪卡片调整顺序', 'info');
    } else {
        sortBtn.innerHTML = '<i class="fas fa-sort"></i> 排序模式';
        sortBtn.style.background = '';
        sortBtn.style.color = '';
        if (container) container.style.cursor = '';
        showMessage('排序模式已关闭', 'info');
    }
    
    // 更新所有卡片的拖拽状态
    document.querySelectorAll('.emotion-card').forEach(card => {
        card.style.cursor = isSortMode ? 'move' : 'pointer';
    });
}

// 情绪区域初始化
function initEmotionSection() {
    // 添加自定义情绪按钮
    document.getElementById('addCustomEmotionBtn').addEventListener('click', function() {
        document.getElementById('customEmotionModal').style.display = 'flex';
    });
    
    // 关闭自定义情绪模态框
    document.getElementById('closeCustomModal').addEventListener('click', function() {
        document.getElementById('customEmotionModal').style.display = 'none';
    });
    
    // 保存自定义情绪
    document.getElementById('saveCustomEmotion').addEventListener('click', function() {
        const name = document.getElementById('customEmotionName').value.trim();
        const emoji = document.getElementById('customEmotionEmoji').value.trim();
        
        if (!name) {
            alert('请输入情绪名称！');
            return;
        }
        
        if (!emoji) {
            alert('请输入表情符号！');
            return;
        }
        
        // 创建自定义情绪
        const customEmotion = {
            id: 'custom_' + Date.now(),
            emoji: emoji,
            name: name,
            messages: [],
            isCustom: true
        };
        
        emotions.push(customEmotion);
        
        // 清空表单
        document.getElementById('customEmotionName').value = '';
        document.getElementById('customEmotionEmoji').value = '';
        
        // 关闭模态框
        document.getElementById('customEmotionModal').style.display = 'none';
        
        // 更新情绪网格并选中新添加的情绪
        initEmotionGrid();
        selectEmotion(emotions.length - 1);
        
        showMessage(`已添加自定义情绪"${name}"`, 'success');
    });
    
    // 表情选择器按钮
    document.getElementById('emojiPickerBtn').addEventListener('click', function() {
        const emojis = ['😊', '😢', '😠', '🥰', '😎', '🤔', '😂', '😲', '😴', '🤒', '🎉', '🙏', 
                       '😍', '🤩', '🥳', '😭', '😤', '😨', '🤗', '🤭', '🤫', '🤔', '😏', '😌'];
        
        let emojiList = '<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin: 15px 0;">';
        emojis.forEach(emoji => {
            emojiList += `<button style="font-size: 1.5rem; background: none; border: none; cursor: pointer;" onclick="document.getElementById('customEmotionEmoji').value = '${emoji}'">${emoji}</button>`;
        });
        emojiList += '</div>';
        
        alert('选择表情符号：\n\n' + emojiList);
    });
    
    // 绑定新的事件
    document.getElementById('sortEmotionsBtn').addEventListener('click', toggleSortMode);
    document.getElementById('toggleEmptyEmotions').addEventListener('click', toggleEmptyEmotions);
    document.getElementById('batchDeleteBtn').addEventListener('click', showBatchDeleteConfirm);
    
    // 添加纸条
    document.getElementById('addMessageBtn').addEventListener('click', addTextMessage);
    
    // 添加图片纸条按钮
    const addImageBtn = document.createElement('button');
    addImageBtn.className = 'btn btn-secondary';
    addImageBtn.innerHTML = '<i class="fas fa-image"></i> 添加图片纸条';
    addImageBtn.id = 'addImageMessageBtn';
    addImageBtn.addEventListener('click', addImageMessage);
    
    // 将图片按钮添加到添加纸条按钮旁边
    const addMessageBtn = document.getElementById('addMessageBtn');
    if (addMessageBtn && addMessageBtn.parentNode) {
        addMessageBtn.parentNode.appendChild(addImageBtn);
    }
    
    // 添加键盘快捷键 - FIXED
    document.getElementById('messageInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); // 防止默认行为（换行）
            addTextMessage();
        }
    });

    // 编辑模态框事件
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('saveEditedMessage').addEventListener('click', saveEditedMessage);
    
    // 批量删除模态框事件
    document.getElementById('closeBatchDeleteModal').addEventListener('click', closeBatchDeleteModal);
    document.getElementById('cancelBatchDelete').addEventListener('click', closeBatchDeleteModal);
    document.getElementById('confirmBatchDelete').addEventListener('click', confirmBatchDelete);
    
    // 字符计数初始化 - 只初始化编辑模态框的
    updateCharCount('editMessageText', 'editCharCount');
    
    // 导航按钮
    document.getElementById('prevToDesign').addEventListener('click', () => {
        document.getElementById('emotionSection').classList.remove('active');
        document.getElementById('designSection').classList.add('active');
        updateStepIndicator(1);
    });

    document.getElementById('finishBox').addEventListener('click', generateBox);
}

// 添加文字纸条
function addTextMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) {
        alert('请输入纸条内容！');
        return;
    }
    
    if (message.length > 500) {
        alert('纸条内容不能超过500字！');
        return;
    }
    
    // 创建文字纸条对象
    const textMessage = {
        type: 'text',
        content: message,
        timestamp: new Date().toISOString()
    };
    
    emotions[currentEmotionIndex].messages.push(textMessage);
    input.value = '';
    input.focus();
    
    updateMessageCount();
    renderMessagesList();
    showMessage('文字纸条添加成功！', 'success');
}

// 添加图片纸条
function addImageMessage() {
    // 创建文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('请上传图片文件！');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 限制5MB
            alert('图片大小不能超过5MB！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // 显示图片预览模态框
            showImagePreviewModal(e.target.result, file.name);
        };
        reader.readAsDataURL(file);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// 显示图片预览模态框
function showImagePreviewModal(imageData, fileName) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'imagePreviewModal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3><i class="fas fa-image"></i> 图片预览</h3>
                <button class="close-modal" id="closeImagePreview">&times;</button>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <img src="${imageData}" id="previewImage" style="max-width: 100%; max-height: 300px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                <p style="margin-top: 10px; color: #666;">${fileName}</p>
            </div>
            
            <div class="form-group">
                <label for="imageCaption"><i class="fas fa-comment"></i> 图片描述（可选）</label>
                <textarea id="imageCaption" placeholder="为这张图片添加描述..." rows="3" style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; resize: vertical;"></textarea>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
                <div style="color: #666; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> 接收者将看到这张图片和描述
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" id="cancelImageUpload">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="btn btn-primary" id="confirmImageUpload">
                        <i class="fas fa-check"></i> 添加图片纸条
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    document.getElementById('closeImagePreview').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('cancelImageUpload').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('confirmImageUpload').addEventListener('click', () => {
        const caption = document.getElementById('imageCaption').value.trim();
        const previewImage = document.getElementById('previewImage').src;
        
        // 创建图片纸条对象
        const imageMessage = {
            type: 'image',
            imageData: previewImage,
            caption: caption,
            fileName: fileName,
            timestamp: new Date().toISOString()
        };
        
        emotions[currentEmotionIndex].messages.push(imageMessage);
        
        updateMessageCount();
        renderMessagesList();
        document.body.removeChild(modal);
        
        showMessage('图片纸条添加成功！', 'success');
    });
}

// 更新纸条计数
function updateMessageCount() {
    const count = emotions[currentEmotionIndex].messages.length;
    const messageCountElement = document.getElementById('messageCount');
    const totalMessageCountElement = document.getElementById('totalMessageCount');
    
    if (messageCountElement) {
        messageCountElement.textContent = count;
    }
    if (totalMessageCountElement) {
        totalMessageCountElement.textContent = count;
    }
}

// 渲染纸条列表 - 更新以支持图片纸条
function renderMessagesList() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    const messages = emotions[currentEmotionIndex].messages;
    const emotionName = emotions[currentEmotionIndex].name;
    
    // 更新标题
    const emotionNameDisplay = document.getElementById('currentEmotionNameDisplay');
    const totalMessageCountElement = document.getElementById('totalMessageCount');
    
    if (emotionNameDisplay) emotionNameDisplay.textContent = emotionName;
    if (totalMessageCountElement) totalMessageCountElement.textContent = messages.length;
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h4>还没有为"${emotionName}"情绪添加纸条</h4>
                <p>可以添加文字纸条或图片纸条</p>
            </div>
        `;
        const batchDeleteBtn = document.getElementById('batchDeleteBtn');
        if (batchDeleteBtn) batchDeleteBtn.style.display = 'none';
        return;
    }
    
    container.innerHTML = '';
    messages.forEach((message, index) => {
        const isSelected = selectedMessages.has(index);
        const card = document.createElement('div');
        card.className = `message-card ${isSelected ? 'selected' : ''}`;
        card.dataset.index = index;
        
        // 根据纸条类型渲染不同内容
        let messageContent = '';
        let iconClass = 'fas fa-sticky-note';
        
        if (message.type === 'image') {
            iconClass = 'fas fa-image';
            messageContent = `
                <div style="margin-bottom: 10px; text-align: center;">
                    <img src="${message.imageData}" style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
                </div>
                ${message.caption ? `<div style="color: #555; font-style: italic; margin-top: 8px;">📷 ${message.caption}</div>` : '<div style="color: #888; font-size: 0.9rem;">(图片纸条)</div>'}
            `;
        } else {
            // 文字纸条
            messageContent = `<div class="message-content">${message.content || message}</div>`;
        }
        
        card.innerHTML = `
            <input type="checkbox" class="message-checkbox" data-index="${index}" ${isSelected ? 'checked' : ''} style="display: none;">
            <div class="message-card-header">
                <span class="message-index">
                    <i class="${iconClass}" style="margin-right: 5px;"></i>第 ${index + 1} 张
                </span>
                <div class="message-actions">
                    <button class="message-action-btn edit" title="编辑纸条" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="message-action-btn delete" title="删除纸条" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="message-action-btn select" title="选择纸条" data-index="${index}">
                        <i class="${isSelected ? 'fas fa-check-square' : 'far fa-square'}"></i>
                    </button>
                </div>
            </div>
            ${messageContent}
        `;
        
        // 绑定编辑按钮（文字纸条可以编辑，图片纸条不能编辑内容）
        const editBtn = card.querySelector('.edit');
        if (editBtn) {
            if (message.type === 'image') {
                editBtn.style.display = 'none'; // 图片纸条暂时不支持编辑
            } else {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editMessage(index);
                });
            }
        }
        
        // 绑定删除按钮
        const deleteBtn = card.querySelector('.delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMessage(index);
            });
        }
        
        // 绑定选择按钮
        const selectBtn = card.querySelector('.select');
        if (selectBtn) {
            selectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSelectMessage(card, index);
            });
        }
        
        // 卡片点击事件
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.message-actions')) {
                // 双击编辑（只对文字纸条）
                if (e.detail === 2 && message.type !== 'image') {
                    editMessage(index);
                }
            }
        });
        
        container.appendChild(card);
    });
    
    // 显示批量删除按钮
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    if (batchDeleteBtn) batchDeleteBtn.style.display = 'inline-flex';
}

// 编辑纸条 - 更新以支持文字纸条编辑
function editMessage(index) {
    const message = emotions[currentEmotionIndex].messages[index];
    
    // 只编辑文字纸条
    if (message.type === 'image') {
        alert('图片纸条暂时不支持编辑内容');
        return;
    }
    
    editingMessageIndex = index;
    const messageContent = message.type === 'text' ? message.content : message;
    
    // 填充编辑框
    document.getElementById('editMessageText').value = messageContent;
    updateCharCount('editMessageText', 'editCharCount');
    
    // 显示编辑模态框
    document.getElementById('editMessageModal').style.display = 'flex';
}

// 保存编辑的纸条
function saveEditedMessage() {
    const editedText = document.getElementById('editMessageText').value.trim();
    
    if (!editedText) {
        alert('纸条内容不能为空！');
        return;
    }
    
    if (editedText.length > 500) {
        alert('纸条内容不能超过500字！');
        return;
    }
    
    if (editingMessageIndex !== -1) {
        const message = emotions[currentEmotionIndex].messages[editingMessageIndex];
        
        if (message.type === 'text') {
            message.content = editedText;
        } else {
            // 如果是旧格式的纯文本纸条，转换为新格式
            emotions[currentEmotionIndex].messages[editingMessageIndex] = {
                type: 'text',
                content: editedText,
                timestamp: new Date().toISOString()
            };
        }
        
        renderMessagesList();
        showMessage('纸条修改成功！', 'success');
    }
    
    // 关闭模态框
    closeEditModal();
}

// 关闭编辑模态框
function closeEditModal() {
    document.getElementById('editMessageModal').style.display = 'none';
    document.getElementById('editMessageText').value = '';
    editingMessageIndex = -1;
}

// 删除纸条
function deleteMessage(index) {
    if (!confirm('确定要删除这张纸条吗？')) return;
    
    emotions[currentEmotionIndex].messages.splice(index, 1);
    updateMessageCount();
    renderMessagesList();
    selectedMessages.clear();
    updateBatchActionsBar();
    
    showMessage('纸条删除成功！', 'success');
}

// 更新字符计数 - 只用于编辑模态框
function updateCharCount(textareaId, countId) {
    const textarea = document.getElementById(textareaId);
    const countSpan = document.getElementById(countId);
    
    if (textarea && countSpan) {
        textarea.addEventListener('input', function() {
            countSpan.textContent = this.value.length;
            
            if (this.value.length > 500) {
                countSpan.style.color = '#dc3545';
            } else {
                countSpan.style.color = '#666';
            }
        });
        
        // 初始计数
        countSpan.textContent = textarea.value.length;
    }
}

// 批量操作初始化
function initBatchActions() {
    const batchSelectAll = document.getElementById('batchSelectAll');
    const batchDelete = document.getElementById('batchDelete');
    const batchCancel = document.getElementById('batchCancel');
    
    if (batchSelectAll) batchSelectAll.addEventListener('click', toggleSelectAll);
    if (batchDelete) batchDelete.addEventListener('click', showBatchDeleteConfirm);
    if (batchCancel) batchCancel.addEventListener('click', cancelBatchSelection);
}

// 切换选择纸条
function toggleSelectMessage(card, index) {
    const checkbox = card.querySelector('.message-checkbox');
    const selectBtn = card.querySelector('.select');
    
    if (selectedMessages.has(index)) {
        selectedMessages.delete(index);
        card.classList.remove('selected');
        if (checkbox) checkbox.checked = false;
        if (selectBtn) selectBtn.innerHTML = '<i class="far fa-square"></i>';
    } else {
        selectedMessages.add(index);
        card.classList.add('selected');
        if (checkbox) checkbox.checked = true;
        if (selectBtn) selectBtn.innerHTML = '<i class="fas fa-check-square"></i>';
    }
    
    updateBatchActionsBar();
}

// 全选/取消全选
function toggleSelectAll() {
    const container = document.getElementById('messagesList');
    if (!container) return;
    
    const cards = container.querySelectorAll('.message-card');
    
    if (selectedMessages.size === cards.length) {
        // 取消全选
        selectedMessages.clear();
        cards.forEach(card => {
            card.classList.remove('selected');
            const checkbox = card.querySelector('.message-checkbox');
            if (checkbox) checkbox.checked = false;
            
            const selectBtn = card.querySelector('.select');
            if (selectBtn) selectBtn.innerHTML = '<i class="far fa-square"></i>';
        });
    } else {
        // 全选
        cards.forEach((card, index) => {
            selectedMessages.add(index);
            card.classList.add('selected');
            const checkbox = card.querySelector('.message-checkbox');
            if (checkbox) checkbox.checked = true;
            
            const selectBtn = card.querySelector('.select');
            if (selectBtn) selectBtn.innerHTML = '<i class="fas fa-check-square"></i>';
        });
    }
    
    updateBatchActionsBar();
}

// 取消批量选择
function cancelBatchSelection() {
    selectedMessages.clear();
    updateBatchActionsBar();
    renderMessagesList();
}

// 更新批量操作栏
function updateBatchActionsBar() {
    const batchBar = document.getElementById('batchActionsBar');
    const selectedCount = selectedMessages.size;
    const batchSelectedCount = document.getElementById('batchSelectedCount');
    
    if (batchSelectedCount) {
        batchSelectedCount.textContent = selectedCount;
    }
    
    if (selectedCount > 0) {
        if (batchBar) batchBar.classList.add('active');
        
        // 更新批量删除按钮
        const batchDeleteBtn = document.getElementById('batchDeleteBtn');
        if (batchDeleteBtn) {
            batchDeleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> 批量删除(${selectedCount})`;
        }
    } else {
        if (batchBar) batchBar.classList.remove('active');
    }
}

// 显示批量删除确认
function showBatchDeleteConfirm() {
    if (selectedMessages.size === 0) {
        alert('请先选择要删除的纸条！');
        return;
    }
    
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) selectedCount.textContent = selectedMessages.size;
    
    document.getElementById('batchDeleteModal').style.display = 'flex';
}

// 确认批量删除
function confirmBatchDelete() {
    // 按从大到小的顺序删除，避免索引问题
    const sortedIndexes = Array.from(selectedMessages).sort((a, b) => b - a);
    
    sortedIndexes.forEach(index => {
        emotions[currentEmotionIndex].messages.splice(index, 1);
    });
    
    // 清空选择
    selectedMessages.clear();
    updateBatchActionsBar();
    
    // 更新UI
    renderMessagesList();
    updateMessageCount();
    
    // 关闭模态框
    closeBatchDeleteModal();
    
    showMessage(`已删除 ${sortedIndexes.length} 张纸条`, 'success');
}

// 关闭批量删除模态框
function closeBatchDeleteModal() {
    document.getElementById('batchDeleteModal').style.display = 'none';
}

// 初始化盒子预览
function initBoxPreview() {
    // 盒子旋转控制
    const rotateLeft = document.getElementById('rotateLeft');
    const rotateRight = document.getElementById('rotateRight');
    const resetRotation = document.getElementById('resetRotation');
    
    if (rotateLeft) rotateLeft.addEventListener('click', function() {
        rotationY -= 15;
        updateBoxRotation();
    });
    
    if (rotateRight) rotateRight.addEventListener('click', function() {
        rotationY += 15;
        updateBoxRotation();
    });
    
    if (resetRotation) resetRotation.addEventListener('click', function() {
        rotationY = -20;
        rotationX = -10;
        updateBoxRotation();
    });
}

// 更新盒子旋转
function updateBoxRotation() {
    const box3d = document.getElementById('box3d');
    if (box3d) {
        box3d.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
    }
}

// 更新预览
function updatePreview() {
    // 更新盒子颜色
    const boxSides = document.querySelectorAll('.box-side');
    boxSides.forEach(side => {
        side.style.background = boxDesign.color;
    });
    
    // 更新盒子标题
    const boxTitleDisplay = document.getElementById('boxTitleDisplay');
    if (boxTitleDisplay) boxTitleDisplay.textContent = boxDesign.title;
    
    // 如果有自定义图片，应用到盒子正面
    const boxFront = document.getElementById('boxFront');
    if (boxFront) {
        if (boxDesign.customImage) {
            boxFront.style.backgroundImage = `url(${boxDesign.customImage})`;
            boxFront.style.backgroundSize = 'cover';
            boxFront.style.backgroundPosition = 'center';
        } else {
            boxFront.style.backgroundImage = 'none';
            boxFront.style.background = boxDesign.color;
        }
    }
}

// 更新当前设置显示
function updateCurrentSettings() {
    const settingsText = `名称：${boxDesign.title} | 颜色：${boxDesign.color}`;
    const currentSettings = document.getElementById('currentSettings');
    if (currentSettings) currentSettings.textContent = settingsText;
}

// 生成盒子
async function generateBox() {
    // 检查是否有纸条
    let totalMessages = 0;
    emotions.forEach(emotion => {
        totalMessages += emotion.messages.length;
    });
    
    if (totalMessages === 0) {
        alert('请至少为一个情绪添加一张纸条！');
        return;
    }
    
    // 检查是否有图片纸条（因为base64数据很大）
    let hasImageMessages = false;
    emotions.forEach(emotion => {
        emotion.messages.forEach(message => {
            if (message.type === 'image') {
                hasImageMessages = true;
            }
        });
    });
    
    if (hasImageMessages) {
        const confirmSave = confirm('检测到图片纸条，图片数据较大可能影响加载速度。确定要保存吗？');
        if (!confirmSave) return;
    }
    
    // 准备盒子数据
    const boxData = {
        design: { ...boxDesign },
        emotions: emotions.map(emotion => ({
            id: emotion.id,
            emoji: emotion.emoji,
            name: emotion.name,
            messages: [...emotion.messages],
            isCustom: emotion.isCustom
        })),
        remaining: getAllMessages(),
        drawn: [],
        createdAt: new Date().toISOString()
    };
    
    try {
        // 保存到本地存储（模拟数据库）
        const boxId = await saveBox(boxData);
        
        // 切换到分享页面
        document.getElementById('emotionSection').classList.remove('active');
        document.getElementById('shareSection').classList.add('active');
        updateStepIndicator(3);
        
        // 更新预览
        updatePreview();
        updateCurrentSettings();
        
        // 生成分享链接
        const shareLink = `${window.location.origin}/view.html?id=${boxId}`;
        const generatedLink = document.getElementById('generatedLink');
        if (generatedLink) generatedLink.textContent = shareLink;
        
    } catch (error) {
        console.error('生成盒子失败:', error);
        alert('保存失败，请重试');
    }
}

// 获取所有纸条 - 更新以支持混合类型
function getAllMessages() {
    const allMessages = [];
    emotions.forEach(emotion => {
        emotion.messages.forEach(message => {
            // 支持旧格式的纯文本纸条
            if (typeof message === 'string') {
                allMessages.push({
                    emotionId: emotion.id,
                    emotionName: emotion.name,
                    emoji: emotion.emoji,
                    type: 'text',
                    content: message,
                    isCustom: emotion.isCustom
                });
            } else {
                // 新格式的纸条（文字或图片）
                allMessages.push({
                    emotionId: emotion.id,
                    emotionName: emotion.name,
                    emoji: emotion.emoji,
                    ...message,
                    isCustom: emotion.isCustom
                });
            }
        });
    });
    return allMessages;
}

// 保存盒子（简化版，使用本地存储）
async function saveBox(boxData) {
    const boxId = 'box_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 保存到浏览器的本地存储
    localStorage.setItem(boxId, JSON.stringify(boxData));
    
    // 保存盒子ID列表
    let boxList = JSON.parse(localStorage.getItem('emotional_box_list') || '[]');
    boxList.push(boxId);
    localStorage.setItem('emotional_box_list', JSON.stringify(boxList));
    
    return boxId;
}

// 分享区域初始化
function initShareSection() {
    // 复制链接
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            const link = document.getElementById('generatedLink').textContent;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(link).then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> 已复制';
                    this.style.background = '#4CAF50';
                    
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.style.background = '';
                    }, 2000);
                }).catch(err => {
                    copyFallback(link, this);
                });
            } else {
                copyFallback(link, this);
            }
        });
    }

    // 制作新盒子
    const makeAnother = document.getElementById('makeAnother');
    if (makeAnother) {
        makeAnother.addEventListener('click', function() {
            if (confirm('确定要制作新盒子吗？当前进度将丢失。')) {
                resetBox();
                document.getElementById('shareSection').classList.remove('active');
                document.getElementById('designSection').classList.add('active');
                updateStepIndicator(1);
            }
        });
    }
}

// 备用复制方法
function copyFallback(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> 已复制';
    button.style.background = '#4CAF50';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);
}

// 更新步骤指示器
function updateStepIndicator(stepNumber) {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index < stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// 重置盒子
function resetBox() {
    boxDesign = {
        title: '我的情绪盒子',
        color: '#ff6b8b',
        customImage: null,
        creatorName: ''
    };
    
    // 重置预设情绪（保留自定义情绪）
    emotions = emotions.filter(emotion => emotion.isCustom);
    emotions = [...emotions, ...[
        { id: 'happy', emoji: '😊', name: '开心', messages: [], isCustom: false },
        { id: 'sad', emoji: '😢', name: '伤心', messages: [], isCustom: false },
        { id: 'angry', emoji: '😠', name: '生气', messages: [], isCustom: false },
        { id: 'love', emoji: '🥰', name: '爱你', messages: [], isCustom: false },
        { id: 'cool', emoji: '😎', name: '得意', messages: [], isCustom: false },
        { id: 'think', emoji: '🤔', name: '思考', messages: [], isCustom: false },
        { id: 'laugh', emoji: '😂', name: '大笑', messages: [], isCustom: false },
        { id: 'surprise', emoji: '😲', name: '惊讶', messages: [], isCustom: false },
        { id: 'sleepy', emoji: '😴', name: '困倦', messages: [], isCustom: false },
        { id: 'sick', emoji: '🤒', name: '生病', messages: [], isCustom: false },
        { id: 'celebrate', emoji: '🎉', name: '庆祝', messages: [], isCustom: false },
        { id: 'thankful', emoji: '🙏', name: '感恩', messages: [], isCustom: false },
        { id: 'excited', emoji: '🤩', name: '兴奋', messages: [], isCustom: true } // 保留自定义情绪
    ]];
    
    currentEmotionIndex = 0;
    isSortMode = false;
    hideEmptyEmotions = false;
    selectedMessages.clear();
    
    // 重置表单
    const boxTitle = document.getElementById('boxTitle');
    const creatorName = document.getElementById('creatorName');
    const messageInput = document.getElementById('messageInput');
    const imagePreview = document.getElementById('imagePreview');
    const imageUpload = document.getElementById('imageUpload');
    const colorPicker = document.getElementById('colorPicker');
    const currentColorHex = document.getElementById('currentColorHex');
    
    if (boxTitle) boxTitle.value = '我的情绪盒子';
    if (creatorName) creatorName.value = '';
    if (messageInput) messageInput.value = '';
    if (imagePreview) imagePreview.innerHTML = '';
    if (imageUpload) imageUpload.value = '';
    if (colorPicker) colorPicker.value = '#ff6b8b';
    if (currentColorHex) currentColorHex.textContent = '#ff6b8b';
    
    // 重置选择
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.color === '#ff6b8b') {
            opt.classList.add('active');
        }
    });
    
    // 重置排序模式按钮
    const sortBtn = document.getElementById('sortEmotionsBtn');
    if (sortBtn) {
        sortBtn.innerHTML = '<i class="fas fa-sort"></i> 排序模式';
        sortBtn.style.background = '';
        sortBtn.style.color = '';
    }
    
    // 重置隐藏按钮
    const toggleBtn = document.getElementById('toggleEmptyEmotions');
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> 隐藏无纸条的情绪';
    }
    
    // 重置旋转
    rotationY = -20;
    rotationX = -10;
    updateBoxRotation();
    
    // 更新预览
    updatePreview();
    updateCurrentSettings();
    
    // 重新初始化情绪网格
    initEmotionGrid();
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s;
        background: ${getMessageColor(type)};
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(messageDiv);
    
    // 显示动画
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
        
        // 3秒后消失
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    document.body.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }, 10);
}

function getMessageColor(type) {
    const colors = {
        success: '#4CAF50',
        error: '#dc3545',
        warning: '#ff9800',
        info: '#2196F3'
    };
    return colors[type] || colors.info;
}