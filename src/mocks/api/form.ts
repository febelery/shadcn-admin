import { http, HttpResponse } from "msw";
import { buildMockApiUrl } from "@/lib/utils";

export default [
  http.get(buildMockApiUrl("/form/:formId"), async ({ params }) => {
    const { formId } = params;

    return HttpResponse.json({
      id: formId,
      title: "测试系统征集表单，满意度调查问卷",
      desc: "测试系统征集表单，满意度调查问卷",
      page_config: {
        header_image: "https://wximg.chuanbaoguancha.cn/mkt/test-03cfd.png",
      },
      fields: [
        {
          key: "dqchsi",
          type: "radio",
          index: 1,
          title: "您的身份是",
          logics: [
            {
              action: "show",
              option: "家长",
              condition: "equal",
              affectedIndexs: [9, 11],
            },
            {
              action: "skip",
              option: "学生",
              condition: "equal",
              affectedIndexs: [3],
            },
          ],
          content: {
            other: {
              show: true,
              text: "自定义",
            },
            options: ["学生", "家长"],
          },
          required: true,
          placeholder:
            "请务必相信我们，不要在其他地\n请务必相信我们，不要在其他地",
        },
        {
          key: "kzeh21",
          type: "input",
          index: 2,
          title: "天空飞来一群云",
          content: {},
          required: true,
          placeholder: "请输入",
        },
        {
          key: "vkrdit",
          type: "checkbox",
          index: 3,
          title: "您（或您的孩子）所选择课程是您（或您的孩子）",
          logics: [
            {
              action: "skip",
              option: "数学",
              condition: "equal",
              affectedIndexs: [5, 4],
            },
            {
              action: "show",
              option: ["语文", "英语"],
              condition: "notContains",
              affectedIndexs: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
            },
          ],
          content: {
            max: 4,
            min: 2,
            other: {
              show: true,
              text: "请输入其他课程",
            },
            options: [
              "数学",
              "语文课",
              "英语",
              "高数",
              "一起学科学",
              "历史",
              "化学",
              "到专业黑客网站听取它人建议",
              "体育",
              "阶梯",
              "offcoursethisismystyle",
            ],
          },
          required: true,
          placeholder: "最多选择3项",
        },
        {
          key: "cwudan",
          type: "checkbox",
          index: 4,
          title: "请问您平时通过川观新闻的哪些平台了解新闻？",
          content: {
            min: 3,
            other: {
              show: false,
              text: "其他",
            },
            options: [
              "新闻客户端",
              "网站",
              "抖音",
              "微博",
              "微信公众号",
              "朋友圈",
              "视频号",
              "B站",
              "快手",
              "知乎",
              "小红书",
              "报纸及数字版",
              "电视",
              "广播",
            ],
          },
          required: true,
        },
        {
          key: "apkpd3",
          type: "date-time",
          index: 5,
          title: "非常时刻用飞航",
          content: {
            valueType: "time",
          },
          required: true,
          placeholder: "请选择日期",
        },
        {
          key: "vktswb",
          type: "select",
          index: 6,
          title: "授课老师为，我们有很多的老师，要认真看哦，不要随便乱选",
          content: {
            other: {
              show: true,
              text: "请输入其他课程",
            },
            options: [
              "Lily老师",
              "Andy老师",
              "Tina老师",
              "Tom老师",
              "NANA老师",
              "ROSS老师",
            ],
          },
          required: false,
          placeholder: "请选择",
        },
        {
          key: "xnn1hg",
          type: "matrix",
          index: 7,
          title: "您对页面的满意度",
          content: {
            rows: [
              "视频可看性",
              "页面设计",
              "动画流畅",
              "重大突发新闻（地震、洪涝等）",
              "人事和反腐类",
              "政策解读类",
              "生活科普类",
              "文娱体育类",
              "教育健康类",
              "旅游时尚类",
              "汽车房产类",
              "农业乡村类",
              "思想评论类",
              "科技类",
              "人物故事类",
            ],
            type: "checkbox",
            columns: ["不满意", "满意", "基本满意", "非常满意", "满意极了"],
          },
          required: true,
        },
        {
          key: "dohqti",
          type: "input",
          index: 8,
          title: "请输入您孩子的身份证号码",
          content: {
            min: 15,
            regex:
              "{rule:'/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/','text':'数字'}",
            valueType: "idcard",
          },
          required: true,
          placeholder: "请输入身份证号码",
        },
        {
          key: "pmsokj",
          type: "textarea",
          index: 9,
          title: "您认为您孩子适合哪些课外教育",
          content: {
            max: 500,
            min: 10,
          },
          required: true,
          placeholder: "请输入课外教育",
        },
        {
          key: "wvysbw",
          type: "date-time",
          index: 10,
          title: "孩子想吃饭时间",
          content: {
            max: "2025-03-30 08:03:59",
            valueType: "date",
          },
          required: true,
          placeholder: "无格式要求",
        },
        {
          key: "dp534g",
          type: "rate",
          index: 11,
          title: "您对孩子的老师如何评价？",
          content: {
            max: 5,
          },
          required: true,
        },
        {
          key: "tpmvau",
          type: "divider",
          title: "分割线",
          content: {},
          required: false,
        },
        {
          key: "mijmtn",
          type: "text",
          title:
            "下面是孩子的个人信息，我们将保证您的信息得到妥善处理，不会有泄露风险",
          content: {},
          required: false,
        },
        {
          key: "rggups",
          type: "upload",
          index: 12,
          title: "请输入您孩子的全身照",
          content: {
            max: 5,
            min: 2,
            regex: "image",
            valueType: "image",
          },
          required: true,
        },
        {
          key: "lwlqpw",
          type: "upload",
          index: 13,
          title: "请输入您孩子日常亲子视频",
          content: {
            min: 1,
            regex: "video",
            valueType: "video",
          },
          required: true,
        },
        {
          key: "msjhlq",
          type: "upload",
          index: 14,
          regex: "doc",
          title: "请上传孩子的简历",
          content: {
            max: 1,
            valueType: "doc",
          },
          required: true,
        },
        {
          key: "tlwklm",
          type: "divider",
          title: "分割线",
          content: {},
          required: false,
        },
        {
          key: "fispyo",
          type: "address",
          index: 15,
          title: "您的常住地",
          content: {
            other: {
              show: true,
              text: "请数据您具体的门牌号",
            },
          },
          required: true,
        },
        {
          key: "rzd328",
          type: "address",
          index: 16,
          title:
            "您孩子的出生地，如果您孩子有多地读书记录，请务必告诉我们，我们好录入档案",
          content: {
            other: {
              show: false,
              text: "请输入详细地址",
            },
          },
          required: true,
          placeholder: "对咯，不要相信陌生人",
        },
        {
          key: "oyasft",
          type: "signature",
          index: 17,
          title: "请手写您的签名",
          content: {},
          required: true,
        },
        {
          key: "zotjhu",
          type: "rate",
          index: 18,
          title: "您对我们的评价",
          content: {
            max: 8,
          },
          required: true,
        },
      ],
      single_limit: 10,
      daily_limit: 10,
      total_limit: 100,
      status: true,
      start_at: "2024-03-08 11:05:03",
      end_at: "2024-10-04 11:05:03",
      created_at: "2024-03-08 11:05:08",
      updated_at: "2024-09-25 18:30:19",
    });
  }),

  http.post(
    buildMockApiUrl("/form/:formId/statistics"),
    async ({ params, request }) => {
      const { formId } = params;

      const url = new URL(request.url);
      const searchParams = new URLSearchParams(url.search);

      const key = searchParams.get("key");
      const type = searchParams.get("type");
      const page = Number(searchParams.get("page")) || 1;
      const pageSize = Number(searchParams.get("page_size")) || 20;

      // 根据字段类型生成对应的模拟数据
      const generateMockData = () => {
        let total = 0;
        let data;

        switch (type) {
          case "radio":
          case "select": {
            data = Array.from({ length: 5 }, (_, i) => ({
              name: `选项${i + 1} ${Math.floor(Math.random() * 100)}`,
              value: Math.floor(Math.random() * 100),
            }));
            total = data.length;
            return { data, total };
          }

          case "checkbox": {
            data = Array.from({ length: 8 }, (_, i) => ({
              name: `多选项${i + 1} ${Math.floor(Math.random() * 100)}`,
              value: Math.floor(Math.random() * 80),
            }));
            total = data.length;
            return { data, total };
          }

          case "rate": {
            data = Array.from({ length: 5 }, (_, i) => ({
              name: `${i + 1}星`,
              value: Math.floor(Math.random() * 50),
            }));
            total = data.length;
            return { data, total };
          }

          case "upload": {
            data = [
              [
                "https://wximg.chuanbaoguancha.cn/mkt/image773541238753405-00ece9c3-pN.png",
                "https://wximg.chuanbaoguancha.cn/mkt/lv739481245429701352920250210120607-9b7b5aab-jO.mp4",
                "https://wximg.chuanbaoguancha.cn/mkt/image773541238753405-00ece9c3-pN.png",
                "https://wximg.chuanbaoguancha.cn/mkt/lv739481245429701352920250210120607-9b7b5aab-jO.mp4",
                "https://wximg.chuanbaoguancha.cn/mkt/image773541238753405-00ece9c3-pN.png",
                "https://wximg.chuanbaoguancha.cn/mkt/lv739481245429701352920250210120607-9b7b5aab-jO.mp4",
              ],
              [
                "https://wximg.chuanbaoguancha.cn/mkt/image773541238753405-00ece9c3-pN.png",
              ],
            ];
            const total = data.length;
            return { data, total };
          }

          case "matrix": {
            // 模拟矩阵题的数据结构
            // 行标题为问题1-3,列标题为选项1-3,每个单元格随机生成1-5的评分
            data = Array.from({ length: 3 }, (_, rowIndex) => {
              return {
                question: `问题${rowIndex + 1}`,
                ratings: Array.from({ length: 3 }, (_, colIndex) => ({
                  option: `选项${colIndex + 1}`,
                  value: Math.floor(Math.random() * 5) + 1,
                })),
              };
            });
            total = data.length;

            return { data, total };
          }

          default: {
            total = 18;
            const startIndex = (page - 1) * pageSize;
            data = Array.from(
              { length: Math.min(pageSize, total - startIndex) },
              (_, i) =>
                `示例内容 ${startIndex + i + 1} ${new Date().toLocaleString()}`
            );
            return { data, total };
          }
        }
      };

      const { data, total } = generateMockData();

      return HttpResponse.json({
        data,
        meta: {
          page,
          page_size: pageSize,
          total,
          page_total: Math.ceil(total / pageSize),
        },
      });
    }
  ),
];
