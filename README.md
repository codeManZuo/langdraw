# 在线绘图工具

一个支持使用自然语言绘图的Web应用，用于创建流程图、时序图、甘特图、架构图、类图、实体图等等，支持PlantUML和Mermaid等语法。

## 功能特点

- 支持Mermaid和PlantUML两种图表语法
- 实时预览功能
- 内置多种常用图表模板
- 支持OpenRouter的apikey
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

- Python 3.8+
- Flask

### 安装依赖

```bash
flask==2.3.3 
openai==1.69.0
httpx[socks]==0.25.2
```


### 运行应用

```
git clone https://github.com/codeManZuo/langdraw.git
cd langdraw/
docker build -t langdraw .
docker run -d -p 3002:3002 --name langdraw-container langdraw
```

或者直接

```
python ./app.py
```


启动后，在浏览器中访问 http://localhost:3002 即可使用应用。

## 使用方法

1. 启用自然语言绘图需要先在设置中配置apikey
2. apikey可以去OpenRouter官网申请免费的
3. 可以自定义修改系统提示词
4. ctrl/command+s 用于手动保存并渲染