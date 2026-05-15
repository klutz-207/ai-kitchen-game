const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [new TextRun({ text: "AI厨房游戏 - 客户需求设计指令", font: "Arial", size: 18, color: "666666" })],
          alignment: AlignmentType.RIGHT
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [new TextRun({ text: "Page ", font: "Arial", size: 18 }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18 })]
        })]
      })
    },
    children: [
      // 标题
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "客户需求库设计指令", bold: true })],
        alignment: AlignmentType.CENTER
      }),

      // 任务目标
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "任务目标", bold: true })]
      }),
      new Paragraph({
        children: [new TextRun("设计10-15个预设客户，每个客户有独特的情感需求和背景故事。")]
      }),

      // 设计规范
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "设计规范", bold: true })]
      }),

      // 客户类型建议
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "客户类型建议", bold: true })]
      }),
      new Paragraph({
        children: [new TextRun("可以是任何角色，例如：")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("职业类：科学家、艺术家、上班族、学生、老师")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("情感类：失恋的人、庆祝生日的人、思念家乡的人")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun("场景类：疲惫的人、兴奋的人、迷茫的人")]
      }),

      // 每个客户需要包含
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "每个客户需要包含", bold: true })]
      }),

      // 1. 基本信息
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "1. 基本信息", bold: true })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "名称：", bold: true }), new TextRun('简短的称呼（如"天体物理学家"）')]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "形象描述：", bold: true }), new TextRun("像素风格的外观描述（用于后续生成头像）")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "背景：", bold: true }), new TextRun("1-2句话介绍这个人")]
      }),

      // 2. 需求设定
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "2. 需求设定", bold: true })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "情感需求：", bold: true }), new TextRun('客户想要什么（如"想要灵感"、"想要温暖"）')]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "需求背景：", bold: true }), new TextRun('为什么会有这个需求（如"研究遇到难题"）')]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "抽象程度：", bold: true }), new TextRun('不要太具体（如"想吃川菜"），要抽象（如"想要甜的东西"）')]
      }),

      // 3. 引导话术
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "3. 引导话术", bold: true })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "第一层引导：", bold: true }), new TextRun('系统给玩家的提示（如"什么是甜的呢？回忆、爱情也是甜的"）')]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "引导目的：", bold: true }), new TextRun("启发玩家思考，不要太局限")]
      }),

      // 4. 反馈模板
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "4. 反馈模板", bold: true })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "满意反馈：", bold: true }), new TextRun("当菜品符合需求时，客户会说什么")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "一般反馈：", bold: true }), new TextRun("当菜品一般时，客户会说什么")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "不满意反馈：", bold: true }), new TextRun("当菜品不符合需求时，客户会说什么")]
      }),

      // 示例
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "示例", bold: true })]
      }),

      // 示例客户
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: "客户1：天体物理学家", bold: true })]
      }),
      new Paragraph({
        children: [new TextRun({ text: "形象描述：", bold: true }), new TextRun("戴眼镜的中年男性，穿着白大褂，头发有点乱，手里拿着星图")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "背景：", bold: true }), new TextRun("研究黑洞理论遇到瓶颈，已经三个月没有突破")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "情感需求：", bold: true }), new TextRun("想要灵感")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "需求背景：", bold: true }), new TextRun("研究遇到难题，想吃一个能启发灵感的东西")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "第一层引导：", bold: true }), new TextRun("灵感是什么呢？可能是星空、可能是漩涡、也可能是某种神秘的力量")]
      }),
      new Paragraph({
        children: [new TextRun({ text: "反馈模板：", bold: true })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "满意：", bold: true }), new TextRun("这让我想起了年轻时看星空的夜晚...我感觉有什么要突破了")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "一般：", bold: true }), new TextRun("还不错，但我还需要再想想")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "不满意：", bold: true }), new TextRun("这和我的研究没什么关系...")]
      }),

      // 输出格式
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "输出格式", bold: true })]
      }),
      new Paragraph({
        children: [new TextRun("请用以下格式填写每个客户：")]
      }),

      // 格式表格
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }, right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
                width: { size: 9360, type: WidthType.DXA },
                shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "### 客户1：[名称]", bold: true })] }),
                  new Paragraph({ children: [new TextRun("")] }),
                  new Paragraph({ children: [new TextRun({ text: "形象描述：", bold: true })] }),
                  new Paragraph({ children: [new TextRun("[像素风格外观描述]")] }),
                  new Paragraph({ children: [new TextRun("")] }),
                  new Paragraph({ children: [new TextRun({ text: "背景：", bold: true })] }),
                  new Paragraph({ children: [new TextRun("[1-2句话介绍]")] }),
                  new Paragraph({ children: [new TextRun("")] }),
                  new Paragraph({ children: [new TextRun({ text: "情感需求：", bold: true })] }),
                  new Paragraph({ children: [new TextRun("[客户想要什么]")] }),
                  new Paragraph({ children: [new TextRun("")] }),
                  new Paragraph({ children: [new TextRun({ text: "需求背景：", bold: true })] }),
                  new Paragraph({ children: [new TextRun("[为什么想要]")] }),
                  new Paragraph({ children: [new TextRun("")] }),
                  new Paragraph({ children: [new TextRun({ text: "第一层引导：", bold: true })] }),
                  new Paragraph({ children: [new TextRun("[系统给玩家的提示]")] }),
                  new Paragraph({ children: [new TextRun("")] }),
                  new Paragraph({ children: [new TextRun({ text: "反馈模板：", bold: true })] }),
                  new Paragraph({ children: [new TextRun("- 满意：[客户说的话]")] }),
                  new Paragraph({ children: [new TextRun("- 一般：[客户说的话]")] }),
                  new Paragraph({ children: [new TextRun("- 不满意：[客户说的话]")] }),
                ]
              })
            ]
          })
        ]
      }),

      // 时间要求
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "时间要求", bold: true })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "截止时间：", bold: true }), new TextRun("5月3日（明天）晚上")]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "交付方式：", bold: true }), new TextRun("在群内发送文档链接")]
      }),

      // 注意事项
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "注意事项", bold: true })]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun("需求要抽象，不要太具体")]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun("引导话术要开放，不要太局限")]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun("反馈要符合客户性格")]
      }),
      new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        children: [new TextRun("可以发挥创意，不要局限于示例")]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:\\Users\\27679\\Desktop\\File\\竞赛\\AI产品\\客户需求设计指令.docx", buffer);
  console.log("文档已生成：客户需求设计指令.docx");
});
