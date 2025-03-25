# 在线绘图工具

一个简单的Web应用，用于创建和编辑图表，支持PlantUML和Mermaid语法。

## 功能特点

- 支持Mermaid和PlantUML两种图表语法
- 实时预览功能
- 内置多种常用图表模板
- 响应式设计，适配不同尺寸的屏幕
- 轻量级，无需复杂的框架

## 技术栈

- 前端：原生HTML、CSS和JavaScript
- 代码编辑器：CodeMirror
- 图表渲染：
  - Mermaid.js (Mermaid图表)
  - PlantUML Web服务 (PlantUML图表)
- 后端：Flask (Python)

## 安装与运行

### 环境要求

- Python 3.6+
- Flask

### 安装依赖

```bash
pip install flask
```

### 运行应用

```bash
python app.py
```

启动后，在浏览器中访问 http://localhost:5000 即可使用应用。

## 使用方法

1. 在顶部工具栏选择图表类型（Mermaid或PlantUML）
2. 从模板下拉菜单中选择一个预设模板，或直接在编辑器中编写代码
3. 编辑器中的内容会实时渲染在左侧预览区域

## 扩展与定制

- 添加新模板：在`static/js/templates.js`文件中添加新的模板定义
- 修改样式：编辑`static/css/style.css`文件
- 添加新的图表类型：修改`static/js/main.js`文件，实现相应的渲染函数 