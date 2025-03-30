/**
 * 图表渲染器模块
 * 包含各种图表类型的渲染逻辑
 */
const DiagramRenderers = {
    /**
     * 通用的渲染错误处理
     * @param {string} message - 错误信息
     * @param {HTMLElement} container - 容器元素
     */
    showError: function(message, container) {
        // 确保清空容器
        container.innerHTML = '';
        
        // 创建错误信息元素
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '1rem';
        errorDiv.style.border = '1px solid red';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        errorDiv.textContent = message;
        
        container.appendChild(errorDiv);
    },
    
    /**
     * 创建加载中指示器
     * @param {HTMLElement} container - 容器元素
     * @returns {HTMLElement} 加载指示器元素
     */
    createLoadingIndicator: function(container) {
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'loading-message';
        loadingMsg.textContent = '正在加载图表...';
        loadingMsg.style.padding = '1rem';
        loadingMsg.style.color = '#666';
        container.appendChild(loadingMsg);
        return loadingMsg;
    },
    
    /**
     * 使用Kroki服务渲染图表
     * @param {string} code - 图表代码
     * @param {string} type - 图表类型
     * @param {HTMLElement} container - 渲染容器
     */
    renderWithKroki: function(code, type, container) {
        // 清空容器
        container.innerHTML = '';
        
        try {
            const diagramConfig = config.diagramTypes[type];
            if (!diagramConfig) {
                throw new Error(`未找到图表类型配置: ${type}`);
            }
            
            // 创建加载指示器
            this.createLoadingIndicator(container);
            
            // 添加时间戳防止缓存
            const timestamp = new Date().getTime();
            
            // 编码数据（如果需要）
            let diagramData = code;
            if (diagramConfig.useEncoder && typeof plantumlEncoder !== 'undefined') {
                diagramData = plantumlEncoder.encode(code);
            }
            
            // 构建Kroki URL
            let url = `${config.krokiBaseUrl}/${diagramConfig.krokiType}/svg/`;
            
            // 根据图表类型选择适当的方法
            if (type === 'mermaid') {
                // 对于mermaid，使用原有的方法
                if (diagramConfig.useEncoder) {
                    url += diagramData;
                    this.fetchSvgContent(url, container, timestamp, type);
                } else {
                    this.postDiagramContent(url, code, container, type);
                }
            } else if (type === 'plantuml') {
                // 对于plantuml，使用plantumlEncoder编码
                url += diagramData;
                this.fetchSvgContent(url, container, timestamp, type);
            } else {
                // 所有其他图表类型（包括excalidraw），使用相同的编码和请求方式
                // 使用deflate + base64编码
                const encodedData = this.encodeKrokiData(code);
                url += encodedData;
                this.fetchSvgContent(url, container, timestamp, type);
            }
        } catch (e) {
            console.error('Kroki渲染错误:', e);
            this.showError(`Kroki渲染错误: ${e.message}`, container);
        }
    },
    
    /**
     * 编码Kroki数据用于GET请求（用于所有非plantuml/mermaid图表）
     * @param {string} data - 图表数据
     * @returns {string} 编码后的字符串
     */
    encodeKrokiData: function(data) {
        try {
            // 使用TextEncoder或者兼容方法将字符串编码为UTF-8
            function textEncode(str) {
                if (window.TextEncoder) {
                    return new TextEncoder('utf-8').encode(str);
                }
                var utf8 = unescape(encodeURIComponent(str));
                var result = new Uint8Array(utf8.length);
                for (var i = 0; i < utf8.length; i++) {
                    result[i] = utf8.charCodeAt(i);
                }
                return result;
            }
            
            // 检查pako库是否可用
            if (typeof pako === 'undefined') {
                throw new Error('需要pako库才能进行压缩。请导入pako_deflate.min.js');
            }
            
            // 1. 将图表数据编码为UTF-8的Uint8Array
            var encoded = textEncode(data);
            
            // 2. 使用pako的deflate方法压缩数据（压缩级别9，最佳压缩）
            var compressed = pako.deflate(encoded, { level: 9, to: 'string' });
            
            // 3. 使用btoa将压缩后的数据编码为Base64
            // 4. 替换+和/字符以使其"URL安全"
            var result = btoa(compressed)
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, ''); // 去除末尾的等号
                
            return result;
        } catch (error) {
            console.error('Kroki数据编码错误:', error);
            throw new Error('Kroki数据编码失败: ' + error.message);
        }
    },
    
    /**
     * 通过GET请求获取SVG内容
     * @param {string} url - 请求URL
     * @param {HTMLElement} container - 渲染容器
     * @param {number} timestamp - 时间戳
     * @param {string} type - 图表类型
     */
    fetchSvgContent: function(url, container, timestamp, type) {
        fetch(`${url}?t=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`服务响应错误: ${response.status}`);
                }
                return response.text();
            })
            .then(svgContent => {
                this.processSvgResponse(svgContent, container, type);
            })
            .catch(error => {
                console.error('SVG加载错误:', error);
                container.innerHTML = '';
                this.showError(`加载错误: ${error.message}`, container);
                
                // 如果是Kroki渲染，尝试回退到PNG
                if (document.getElementById('use-kroki').checked) {
                    this.tryFallbackToPng(url.replace('/svg/', '/png/'), container, type);
                }
            });
    },
    
    /**
     * 通过POST请求发送图表内容
     * @param {string} url - 请求URL
     * @param {string} content - 图表内容
     * @param {HTMLElement} container - 渲染容器
     * @param {string} type - 图表类型
     */
    postDiagramContent: function(url, content, container, type) {
        const diagramConfig = config.diagramTypes[type];
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': diagramConfig.mimeType || 'text/plain',
                'Accept': 'image/svg+xml'
            },
            body: content
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`服务响应错误: ${response.status}`);
            }
            return response.text();
        })
        .then(svgContent => {
            this.processSvgResponse(svgContent, container, type);
        })
        .catch(error => {
            console.error('POST请求错误:', error);
            container.innerHTML = '';
            this.showError(`请求错误: ${error.message}`, container);
            
            // 尝试回退到PNG
            this.tryFallbackWithPostToPng(url.replace('/svg/', '/png/'), content, container, type);
        });
    },
    
    /**
     * 处理SVG响应
     * @param {string} svgContent - SVG内容
     * @param {HTMLElement} container - 渲染容器
     * @param {string} type - 图表类型
     */
    processSvgResponse: function(svgContent, container, type) {
        // 验证SVG内容
        if (!svgContent || svgContent.trim().length === 0) {
            throw new Error('收到空的SVG内容');
        }
        
        if (!svgContent.includes('<svg')) {
            throw new Error('返回内容不是有效的SVG');
        }
        
        // 清空容器
        container.innerHTML = '';
        
        // 创建包装器div
        const svgWrapper = document.createElement('div');
        svgWrapper.className = `${type}-diagram diagram-container`;
        svgWrapper.style.maxWidth = '100%';
        svgWrapper.style.margin = '0 auto';
        svgWrapper.style.position = 'relative';
        svgWrapper.style.overflow = 'hidden';
        
        // 为特定图表类型设置全宽样式
        if (type === 'seqdiag' || type === 'actdiag' || type === 'plantuml') {
            svgWrapper.style.width = '100%';
            svgWrapper.style.minHeight = '400px';
            svgWrapper.style.display = 'flex';
            svgWrapper.style.justifyContent = 'center';
            svgWrapper.style.alignItems = 'center';
        }
        
        // 处理SVG内容，移除DOCTYPE和处理特殊情况
        let processedSvg = svgContent;
        
        // 移除DOCTYPE声明，它可能导致渲染问题
        processedSvg = processedSvg.replace(/<!DOCTYPE[^>]*>/i, '');
        
        // 修复特定图表类型的问题
        if (type === 'seqdiag' || type === 'actdiag' || type === 'blockdiag' || type === 'nwdiag' || type === 'packetdiag' || type === 'rackdiag') {
            // 对于这些图表，确保滤镜正确应用
            // 移除滤镜引用，如果显示有问题
            processedSvg = processedSvg.replace(/style="filter:url\(#filter_blur\)[^"]*"/g, 'style="opacity:0.7;fill-opacity:1"');
            
            // 确保SVG有正确的viewBox
            if (!processedSvg.includes('viewBox')) {
                // 提取宽度和高度信息
                const widthMatch = processedSvg.match(/width="(\d+)"/);
                const heightMatch = processedSvg.match(/height="(\d+)"/);
                
                if (widthMatch && heightMatch) {
                    const width = parseInt(widthMatch[1]);
                    const height = parseInt(heightMatch[1]);
                    processedSvg = processedSvg.replace(/<svg/, `<svg viewBox="0 0 ${width} ${height}"`);
                } else {
                    // 默认viewBox
                    processedSvg = processedSvg.replace(/<svg/, '<svg viewBox="0 0 800 600"');
                }
            }
            
            // 修复文本重叠问题
            // 为文本元素添加字体族和调整字间距
            processedSvg = processedSvg.replace(/<text([^>]*)>(.*?)<\/text>/g, (match, attrs, content) => {
                // 如果文本已经有字体族和字间距，不要重复添加
                if (attrs.includes('font-family') && attrs.includes('letter-spacing')) {
                    return match;
                }
                
                // 添加字体族和字间距
                const newAttrs = attrs.replace(/font-size="([^"]*)"/, 'font-size="$1" letter-spacing="0.05em"');
                return `<text${newAttrs} font-family="Arial, sans-serif">${content}</text>`;
            });
            
            // 修复可能的文本位置问题
            processedSvg = processedSvg.replace(/<text([^>]*)textLength="([^"]*)"([^>]*)>(.*?)<\/text>/g, (match, before, textLength, after, content) => {
                // 移除textLength属性，它可能导致文本渲染问题
                return `<text${before}${after}>${content}</text>`;
            });
            
            // 扩大SVG尺寸
            processedSvg = processedSvg.replace(/<svg([^>]*)width="(\d+)"([^>]*)height="(\d+)"([^>]*)/g, 
                '<svg$1width="100%"$3height="100%"$5');
        }
        
        // 为PlantUML添加特殊处理
        if (type === 'plantuml') {
            // 确保SVG有正确的viewBox
            if (!processedSvg.includes('viewBox')) {
                // 提取宽度和高度信息
                const widthMatch = processedSvg.match(/width="(\d+)"/);
                const heightMatch = processedSvg.match(/height="(\d+)"/);
                
                if (widthMatch && heightMatch) {
                    const width = parseInt(widthMatch[1]);
                    const height = parseInt(heightMatch[1]);
                    processedSvg = processedSvg.replace(/<svg/, `<svg viewBox="0 0 ${width} ${height}"`);
                } else {
                    // 默认viewBox
                    processedSvg = processedSvg.replace(/<svg/, '<svg viewBox="0 0 800 600"');
                }
            }
            
            // 修改SVG属性以确保它可以正确缩放
            processedSvg = processedSvg.replace(/<svg([^>]*)width="(\d+)"([^>]*)height="(\d+)"([^>]*)/g, 
                '<svg$1width="100%"$3height="100%"$5');
                
            // 修复字体和文本相关问题
            processedSvg = processedSvg.replace(/<text([^>]*)>(.*?)<\/text>/g, (match, attrs, content) => {
                if (!attrs.includes('font-family')) {
                    return `<text${attrs} font-family="Arial, sans-serif">${content}</text>`;
                }
                return match;
            });
        }
        
        // 为BPMN添加特殊处理
        if (type === 'bpmn') {
            // 确保SVG有正确的viewBox
            if (!processedSvg.includes('viewBox')) {
                // 提取宽度和高度信息
                const widthMatch = processedSvg.match(/width="(\d+)"/);
                const heightMatch = processedSvg.match(/height="(\d+)"/);
                
                if (widthMatch && heightMatch) {
                    const width = parseInt(widthMatch[1]);
                    const height = parseInt(heightMatch[1]);
                    // 为BPMN添加更大的视图区域
                    processedSvg = processedSvg.replace(/<svg/, `<svg viewBox="0 0 ${width} ${height}"`);
                } else {
                    // 默认viewBox
                    processedSvg = processedSvg.replace(/<svg/, '<svg viewBox="0 0 800 600"');
                }
            }
            
            // 修复BPMN特有的SVG问题
            processedSvg = processedSvg.replace(/<svg([^>]*)width="(\d+)"([^>]*)height="(\d+)"([^>]*)/g, 
                '<svg$1width="100%"$3height="auto"$5');
                
            // 修复某些BPMN渲染问题
            processedSvg = processedSvg.replace(/<g([^>]*)class="djs-group"([^>]*)>/g, 
                '<g$1class="djs-group"$2 style="fill: #fff; stroke: #000; stroke-width: 1.5px;">');
                
            // 修复标签文本
            processedSvg = processedSvg.replace(/<text([^>]*)class="djs-label"([^>]*)>/g, 
                '<text$1class="djs-label"$2 style="font-family: Arial, sans-serif; font-size: 12px;">');
        }
        
        // 设置处理后的SVG内容
        svgWrapper.innerHTML = processedSvg;
        
        // 调整SVG样式
        const svgElement = svgWrapper.querySelector('svg');
        if (svgElement) {
            // 确保SVG适合容器
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.display = 'block';
            svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');
            
            // 特殊处理需要全宽样式的图表类型
            if (type === 'seqdiag' || type === 'actdiag' || type === 'plantuml') {
                svgElement.style.width = '100%';
                svgElement.style.minHeight = '400px';
                svgElement.style.height = '100%';
                
                // 确保viewBox设置正确
                if (!svgElement.getAttribute('viewBox')) {
                    const width = svgElement.getAttribute('width') || '800';
                    const height = svgElement.getAttribute('height') || '600';
                    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
                }
            }
            
            // 确保SVG有合适的尺寸
            if (!svgElement.hasAttribute('width') && !svgElement.hasAttribute('height')) {
                svgElement.setAttribute('width', '100%');
                svgElement.setAttribute('height', '100%');
            }
            
            // 对于特定图表类型，修复文字显示问题
            if (type === 'seqdiag' || type === 'actdiag' || type === 'plantuml') {
                // 修复文本元素的样式
                const textElements = svgElement.querySelectorAll('text');
                textElements.forEach(textEl => {
                    textEl.style.fontFamily = 'Arial, sans-serif';
                    textEl.style.letterSpacing = '0.05em'; // 增加字间距
                    textEl.style.fontSize = (parseInt(textEl.style.fontSize || '11') + 1) + 'px'; // 略微增大字体
                    
                    // 移除可能导致问题的属性
                    textEl.removeAttribute('textLength');
                });
            }
        } else {
            throw new Error('SVG解析失败');
        }
        
        container.appendChild(svgWrapper);
        
        // 当图表比较复杂时添加缩放控制
        if (type === 'seqdiag' || type === 'actdiag' || type === 'bpmn' || type === 'erd' || type === 'mermaid'  || type === 'plantuml') {
            this.addZoomControls(container, svgWrapper);
            
            // 为特定图表添加额外的全屏按钮
            if (type === 'seqdiag' || type === 'actdiag' || type === 'bpmn' || type === 'plantuml') {
                this.addFullscreenButton(container, svgWrapper);
            }
        }
    },
    
    /**
     * 为复杂图表添加缩放控制 
     * @param {HTMLElement} container - 主容器
     * @param {HTMLElement} svgWrapper - SVG包装器
     */
    addZoomControls: function(container, svgWrapper) {
        // 创建缩放控制容器
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.style.position = 'absolute';
        zoomControls.style.top = '10px';
        zoomControls.style.right = '10px';
        zoomControls.style.backgroundColor = '#ffffff';
        zoomControls.style.padding = '5px';
        zoomControls.style.border = '1px solid #cccccc';
        zoomControls.style.borderRadius = '4px';
        zoomControls.style.zIndex = '100';
        zoomControls.style.display = 'flex';
        zoomControls.style.gap = '5px';
        
        // 获取SVG元素
        const svg = svgWrapper.querySelector('svg');
        if (!svg) return;
        
        // 创建放大按钮
        const zoomInBtn = document.createElement('button');
        zoomInBtn.textContent = '+';
        zoomInBtn.style.width = '30px';
        zoomInBtn.style.height = '30px';
        zoomInBtn.style.cursor = 'pointer';
        zoomInBtn.style.fontSize = '20px';
        zoomInBtn.style.lineHeight = '20px';
        zoomInBtn.style.padding = '0';
        zoomInBtn.style.color = '#333333';
        zoomInBtn.style.backgroundColor = '#f5f5f5';
        zoomInBtn.style.border = '1px solid #cccccc';
        zoomInBtn.style.display = 'flex';
        zoomInBtn.style.alignItems = 'center';
        zoomInBtn.style.justifyContent = 'center';
        
        // 创建缩小按钮
        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.textContent = '-';
        zoomOutBtn.style.width = '30px';
        zoomOutBtn.style.height = '30px';
        zoomOutBtn.style.cursor = 'pointer';
        zoomOutBtn.style.fontSize = '20px';
        zoomOutBtn.style.lineHeight = '20px';
        zoomOutBtn.style.padding = '0';
        zoomOutBtn.style.color = '#333333';
        zoomOutBtn.style.backgroundColor = '#f5f5f5';
        zoomOutBtn.style.border = '1px solid #cccccc';
        zoomOutBtn.style.display = 'flex';
        zoomOutBtn.style.alignItems = 'center';
        zoomOutBtn.style.justifyContent = 'center';
        
        // 创建重置按钮
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '重置';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.padding = '0 5px';
        resetBtn.style.height = '30px';
        resetBtn.style.color = '#333333';
        resetBtn.style.backgroundColor = '#f5f5f5';
        resetBtn.style.border = '1px solid #cccccc';
        resetBtn.style.display = 'flex';
        resetBtn.style.alignItems = 'center';
        resetBtn.style.justifyContent = 'center';
        
        // 添加按钮到控制容器
        zoomControls.appendChild(zoomInBtn);
        zoomControls.appendChild(zoomOutBtn);
        zoomControls.appendChild(resetBtn);
        
        // 使容器能够定位控件
        if (container.style.position !== 'absolute' && container.style.position !== 'relative') {
            container.style.position = 'relative';
        }
        
        // 添加控制器到容器
        container.appendChild(zoomControls);
        
        // 当前缩放比例
        let scale = 0.8;
        const scaleStep = 0.1;
        
        // 设置外部容器为相对定位，使得内部绝对定位的元素能够参照它
        container.style.position = 'relative';
        
        // 保存原始SVG包装器的内容，以便重构DOM
        const svgWrapperContent = svgWrapper.innerHTML;
        
        // 清空SVG包装器并修改其样式
        svgWrapper.innerHTML = '';
        svgWrapper.style.position = 'relative';
        svgWrapper.style.width = '100%';
        svgWrapper.style.height = '100%';
        svgWrapper.style.minHeight = '400px';
        
        // 创建滚动容器
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'scroll-container';
        scrollContainer.style.width = '100%';
        scrollContainer.style.height = '100%';
        scrollContainer.style.minHeight = '400px';
        scrollContainer.style.overflow = 'auto'; // 允许在两个方向上滚动
        scrollContainer.style.position = 'absolute';
        scrollContainer.style.top = '0';
        scrollContainer.style.left = '0';
        scrollContainer.style.right = '0';
        scrollContainer.style.bottom = '0';
        scrollContainer.style.backgroundColor = '#fff';
        
        // 创建一个缩放内容包装器
        const zoomContentWrapper = document.createElement('div');
        zoomContentWrapper.className = 'zoom-content-wrapper';
        zoomContentWrapper.style.minWidth = '100%';
        zoomContentWrapper.style.minHeight = '100%';
        zoomContentWrapper.style.display = 'flex';
        zoomContentWrapper.style.justifyContent = 'center';
        zoomContentWrapper.style.alignItems = 'center';
        zoomContentWrapper.style.position = 'relative';
        
        // 创建一个内部容器用于缩放
        const zoomContainer = document.createElement('div');
        zoomContainer.className = 'zoom-container';
        zoomContainer.style.transformOrigin = 'center center';
        zoomContainer.style.transition = 'transform 0.1s ease-out';
        zoomContainer.style.position = 'relative';
        zoomContainer.style.display = 'inline-block'; // 使容器宽度自适应内容
        
        // 设置原始内容
        zoomContainer.innerHTML = svgWrapperContent;
        
        // 组装DOM结构
        zoomContentWrapper.appendChild(zoomContainer);
        scrollContainer.appendChild(zoomContentWrapper);
        svgWrapper.appendChild(scrollContainer);
        
        // 获取SVG元素
        const updatedSvg = zoomContainer.querySelector('svg');
        if (updatedSvg) {
            // 重新应用样式以确保SVG正确显示
            updatedSvg.style.maxWidth = 'none'; // 移除最大宽度限制
            updatedSvg.style.width = updatedSvg.getAttribute('width') || 'auto';
            updatedSvg.style.height = updatedSvg.getAttribute('height') || 'auto';
        }
        
        // 更新缩放
        function updateZoom() {
            // 应用缩放
            zoomContainer.style.transform = `scale(${scale})`;
            
            // 获取SVG的实际尺寸
            const svgWidth = updatedSvg ? updatedSvg.getBoundingClientRect().width * scale : zoomContainer.offsetWidth * scale;
            const svgHeight = updatedSvg ? updatedSvg.getBoundingClientRect().height * scale : zoomContainer.offsetHeight * scale;
            
            // 计算并应用新的内边距，确保缩放后内容仍然居中
            const paddingHorizontal = Math.max(0, (scrollContainer.clientWidth - svgWidth) / 2);
            const paddingVertical = Math.max(0, (scrollContainer.clientHeight - svgHeight) / 2);
            
            // 更新内边距
            zoomContentWrapper.style.padding = 
                `${paddingVertical}px ${paddingHorizontal}px ${paddingVertical}px ${paddingHorizontal}px`;
            
            // 更新zoomContentWrapper尺寸以适应缩放内容
            zoomContentWrapper.style.width = `${Math.max(scrollContainer.clientWidth, svgWidth)}px`;
            zoomContentWrapper.style.height = `${Math.max(scrollContainer.clientHeight, svgHeight)}px`;
        }
        
        // 确保SVG尺寸正确
        if (updatedSvg) {
            // 如果SVG没有设置宽高，给它设置合适的尺寸
            if (!updatedSvg.getAttribute('width') || !updatedSvg.getAttribute('height')) {
                updatedSvg.setAttribute('width', '100%');
                updatedSvg.setAttribute('height', 'auto');
            }
        }
        
        // 在元素加载后应用初始缩放
        setTimeout(() => {
            updateZoom();
            
            // 滚动到中心位置
            scrollContainer.scrollLeft = (zoomContentWrapper.scrollWidth - scrollContainer.clientWidth) / 2;
            scrollContainer.scrollTop = (zoomContentWrapper.scrollHeight - scrollContainer.clientHeight) / 2;
        }, 50);
        
        // 添加窗口大小变化监听器，重新调整内容位置
        window.addEventListener('resize', function() {
            updateZoom();
        });
        
        // 事件监听器
        zoomInBtn.addEventListener('click', function() {
            // 获取当前滚动位置和中心点
            const scrollCenterX = scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;
            const scrollCenterY = scrollContainer.scrollTop + scrollContainer.clientHeight / 2;
            
            // 计算当前中心点在内容中的比例位置
            const contentWidth = zoomContentWrapper.scrollWidth;
            const contentHeight = zoomContentWrapper.scrollHeight;
            const centerRatioX = scrollCenterX / contentWidth;
            const centerRatioY = scrollCenterY / contentHeight;
            
            // 增加缩放值
            scale += scaleStep;
            updateZoom();
            
            // 等待DOM更新
            setTimeout(() => {
                // 计算新的内容尺寸和滚动位置
                const newContentWidth = zoomContentWrapper.scrollWidth;
                const newContentHeight = zoomContentWrapper.scrollHeight;
                const newScrollLeft = (newContentWidth * centerRatioX) - (scrollContainer.clientWidth / 2);
                const newScrollTop = (newContentHeight * centerRatioY) - (scrollContainer.clientHeight / 2);
                
                // 应用新滚动位置
                scrollContainer.scrollLeft = newScrollLeft;
                scrollContainer.scrollTop = newScrollTop;
            }, 10);
        });
        
        zoomOutBtn.addEventListener('click', function() {
            // 记录缩小前的中心点位置比例
            const scrollCenterX = scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;
            const scrollCenterY = scrollContainer.scrollTop + scrollContainer.clientHeight / 2;
            const contentWidth = zoomContentWrapper.scrollWidth;
            const contentHeight = zoomContentWrapper.scrollHeight;
            const centerRatioX = scrollCenterX / contentWidth;
            const centerRatioY = scrollCenterY / contentHeight;
            
            // 缩小
            scale = Math.max(0.1, scale - scaleStep);
            updateZoom();
            
            // 等待DOM更新
            setTimeout(() => {
                // 计算新的滚动位置
                const newContentWidth = zoomContentWrapper.scrollWidth;
                const newContentHeight = zoomContentWrapper.scrollHeight;
                const newScrollLeft = (newContentWidth * centerRatioX) - (scrollContainer.clientWidth / 2);
                const newScrollTop = (newContentHeight * centerRatioY) - (scrollContainer.clientHeight / 2);
                
                // 应用新滚动位置
                scrollContainer.scrollLeft = newScrollLeft;
                scrollContainer.scrollTop = newScrollTop;
            }, 10);
        });
        
        resetBtn.addEventListener('click', function() {
            // 重置缩放
            scale = 0.8;
            updateZoom();
            
            // 等待DOM更新后滚动到中心
            setTimeout(() => {
                scrollContainer.scrollLeft = (zoomContentWrapper.scrollWidth - scrollContainer.clientWidth) / 2;
                scrollContainer.scrollTop = (zoomContentWrapper.scrollHeight - scrollContainer.clientHeight) / 2;
            }, 10);
        });
        
        // 添加鼠标滚轮缩放支持
        scrollContainer.addEventListener('wheel', function(e) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                
                // 获取鼠标位置作为缩放中心点
                const rect = scrollContainer.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // 计算鼠标指针在内容中的位置比例
                const scrollX = scrollContainer.scrollLeft;
                const scrollY = scrollContainer.scrollTop;
                const pointX = scrollX + mouseX;
                const pointY = scrollY + mouseY;
                const contentWidth = zoomContentWrapper.scrollWidth;
                const contentHeight = zoomContentWrapper.scrollHeight;
                const ratioX = pointX / contentWidth;
                const ratioY = pointY / contentHeight;
                
                // 更新缩放值
                if (e.deltaY < 0) {
                    // 向上滚动，放大
                    scale = Math.min(5, scale + scaleStep);
                } else {
                    // 向下滚动，缩小
                    scale = Math.max(0.1, scale - scaleStep);
                }
                
                updateZoom();
                
                // 等待DOM更新
                setTimeout(() => {
                    // 计算缩放后的新位置
                    const newContentWidth = zoomContentWrapper.scrollWidth;
                    const newContentHeight = zoomContentWrapper.scrollHeight;
                    const newPointX = newContentWidth * ratioX;
                    const newPointY = newContentHeight * ratioY;
                    
                    // 调整滚动位置，使鼠标位置保持在同一内容点上
                    scrollContainer.scrollLeft = newPointX - mouseX;
                    scrollContainer.scrollTop = newPointY - mouseY;
                }, 10);
            }
        }, { passive: false });
    },
    
    /**
     * 添加全屏按钮
     * @param {HTMLElement} container - 主容器
     * @param {HTMLElement} svgWrapper - SVG包装器
     */
    addFullscreenButton: function(container, svgWrapper) {
        //.获取缩放控件容器（如果已存在）
        let zoomControls = container.querySelector('.zoom-controls');
        
        // 如果不存在，创建一个新的
        if (!zoomControls) {
            zoomControls = document.createElement('div');
            zoomControls.className = 'zoom-controls';
            zoomControls.style.position = 'absolute';
            zoomControls.style.top = '10px';
            zoomControls.style.right = '10px';
            zoomControls.style.backgroundColor = '#ffffff';
            zoomControls.style.padding = '5px';
            zoomControls.style.border = '1px solid #cccccc';
            zoomControls.style.borderRadius = '4px';
            zoomControls.style.zIndex = '100';
            zoomControls.style.display = 'flex';
            zoomControls.style.gap = '5px';
            container.appendChild(zoomControls);
        }
        
        // 创建全屏按钮
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.textContent = '全屏';
        fullscreenBtn.style.cursor = 'pointer';
        fullscreenBtn.style.padding = '0 5px';
        fullscreenBtn.style.height = '30px';
        fullscreenBtn.style.color = '#333333';
        fullscreenBtn.style.backgroundColor = '#f5f5f5';
        fullscreenBtn.style.border = '1px solid #cccccc';
        fullscreenBtn.style.display = 'flex';
        fullscreenBtn.style.alignItems = 'center';
        fullscreenBtn.style.justifyContent = 'center';
        
        // 添加全屏功能
        fullscreenBtn.addEventListener('click', function() {
            if (!document.fullscreenElement) {
                // 进入全屏模式
                if (svgWrapper.requestFullscreen) {
                    svgWrapper.requestFullscreen();
                } else if (svgWrapper.mozRequestFullScreen) { /* Firefox */
                    svgWrapper.mozRequestFullScreen();
                } else if (svgWrapper.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                    svgWrapper.webkitRequestFullscreen();
                } else if (svgWrapper.msRequestFullscreen) { /* IE/Edge */
                    svgWrapper.msRequestFullscreen();
                }
                fullscreenBtn.textContent = '退出';
            } else {
                // 退出全屏模式
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) { /* Firefox */
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { /* IE/Edge */
                    document.msExitFullscreen();
                }
                fullscreenBtn.textContent = '全屏';
            }
        });
        
        // 监听全屏变化事件
        document.addEventListener('fullscreenchange', function() {
            if (document.fullscreenElement) {
                fullscreenBtn.textContent = '退出';
            } else {
                fullscreenBtn.textContent = '全屏';
            }
        });
        
        // 添加按钮到控制容器
        zoomControls.appendChild(fullscreenBtn);
    },
    
    /**
     * 尝试回退到PNG格式（GET方法）
     * @param {string} url - PNG请求URL
     * @param {HTMLElement} container - 渲染容器
     * @param {string} type - 图表类型
     */
    tryFallbackToPng: function(url, container, type) {
        const timestamp = new Date().getTime();
        const img = document.createElement('img');
        img.src = `${url}?t=${timestamp}`;
        img.alt = `${config.diagramTypes[type].name} Diagram (Fallback)`;
        img.style.maxWidth = '100%';
        
        const fallbackMessage = document.createElement('div');
        fallbackMessage.textContent = '(使用备用PNG格式 - SVG加载失败)';
        fallbackMessage.style.textAlign = 'center';
        fallbackMessage.style.color = '#666';
        fallbackMessage.style.fontSize = '0.8rem';
        fallbackMessage.style.marginTop = '0.5rem';
        
        container.appendChild(img);
        container.appendChild(fallbackMessage);
    },
    
    /**
     * 尝试回退到PNG格式（POST方法）
     * @param {string} url - PNG请求URL
     * @param {string} content - 图表内容
     * @param {HTMLElement} container - 渲染容器
     * @param {string} type - 图表类型
     */
    tryFallbackWithPostToPng: function(url, content, container, type) {
        const diagramConfig = config.diagramTypes[type];
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': diagramConfig.mimeType || 'text/plain',
                'Accept': 'image/png'
            },
            body: content
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`PNG服务响应错误: ${response.status}`);
            }
            return response.blob();
        })
        .then(blob => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.alt = `${diagramConfig.name} Diagram (Fallback)`;
            img.style.maxWidth = '100%';
            
            const fallbackMessage = document.createElement('div');
            fallbackMessage.textContent = '(使用备用PNG格式 - SVG加载失败)';
            fallbackMessage.style.textAlign = 'center';
            fallbackMessage.style.color = '#666';
            fallbackMessage.style.fontSize = '0.8rem';
            fallbackMessage.style.marginTop = '0.5rem';
            
            container.innerHTML = '';
            container.appendChild(img);
            container.appendChild(fallbackMessage);
        })
        .catch(error => {
            console.error('PNG回退加载错误:', error);
            container.innerHTML = '';
            this.showError(`无法加载图表: ${error.message}`, container);
        });
    },
    
    // === 专用渲染器 ===
    
    /**
     * 渲染Mermaid图表
     * @param {string} code - Mermaid代码
     * @param {HTMLElement} container - 渲染容器
     */
    renderMermaid: function(code, container) {
        // 清空容器
        container.innerHTML = '';
        
        try {
            // 创建一个div元素用于Mermaid渲染
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = code;
            container.appendChild(div);
            
            // 渲染Mermaid图表
            mermaid.init(undefined, div);
            
            // 创建一个包装器元素，包含mermaid渲染后的内容
            const svgWrapper = document.createElement('div');
            svgWrapper.className = 'mermaid-wrapper';
            
            // 等待mermaid渲染完成
            setTimeout(() => {
                // 找到渲染后的SVG
                const svg = div.querySelector('svg');
                if (svg) {
                    // 将SVG移动到包装器中
                    svgWrapper.appendChild(svg);
                    // 先清空容器
                    container.innerHTML = '';
                    // 添加包装器到容器
                    container.appendChild(svgWrapper);
                    // 添加缩放控制
                    this.addZoomControls(container, svgWrapper);
                    // 添加全屏按钮
                    this.addFullscreenButton(container, svgWrapper);
                }
            }, 100);
        } catch (e) {
            console.error('Mermaid渲染错误:', e);
            this.showError(`Mermaid语法错误: ${e.message}`, container);
        }
    },
    
    /**
     * 渲染PlantUML图表（使用公共服务）
     * @param {string} code - PlantUML代码
     * @param {HTMLElement} container - 渲染容器
     */
    renderPlantUML: function(code, container) {
        // 清空容器
        container.innerHTML = '';
        
        try {
            // 将PlantUML代码转换为URL编码
            const encoded = plantumlEncoder.encode(code);
            
            // 创建加载中指示器
            this.createLoadingIndicator(container);
            
            // 添加随机参数防止缓存
            const timestamp = new Date().getTime();
            
            // 使用公共PlantUML服务创建SVG
            fetch(`https://www.plantuml.com/plantuml/svg/${encoded}?t=${timestamp}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`PlantUML服务响应错误: ${response.status}`);
                    }
                    return response.text();
                })
                .then(svgContent => {
                    this.processSvgResponse(svgContent, container, 'plantuml');
                })
                .catch(error => {
                    console.error('PlantUML错误:', error);
                    
                    // 清空容器
                    container.innerHTML = '';
                    
                    // 显示错误消息
                    this.showError(`PlantUML加载错误: ${error.message}`, container);
                    
                    // 备用方案：尝试PNG格式
                    this.tryFallbackToPng(`https://www.plantuml.com/plantuml/png/${encoded}`, container, 'plantuml');
                });
        } catch (e) {
            // 清空容器
            container.innerHTML = '';
            this.showError(`PlantUML处理错误: ${e.message}`, container);
        }
    },
    
    /**
     * 主渲染方法 - 根据图表类型和设置选择合适的渲染器
     * @param {string} code - 图表代码
     * @param {string} type - 图表类型
     * @param {HTMLElement} container - 渲染容器
     */
    render: function(code, type, container) {
        // 检查是否使用Kroki
        const useKroki = document.getElementById('use-kroki').checked;
        
        if (useKroki) {
            // 使用Kroki渲染所有图表类型
            this.renderWithKroki(code, type, container);
        } else {
            // 使用专用渲染器
            switch (type) {
                case 'mermaid':
                    this.renderMermaid(code, container);
                    break;
                case 'plantuml':
                    this.renderPlantUML(code, container);
                    break;
                default:
                    // 对于其他类型，默认使用Kroki（即使没有选择Kroki选项）
                    this.renderWithKroki(code, type, container);
                    break;
            }
        }
    }
}; 