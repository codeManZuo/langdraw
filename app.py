from flask import Flask, send_from_directory, request, jsonify
from openai import OpenAI
import os
import traceback
import json
import re

app = Flask(__name__)

@app.route('/')
def index():
    """提供主页HTML"""
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """提供所有静态文件"""
    return send_from_directory('static', path)

@app.route('/api/nl-draw', methods=['POST'])
def natural_language_draw():
    """处理自然语言绘图请求"""
    try:
        data = request.json
        api_key = data.get('api_key')
        user_context = data.get('user_context')
        draw_tool_name = data.get('draw_tool_name')
        draw_type = data.get('draw_type')

        # 打印请求参数（不包含API key）
        print(f"收到绘图请求: tool={draw_tool_name}, type={draw_type}")

        if not all([api_key, user_context, draw_tool_name, draw_type]):
            missing_params = [param for param, value in {
                'api_key': api_key,
                'user_context': user_context,
                'draw_tool_name': draw_tool_name,
                'draw_type': draw_type
            }.items() if not value]
            return jsonify({'error': f'缺少必要参数: {", ".join(missing_params)}'}), 400

        # 构建提示词
        prompt = f"{user_context}。请你基于以上信息,给我{draw_tool_name}的{draw_type}图的文本格式,一定记住你只能输出这个图的文本,其他任何文本信息都不要输出给我"

        print(f"发送到OpenRouter的提示词: {prompt}")

        try:
            # 调用OpenRouter API
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key
            )

            completion = client.chat.completions.create(
                model="deepseek/deepseek-chat-v3-0324:free",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            if not completion or not completion.choices:
                raise ValueError("OpenRouter API 返回结果为空")

            # 获取生成的图表代码
            generated_code = completion.choices[0].message.content
            print(f"成功生成图表代码，长度: {len(generated_code)}")

            # 处理代码块标记
            # 1. 移除开头和结尾的 ```
            generated_code = generated_code.strip()
            if generated_code.startswith('```') and generated_code.endswith('```'):
                # 移除开头的 ``` 和可能的语言标识
                generated_code = re.sub(r'^```[\w-]*\n', '', generated_code)
                # 移除结尾的 ```
                generated_code = re.sub(r'\n```$', '', generated_code)
            
            # 2. 如果只有单行代码，直接移除 ``` 标记
            generated_code = generated_code.strip('`')

            print(f"处理后的代码，长度: {len(generated_code)}")
            return jsonify({'code': generated_code})

        except Exception as api_error:
            print(f"OpenRouter API 调用错误: {str(api_error)}")
            print(f"详细错误信息: {traceback.format_exc()}")
            return jsonify({'error': f'OpenRouter API 调用失败: {str(api_error)}'}), 500

    except Exception as e:
        print(f"处理请求时发生错误: {str(e)}")
        print(f"详细错误信息: {traceback.format_exc()}")
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5200) 