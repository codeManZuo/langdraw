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
    autonumber
    participant A as Alice<br/>用户
    actor B as Bob
    participant C
    
    %% 添加参与者链接
    link A: 主页 @ https://example.com/alice
    
    %% 激活与消息交互
    A->>+B: 你好，Bob，最近如何？
    activate C
    Note over B: 思考中...
    
    %% 循环结构
    loop 每分钟
        B-->>A: 我很好！
    end
    
    %% 并行消息
    par Alice到Bob
        A->>B: 有个问题想问你
    and Alice到Charlie
        A-)C: 嗨Charlie!
    end
    
    %% 条件分支
    alt 有空
        B->>+A: 有什么事?
        A->>-B: 需要你帮忙
    else 没空
        B--xA: 抱歉，我很忙
    end
    
    %% 选项结构
    opt 可选回应
        C-->>A: 我也在这里!
    end
    
    %% 临界区
    critical 数据库连接
        B->>+C: 请获取数据
        C-->>-B: 返回数据
    option 连接失败
        C-->>B: 返回错误
    end
    
    %% 中断
    break 发生异常
        C->>A: 服务中断
    end
    
    %% 背景高亮
    rect rgb(191, 223, 255)
        B->>C: 后台处理
        C-->>B: 完成
    end
    
    

    
    deactivate C
    B-->>-A: 任务已完成！`,
        
        'ER图': `erDiagram
    CAR ||--o{ NAMED-DRIVER : allows
    CAR {
        string registrationNumber PK
        string make
        string model
        string[] parts
    }
    PERSON ||--o{ NAMED-DRIVER : is
    PERSON {
        string driversLicense PK "The license #"
        string(99) firstName "Only 99 characters are allowed"
        string lastName
        string phone UK
        int age
    }
    NAMED-DRIVER {
        string carRegistrationNumber PK, FK
        string driverLicence PK, FK
    }
    MANUFACTURER only one to zero or more CAR : makes
`,
        
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
        
        '饼图': `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
`,

    '象限图': `quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]
`,

    '需求图': `    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req
`,

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
    部署          :a5, after a4, 3d`,

    'Gitgraph': `---
title: Example Git diagram
---
gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   checkout main
   merge develop
   commit
   commit
`
    ,

    'C4图': `    C4Context
      title System Context diagram for Internet Banking System
      Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
        Person(customerB, "Banking Customer B")
        Person_Ext(customerC, "Banking Customer C", "desc")

        Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")

        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

        Enterprise_Boundary(b1, "BankBoundary") {

          SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")

          System_Boundary(b2, "BankBoundary2") {
            System(SystemA, "Banking System A")
            System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")
          }

          System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
          SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")

          Boundary(b3, "BankBoundary3", "boundary") {
            SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")
            SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
          }
        }
      }

      BiRel(customerA, SystemAA, "Uses")
      BiRel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
      Rel(SystemC, customerA, "Sends e-mails to")

      UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
      UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue", $offsetX="5")
      UpdateRelStyle(SystemAA, SystemE, $textColor="blue", $lineColor="blue", $offsetY="-10")
      UpdateRelStyle(SystemAA, SystemC, $textColor="blue", $lineColor="blue", $offsetY="-40", $offsetX="-50")
      UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")

      UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")


`
    ,

    '思维导图': `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid

`
    ,

    '时间线图': `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter
`,

'桑基图': `---
config:
  sankey:
    showValues: false
---
sankey-beta

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144
Biofuel imports,Liquid,35
Biomass imports,Solid,35
Coal imports,Coal,11.606
Coal reserves,Coal,63.965
Coal,Solid,75.571
District heating,Industry,10.639
District heating,Heating and cooling - commercial,22.505
District heating,Heating and cooling - homes,46.184
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
Electricity grid,Industry,342.165
Electricity grid,Road transport,37.797
Electricity grid,Agriculture,4.412
Electricity grid,Heating and cooling - commercial,40.858
Electricity grid,Losses,56.691
Electricity grid,Rail transport,7.863
Electricity grid,Lighting & appliances - commercial,90.008
Electricity grid,Lighting & appliances - homes,93.494
Gas imports,Ngas,40.719
Gas reserves,Ngas,82.233
Gas,Heating and cooling - commercial,0.129
Gas,Losses,1.401
Gas,Thermal generation,151.891
Gas,Agriculture,2.096
Gas,Industry,48.58
Geothermal,Electricity grid,7.013
H2 conversion,H2,20.897
H2 conversion,Losses,6.242
H2,Road transport,20.897
Hydro,Electricity grid,6.995
Liquid,Industry,121.066
Liquid,International shipping,128.69
Liquid,Road transport,135.835
Liquid,Domestic aviation,14.458
Liquid,International aviation,206.267
Liquid,Agriculture,3.64
Liquid,National navigation,33.218
Liquid,Rail transport,4.413
Marine algae,Bio-conversion,4.375
Ngas,Gas,122.952
Nuclear,Thermal generation,839.978
Oil imports,Oil,504.287
Oil reserves,Oil,107.703
Oil,Liquid,611.99
Other waste,Solid,56.587
Other waste,Bio-conversion,77.81
Pumped heat,Heating and cooling - homes,193.026
Pumped heat,Heating and cooling - commercial,70.672
Solar PV,Electricity grid,59.901
Solar Thermal,Heating and cooling - homes,19.263
Solar,Solar Thermal,19.263
Solar,Solar PV,59.901
Solid,Agriculture,0.882
Solid,Thermal generation,400.12
Solid,Industry,46.477
Thermal generation,Electricity grid,525.531
Thermal generation,Losses,787.129
Thermal generation,District heating,79.329
Tidal,Electricity grid,9.452
UK land based bioenergy,Bio-conversion,182.01
Wave,Electricity grid,19.013
Wind,Electricity grid,289.366
`,

'XY图': `xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
`,

'框图': `block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px
`,

'数据包图': `---
title: "TCP Packet"
---
packet-beta
0-15: "Source Port"
16-31: "Destination Port"
32-63: "Sequence Number"
64-95: "Acknowledgment Number"
96-99: "Data Offset"
100-105: "Reserved"
106: "URG"
107: "ACK"
108: "PSH"
109: "RST"
110: "SYN"
111: "FIN"
112-127: "Window"
128-143: "Checksum"
144-159: "Urgent Pointer"
160-191: "(Options and Padding)"
192-255: "Data (variable length)"
`,

'看板图': `---
config:
  kanban:
    ticketBaseUrl: 'https://mermaidchart.atlassian.net/browse/#TICKET#'
---
kanban
  Todo
    [Create Documentation]
    docs[Create Blog about the new diagram]
  [In progress]
    id6[Create renderer so that it works in all cases. We also add som extra text here for testing purposes. And some more just for the extra flare.]
  id9[Ready for deploy]
    id8[Design grammar]@{ assigned: 'knsv' }
  id10[Ready for test]
    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id11[Done]
    id5[define getData]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }

  id12[Can't reproduce]
    id3[Weird flickering in Firefox]
`,

'架构图': `architecture-beta
    service left_disk(disk)[Disk]
    service top_disk(disk)[Disk]
    service bottom_disk(disk)[Disk]
    service top_gateway(internet)[Gateway]
    service bottom_gateway(internet)[Gateway]
    junction junctionCenter
    junction junctionRight

    left_disk:R -- L:junctionCenter
    top_disk:B -- T:junctionCenter
    bottom_disk:T -- B:junctionCenter
    junctionCenter:R -- L:junctionRight
    top_gateway:B -- T:junctionRight
    bottom_gateway:T -- B:junctionRight
`,

'雷达图': `---
title: "Grades"
---
radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve a["Alice"]{85, 90, 80, 70, 75, 90}
  curve b["Bob"]{70, 75, 85, 80, 90, 85}

  max 100
  min 0

`
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

'状态图': `@startuml
[*] --> Active

state Active {
  [*] -> NumLockOff
  NumLockOff --> NumLockOn : EvNumLockPressed
  NumLockOn --> NumLockOff : EvNumLockPressed
  --
  [*] -> CapsLockOff
  CapsLockOff --> CapsLockOn : EvCapsLockPressed
  CapsLockOn --> CapsLockOff : EvCapsLockPressed
  --
  [*] -> ScrollLockOff
  ScrollLockOff --> ScrollLockOn : EvCapsLockPressed
  ScrollLockOn --> ScrollLockOff : EvCapsLockPressed
}

@enduml
`,

'定时图': `@startuml
robust "Web 浏览器" as WB
concise "Web 用户" as WU

@0
WU is 空闲
WB is 空闲

@100
WU is 等待中
WB is 处理中

@300
WB is 等待中
@enduml
`,

'甘特图': `@startgantt
[Prototype design] requires 15 days
[Test prototype] requires 10 days
-- All example --
[Task 1 (1 day)] requires 1 day
[T2 (5 days)] requires 5 days
[T3 (1 week)] requires 1 week
[T4 (1 week and 4 days)] requires 1 week and 4 days
[T5 (2 weeks)] requires 2 weeks
@endgantt
`,

        
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
        '协议格式': `(defattrs :bg-green {:fill "#a0ffa0"})
(defattrs :bg-yellow {:fill "#ffffa0"})
(defattrs :bg-pink {:fill "#ffb0a0"})
(defattrs :bg-cyan {:fill "#a0fafa"})
(defattrs :bg-purple {:fill "#e4b5f7"})

(defn draw-group-label-header
  [span label]
  (draw-box (text label [:math {:font-size 12}]) {:span span :borders #{} :height 14}))

(defn draw-remotedb-header
  [kind args]
  (draw-column-headers)
  (draw-group-label-header 5 "start")
  (draw-group-label-header 5 "TxID")
  (draw-group-label-header 3 "type")
  (draw-group-label-header 2 "args")
  (draw-group-label-header 1 "tags")
  (next-row 18)

  (draw-box 0x11 :bg-green)
  (draw-box 0x872349ae [{:span 4} :bg-green])
  (draw-box 0x11 :bg-yellow)
  (draw-box (text "TxID" :math) [{:span 4} :bg-yellow])
  (draw-box 0x10 :bg-pink)
  (draw-box (hex-text kind 4 :bold) [{:span 2} :bg-pink])
  (draw-box 0x0f :bg-cyan)
  (draw-box (hex-text args 2 :bold) :bg-cyan)
  (draw-box 0x14 :bg-purple)

  (draw-box (text "0000000c" :hex [[:plain {:font-weight "light" :font-size 16}] " (12)"]) [{:span 4} :bg-purple])
  (draw-box (hex-text 6 2 :bold) [:box-first :bg-purple])
  (doseq [val [6 6 3 6 6 6 6 3]]
    (draw-box (hex-text val 2 :bold) [:box-related :bg-purple]))
  (doseq [val [0 0]]
    (draw-box val [:box-related :bg-purple]))
  (draw-box 0 [:box-last :bg-purple]))

(draw-remotedb-header 0x4702 9)

(draw-box 0x11)
(draw-box 0x2104 {:span 4})
(draw-box 0x11)
(draw-box 0 {:span 4})
(draw-box 0x11)
(draw-box (text "length" [:math] [:sub 1]) {:span 4})
(draw-box 0x14)

(draw-box (text "length" [:math] [:sub 1]) {:span 4})
(draw-gap "Cue and loop point bytes")

(draw-box nil :box-below)
(draw-box 0x11)
(draw-box 0x36 {:span 4})
(draw-box 0x11)
(draw-box (text "num" [:math] [:sub "hot"]) {:span 4})
(draw-box 0x11)
(draw-box (text "num" [:math] [:sub "cue"]) {:span 4})

(draw-box 0x11)
(draw-box (text "length" [:math] [:sub 2]) {:span 4})
(draw-box 0x14)
(draw-box (text "length" [:math] [:sub 2]) {:span 4})
(draw-gap "Unknown bytes" {:min-label-columns 6})
(draw-bottom)
`
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
        '实体关系图': `[Person]
*name
height
weight
+birth_location_id

[Location]
*id
city
state
country

Person *--1 Location`
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