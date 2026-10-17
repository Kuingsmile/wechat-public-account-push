# wechat-public-account-push

使用微信公众平台**测试号**，每天定时给指定的微信用户推送模板消息：天气、纪念日、生日倒计时、每日一句、星座运势、课程表等。

程序运行在 GitHub Actions 上，不需要服务器；所有个人信息都保存在 GitHub Secrets 中，不会出现在仓库代码里。

## 功能

- 支持多个收件人，每个人可以使用不同的模板
- 每日天气
- 金山每日一句、每日一言、土味情话、朋友圈文案、毒鸡汤、古诗词
- 生日和节日倒计时，支持农历
- 纪念日计时，例如「今天是我们在一起的第 N 天」
- 星座运势
- 大学生课程表，支持单双周
- 自定义文本插槽
- 推送完成回执
- [天行数据](https://www.tianapi.com) 接口：早安/晚安心语、全网热搜、天气预报

## 快速开始

### 1. 注册微信测试号并创建模板

按照 [微信测试号配置教程](./docs/message-channel/test-number.md) 完成注册，记下以下信息：

- 测试号的 **appID** 和 **appsecret**
- 接收消息的用户扫码关注测试号后得到的 **微信号**（openid）
- 新建模板后得到的 **模板ID**

模板内容可以参考 [常用的推送模板样例](./docs/how-to-use/default-model.md)，可用的参数见下文 [模板参数](#模板参数)。

### 2. Fork 本仓库

点击右上角的 **Fork**。

### 3. 配置 GitHub Secrets

进入 Fork 后的仓库，打开 **Settings → Secrets and variables → Actions**，点击 **New repository secret** 添加以下内容：

| 名称                   | 必填 | 说明                                                                             |
| ---------------------- | ---- | -------------------------------------------------------------------------------- |
| `APP_ID`               | 是   | 测试号的 appID                                                                   |
| `APP_SECRET`           | 是   | 测试号的 appsecret                                                               |
| `USERS`                | 是   | 接收消息的用户，JSON 数组，见下方示例                                            |
| `CALLBACK_TEMPLATE_ID` | 否   | 【推送完成提醒】的模板ID，不填则不发送回执                                       |
| `CALLBACK_USERS`       | 否   | 接收推送完成提醒的用户，JSON 数组，格式为 `[{ "name": "自己", "id": "微信号" }]` |
| `TIAN_API`             | 否   | 天行数据的 APIKEY                                                                |
| `USER_INFO`            | 否   | JSON 对象，可以覆盖 `config/index.ts` 中的任意配置                               |

`USERS` 示例：

```json
[
  {
    "name": "宝贝",
    "id": "扫码关注测试号后得到的微信号",
    "useTemplateId": "模板ID",
    "province": "广东",
    "city": "惠州",
    "horoscopeDate": "09-02",
    "festivals": [
      { "type": "*生日", "name": "宝贝", "year": "1999", "date": "08-15" },
      { "type": "节日", "name": "相识纪念日", "year": "2021", "date": "05-20" }
    ],
    "customizedDateList": [
      { "keyword": "love_day", "date": "2021-05-20" }
    ]
  }
]
```

每个用户的全部可选字段见 [配置说明](./docs/how-to-use/config-demo.md)。

### 4. 启用并测试 GitHub Actions

1. 打开仓库的 **Actions** 页面，Fork 的仓库默认禁用了 Actions，点击启用
2. 选择 **weixin-push-on-time**，点击 **Run workflow** 手动运行一次，确认能收到消息
3. 之后会按照定时任务每天自动运行

也可以运行 **weixin-push-on-time-params-log**，它只会在日志中打印模板参数，不会推送消息，适合用来检查配置。

> 公开仓库的 Actions 日志所有人都能看到，打印的参数中包含名字、纪念日等信息，检查完配置后可以删除这次运行记录。

更详细的图文步骤见 [GitHub Actions 部署教程](./docs/how-to-use/github-actions.md)。

## 修改推送时间

定时任务配置在 `.github/workflows/weixin-push-on-time.yml` 中，默认为每天 UTC 0:00，即**北京时间 8:00**：

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * *'
```

cron 使用 UTC 时间，北京时间需要减去 8 小时，例如北京时间 7:30 对应 `30 23 * * *`，可以使用 [crontab.guru](https://crontab.guru) 辅助编写。

GitHub Actions 的定时任务需要排队，整点（尤其是 UTC 0:00）比较拥堵，可能会延迟较久，推荐设置为 `30 22 * * *` 这类非整点时间。

## 配置说明

配置分为两部分：

- `config/index.ts`：功能开关等**非敏感**配置，会公开在仓库中，请不要在这里填写个人信息
- 环境变量（GitHub Secrets）：appID、用户微信号、模板ID 等**敏感**信息

优先级为：单项环境变量（`APP_ID`、`USERS` 等） > `USER_INFO` > `config/index.ts`

全部配置项见 [配置说明](./docs/how-to-use/config-demo.md)。

## 模板参数

微信测试号的模板中可以使用 `{{参数.DATA}}` 获取以下内容。

### 基础

| 参数          | 说明             | 示例              |
| ------------- | ---------------- | ----------------- |
| to_name.DATA  | 收件人名字       | 宝贝              |
| date.DATA     | YYYY-MM-DD 星期d | 2022-08-26 星期五 |
| province.DATA | 省份             | 广东              |
| city.DATA     | 城市             | 惠州              |

### 天气

| 参数                 | 说明         | 示例                                                                 |
| -------------------- | ------------ | -------------------------------------------------------------------- |
| weather.DATA         | 天气         | 阵雨转多云                                                           |
| min_temperature.DATA | 最低气温     | 25℃                                                                  |
| max_temperature.DATA | 最高气温     | 32℃                                                                  |
| wind_direction.DATA  | 风向         | 持续东南风                                                           |
| wind_scale.DATA      | 风级         | <3级                                                                 |
| shidu.DATA           | 湿度         | 50%                                                                  |
| pm25.DATA            | PM2.5        | 36                                                                   |
| pm10.DATA            | PM10         | 54                                                                   |
| sunrise.DATA         | 日出时间     | 06:20                                                                |
| sunset.DATA          | 日落时间     | 18:20                                                                |
| aqi.DATA             | 空气质量指数 | 40                                                                   |
| ganmao.DATA          | 预防感冒提醒 | 儿童、老年人及心脏、呼吸系统疾病患者人群应减少长时间或高强度户外锻炼 |
| notice.DATA          | 天气温馨语   | 雨虽小，注意保暖别感冒                                               |

### 节假日

| 参数            | 说明               | 示例                                            |
| --------------- | ------------------ | ----------------------------------------------- |
| holidaytts.DATA | 下一休息日综合提醒 | 还有3天就周六了，好好工作吧！距离国庆节还有18天 |

下一休息日根据法定节假日和调休安排在本地计算，不依赖外部接口。放假安排数据来自 [lunar-javascript](https://github.com/6tail/lunar-javascript)，每年国务院公布次年安排后需要更新该依赖（同步 fork 即可）；还没有数据的年份只按节日当天和周末计算。

### 每日一句

| 参数                     | 说明              | 示例                                                  |
| ------------------------ | ----------------- | ----------------------------------------------------- |
| note_en.DATA             | 金山每日一句-英文 | Nothing in this world that's worth having comes easy. |
| note_ch.DATA             | 金山每日一句-中文 | 这世界上凡是值得拥有的东西，都不易获得。              |
| one_talk.DATA            | 每日一言-内容     | 愿你遍布祖国山河，觉得人生也值得                      |
| talk_from.DATA           | 每日一言-来源     | 晓良                                                  |
| earthy_love_words.DATA   | 土味情话          | 我今晚会很忙，忙着跟你过日子                          |
| moment_copyrighting.DATA | 朋友圈文案        | 错过太阳就不要再错过月亮了                            |
| poison_chicken_soup.DATA | 毒鸡汤            | 我从不以强凌弱，我欺负他之前，真不晓得他比我弱。      |
| poetry_content.DATA      | 古诗词-内容       | 举头望明月，低头思故乡。                              |
| poetry_title.DATA        | 古诗词-标题       | 静夜思                                                |
| poetry_author.DATA       | 古诗词-作者       | 李白                                                  |
| poetry_dynasty.DATA      | 古诗词-朝代       | 唐代                                                  |

### 星座运势

需要在用户配置中填写 `horoscopeDate`。

| 参数                         | 说明     |
| ---------------------------- | -------- |
| comprehensive_horoscope.DATA | 综合运势 |
| love_horoscope.DATA          | 爱情运势 |
| career_horoscope.DATA        | 事业学业 |
| wealth_horoscope.DATA        | 财富运势 |
| healthy_horoscope.DATA       | 健康运势 |

### 生日、节日和课程表

测试号模板不支持换行，多条内容请使用带序号的参数，`{index}` 从 0 开始。

| 参数                            | 说明                                                  | 示例                              |
| ------------------------------- | ----------------------------------------------------- | --------------------------------- |
| wx_birthday_{index}.DATA        | 第 index+1 近的生日或节日                             | 距离 「宝贝」 的公历生日还有122天 |
| wx_course_schedule_{index}.DATA | 今天的第 index+1 节课                                 | 08:00-09:35 高等数学              |
| birthday_message.DATA           | 全部生日和节日，多行内容                              |                                   |
| course_schedule.DATA            | 今天的全部课程，多行内容，没有课时为「今天没有课哟~」 |                                   |

### 自定义纪念日和文本插槽

在用户配置的 `customizedDateList`（或全局的 `CUSTOMIZED_DATE_LIST`）中添加的 `keyword` 会作为模板参数，值为距离该日期的天数；`SLOT_LIST` 中的 `keyword` 会被替换为对应的文本。例如配置了 `{ "keyword": "love_day", "date": "2021-05-20" }` 后，模板中可以这样使用：

```text
今天是我们在一起的第{{love_day.DATA}}天
```

自定义的 `keyword` 不要与本页中已有的参数重名。

### 天行数据

需要在 [天行数据](https://www.tianapi.com) 控制台分别申请用到的接口，并配置 `TIAN_API` Secret；没有申请的接口会返回 `160 当前未申请该API`。

程序使用天行的新接口域名 `apis.tianapi.com`（旧域名 `api.tianapi.com` 已于 2025 年 10 月停止维护），原有的 APIKEY 可以直接使用。

| 参数                           | 说明                                            |
| ------------------------------ | ----------------------------------------------- |
| tian_api_morning_greeting.DATA | [早安心语](https://www.tianapi.com/apiview/143) |
| tian_api_evening_greeting.DATA | [晚安心语](https://www.tianapi.com/apiview/142) |
| tian_api_network_hot.DATA      | [全网热搜](https://www.tianapi.com/apiview/223) |

[天气预报](https://www.tianapi.com/apiview/72)接口按次计费，`{offset}` 为距离今天的天数，例如今天的天气为 `tian_api_weather_weather_0.DATA`，明天为 `tian_api_weather_weather_1.DATA`，展示的天数由 `TIAN_API.weather` 配置。

| 参数                                     | 说明               |
| ---------------------------------------- | ------------------ |
| tian_api_weather_date_{offset}.DATA      | 日期               |
| tian_api_weather_week_{offset}.DATA      | 星期               |
| tian_api_weather_weather_{offset}.DATA   | 早晚天气变化       |
| tian_api_weather_real_{offset}.DATA      | 气温（估测值）     |
| tian_api_weather_lowest_{offset}.DATA    | 最低温             |
| tian_api_weather_highest_{offset}.DATA   | 最高温             |
| tian_api_weather_wind_{offset}.DATA      | 风向               |
| tian_api_weather_winddeg_{offset}.DATA   | 风向360°角度       |
| tian_api_weather_windspeed_{offset}.DATA | 风速，km/h         |
| tian_api_weather_windsc_{offset}.DATA    | 风力               |
| tian_api_weather_sunrise_{offset}.DATA   | 日出时间           |
| tian_api_weather_sunset_{offset}.DATA    | 日落时间           |
| tian_api_weather_moonrise_{offset}.DATA  | 月升时间           |
| tian_api_weather_moondown_{offset}.DATA  | 月落时间           |
| tian_api_weather_pcpn_{offset}.DATA      | 降雨量             |
| tian_api_weather_pop_{offset}.DATA       | 降雨概率           |
| tian_api_weather_uv_index_{offset}.DATA  | 紫外线强度指数     |
| tian_api_weather_vis_{offset}.DATA       | 能见度，单位：公里 |
| tian_api_weather_humidity_{offset}.DATA  | 相对湿度           |
| tian_api_weather_tips_{offset}.DATA      | 生活指数提示       |

### 推送完成提醒

仅能在 `CALLBACK_TEMPLATE_ID` 对应的模板中使用，在所有消息推送完成后发送。

| 参数                  | 说明               | 示例                |
| --------------------- | ------------------ | ------------------- |
| post_time_zone.DATA   | 服务器时区         | UTC                 |
| post_time.DATA        | 服务器执行脚本时间 | 2022-08-31 19:41:57 |
| need_post_num.DATA    | 共需推送N人        | 3                   |
| success_post_num.DATA | 成功推送N人        | 2                   |
| fail_post_num.DATA    | 推送失败N人        | 1                   |
| success_post_ids.DATA | 推送成功的用户     | 宝贝,自己           |
| fail_post_ids.DATA    | 推送失败的用户     | 朋友                |

## 常见问题

**获取 accessToken 失败，提示 40001 / invalid appsecret**

检查 `APP_ID` 和 `APP_SECRET` 是否正确；如果是第一次使用测试号，可以退出测试号平台后重新扫码登录，获取最新的 appID 和 appsecret。

**推送失败，提示 40003 或 40036**

40003 表示用户的 `id` 不正确，应填写用户扫码关注测试号后生成的微信号；40036 表示 `useTemplateId` 不正确。

**提示「没有需要推送的用户」或「不是合法的 JSON」**

检查 `USERS` Secret 是否已添加、是否为合法的 JSON 数组。常见错误是使用了中文引号、在最后一项后面多写了逗号。

**定时任务没有自动执行**

- Fork 的仓库需要先在 Actions 页面手动启用
- 定时任务需要排队，延迟几十分钟属于正常现象
- 公开仓库 60 天内没有任何提交时，GitHub 会自动停用定时任务，需要到 Actions 页面重新启用

**模板显示不完整**

2023 年 5 月起，微信测试号模板不再支持自定义颜色、换行和部分 emoji，单个字段超过 20 个字会显示为省略号，详见 [常用的推送模板样例](./docs/how-to-use/default-model.md)。

**如何同步更新**

在 Fork 的仓库页面点击 **Sync fork → Update branch**。个人信息都保存在 Secrets 中，同步时不会丢失；如果修改过 `config/index.ts`，可能需要处理冲突。

## 本地开发

项目使用 TypeScript 编写，使用 [pnpm](https://pnpm.io) 管理依赖，需要 Node.js `^22.22.2 || ^24.15.0 || >=26`（推荐 Node.js 24）。

```bash
pnpm install         # 安装依赖
pnpm params-log      # 构建并打印模板参数（不推送）
pnpm dev             # 构建并推送消息
pnpm start           # 运行已构建的 dist/main.js（GitHub Actions 使用）
pnpm test            # 运行单元测试 (Vitest)
pnpm typecheck       # 类型检查
pnpm lint            # 代码检查 (ESLint)
pnpm format          # 代码格式化 (Prettier)
```

本地运行时，把 `.env.example` 复制为 `.env` 并填写，`pnpm dev` 和 `pnpm params-log` 会自动读取。`.env` 已被 git 忽略，不会提交到仓库；已设置的系统环境变量优先于 `.env` 中的值。

目录结构：

```text
config/index.ts      非敏感配置
src/config.ts        合并配置文件与环境变量
src/main.ts          程序入口
src/services/        数据获取及消息推送
src/utils/           工具函数
src/store/           城市数据及默认文案
__tests__/           单元测试
```

## License

[MIT](./LICENSE)
