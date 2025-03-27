/**
 * 在线绘图工具主脚本
 */
document.addEventListener('DOMContentLoaded', function() {
    // 初始化变量
    let currentDiagramType = 'mermaid';  // 默认使用Mermaid
    let editor;                          // CodeMirror编辑器实例
    let renderTimeout = null;            // 渲染延时器
    let streamRenderInterval = null;     // 流式渲染定时器
    let settings = {                     // 设置对象
        openrouterKey: localStorage.getItem('openrouterKey') || '',
        enableNLDrawing: localStorage.getItem('enableNLDrawing') === 'true'
    };
    let isProcessingNLDrawing = false;  // 添加标志变量
    let lastGeneratedCode = null;       // 存储最后一次生成的代码
    
    // 初始化自定义编辑器模式
    initCustomModes();
    
    // 初始化编辑器
    initEditor();
    
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
    
    /**
     * 初始化自定义编辑器模式
     */
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
     * 初始化编辑器
     */
    function initEditor() {
        const textArea = document.getElementById('code-editor');
        
        // 创建编辑器
        editor = CodeMirror.fromTextArea(textArea, {
            mode: currentDiagramType,  // 使用当前图表类型的模式
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false,
            autoCloseBrackets: true,
            matchBrackets: true
        });
        
        // 监听编辑器内容变化，实时更新预览
        editor.on('change', function() {
            renderDiagram();
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
                editor.setOption('mode', diagramConfig.editorMode);
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
        
        // 监听Kroki选项变更
        document.getElementById('use-kroki').addEventListener('change', function() {
            // 重新渲染当前图表
            renderDiagram();
        });

        // 监听重新生成按钮点击
        document.getElementById('regenerate-btn').addEventListener('click', async function() {
            if (settings.enableNLDrawing && settings.openrouterKey) {
                const code = editor.getValue();
                const previewContainer = document.getElementById('preview-container');
                
                try {
                    // 设置处理标志
                    isProcessingNLDrawing = true;
                    // 使用自然语言处理
                    const generatedCode = await handleNaturalLanguageDrawing(code);
                    if (generatedCode) {
                        lastGeneratedCode = generatedCode;
                        // 更新编辑器内容
                        editor.setValue(generatedCode);
                        // 渲染生成的代码
                        DiagramRenderers.render(generatedCode, currentDiagramType, previewContainer);
                    }
                } catch (error) {
                    console.error('重新生成错误:', error);
                    DiagramRenderers.showError(`重新生成失败: ${error.message}`, previewContainer);
                } finally {
                    // 重置处理标志
                    isProcessingNLDrawing = false;
                }
            }
        });
    }
    
    /**
     * 加载模板
     */
    function loadTemplate(diagramType, templateName) {
        if (diagramTemplates[diagramType] && diagramTemplates[diagramType][templateName]) {
            const template = diagramTemplates[diagramType][templateName];
            editor.setValue(template);
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

    /**
     * 处理自然语言绘图
     * @param {string} text - 用户输入的文本
     * @returns {Promise<string>} - 生成的图表代码
     */
    async function handleNaturalLanguageDrawing(text) {
        try {
            const currentTemplate = document.getElementById('template-select').value;
            const regenerateBtn = document.getElementById('regenerate-btn');
            const previewContainer = document.getElementById('preview-container');

            // 添加加载动画
            regenerateBtn.classList.add('loading');

            const response = await fetch('/api/nl-draw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: settings.openrouterKey,
                    user_context: text,
                    draw_tool_name: currentDiagramType,
                    draw_type: currentTemplate || '流程图'
                })
            });

            if (!response.ok) {
                throw new Error('API请求失败');
            }

            // 创建响应流读取器
            const reader = response.body.getReader();
            let accumulatedCode = '';
            
            // 清除之前的定时器
            if (streamRenderInterval) {
                clearInterval(streamRenderInterval);
            }

            // 设置定时渲染
            streamRenderInterval = setInterval(() => {
                if (accumulatedCode) {
                    editor.setValue(accumulatedCode);
                    DiagramRenderers.render(accumulatedCode, currentDiagramType, previewContainer);
                }
            }, 5000);

            // 读取流数据
            while (true) {
                const {value, done} = await reader.read();
                if (done) break;

                // 将 Uint8Array 转换为文本
                const chunk = new TextDecoder().decode(value);
                // 处理每一行数据
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        
                        if (data.error) {
                            throw new Error(data.error);
                        }

                        accumulatedCode = data.code;
                        
                        // 如果是最终响应
                        if (data.done) {
                            // 清除定时渲染
                            clearInterval(streamRenderInterval);
                            // 最后一次完整渲染
                            editor.setValue(accumulatedCode);
                            DiagramRenderers.render(accumulatedCode, currentDiagramType, previewContainer);
                            lastGeneratedCode = accumulatedCode;
                        }
                    } catch (error) {
                        console.error('解析响应数据错误:', error);
                    }
                }
            }

            return lastGeneratedCode;
        } catch (error) {
            console.error('自然语言绘图错误:', error);
            // 显示错误信息
            const previewContainer = document.getElementById('preview-container');
            DiagramRenderers.showError(`自然语言绘图失败: ${error.message}`, previewContainer);
            return null;
        } finally {
            // 清除定时渲染
            if (streamRenderInterval) {
                clearInterval(streamRenderInterval);
            }
            // 移除加载动画
            document.getElementById('regenerate-btn').classList.remove('loading');
        }
    }

    /**
     * 渲染图表
     */
    async function renderDiagram() {
        // 清除之前的延时器
        if (renderTimeout) {
            clearTimeout(renderTimeout);
        }

        // 设置新的延时器
        renderTimeout = setTimeout(async () => {
            const code = editor.getValue();
            const previewContainer = document.getElementById('preview-container');

            try {
                if (settings.enableNLDrawing && settings.openrouterKey) {
                    // 如果启用了自然语言绘图，只渲染已生成的代码或原始代码
                    if (lastGeneratedCode) {
                        DiagramRenderers.render(lastGeneratedCode, currentDiagramType, previewContainer);
                    } else {
                        DiagramRenderers.render(code, currentDiagramType, previewContainer);
                    }
                } else {
                    // 使用普通渲染
                    DiagramRenderers.render(code, currentDiagramType, previewContainer);
                }
            } catch (error) {
                console.error('渲染错误:', error);
                DiagramRenderers.showError(`渲染失败: ${error.message}`, previewContainer);
            }
        }, 500); // 500ms的防抖延迟
    }

    // 在图表类型或模板改变时重置lastGeneratedCode
    document.getElementById('diagram-select').addEventListener('change', function() {
        lastGeneratedCode = null;
    });

    document.getElementById('template-select').addEventListener('change', function() {
        lastGeneratedCode = null;
    });

    // 在禁用自然语言绘图时重置lastGeneratedCode
    document.getElementById('enable-nl-drawing').addEventListener('change', function() {
        if (!this.checked) {
            lastGeneratedCode = null;
        }
    });
}); 