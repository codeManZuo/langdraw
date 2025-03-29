from flask import Flask, send_from_directory, request, jsonify, Response, stream_with_context
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
    """处理自然语言绘图请求（流式响应）"""
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

        def generate():
            try:
                # 调用OpenRouter API
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=api_key
                )

                # 使用流式响应
                completion = client.chat.completions.create(
                    model="deepseek/deepseek-chat-v3-0324:free",
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    stream=True  # 启用流式响应
                )

                # 用于累积完整的响应
                full_response = ""
                
                # 处理流式响应
                for chunk in completion:
                    if chunk.choices and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        
                        # 打印流式数据
                        # print(f"流式数据片段: {content}")
                        # print(f"当前累积响应: {full_response}")
                        
                        # 发送当前累积的响应
                        yield json.dumps({
                            'code': full_response,
                            'done': False
                        }) + '\n'

                # 处理最终的完整响应
                final_response = full_response.strip()
                # print(f"\n完整响应处理前: {final_response}")
                
                # 处理代码块标记
                if final_response.startswith('```') and final_response.endswith('```'):
                    # 移除开头的 ``` 和可能的语言标识
                    final_response = re.sub(r'^```[\w-]*\n', '', final_response)
                    # 移除结尾的 ```
                    final_response = re.sub(r'\n```$', '', final_response)
                
                # 如果只有单行代码，直接移除 ``` 标记
                final_response = final_response.strip('`')
                
                print(f"完整响应处理后: {final_response}\n")

                # 发送完整的最终响应
                yield json.dumps({
                    'code': final_response,
                    'done': True
                })

            except Exception as api_error:
                print(f"OpenRouter API 调用错误: {str(api_error)}")
                print(f"详细错误信息: {traceback.format_exc()}")
                yield json.dumps({
                    'error': f'OpenRouter API 调用失败: {str(api_error)}',
                    'done': True
                })

        return Response(stream_with_context(generate()), mimetype='text/event-stream')

    except Exception as e:
        print(f"处理请求时发生错误: {str(e)}")
        print(f"详细错误信息: {traceback.format_exc()}")
        return jsonify({'error': f'服务器错误: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5200) 