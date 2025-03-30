# 使用官方 Python 3.12 基础镜像
FROM python:3.12

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器
COPY . /app

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 运行 Flask 应用（程序中的端口 3002）
CMD ["python", "app.py"]