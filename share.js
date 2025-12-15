// share.js - 分享功能

// 简单的分享功能
function shareBox() {
    const currentUrl = window.location.href;
    
    // 创建分享模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 400px;
            padding: 20px;
            animation: modalSlideIn 0.3s ease;
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            ">
                <h3 style="margin: 0;">
                    <i class="fas fa-share-alt"></i> 分享情绪盒子
                </h3>
                <button class="close-share" style="
                    background: none;
                    border: none;
                    font-size: 1.8rem;
                    cursor: pointer;
                    color: #666;
                ">&times;</button>
            </div>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <p>复制链接分享给朋友：</p>
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 0.9rem;
                ">${currentUrl}</div>
            </div>
            
            <div style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 20px 0;
            ">
                <button id="copyLinkBtn" style="
                    padding: 15px;
                    background: #ff6b8b;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="fas fa-copy"></i>
                    <span>复制链接</span>
                </button>
                
                <button id="shareQRBtn" style="
                    padding: 15px;
                    background: #36d1dc;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="fas fa-qrcode"></i>
                    <span>生成二维码</span>
                </button>
            </div>
            
            <div style="
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                margin-top: 20px;
                text-align: center;
                font-size: 0.9rem;
                color: #666;
            ">
                <p><i class="fas fa-lightbulb"></i> 将链接发送给朋友，朋友打开即可使用</p>
            </div>
        </div>
        
        <style>
            @keyframes modalSlideIn {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            #copyLinkBtn:hover, #shareQRBtn:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                transition: all 0.3s;
            }
        </style>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 绑定事件
    modal.querySelector('.close-share').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
    });
    
    modal.querySelector('#copyLinkBtn').addEventListener('click', () => {
        copyLink(currentUrl);
    });
    
    modal.querySelector('#shareQRBtn').addEventListener('click', () => {
        showQRCode(currentUrl);
    });
    
    // 点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        }
    });
}

// 复制链接
function copyLink(link) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showMessage('链接已复制到剪贴板！', 'success');
        }).catch(err => {
            copyFallback(link);
        });
    } else {
        copyFallback(link);
    }
}

// 备用复制方法
function copyFallback(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showMessage('链接已复制！', 'success');
}

// 显示二维码
function showQRCode(url) {
    // 创建二维码模态框
    const qrModal = document.createElement('div');
    qrModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    qrModal.innerHTML = `
        <div style="
            width: 300px;
            max-width: 90%;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 20px;
            padding: 20px;
            text-align: center;
        ">
            <h3 style="margin: 0 0 15px 0; color: #333;">扫描二维码</h3>
            <div id="qrCodeContainer" style="
                width: 250px;
                height: 250px;
                margin: 0 auto;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
            ">
                正在生成二维码...
            </div>
            <p style="color: #666; margin: 15px 0 0 0; font-size: 0.9rem;">扫描二维码打开情绪盒子</p>
        </div>
        
        <button id="closeQR" style="
            padding: 12px 25px;
            background: #666;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        ">
            <i class="fas fa-times"></i> 关闭
        </button>
    `;
    
    document.body.appendChild(qrModal);
    
    // 生成二维码
    generateQRCode(url, qrModal.querySelector('#qrCodeContainer'));
    
    // 绑定关闭事件
    document.getElementById('closeQR').addEventListener('click', () => {
        document.body.removeChild(qrModal);
    });
}

// 生成二维码
function generateQRCode(url, container) {
    // 简单的二维码生成（使用在线API）
    const qrSize = 250;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}`;
    
    const img = document.createElement('img');
    img.src = qrUrl;
    img.alt = '情绪盒子二维码';
    img.style.width = '100%';
    img.style.height = '100%';
    
    container.innerHTML = '';
    container.appendChild(img);
}

// 显示消息提示
function showMessage(message, type = 'info') {
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
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }, 10);
}

// 获取消息颜色
function getMessageColor(type) {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    return colors[type] || colors.info;
}

// 覆盖view.js中的shareBox函数
window.shareBox = shareBox;