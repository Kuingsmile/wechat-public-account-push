[📌返回首页](../../README.md)

# 配置说明

配置来自三个地方，优先级从高到低：

1. 单项环境变量：`APP_ID`、`APP_SECRET`、`USERS`、`CALLBACK_TEMPLATE_ID`、`CALLBACK_USERS`、`TIAN_API`
2. `USER_INFO` 环境变量：JSON 对象，可以覆盖下文 `config/index.ts` 中的任意配置项
3. `config/index.ts`：功能开关等非敏感配置

在 GitHub Actions 中，环境变量通过仓库的 Secrets 配置；本地运行时可以写在 `.env` 文件中，见首页 [本地开发](../../README.md#本地开发)。

`config/index.ts` 会公开在仓库中，**不要在里面填写任何个人信息**。

## 环境变量

| 名称                   | 必填 | 说明                                                            |
| ---------------------- | ---- | --------------------------------------------------------------- |
| `APP_ID`               | 是   | 测试号的 appID                                                  |
| `APP_SECRET`           | 是   | 测试号的 appsecret                                              |
| `USERS`                | 是   | 接收消息的用户，JSON 数组，见 [USERS 用户配置](#users-用户配置) |
| `CALLBACK_TEMPLATE_ID` | 否   | 【推送完成提醒】的模板ID，不填则不发送回执                      |
| `CALLBACK_USERS`       | 否   | 接收推送完成提醒的用户，JSON 数组                               |
| `TIAN_API`             | 否   | 天行数据的 APIKEY                                               |
| `USER_INFO`            | 否   | JSON 对象，见 [USER_INFO](#user_info)                           |

## USERS 用户配置

`USERS` 是一个 JSON 数组，每一项对应一个接收消息的用户：

```json
[
  {
    "name": "宝贝",
    "id": "扫码关注测试号后得到的微信号",
    "useTemplateId": "模板ID",
    "province": "广东",
    "city": "惠阳",
    "horoscopeDate": "12-27",
    "horoscopeDateType": "今日",
    "festivals": [
      { "type": "*生日", "name": "宝贝", "year": "1996", "date": "09-09", "isShowAge": true },
      { "type": "节日", "name": "结婚纪念日", "year": "2020", "date": "09-03" }
    ],
    "customizedDateList": [
      { "keyword": "love_day", "date": "2018-09-08" },
      { "keyword": "marry_day", "date": "2020-09-03" }
    ],
    "courseSchedule": {
      "benchmark": { "date": "2022-09-23", "isOdd": true },
      "courses": {
        "odd": [
          ["08:00-09:35 高等数学", "09:50-11:25 高等物理"],
          ["08:00-09:35 大学英语"],
          [],
          [],
          [],
          [],
          []
        ],
        "even": [[], [], [], [], [], [], []]
      }
    }
  },
  {
    "name": "自己",
    "id": "扫码关注测试号后得到的微信号",
    "useTemplateId": "模板ID",
    "city": "杭州"
  }
]
```

| 字段                 | 必填 | 说明                                                                           |
| -------------------- | ---- | ------------------------------------------------------------------------------ |
| `name`               | 是   | 名字，对应模板参数 `to_name`                                                   |
| `id`                 | 是   | 扫码关注测试号后，测试号后台用户列表中的微信号                                 |
| `useTemplateId`      | 是   | 发送给该用户的模板ID                                                           |
| `province`           | 否   | 省份，不填时使用 `PROVINCE`，可以不填                                          |
| `city`               | 否   | 城市或县区，不填时使用 `CITY`                                                  |
| `horoscopeDate`      | 否   | 新历生日，格式为 `MM-DD`，仅用于获取星座运势，不填则不获取                     |
| `horoscopeDateType`  | 否   | 星座运势的时段：`今日`、`明日`、`本周`、`本月`、`今年`，默认为 `今日`          |
| `festivals`          | 否   | 生日和节日，填写后不再使用全局的 `FESTIVALS`，格式见 [生日和节日](#生日和节日) |
| `customizedDateList` | 否   | 纪念日，填写后不再使用全局的 `CUSTOMIZED_DATE_LIST`，格式见 [纪念日](#纪念日)  |
| `courseSchedule`     | 否   | 课程表，不填时使用全局的 `COURSE_SCHEDULE`，格式见 [课程表](#课程表)           |

### 生日和节日

```json
{ "type": "*生日", "name": "宝贝", "year": "1996", "date": "09-09", "isShowAge": true }
```

- `type` 只能填写 `生日` 或 `节日`；日期为**农历**时在前面加 `*`，例如 `*生日`
- `name` 为展示的名字，例如 `宝贝`、`相识纪念日`
- `date` 只填月和日，格式为 `MM-DD`
- `isShowAge` 为 `true` 时展示岁数，仅对生日生效

### 纪念日

```json
{ "keyword": "love_day", "date": "2018-09-08" }
```

`keyword` 会作为模板参数，在模板中使用 `{{love_day.DATA}}` 即可得到距离该日期的天数。`keyword` 不要与 [模板参数](../../README.md#模板参数) 中已有的参数重名。

### 课程表

- 不区分单双周时，填写一个数组，依次为周一到周日的课程，例如 `[["08:00-09:35 高等数学"], [], [], [], [], [], []]`
- 区分单双周时，填写一个对象：`benchmark.date` 为一个参考日期，`benchmark.isOdd` 表示该日期所在的周是否为单周，`courses.odd` 和 `courses.even` 分别为单周和双周的课表

## CALLBACK_USERS

接收【推送完成提醒】的用户，一般只填自己：

```json
[{ "name": "自己", "id": "扫码关注测试号后得到的微信号" }]
```

## config/index.ts

以下为 `config/index.ts` 中全部可用的配置项，都可以不填，不填时使用默认值。

```typescript
import type { UserConfig } from '../src/types'

const USER_CONFIG: UserConfig = {
  // 为了避免推送服务器误将脚本列为恶意推送脚本，可设置每分钟脚本最大推送数
  // 超过此数将会休眠 SLEEP_TIME 毫秒后再发送剩余消息，默认为 5
  MAX_PUSH_ONE_MINUTE: 5,
  // 默认为 65000
  SLEEP_TIME: 65000,

  // 功能开关，填 false 关闭对应功能，关闭不使用的功能可以提高运行速度
  SWITCH: {
    // 每日天气
    weather: true,
    // 下一休息日综合提醒
    holidaytts: true,
    // 金山每日一句
    CIBA: true,
    // 每日一言
    oneTalk: true,
    // 土味情话
    earthyLoveWords: true,
    // 朋友圈文案
    momentCopyrighting: true,
    // 毒鸡汤
    poisonChickenSoup: true,
    // 古诗词
    poetry: true,
    // 星座运势
    horoscope: true,
    // 生日和节日
    birthdayMessage: true,
    // 课程表
    courseSchedule: true,
  },

  // 天行数据，key 通过 TIAN_API 环境变量传入
  TIAN_API: {
    // 早安心语
    morningGreeting: true,
    // 晚安心语
    eveningGreeting: true,
    // 天气预报，展示未来 N 天（最多 7 天），填 0 关闭
    weather: 3,
    // 全网热搜，展示 N 条（最多 30 条），填 0 关闭
    networkHot: 3,
    // 全网热搜展示类型：'default' 展示概要信息，'title' 仅展示标题
    networkHotType: 'default',
  },

  // 是否给文字设置随机颜色，微信测试号已不再支持自定义颜色
  IS_SHOW_COLOR: true,

  // 每日一言的内容类型：动画，漫画，游戏，小说，原创，网络，其他；留空则随机
  LITERARY_PREFERENCE: '',

  // 默认的省份和城市，USERS 中没有填写 province / city 时使用
  // PROVINCE 的区域必须包含 CITY，PROVINCE 也可以不填，例如 PROVINCE: '', CITY: '长武'
  PROVINCE: '',
  CITY: '',

  // 接收消息的用户，请通过 USERS 环境变量传入
  USERS: [],

  // 默认的生日和节日，USERS 中没有填写 festivals 时使用
  FESTIVALS: [],

  // 只展示最近的 N 个生日和节日，0 为全部展示
  FESTIVALS_LIMIT: 4,

  // 默认的纪念日，USERS 中没有填写 customizedDateList 时使用
  CUSTOMIZED_DATE_LIST: [],

  // 默认的课程表，USERS 中没有填写 courseSchedule 时使用
  COURSE_SCHEDULE: null,

  // 自定义文本插槽，keyword 会作为模板参数，例如 {{encourage_oneself.DATA}}
  SLOT_LIST: [
    // contents 为字符串时，每次发送这句话
    { keyword: 'encourage_oneself', contents: '你主要的问题在于读书太少而想得太多' },
    // contents 为数组时，每次随机选一句话发送
    {
      keyword: 'lover_prattle',
      contents: ['因为太喜欢你，所以看谁都像是情敌。', '申请成为你爱里的永久居民。'],
    },
  ],
}

export default USER_CONFIG
```

## USER_INFO

`USER_INFO` 是一个 JSON 对象，可以包含上文 `config/index.ts` 中的任意配置项，用于保存不想公开的配置，例如全局的生日、纪念日：

```json
{
  "PROVINCE": "广东",
  "CITY": "惠州",
  "FESTIVALS": [{ "type": "节日", "name": "相识纪念日", "year": "2021", "date": "05-20" }],
  "CUSTOMIZED_DATE_LIST": [{ "keyword": "love_day", "date": "2021-05-20" }]
}
```

`USER_INFO` 中的配置会覆盖 `config/index.ts` 中的同名配置项；`APP_ID`、`USERS` 等单项环境变量又会覆盖 `USER_INFO` 中的同名配置项。

[📌返回首页](../../README.md)
