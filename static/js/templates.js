/**
 * 图表模板定义
 */
const diagramTemplates = {
    // Mermaid 图表模板
    mermaid: {
        '流程图': `graph TD
    A[开始] --> B{判断}
    B -->|条件1| C[处理1]
    B -->|条件2| D[处理2]
    C --> E[结束]
    D --> E`,
        
        '时序图': `sequenceDiagram
    participant 用户
    participant 系统
    participant 数据库
    
    用户->>系统: 发送请求
    系统->>数据库: 查询数据
    数据库-->>系统: 返回结果
    系统-->>用户: 显示结果`,
        
        '类图': `classDiagram
    class Animal {
        +String name
        +move()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
        
        '状态图': `stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中: 开始处理
    处理中 --> 已完成: 完成
    处理中 --> 失败: 出错
    失败 --> 待处理: 重试
    已完成 --> [*]`,
        
        '甘特图': `gantt
    title 项目计划
    dateFormat  YYYY-MM-DD
    section 阶段1
    需求分析      :a1, 2023-01-01, 7d
    设计          :a2, after a1, 10d
    section 阶段2
    开发          :a3, after a2, 15d
    测试          :a4, after a3, 7d
    section 阶段3
    部署          :a5, after a4, 3d`
    },
    
    // PlantUML 图表模板
    plantuml: {
        '用例图': `@startuml
left to right direction
actor 用户
actor 管理员
rectangle 系统 {
  用户 -- (登录)
  用户 -- (查看报告)
  用户 -- (导出数据)
  管理员 -- (管理用户)
  管理员 -- (查看统计)
  (登录) <-- (验证)
}
@enduml`,
        
        '时序图': `@startuml
actor 用户
participant "前端界面" as Frontend
participant "后端服务" as Backend
database "数据库" as DB

用户 -> Frontend: 输入数据
Frontend -> Backend: API请求
Backend -> DB: 查询数据
DB --> Backend: 返回结果
Backend --> Frontend: 返回API响应
Frontend --> 用户: 显示结果
@enduml`,
        
        '活动图': `@startuml
start
:初始化;
if (条件判断) then (yes)
  :执行操作A;
else (no)
  :执行操作B;
endif
:最终操作;
stop
@enduml`,
        
        '类图': `@startuml
class User {
  -String username
  -String password
  +login()
  +logout()
}

class Admin {
  +manageUsers()
}

class Customer {
  -String address
  +placeOrder()
}

User <|-- Admin
User <|-- Customer
@enduml`,
        
        '组件图': `@startuml
package "前端应用" {
  [用户界面]
  [数据处理]
}

package "后端服务" {
  [API网关]
  [业务逻辑]
  [数据访问]
}

database "数据库" {
  [用户数据]
  [业务数据]
}

[用户界面] --> [API网关]
[API网关] --> [业务逻辑]
[业务逻辑] --> [数据访问]
[数据访问] --> [业务数据]
@enduml`
    },
    
    // SeqDiag 图表模板
    seqdiag: {
        '基础示例': `seqdiag {
  // 设置宽度和高度
  default_fontsize = 14;
  span_width = 120;
  edge_length = 200;  
  
  "客户端" -> "服务器" [label = "请求"];
  "服务器" -> "数据库" [label = "查询"];
  "数据库" -> "服务器" [label = "结果"];
  "服务器" -> "客户端" [label = "响应"];
}`,
        '分组示例': `seqdiag {
  // 设置宽度和高度
  default_fontsize = 14;
  span_width = 120;
  edge_length = 200;
  
  // 定义组
  group {
    "A"; "B"; "C"; "D";
  }

  "A" -> "B" [label = "请求"];
  "B" -> "C" [label = "转发"];
  "C" -> "D" [label = "处理"];
  "D" -> "C" [label = "返回"];
  "C" -> "B" [label = "返回"];
  "B" -> "A" [label = "响应"];
}`
    },
    
    // BPMN 图表模板
    bpmn: {
        '简单流程': `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_1" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="开始">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Activity_1" name="任务1">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="结束">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_1" targetRef="EndEvent_1" />
  </bpmn:process>
</bpmn:definitions>`
    },
    
    // Excalidraw 图表模板
    excalidraw: {
        '简单绘图': `{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "rectangle1",
      "type": "rectangle",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#4c6ef5",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100
    },
    {
      "id": "ellipse1",
      "type": "ellipse",
      "x": 400,
      "y": 120,
      "width": 120,
      "height": 80,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#fab005",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100
    },
    {
      "id": "arrow1",
      "type": "arrow",
      "x": 300,
      "y": 150,
      "width": 100,
      "height": 0,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "points": [
        [0, 0],
        [100, 0]
      ]
    },
    {
      "id": "text1",
      "type": "text",
      "x": 150,
      "y": 140,
      "width": 100,
      "height": 25,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "text": "开始",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle"
    },
    {
      "id": "text2",
      "type": "text",
      "x": 410,
      "y": 150,
      "width": 100,
      "height": 25,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 1,
      "roughness": 1,
      "opacity": 100,
      "text": "结束",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle"
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  }
}`
    },
    
    // Bytefield 图表模板
    bytefield: {
        '协议格式': `(defattrs :bg-color "#f5f5f5")
(defconst box-width 20)
(def boxes-per-row 8)

(draw-box "版本" {:span 1})
(draw-box "头部长度" {:span 1})
(draw-box "服务类型" {:span 1})
(draw-box "总长度" {:span 2})
(draw-box "标识" {:span 2})
(draw-box "标志" {:span 1})
(next-row)

(draw-box "片偏移" {:span 2})
(draw-box "TTL" {:span 1})
(draw-box "协议" {:span 1})
(draw-box "头部校验和" {:span 2})
(draw-box "源地址" {:span 2})
(next-row)

(draw-box "目标地址" {:span 4})
(draw-box "选项" {:span 2})
(draw-box "数据" {:span 2})
(next-row)`
    },
    
    // Nomnoml 图表模板
    nomnoml: {
        '类图': `[用户|
  - 用户名
  - 密码
  |
  + 登录()
  + 注销()
]

[管理员|
  + 管理用户()
]

[客户|
  - 地址
  |
  + 下单()
]

[用户] <:- [管理员]
[用户] <:- [客户]`,
        '状态图': `[<start>开始] -> [处理中]
[处理中] -> [<choice>成功?]
[<choice>成功?] - 是 -> [完成]
[<choice>成功?] - 否 -> [失败]
[失败] -> [处理中]
[完成] -> [<end>结束]`
    },
    
    // ActDiag 图表模板
    actdiag: {
        '活动图': `actdiag {
  // 设置宽度和高度
  default_fontsize = 14;
  span_width = 120;
  node_width = 200;
  node_height = 100;
  
  "开始" -> "过程1";
  "过程1" -> "过程2";
  
  lane "用户" {
    "开始"; "过程1";
  }
  
  lane "系统" {
    "过程2"; "过程3";
  }
  
  "过程2" -> "过程3";
  "过程3" -> "结束";
}`,
        '并行处理': `actdiag {
  // 设置宽度和高度
  default_fontsize = 14;
  span_width = 120;
  node_width = 200;
  node_height = 100;
  
  "开始" -> "并行操作";
  "并行操作" -> "A", "B";
  "A" -> "C";
  "B" -> "C";
  "C" -> "结束";
}`
    },
    
    // Erd 图表模板
    erd: {
        '实体关系图': `[用户] {
  +用户ID
  用户名
  密码
  邮箱
}

[订单] {
  +订单ID
  日期
  金额
}

[产品] {
  +产品ID
  名称
  价格
  库存
}

用户 1--* 订单
订单 *--* 产品`
    },
    
    // Ditaa 图表模板
    ditaa: {
        '系统架构': `+--------+   +-------+   +-------+
| 客户端 +---+ 服务器 +---+ 数据库 |
|  cGRE  |   |  cBLU |   | cYEL  |
+--------+   +-------+   +-------+
    ^                       ^
    |                       |
    |     +----------+      |
    +-----+ 缓存服务 +------+
          |   cPNK   |
          +----------+
`,
        '流程图': `    +--------+
    | 开始   |
    +--------+
         |
         v
    +--------+
    | 输入   |
    +--------+
         |
         v
    +--------+     错误     +--------+
    | 处理   +------------->| 处理错误|
    +--------+              +--------+
         |                       |
         | 成功                  |
         v                       |
    +--------+                   |
    | 输出   |<------------------+
    +--------+
         |
         v
    +--------+
    | 结束   |
    +--------+
`
    }
}; 