/**
 * 图表渲染工具配置
 */
const config = {
    // 默认渲染服务URL
    krokiBaseUrl: 'https://kroki.io',
    
    // 本地渲染支持配置
    localRenderSupport: {
        mermaid: true,
        plantuml: false,
        seqdiag: false,
        bpmn: false,
        excalidraw: false,
        bytefield: false,
        nomnoml: false,
        actdiag: false,
        erd: false,
        ditaa: false
    },
    
    // 编辑器配置
    editor: {
        switchIcon: 'fas fa-exchange-alt',
        saveIcon: 'fas fa-save',
        readOnlyMessage: {
            title: '编辑器已锁定',
            content: '当前处于自然语言绘图模式，绘图文本编辑器为只读状态。是否需要关闭自然语言绘图？',
            confirmText: '确认关闭',
            cancelText: '知道了'
        }
    },
    
    // 图表类型配置
    diagramTypes: {
        mermaid: {
            name: 'Mermaid',
            krokiType: 'mermaid',
            mimeType: 'text/plain',
            editorMode: 'mermaid',
            useEncoder: false,
            fileExtension: '.mmd',
            description: '使用简单文本语法创建图表的工具'
        },
        plantuml: {
            name: 'PlantUML',
            krokiType: 'plantuml',
            mimeType: 'text/plain',
            editorMode: 'plantuml',
            useEncoder: true,
            fileExtension: '.puml',
            description: '使用纯文本语言创建UML图的工具'
        },
        seqdiag: {
            name: 'SeqDiag',
            krokiType: 'seqdiag',
            mimeType: 'text/plain',
            editorMode: 'python',
            useEncoder: false,
            fileExtension: '.diag',
            description: '简单的序列图生成器'
        },
        bpmn: {
            name: 'BPMN',
            krokiType: 'bpmn',
            mimeType: 'application/xml',
            editorMode: 'xml',
            useEncoder: false,
            fileExtension: '.bpmn',
            description: '业务流程模型和标记'
        },
        excalidraw: {
            name: 'Excalidraw',
            krokiType: 'excalidraw',
            mimeType: 'application/json',
            editorMode: 'javascript',
            useEncoder: false,
            fileExtension: '.excalidraw',
            description: '手绘风格的图表工具'
        },
        bytefield: {
            name: 'Bytefield',
            krokiType: 'bytefield',
            mimeType: 'text/plain',
            editorMode: 'scheme',
            useEncoder: false,
            fileExtension: '.bytefield',
            description: '网络协议或数据格式的字节布局'
        },
        nomnoml: {
            name: 'Nomnoml',
            krokiType: 'nomnoml',
            mimeType: 'text/plain',
            editorMode: 'javascript',
            useEncoder: false,
            fileExtension: '.nomnoml',
            description: '简洁的UML图形工具'
        },
        actdiag: {
            name: 'ActDiag',
            krokiType: 'actdiag',
            mimeType: 'text/plain',
            editorMode: 'python',
            useEncoder: false,
            fileExtension: '.diag',
            description: '活动图生成器'
        },
        erd: {
            name: 'Erd',
            krokiType: 'erd',
            mimeType: 'text/plain',
            editorMode: 'javascript',
            useEncoder: false,
            fileExtension: '.erd',
            description: '实体关系图生成器'
        },
        ditaa: {
            name: 'Ditaa',
            krokiType: 'ditaa',
            mimeType: 'text/plain',
            editorMode: 'javascript',
            useEncoder: false,
            fileExtension: '.ditaa',
            description: '将ASCII艺术转换为图表'
        }
    }
}; 