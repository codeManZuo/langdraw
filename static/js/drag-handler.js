// 拖拽处理类
class DragHandler {
    constructor(container) {
        this.container = container;
        this.isDragging = false;
        this.isSpacePressed = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.lastTranslateX = 0;
        this.lastTranslateY = 0;

        // 绑定事件处理器
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        // 添加事件监听器
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        this.container.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }

    handleKeyDown(e) {
        if (e.code === 'Space' && !this.isSpacePressed) {
            e.preventDefault(); // 阻止页面滚动
            this.isSpacePressed = true;
            this.container.classList.add('draggable');
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space') {
            this.isSpacePressed = false;
            if (!this.isDragging) {
                this.container.classList.remove('draggable');
            }
        }
    }

    handleMouseDown(e) {
        if (!this.isSpacePressed) return;

        this.isDragging = true;
        this.container.classList.add('dragging');
        
        // 记录起始位置
        this.startX = e.clientX - this.lastTranslateX;
        this.startY = e.clientY - this.lastTranslateY;

        // 获取预览区域中的图表容器
        const diagramContainer = this.container.querySelector('.diagram-container, .mermaid-wrapper');
        if (diagramContainer) {
            // 确保图表容器有定位属性
            if (getComputedStyle(diagramContainer).position === 'static') {
                diagramContainer.style.position = 'relative';
            }
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        
        // 计算新的位置
        this.translateX = e.clientX - this.startX;
        this.translateY = e.clientY - this.startY;

        // 获取预览区域中的图表容器
        const diagramContainer = this.container.querySelector('.diagram-container, .mermaid-wrapper');
        if (diagramContainer) {
            // 应用变换
            diagramContainer.style.transform = `translate(${this.translateX}px, ${this.translateY}px)`;
        }
    }

    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.container.classList.remove('dragging');
            
            // 保存最后的位置
            this.lastTranslateX = this.translateX;
            this.lastTranslateY = this.translateY;
        }
        
        if (!this.isSpacePressed) {
            this.container.classList.remove('draggable');
        }
    }

    // 清理方法
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.container.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
}

// 导出DragHandler类
window.DragHandler = DragHandler; 