// 获取DOM元素
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');  // 调试信息

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const settingsPanel = document.getElementById('settingsPanel');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadArea = document.getElementById('downloadArea');

    // 检查所有元素是否正确获取
    console.log('滑块元素:', qualitySlider);
    console.log('质量显示元素:', qualityValue);

    // 当前处理的图片数据
    let currentFile = null;
    let currentCompressedUrl = null;

    // 事件监听器
    dropZone.addEventListener('click', () => {
        console.log('点击上传区域');  // 调试信息
        fileInput.click();
    });
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#0071e3';
        dropZone.style.background = '#f5f5f7';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#86868b';
        dropZone.style.background = 'white';
    });

    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // 添加滑块事件监听器
    qualitySlider.addEventListener('input', handleQualityChange);
    console.log('已添加滑块事件监听器');  // 调试信息

    // 处理拖放
    function handleDrop(e) {
        console.log('文件拖放');  // 调试信息
        e.preventDefault();
        dropZone.style.borderColor = '#86868b';
        dropZone.style.background = 'white';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    }

    // 处理文件选择
    function handleFileSelect(e) {
        console.log('文件选择');  // 调试信息
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    }

    // 处理质量滑块变化
    function handleQualityChange(e) {
        const quality = qualitySlider.value;
        console.log('滑块值改变:', quality);  // 调试信息
        qualityValue.textContent = `${quality}%`;
        
        if (currentFile) {
            console.log('开始压缩，质量:', quality);  // 调试信息
            if (window.compressionTimeout) {
                clearTimeout(window.compressionTimeout);
            }
            window.compressionTimeout = setTimeout(() => {
                compressImage(currentFile, quality / 100);
            }, 100);
        }
    }

    // 处理文件
    function processFile(file) {
        console.log('处理文件:', file.name, file.size);  // 调试信息
        currentFile = file;
        
        // 显示原始图片
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            originalSize.textContent = formatFileSize(file.size);
            
            // 显示设置面板和预览区域
            settingsPanel.style.display = 'block';
            previewContainer.style.display = 'grid';
            downloadArea.style.display = 'block';
            
            // 压缩图片
            compressImage(file, qualitySlider.value / 100);
        };
        reader.readAsDataURL(file);
    }

    // 压缩图片
    function compressImage(file, quality) {
        console.log('压缩图片，质量:', quality);
        const img = new Image();
        
        img.onload = () => {
            console.log('图片加载完成，开始压缩');
            // 创建canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算新的尺寸
            let width = img.width;
            let height = img.height;
            
            // 如果是PNG，使用尺寸调整来压缩
            if (file.type === 'image/png') {
                const scale = Math.sqrt(quality);  // 根据质量计算缩放比例
                width = Math.floor(img.width * scale);
                height = Math.floor(img.height * scale);
            }
            
            // 设置canvas尺寸
            canvas.width = width;
            canvas.height = height;
            
            // 使用双线性插值
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 绘制图片
            ctx.drawImage(img, 0, 0, width, height);
            
            // 如果是PNG，转换为JPEG来实现更好的压缩
            const outputType = quality < 0.8 ? 'image/jpeg' : file.type;
            
            // 压缩并显示
            canvas.toBlob(
                (blob) => {
                    if (currentCompressedUrl) {
                        URL.revokeObjectURL(currentCompressedUrl);
                    }
                    currentCompressedUrl = URL.createObjectURL(blob);
                    compressedPreview.src = currentCompressedUrl;
                    
                    // 显示压缩率
                    const compressionRatio = ((1 - (blob.size / file.size)) * 100).toFixed(1);
                    compressedSize.textContent = `${formatFileSize(blob.size)} (减小了 ${compressionRatio}%)`;
                    console.log('压缩率:', compressionRatio + '%');
                    
                    // 更新下载按钮点击事件
                    downloadBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = currentCompressedUrl;
                        // 根据输出类型设置文件扩展名
                        const extension = outputType === 'image/jpeg' ? '.jpg' : '.png';
                        const fileName = file.name.replace(/\.[^/.]+$/, "") + '_compressed' + extension;
                        link.download = fileName;
                        link.click();
                    };
                },
                outputType,
                quality
            );
        };

        // 使用 FileReader 读取文件
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 