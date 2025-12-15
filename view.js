// view.js - 查看页面的逻辑

// 全局变量
let boxData = null;
let boxId = null;
let currentSelection = null;

// 页面加载
document.addEventListener('DOMContentLoaded', async function() {
    // 从URL获取盒子ID
    const urlParams = new URLSearchParams(window.location.search);
    boxId = urlParams.get('id');
    
    if (!boxId) {
        showError('无效的盒子链接');
        return;
    }

    try {
        // 从本地存储加载盒子数据
        boxData = await loadBoxFromStorage(boxId);
        
        if (!boxData) {
            showError('盒子不存在或已过期');
            return;
        }

        // 渲染盒子
        renderBox();
        updateStats();
        renderEmotions();
        
        // 隐藏加载界面，显示主内容
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        // 绑定分享按钮
        document.getElementById('shareBtn').addEventListener('click', shareBox);
        
    } catch (error) {
        console.error('加载失败:', error);
        showError('加载失败，请重试');
    }
});

// 从本地存储加载盒子
async function loadBoxFromStorage(boxId) {
    try {
        const data = localStorage.getItem(boxId);
        if (!data) return null;
        
        return JSON.parse(data);
    } catch (error) {
        console.error('加载盒子失败:', error);
        return null;
    }
}

// 渲染盒子
function renderBox() {
    // 标题
    document.getElementById('boxTitle').textContent = boxData.design.title;
    
    // 制作者
    if (boxData.design.creatorName) {
        document.getElementById('boxCreator').textContent = `由 ${boxData.design.creatorName} 制作`;
    }
    
    // 盒子预览
    const preview = document.getElementById('boxPreview');
    if (preview) {
        preview.style.background = boxData.design.color || '#ff6b8b';
        preview.querySelector('.box-lid').style.background = darkenColor(boxData.design.color || '#ff6b8b', 20);
    }
}

// 颜色加深函数
function darkenColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return `#${(
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
}

// 更新统计
function updateStats() {
    const total = boxData.remaining?.length || 0;
    const remaining = boxData.remaining?.length || 0;
    const drawn = boxData.drawn?.length || 0;
    
    document.getElementById('totalMessages').textContent = total;
    document.getElementById('remainingMessages').textContent = remaining;
    document.getElementById('drawnMessages').textContent = drawn;
}

// 渲染情绪信封
function renderEmotions() {
    const grid = document.getElementById('emotionsGrid');
    grid.innerHTML = '';
    
    // 从emotions数据中获取情绪信息
    const emotions = boxData.emotions || [];
    
    emotions.forEach(emotion => {
        // 计算该情绪还有多少剩余纸条
        const remainingForEmotion = (boxData.remaining || []).filter(
            msg => msg.emotionId === emotion.id
        ).length;
        
        const totalForEmotion = remainingForEmotion + 
            ((boxData.drawn || []).filter(msg => msg.emotionId === emotion.id).length);
        
        if (totalForEmotion === 0) return; // 没有纸条的情绪不显示
        
        const envelope = document.createElement('div');
        envelope.className = `emotion-envelope ${remainingForEmotion === 0 ? 'disabled' : ''}`;
        envelope.dataset.emotionId = emotion.id;
        
        envelope.innerHTML = `
            <span class="envelope-emoji">${emotion.emoji}</span>
            <div class="envelope-name">${emotion.name}</div>
            <div class="envelope-count">${remainingForEmotion}/${totalForEmotion} 张剩余</div>
        `;
        
        if (remainingForEmotion > 0) {
            envelope.addEventListener('click', () => drawMessage(emotion.id));
        }
        
        grid.appendChild(envelope);
    });
}

// 抽取纸条
async function drawMessage(emotionId) {
    if (currentSelection) return; // 防止重复点击
    
    const remaining = boxData.remaining || [];
    const emotionRemaining = remaining.filter(msg => msg.emotionId === emotionId);
    
    if (emotionRemaining.length === 0) {
        alert('这个情绪的纸条已经抽完了！');
        return;
    }
    
    // 随机选择一张纸条
    const randomIndex = Math.floor(Math.random() * emotionRemaining.length);
    const drawnMessage = emotionRemaining[randomIndex];
    currentSelection = emotionId;
    
    // 显示抽取动画
    const display = document.getElementById('messageDisplay');
    display.innerHTML = `
        <div class="drawn-emoji">🎁</div>
        <p>正在拆开信封...</p>
    `;
    
    // 延迟显示结果（模拟拆信封）
    setTimeout(() => {
        try {
            // 从剩余池移除
            const newRemaining = remaining.filter(msg => 
                !(msg.emotionId === drawnMessage.emotionId && msg.text === drawnMessage.text)
            );
            
            // 添加到已抽取
            const newDrawn = [...(boxData.drawn || []), {
                ...drawnMessage,
                drawnAt: new Date().toISOString()
            }];
            
            // 更新数据
            boxData.remaining = newRemaining;
            boxData.drawn = newDrawn;
            
            // 保存到本地存储
            localStorage.setItem(boxId, JSON.stringify(boxData));
            
            // 显示抽取结果
            displayResult(drawnMessage);
            
            // 更新UI
            updateStats();
            renderEmotions();
            
            currentSelection = null;
            
        } catch (error) {
            console.error('抽取失败:', error);
            alert('网络错误，请重试');
            currentSelection = null;
        }
    }, 1500);
}

// 显示抽取结果
function displayResult(message) {
    const display = document.getElementById('messageDisplay');
    display.innerHTML = `
        <div class="drawn-emoji">${message.emoji}</div>
        <div class="drawn-text">${message.text}</div>
        <div class="drawn-info">
            <p>来自：${message.emotionName} 情绪</p>
            <p><small>${new Date().toLocaleString('zh-CN')}</small></p>
        </div>
    `;
}

// 分享盒子（基本功能）
function shareBox() {
    const currentUrl = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(currentUrl).then(() => {
            alert('盒子链接已复制到剪贴板！\n\n' + currentUrl);
        }).catch(err => {
            copyFallback(currentUrl);
        });
    } else {
        copyFallback(currentUrl);
    }
}

// 备用复制方法
function copyFallback(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    alert('链接已复制！\n\n' + text);
}

// 显示错误
function showError(message) {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('errorScreen').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}