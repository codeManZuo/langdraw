from flask import Flask, send_from_directory

app = Flask(__name__)

@app.route('/')
def index():
    """提供主页HTML"""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """提供所有静态文件"""
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5200) 