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
    let settings = {                     // 设置对象
        openrouterKey: localStorage.getItem('openrouterKey') || '',
        enableNLDrawing: localStorage.getItem('enableNLDrawing') === 'true'
    };
    let isProcessingNLDrawing = false;   // 添加标志变量
    let lastGeneratedCode = null;        // 存储最后一次生成的代码
    let currentEditor = 'diagram';       // 当前显示的编辑器类型
    
    // 初始化自定义编辑器模式
    initCustomModes();
    
    // 初始化编辑器
    initEditors();
    
    // 初始化图表库
    initMermaid();
    
    // 填充模板选择器
    populateTemplateSelector(currentDiagramType);
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 初始化设置相关功能
    initSettings();
    
    // 默认加载一个简单的Mermaid图表示例
    loadTemplate('mermaid', '流程图');

    // 创建toast提示元素
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        display: none;
        z-index: 1000;
        transition: opacity 0.3s ease-in-out;
    `;
    document.body.appendChild(toast);

    /**
     * 初始化编辑器
     */
    function initEditors() {
        // 获取编辑器元素
        const diagramTextArea = document.getElementById('code-editor');
        const nlTextArea = document.getElementById('nl-editor');
        
        // 创建绘图文本编辑器
        diagramEditor = CodeMirror.fromTextArea(diagramTextArea, {
            mode: currentDiagramType,
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false,
            autoCloseBrackets: true,
            matchBrackets: true
        });
        
        // 创建自然语言编辑器
        nlEditor = CodeMirror.fromTextArea(nlTextArea, {
            mode: 'text',
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false
        });
        
        // 设置编辑器权限控制
        setupEditorPermissions();
    }

    /**
     * 设置编辑器权限控制
     */
    function setupEditorPermissions() {
        diagramEditor.on('beforeChange', function(cm, change) {
            if (document.getElementById('enable-nl-drawing').checked) {
                showReadOnlyDialog();
                return false; // 阻止编辑
            }
        });
    }

    /**
     * 显示只读提示对话框
     */
    function showReadOnlyDialog() {
        const { title, content, confirmText, cancelText } = config.editor.readOnlyMessage;
        
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>${title}</h3>
                <p>${content}</p>
                <div class="modal-footer">
                    <button class="confirm">${confirmText}</button>
                    <button class="cancel">${cancelText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        dialog.querySelector('.confirm').addEventListener('click', () => {
            document.getElementById('enable-nl-drawing').checked = false;
            dialog.remove();
            // 触发change事件以更新状态
            const event = new Event('change');
            document.getElementById('enable-nl-drawing').dispatchEvent(event);
        });
        
        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });
    }

    /**
     * 显示toast提示
     */
    function showToast(message, duration = 2000) {
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
        
        // 监听编辑器切换按钮
        document.getElementById('editor-switch').addEventListener('click', toggleEditor);
        
        // 监听保存按钮
        document.getElementById('save-btn').addEventListener('click', handleSave);
        
        // 监听自然语言绘图开关
        document.getElementById('enable-nl-drawing').addEventListener('change', function(e) {
            settings.enableNLDrawing = e.target.checked;
            localStorage.setItem('enableNLDrawing', settings.enableNLDrawing);
            
            // 更新编辑器状态
            updateEditorsState();
        });

        // 添加快捷键监听
        document.addEventListener('keydown', function(e) {
            // 检查是否按下了Command+S (Mac) 或 Ctrl+S (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault(); // 阻止浏览器默认的保存行为
                handleSave();
            }
        });
    }

    /**
     * 切换编辑器显示
     */
    function toggleEditor() {
        if (currentEditor === 'diagram') {
            diagramEditor.getWrapperElement().style.display = 'none';
            nlEditor.getWrapperElement().style.display = '';
            currentEditor = 'nl';
        } else {
            diagramEditor.getWrapperElement().style.display = '';
            nlEditor.getWrapperElement().style.display = 'none';
            currentEditor = 'diagram';
        }
        
        // 刷新编辑器以确保正确显示
        diagramEditor.refresh();
        nlEditor.refresh();
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
        } else {
            diagramWrapper.classList.remove('readonly');
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
            const nlContent = nlEditor.getValue();
            
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
                    throw new Error('API请求失败');
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
                        }
                    }
                }
            } catch (error) {
                console.error('自然语言绘图错误:', error);
                showToast('生成失败: ' + error.message);
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
                if (useKroki || !config.localRenderSupport[currentDiagramType]) {
                    // 使用Kroki渲染
                    DiagramRenderers.renderWithKroki(code, currentDiagramType, previewContainer);
                } else {
                    // 使用本地渲染
                    DiagramRenderers.render(code, currentDiagramType, previewContainer);
                }
            } catch (error) {
                console.error('渲染错误:', error);
                DiagramRenderers.showError(`渲染失败: ${error.message}`, previewContainer);
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

        // 加载保存的设置
        openrouterKeyInput.value = settings.openrouterKey;
        enableNLDrawingCheckbox.checked = settings.enableNLDrawing;

        // 打开设置弹窗
        settingsBtn.onclick = function() {
            modal.style.display = "block";
        }

        // 关闭弹窗
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }

        // 点击弹窗外部关闭
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }

        // 保存设置
        saveBtn.onclick = function() {
            settings.openrouterKey = openrouterKeyInput.value;
            settings.enableNLDrawing = enableNLDrawingCheckbox.checked;
            
            // 保存到localStorage
            localStorage.setItem('openrouterKey', settings.openrouterKey);
            localStorage.setItem('enableNLDrawing', settings.enableNLDrawing);
            
            modal.style.display = "none";
            
            // 重新渲染当前图表
            renderDiagram();
        }

        // 取消设置
        cancelBtn.onclick = function() {
            openrouterKeyInput.value = settings.openrouterKey;
            enableNLDrawingCheckbox.checked = settings.enableNLDrawing;
            modal.style.display = "none";
        }
    }
}); 