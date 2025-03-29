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
    
    // 从localStorage获取设置或使用默认值
    const savedEnableNLDrawing = localStorage.getItem('enableNLDrawing');
    let settings = {                     // 设置对象
        openrouterKey: localStorage.getItem('openrouterKey') || '',
        enableNLDrawing: savedEnableNLDrawing !== null ? savedEnableNLDrawing === 'true' : true, // 如果未设置，默认启用
        autoRender: localStorage.getItem('autoRender') !== 'false' // 默认开启自动渲染
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
                showToast('已启用自然语言绘图模式，图表编辑器已锁定', 3000);
                
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
                showToast('已退出自然语言绘图模式，图表编辑器已解锁', 3000);
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
                        showToast('图表编辑器已锁定，请先退出自然语言模式再编辑', 3000);
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
            
            try {
                // 调用大语言模型API
                const response = await fetch('/api/nl-draw', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        api_key: settings.openrouterKey,
                        user_context: nlContent,
                        draw_tool_name: currentDiagramType,
                        draw_type: document.getElementById('template-select').value || '流程图'
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }
                
                // 处理流式响应
                const reader = response.body.getReader();
                let accumulatedCode = '';
                
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
                console.error('自然语言绘图错误:', error);
                showToast('保存失败，请稍后再试: ' + error.message, 3000);
            }
        } else {
            // 直接渲染当前编辑器内容
            renderDiagram(true);
            showToast('保存成功');
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
    function init() {
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
}); 