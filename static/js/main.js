/**
 * 在线绘图工具主脚本
 */
document.addEventListener('DOMContentLoaded', function() {
    // 初始化变量
    let currentDiagramType = 'mermaid';  // 默认使用Mermaid
    let diagramEditor;                   // 绘图文本编辑器实例
    let nlEditor;                        // 自然语言编辑器实例
    let renderTimeout = null;            // 渲染延时器
    let streamRenderInterval = null;     // 流式渲染定时器
    let currentAbortController = null;   // 请求中止控制器
    let isProcessingRequest = false;     // 是否正在处理请求
    let pendingSaveData = null;          // 待处理的保存内容
    
    // 从localStorage获取设置或使用默认值
    const savedEnableNLDrawing = localStorage.getItem('enableNLDrawing');
    let settings = {                     // 设置对象
        openrouterKey: localStorage.getItem('openrouterKey') || '',
        enableNLDrawing: savedEnableNLDrawing !== null ? savedEnableNLDrawing === 'true' : true, // 如果未设置，默认启用
        autoRender: localStorage.getItem('autoRender') !== 'false', // 默认开启自动渲染
        promptTemplates: null,  // 存储提示词模板
    };
    let isProcessingNLDrawing = false;   // 添加标志变量
    let lastGeneratedCode = null;        // 存储最后一次生成的代码
    let currentEditor = 'diagram';       // 当前激活的编辑器类型: 'diagram' 或 'nl'
    let isInitialLoad = true;            // 初始加载标志
    
    // 确保所有模态框初始时是隐藏的
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    
    // 如果没有API密钥但启用了自然语言绘图，提示用户设置
    if (settings.enableNLDrawing && !settings.openrouterKey) {
        // 延迟显示提示，确保页面先加载完成
        setTimeout(() => {
            // 仍然保持启用状态，但显示提示
            showToast('请设置API密钥以使用自然语言绘图功能', 5000);
        }, 1500);
    }
    
    // 创建toast提示元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        display: none;
        z-index: 1000;
        transition: opacity 0.3s ease-in-out;
        text-align: center;
        min-width: 250px;
        max-width: 80%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    `;
    document.body.appendChild(toast);
    
    // 初始化顺序很重要
    initCustomModes();  // 1. 初始化编辑器模式
    initMermaid();      // 2. 初始化图表库
    initEditors();      // 3. 初始化编辑器
    initSettings();     // 4. 初始化设置
    
    // 填充模板选择器
    populateTemplateSelector(currentDiagramType);
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 默认加载一个简单的Mermaid图表示例
    loadTemplate('mermaid', '流程图');
    
    // 设置初始UI状态
    document.getElementById('enable-nl-drawing').checked = settings.enableNLDrawing;
    document.getElementById('enable-auto-render').checked = settings.autoRender;
    updateEditorsState();
    
    // 页面加载完成后，移除初始加载标记
    setTimeout(function() {
        isInitialLoad = false;
    }, 1000);

    // 初始化应用
    init();

    // 初始化拖拽分隔条
    initResizer();

    /**
     * 初始化编辑器
     */
    function initEditors() {
        // 初始化代码编辑器
        diagramEditor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            lineNumbers: true,
            mode: currentDiagramType,
            theme: 'dracula',
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false,
            autoCloseBrackets: true,
            matchBrackets: true
        });
        
        // 初始化自然语言编辑器
        nlEditor = CodeMirror.fromTextArea(document.getElementById('nl-editor'), {
            lineNumbers: true,
            mode: 'text',
            theme: 'dracula',
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false
        });
        
        // 添加编辑器内容变化事件
        diagramEditor.on('change', function(cm, change) {
            // 仅当用户手动输入（非程序设置值）时进行实时渲染
            if (change.origin !== 'setValue' && change.origin !== 'undo' && change.origin !== 'redo') {
                // 判断是否启用了自动渲染且未启用自然语言绘图
                const shouldAutoRender = settings.autoRender && !settings.enableNLDrawing;
                if (shouldAutoRender) {
                    // 实时渲染预览
                    renderDiagram(false);
                }
            }
        });
        
        // 初始化编辑器内容 - 默认为空，后续会通过loadTemplate加载内容
        // 不需要使用defaultDiagramCode变量
        
        // 为tab添加点击事件
        setupTabSwitching();
    }

    /**
     * 设置tab切换功能
     */
    function setupTabSwitching() {
        const tabs = document.querySelectorAll('.editor-tabs .tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 获取目标容器id
                const targetId = this.getAttribute('data-target');
                
                // 更新当前编辑器类型
                currentEditor = targetId === 'diagram-editor-container' ? 'diagram' : 'nl';
                
                // 隐藏所有编辑器容器
                document.querySelectorAll('.editor-container').forEach(container => {
                    container.classList.remove('active');
                });
                
                // 显示目标编辑器容器
                document.getElementById(targetId).classList.add('active');
                
                // 不需要手动更新tab状态，将由updateEditorTitle处理
                updateEditorTitle();
                
                // 刷新编辑器以确保正确显示
                if (currentEditor === 'diagram') {
                    diagramEditor.refresh();
                } else {
                    nlEditor.refresh();
                }
            });
        });
    }

    /**
     * 更新编辑器标题
     */
    function updateEditorTitle() {
        // 由于tabs现在直接在panel-header中，这里只需处理tab的活动状态
        const diagramTab = document.querySelector('.editor-tabs .tab[data-target="diagram-editor-container"]');
        const nlTab = document.querySelector('.editor-tabs .tab[data-target="nl-editor-container"]');
        
        if (currentEditor === 'diagram') {
            diagramTab.classList.add('active');
            nlTab.classList.remove('active');
        } else {
            diagramTab.classList.remove('active');
            nlTab.classList.add('active');
        }
    }

    /**
     * 切换到指定的编辑器
     * @param {string} editorType - 编辑器类型: 'diagram' 或 'nl'
     */
    function switchToEditor(editorType) {
        const tab = document.querySelector(`.editor-tabs .tab[data-target="${editorType === 'diagram' ? 'diagram-editor-container' : 'nl-editor-container'}"]`);
        if (tab) {
            tab.click();
        }
    }

    /**
     * 切换编辑器（向后兼容）
     */
    function toggleEditor() {
        // 切换编辑器类型
        const newEditorType = currentEditor === 'diagram' ? 'nl' : 'diagram';
        
        // 使用新的tab切换功能
        switchToEditor(newEditorType);
    }

    /**
     * 显示toast提示
     */
    function showToast(message, duration = 3000) {
        toast.textContent = message;
        toast.style.display = 'block';
        toast.style.opacity = '1';
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, duration);
    }

    /**
     * 监听自然语言绘图开关
     */
    function setupNLDrawingListeners() {
        document.getElementById('enable-nl-drawing').addEventListener('change', function(e) {
            // 如果是初始加载，忽略事件处理
            if (isInitialLoad) return;
            
            const isEnabled = e.target.checked;
            
            // 如果要启用自然语言绘图，先检查API密钥
            if (isEnabled && !settings.openrouterKey) {
                // 允许勾选，但显示设置对话框提示设置API密钥
                showToast('请设置API密钥以使用自然语言绘图功能');
                
                // 显示设置对话框
                document.getElementById('settings-modal').classList.add('show');
            }
            
            settings.enableNLDrawing = isEnabled;
            localStorage.setItem('enableNLDrawing', isEnabled);
            
            // 更新编辑器状态
            updateEditorsState();
            
            // 如果启用自然语言绘图，禁用自动渲染
            if (isEnabled) {
                // 自动渲染在自然语言绘图模式下禁用
                document.getElementById('enable-auto-render').disabled = true;
                
                // 显示提示信息
                showToast('已启用自然语言绘图模式，图表源码已锁定', 3000);
                
                // 如果当前是图表编辑器，自动切换到自然语言编辑器
                if (currentEditor === 'diagram') {
                    switchToEditor('nl');
                }
            } else {
                // 关闭自然语言绘图时，重新启用自动渲染选项
                document.getElementById('enable-auto-render').disabled = false;
                
                // 如果自动渲染是开启的，触发一次渲染
                if (settings.autoRender) {
                    renderDiagram(false);
                }
                
                // 显示提示信息
                showToast('已退出自然语言绘图模式，图表源码已解锁', 3000);
            }
        });
    }

    /**
     * 监听自动渲染开关
     */
    function setupAutoRenderListeners() {
        document.getElementById('enable-auto-render').addEventListener('change', function(e) {
            // 如果是初始加载，忽略事件处理
            if (isInitialLoad) return;
            
            const isEnabled = e.target.checked;
            settings.autoRender = isEnabled;
            localStorage.setItem('autoRender', isEnabled);
            
            // 如果开启了自动渲染，且当前不是自然语言绘图模式，立即触发一次渲染
            if (isEnabled && !settings.enableNLDrawing) {
                renderDiagram(false);
            }
        });
    }

    /**
     * 绑定事件监听器
     */
    function bindEventListeners() {
        // 监听图表类型选择变更
        document.getElementById('diagram-select').addEventListener('change', function(e) {
            currentDiagramType = e.target.value;
            
            // 填充相应的模板选择器
            populateTemplateSelector(currentDiagramType);
            
            // 设置编辑器模式
            const diagramConfig = config.diagramTypes[currentDiagramType];
            if (diagramConfig) {
                diagramEditor.setOption('mode', diagramConfig.editorMode);
            }
            
            // 默认加载该类型的第一个模板
            if (diagramTemplates[currentDiagramType]) {
                const firstTemplate = Object.keys(diagramTemplates[currentDiagramType])[0];
                loadTemplate(currentDiagramType, firstTemplate);
            }
        });
        
        // 监听模板选择变更
        document.getElementById('template-select').addEventListener('change', function(e) {
            if (e.target.value) {
                loadTemplate(currentDiagramType, e.target.value);
            }
        });
        
        // 监听保存按钮
        document.getElementById('save-btn').addEventListener('click', handleSave);
        
        // 导出SVG按钮监听
        document.getElementById('export-svg-btn').addEventListener('click', exportSVG);
        
        // 添加自然语言绘图开关监听
        setupNLDrawingListeners();
        
        // 添加自动渲染开关监听
        setupAutoRenderListeners();

        // 添加快捷键监听
        document.addEventListener('keydown', function(e) {
            // 检查是否按下了Command+S (Mac) 或 Ctrl+S (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault(); // 阻止浏览器默认的保存行为
                handleSave();
            }
        });
        
        // 监听Kroki渲染切换
        document.getElementById('use-kroki').addEventListener('change', function() {
            // 如果切换到Kroki渲染，需要手动触发一次渲染
            renderDiagram(true);
        });
    }

    /**
     * 更新编辑器状态
     */
    function updateEditorsState() {
        const isNLDrawingEnabled = document.getElementById('enable-nl-drawing').checked;
        
        // 设置绘图文本编辑器的只读状态
        diagramEditor.setOption('readOnly', isNLDrawingEnabled);
        
        // 更新编辑器的视觉提示
        const diagramWrapper = diagramEditor.getWrapperElement();
        if (isNLDrawingEnabled) {
            diagramWrapper.classList.add('readonly');
            
            // 如果开启了自然语言绘图，自动渲染选项应当被禁用
            document.getElementById('enable-auto-render').disabled = true;
            
            // 添加点击事件监听器
            if (!diagramWrapper.hasAttribute('data-has-click-listener')) {
                diagramWrapper.addEventListener('click', function(e) {
                    if (document.getElementById('enable-nl-drawing').checked) {
                        showToast('图表源码已锁定，请先退出自然语言模式再编辑', 3000);
                    }
                });
                // 设置标记，避免重复添加事件监听器
                diagramWrapper.setAttribute('data-has-click-listener', 'true');
            }
            
            // 如果已启用自然语言绘图，默认显示自然语言编辑器
            if (isInitialLoad) {
                switchToEditor('nl');
            }
        } else {
            diagramWrapper.classList.remove('readonly');
            
            // 如果关闭了自然语言绘图，自动渲染选项应当被启用
            document.getElementById('enable-auto-render').disabled = false;
        }
    }

    /**
     * 处理保存操作
     */
    async function handleSave() {
        const useNLDrawing = document.getElementById('enable-nl-drawing').checked;
        const useKroki = document.getElementById('use-kroki').checked;
        
        showToast('开始保存...');
        
        if (useNLDrawing) {
            // 获取自然语言内容
            const nlContent = nlEditor.getValue().trim();
            
            // 检查自然语言编辑器内容是否为空
            if (!nlContent) {
                showToast('自然语言编辑器内容为空', 3000);
                return;
            }
            
            const saveData = {
                api_key: settings.openrouterKey,
                user_context: nlContent,
                draw_tool_name: currentDiagramType,
                draw_type: document.getElementById('template-select').value || '流程图'
            };
            
            // 如果正在处理请求，缓存新的内容并返回
            if (isProcessingRequest) {
                pendingSaveData = saveData;
                showToast('已缓存最新内容，将在当前处理完成后自动执行', 3000);
                return;
            }
            
            // 标记开始处理请求
            isProcessingRequest = true;
            
            try {
                // 处理当前请求
                await processNLDrawingRequest(saveData);
            } finally {
                // 请求处理完成后
                isProcessingRequest = false;
                
                // 检查是否有待处理的内容
                if (pendingSaveData) {
                    const nextData = pendingSaveData;
                    pendingSaveData = null; // 清空待处理内容
                    showToast('开始处理缓存的保存请求...');
                    
                    // 递归调用自身来处理待处理的内容
                    // 由于已经清空了pendingSaveData，这不会导致无限递归
                    handleSave();
                }
            }
        } else {
            // 直接渲染当前编辑器内容
            renderDiagram(true);
            showToast('保存成功');
        }
    }

    /**
     * 处理自然语言绘图请求
     */
    async function processNLDrawingRequest(data) {
        // 中止当前正在进行的请求（如果有）
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
        }

        // 创建新的AbortController
        currentAbortController = new AbortController();

        try {
            // 获取完整提示词
            const fullPrompt = getFullPrompt(
                data.user_context,
                data.draw_tool_name,
                data.draw_type
            );

            // 调用大语言模型API
            const response = await fetch('/api/nl-draw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: data.api_key,
                    prompt: fullPrompt  // 使用拼接后的完整提示词
                }),
                signal: currentAbortController.signal
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }
            
            // 处理流式响应
            const reader = response.body.getReader();
            let accumulatedCode = '';
            
            try {
                while (true) {
                    const {value, done} = await reader.read();
                    if (done) break;
                    
                    // 更新绘图文本编辑器
                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());
                    
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            
                            if (data.error) {
                                throw new Error(data.error);
                            }
                            
                            accumulatedCode = data.code;
                            diagramEditor.setValue(accumulatedCode);
                            
                            // 如果是最终响应
                            if (data.done) {
                                // 完成后渲染
                                renderDiagram(true);
                                showToast('生成完成');
                            }
                        } catch (error) {
                            console.error('解析响应数据错误:', error);
                            showToast('生成失败: 解析响应数据错误', 3000);
                            return;
                        }
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('请求被中止，准备处理新的请求');
                    return;
                }
                throw error;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('请求被中止，准备处理新的请求');
                return;
            }
            console.error('自然语言绘图错误:', error);
            showToast('保存失败，请稍后再试: ' + error.message, 3000);
        } finally {
            // 清理当前的AbortController
            if (currentAbortController) {
                currentAbortController = null;
            }
        }
    }

    /**
     * 渲染图表
     */
    function renderDiagram(forceRender = false) {
        // 清除之前的延时器
        if (renderTimeout) {
            clearTimeout(renderTimeout);
        }

        // 设置新的延时器
        renderTimeout = setTimeout(async () => {
            const code = diagramEditor.getValue();
            const previewContainer = document.getElementById('preview-container');
            const useKroki = document.getElementById('use-kroki').checked;
            
            try {
                // 清空预览容器
                previewContainer.innerHTML = '';
                
                if (useKroki) {
                    // 使用Kroki渲染
                    DiagramRenderers.renderWithKroki(code, currentDiagramType, previewContainer);
                } else {
                    // 本地渲染 - 根据图表类型处理
                    switch (currentDiagramType) {
                        case 'mermaid':
                            // 使用Mermaid库渲染
                            const mermaidContainer = document.createElement('div');
                            mermaidContainer.className = 'mermaid';
                            mermaidContainer.textContent = code;
                            previewContainer.appendChild(mermaidContainer);
                            
                            // 触发Mermaid渲染
                            mermaid.init(undefined, mermaidContainer);
                            
                            // 创建一个包装器元素，包含mermaid渲染后的内容
                            // 这样我们可以为它添加缩放控制
                            const svgWrapper = document.createElement('div');
                            svgWrapper.className = 'mermaid-wrapper';
                            
                            // 等待mermaid渲染完成
                            setTimeout(() => {
                                // 找到渲染后的SVG
                                const svg = mermaidContainer.querySelector('svg');
                                if (svg) {
                                    // 修复SVG的height和width属性，如果是"auto"则设置为实际值
                                    if (svg.getAttribute('height') === 'auto' || !svg.getAttribute('height')) {
                                        const svgRect = svg.getBoundingClientRect();
                                        svg.setAttribute('height', `${svgRect.height}px`);
                                        console.log('修复SVG高度: auto -> ', `${svgRect.height}px`);
                                    }
                                    
                                    if (svg.getAttribute('width') === 'auto' || !svg.getAttribute('width')) {
                                        const svgRect = svg.getBoundingClientRect();
                                        svg.setAttribute('width', `${svgRect.width}px`);
                                        console.log('修复SVG宽度: auto -> ', `${svgRect.width}px`);
                                    }
                                    
                                    // 将SVG移动到包装器中
                                    svgWrapper.appendChild(svg);
                                    // 先清空预览容器
                                    previewContainer.innerHTML = '';
                                    // 添加包装器到预览容器
                                    previewContainer.appendChild(svgWrapper);
                                    // 添加缩放控制
                                    DiagramRenderers.addZoomControls(previewContainer, svgWrapper);
                                    // 添加全屏按钮
                                    DiagramRenderers.addFullscreenButton(previewContainer, svgWrapper);
                                }
                            }, 100);
                            break;
                            
                        default:
                            // 默认使用Kroki渲染
                            DiagramRenderers.renderWithKroki(code, currentDiagramType, previewContainer);
                            break;
                    }
                }
            } catch (error) {
                console.error('渲染错误:', error);
                // 显示错误消息
                previewContainer.innerHTML = '';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.color = 'red';
                errorDiv.style.padding = '1rem';
                errorDiv.textContent = `渲染失败: ${error.message}`;
                previewContainer.appendChild(errorDiv);
            }
        }, 500);
    }

    // 初始化自定义编辑器模式
    function initCustomModes() {
        // 为Mermaid定义简单语法高亮
        CodeMirror.defineSimpleMode("mermaid", {
            start: [
                {regex: /(graph|sequenceDiagram|classDiagram|stateDiagram-v2|gantt|pie|flowchart|erDiagram)\b/, token: "keyword"},
                {regex: /[{}[\]]/, token: "bracket"},
                {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
                {regex: /'(?:[^\\]|\\.)*?(?:'|$)/, token: "string"},
                {regex: /--?>|===>|\|>|o--|<-->|<--o|<=>|<-\.->/, token: "operator"},
                {regex: /\d+/, token: "number"},
                {regex: /:[\w\s]+:/, token: "variable"},
                {regex: /#.*/, token: "comment"},
                {regex: /[\w$][\w\d$]*/, token: "variable"}
            ],
            meta: {
                lineComment: "#"
            }
        });
        
        // 为PlantUML定义简单语法高亮
        CodeMirror.defineSimpleMode("plantuml", {
            start: [
                {regex: /@startuml|@enduml|start|stop|if|then|else|endif|repeat|while|endwhile|fork|again|end\b/, token: "keyword"},
                {regex: /\b(actor|participant|boundary|control|entity|database|collections|queue|usecase|class|interface|enum|package|node|rectangle|object)\b/, token: "keyword"},
                {regex: /-+>|<-+|--|==|\.\./, token: "operator"},
                {regex: /[{}[\]]/, token: "bracket"},
                {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
                {regex: /'(?:[^\\]|\\.)*?(?:'|$)/, token: "string"},
                {regex: /\b\d+\b/, token: "number"},
                {regex: /'.*/, token: "comment"},
                {regex: /[\w$][\w\d$]*/, token: "variable"}
            ],
            meta: {
                lineComment: "'"
            }
        });
    }
    
    /**
     * 初始化Mermaid库
     */
    function initMermaid() {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            logLevel: 'error'
        });
    }
    
    /**
     * 填充模板选择器
     */
    function populateTemplateSelector(diagramType) {
        const templateSelect = document.getElementById('template-select');
        
        // 清空已有的选项（保留第一个默认选项）
        while (templateSelect.options.length > 1) {
            templateSelect.remove(1);
        }
        
        // 添加新选项
        const templates = diagramTemplates[diagramType];
        if (templates) {
            for (const templateName in templates) {
                const option = document.createElement('option');
                option.value = templateName;
                option.textContent = templateName;
                templateSelect.appendChild(option);
            }
        } else {
            console.warn(`未找到图表类型的模板: ${diagramType}`);
        }
    }
    
    /**
     * 加载模板
     */
    function loadTemplate(diagramType, templateName) {
        if (diagramTemplates[diagramType] && diagramTemplates[diagramType][templateName]) {
            const template = diagramTemplates[diagramType][templateName];
            diagramEditor.setValue(template);
            renderDiagram();
        } else {
            console.error(`模板未找到: ${diagramType} - ${templateName}`);
        }
    }
    
    /**
     * 初始化设置相关功能
     */
    function initSettings() {
        const modal = document.getElementById('settings-modal');
        const settingsBtn = document.getElementById('settings-btn');
        const closeBtn = modal.querySelector('.close');
        const saveBtn = document.getElementById('save-settings');
        const cancelBtn = document.getElementById('cancel-settings');
        const openrouterKeyInput = document.getElementById('openrouter-key');
        const enableNLDrawingCheckbox = document.getElementById('enable-nl-drawing');

        // 确保设置弹窗初始时是隐藏的
        modal.style.display = "none";
        
        // 加载保存的设置到设置弹窗中，但不显示弹窗
        openrouterKeyInput.value = settings.openrouterKey;
        enableNLDrawingCheckbox.checked = settings.enableNLDrawing;

        // 触发设置框的功能 - 只有用户点击按钮时才显示
        settingsBtn.onclick = function() {
            // 更新设置弹窗内容（确保反映最新状态）
            openrouterKeyInput.value = settings.openrouterKey;
            enableNLDrawingCheckbox.checked = settings.enableNLDrawing;
            modal.classList.add('show');
        }

        // 关闭弹窗
        closeBtn.onclick = function() {
            modal.classList.remove('show');
        }

        // 点击弹窗外部关闭
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        }

        // 保存设置
        saveBtn.onclick = function() {
            const newKey = openrouterKeyInput.value.trim();
            const newEnableNLDrawing = enableNLDrawingCheckbox.checked;
            
            // 如果要启用自然语言绘图但没有API密钥，显示提示但仍允许启用
            if (newEnableNLDrawing && !newKey) {
                showToast('需要设置API密钥才能使用自然语言绘图功能', 5000);
                // 仍然保存用户选择的设置
                settings.enableNLDrawing = newEnableNLDrawing;
            } else {
                // 正常保存设置
                settings.enableNLDrawing = newEnableNLDrawing;
            }
            
            // 保存API密钥
            settings.openrouterKey = newKey;
            
            // 更新UI状态
            document.getElementById('enable-nl-drawing').checked = newEnableNLDrawing;
            
            // 保存到localStorage
            localStorage.setItem('openrouterKey', settings.openrouterKey);
            localStorage.setItem('enableNLDrawing', settings.enableNLDrawing);
            
            modal.classList.remove('show');
            
            // 更新编辑器状态
            updateEditorsState();
            
            // 重新渲染当前图表
            renderDiagram();
        }

        // 取消设置
        cancelBtn.onclick = function() {
            openrouterKeyInput.value = settings.openrouterKey;
            enableNLDrawingCheckbox.checked = settings.enableNLDrawing;
            modal.classList.remove('show');
        }
    }

    /**
     * 初始化应用
     */
    async function init() {
        // 加载提示词模板
        await loadPromptTemplates();
        
        // 设置初始UI状态
        document.getElementById('enable-nl-drawing').checked = settings.enableNLDrawing;
        document.getElementById('enable-auto-render').checked = settings.autoRender;
        updateEditorsState();
        
        // 初始化渲染
        renderDiagram(true);
        
        // 如果启用了自然语言绘图，自动切换到自然语言编辑器
        if (settings.enableNLDrawing) {
            // 延迟切换以确保UI元素已加载完成
            setTimeout(() => {
                switchToEditor('nl');
            }, 200);
        }
        
        // 延迟标记初始加载完成
        setTimeout(() => {
            isInitialLoad = false;
        }, 500);
    }

    /**
     * 初始化拖拽分隔条
     */
    function initResizer() {
        const resizer = document.getElementById('panel-resizer');
        const previewPanel = document.querySelector('.preview-panel');
        const editorPanel = document.querySelector('.editor-panel');
        const container = document.querySelector('.content');
        
        // 检测是否为移动设备
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        // 从localStorage获取之前保存的宽度比例
        const savedPreviewWidth = localStorage.getItem('previewPanelWidth');
        if (savedPreviewWidth && !isMobile) {
            previewPanel.style.flex = 'none';
            previewPanel.style.width = savedPreviewWidth;
        }
        
        // 从localStorage获取之前保存的高度比例（用于移动设备）
        const savedPreviewHeight = localStorage.getItem('previewPanelHeight');
        if (savedPreviewHeight && isMobile) {
            previewPanel.style.flex = 'none';
            previewPanel.style.height = savedPreviewHeight;
        }
        
        let isResizing = false;
        
        // 处理鼠标按下事件
        const handlePointerDown = (e) => {
            isResizing = true;
            resizer.classList.add('active');
            
            // 阻止默认事件防止文本选择等
            e.preventDefault();
            
            // 添加相应的事件监听
            if (e.type === 'touchstart') {
                document.addEventListener('touchmove', handlePointerMove, { passive: false });
                document.addEventListener('touchend', handlePointerUp);
            } else {
                document.addEventListener('mousemove', handlePointerMove);
                document.addEventListener('mouseup', handlePointerUp);
            }
        };
        
        // 处理移动事件
        const handlePointerMove = (e) => {
            if (!isResizing) return;
            
            // 阻止默认事件，如滚动
            e.preventDefault();
            
            if (isMobile) {
                // 移动设备上调整高度 - 使用绝对位置
                const clientY = e.clientY || e.touches[0].clientY;
                handleVerticalResize(clientY);
            } else {
                // 桌面设备上调整宽度 - 使用绝对位置
                const clientX = e.clientX || e.touches[0].clientX;
                handleHorizontalResize(clientX);
            }
        };
        
        // 处理水平方向的调整（桌面）- 使用绝对位置计算
        function handleHorizontalResize(clientX) {
            // 计算绝对位置
            const containerRect = container.getBoundingClientRect();
            
            // 计算相对于容器的位置
            let newWidth = clientX - containerRect.left;
            
            // 设置新宽度（确保最小宽度）
            newWidth = Math.max(200, newWidth);
            
            // 确保不会超出容器宽度减去最小编辑器宽度
            const maxWidth = container.offsetWidth - 200 - resizer.offsetWidth;
            newWidth = Math.min(newWidth, maxWidth);
            
            // 更新预览面板宽度
            previewPanel.style.flex = 'none';
            previewPanel.style.width = `${newWidth}px`;
            
            // 更新编辑器面板宽度（自动填充剩余空间）
            editorPanel.style.flex = '1';
            
            // 保存到localStorage
            localStorage.setItem('previewPanelWidth', `${newWidth}px`);
            
            // 触发窗口大小改变事件，以便重新渲染图表
            window.dispatchEvent(new Event('resize'));
        }
        
        // 处理垂直方向的调整（移动设备）- 使用绝对位置计算
        function handleVerticalResize(clientY) {
            // 计算绝对位置
            const containerRect = container.getBoundingClientRect();
            
            // 计算相对于容器的位置
            let newHeight = clientY - containerRect.top;
            
            // 设置新高度（确保最小高度）
            newHeight = Math.max(150, newHeight);
            
            // 确保不会超出容器高度减去最小编辑器高度
            const maxHeight = container.offsetHeight - 150;
            newHeight = Math.min(newHeight, maxHeight);
            
            // 更新预览面板高度
            previewPanel.style.flex = 'none';
            previewPanel.style.height = `${newHeight}px`;
            
            // 更新编辑器面板高度
            editorPanel.style.flex = 'none';
            editorPanel.style.height = `${container.offsetHeight - newHeight - resizer.offsetHeight}px`;
            
            // 保存到localStorage
            localStorage.setItem('previewPanelHeight', `${newHeight}px`);
            
            // 触发窗口大小改变事件
            window.dispatchEvent(new Event('resize'));
        }
        
        // 处理指针释放事件
        const handlePointerUp = () => {
            isResizing = false;
            resizer.classList.remove('active');
            
            // 移除事件监听
            document.removeEventListener('mousemove', handlePointerMove);
            document.removeEventListener('mouseup', handlePointerUp);
            document.removeEventListener('touchmove', handlePointerMove);
            document.removeEventListener('touchend', handlePointerUp);
        };
        
        // 添加事件监听器
        resizer.addEventListener('mousedown', handlePointerDown);
        resizer.addEventListener('touchstart', handlePointerDown, { passive: false });
        
        // 监听媒体查询状态更改
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        mediaQuery.addEventListener('change', (e) => {
            const isMobileNow = e.matches;
            if (isMobileNow) {
                // 切换到移动视图
                previewPanel.style.width = '';
                previewPanel.style.flex = 'none';
                const savedHeight = localStorage.getItem('previewPanelHeight') || '50vh';
                previewPanel.style.height = savedHeight;
            } else {
                // 切换到桌面视图
                previewPanel.style.height = '';
                previewPanel.style.flex = 'none';
                const savedWidth = localStorage.getItem('previewPanelWidth') || '50%';
                previewPanel.style.width = savedWidth;
            }
        });
        
        // 窗口大小变化时调整面板
        window.addEventListener('resize', () => {
            if (isMobile) {
                // 移动设备上不需要特殊处理，CSS已设置好
            } else {
                // 桌面设备需要确保宽度不超出限制
                const containerWidth = container.offsetWidth;
                const previewWidth = previewPanel.offsetWidth;
                
                if (previewWidth > containerWidth - 200 - resizer.offsetWidth) {
                    const newWidth = containerWidth - 200 - resizer.offsetWidth;
                    previewPanel.style.width = `${newWidth}px`;
                    localStorage.setItem('previewPanelWidth', `${newWidth}px`);
                }
            }
        });
    }

    /**
     * 导出SVG文件
     */
    function exportSVG() {
        try {
            // 获取当前时间作为文件名的一部分
            const now = new Date();
            const timestamp = now.getFullYear() +
                String(now.getMonth() + 1).padStart(2, '0') +
                String(now.getDate()).padStart(2, '0') +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            
            // 构建文件名
            const filename = `langdraw_${currentDiagramType}_${timestamp}.svg`;
            
            // 获取预览容器中的SVG元素
            const container = document.getElementById('preview-container');
            const svg = container.querySelector('svg');
            
            if (!svg) {
                showToast('没有找到可导出的SVG图表', 'error');
                return;
            }
            
            // 克隆SVG以避免修改原始图表
            const svgClone = svg.cloneNode(true);
            
            // 确保SVG有正确的命名空间
            if (!svgClone.getAttribute('xmlns')) {
                svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }
            
            // 创建一个Blob对象
            const svgData = new XMLSerializer().serializeToString(svgClone);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // 模拟点击下载
            document.body.appendChild(link);
            link.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
            
            showToast('SVG导出成功', 'success');
        } catch (error) {
            console.error('导出SVG失败:', error);
            showToast('导出SVG失败: ' + error.message, 'error');
        }
    }

    // 加载提示词模板
    async function loadPromptTemplates() {
        try {
            const response = await fetch('/static/config/prompts.json');
            if (!response.ok) {
                throw new Error('Failed to load prompt templates');
            }
            settings.promptTemplates = await response.json();
            console.log('提示词模板加载成功:', settings.promptTemplates);
        } catch (error) {
            console.error('加载提示词模板失败:', error);
            // 使用默认模板作为备份
            settings.promptTemplates = {
                "nl_drawing": {
                    "default": "{user_context}。请你基于以上信息,给我{draw_tool_name}的{draw_type}图的文本格式。并且你一定要遵循以下规则：\n1. 你只能输出这个图相关的文本,其他任何文本信息都不要输出给我\n2. 你需要注意绘图文本中一些特殊文案字符的转义或处理，比如在mermaid流程图中，如果内容包含中括号，比如下面这样：\nH -->|否| J{{该范围[1024,3024]可以进行处理}}\n那么你需要将内容放在双引号中，像下面这样，因为中括号是mermaid的关键字，不能直接使用：\nH -->|否| J{{\"该范围[1024,3024]可以进行处理\"}}\n3. 其他的绘图，你输出的时候也一定要注意关键字冲突和转移的问题。"
                }
            };
        }
    }

    // 格式化提示词模板
    function formatPromptTemplate(template, params) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] || match;
        });
    }

    // 获取完整提示词
    function getFullPrompt(userContext, diagramType, drawType) {
        const templateType = 'nl_drawing';
        const templateName = 'default';
        
        const templates = settings.promptTemplates?.[templateType] || {};
        let promptTemplate = templates[templateName];
        
        if (!promptTemplate) {
            promptTemplate = settings.promptTemplates?.['nl_drawing']?.['default'];
        }
        
        if (!promptTemplate) {
            console.error('提示词模板不存在');
            return userContext;
        }
        
        return formatPromptTemplate(promptTemplate, {
            user_context: userContext,
            draw_tool_name: diagramType,
            draw_type: drawType
        });
    }

    // 修改调用LLM的函数
    async function callLLM(nlContent) {
        try {
            if (!settings.openrouterKey) {
                showError('请先在设置中配置OpenRouter API Key');
                return;
            }

            // 获取完整提示词
            const fullPrompt = getFullPrompt(
                nlContent,
                currentDiagramType,
                getDrawType(currentDiagramType)
            );

            const response = await fetch('/api/nl-draw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: settings.openrouterKey,
                    prompt: fullPrompt  // 直接发送完整提示词
                })
            });

            // ... existing code ...
        } catch (error) {
            console.error('调用LLM出错:', error);
            showError('调用LLM失败: ' + error.message);
        }
    }
}); 