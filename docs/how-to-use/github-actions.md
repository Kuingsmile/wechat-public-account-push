[📌返回首页](../../README.md)

# GitHub Actions 部署教程

开始之前，请先按照 [微信测试号配置教程](../message-channel/test-number.md) 拿到 appID、appsecret、用户微信号和模板ID。

## 1. Fork 仓库

在仓库首页点击右上角的 **Fork**，创建一份属于自己的仓库。

## 2. 添加 Secrets

所有个人信息都通过 Secrets 配置，不需要修改仓库中的代码。

1. 进入 Fork 后的仓库，点击 **Settings**
2. 在左侧菜单中选择 **Secrets and variables → Actions**
3. 点击 **New repository secret**，在 **Name** 中填写名称，在 **Secret** 中填写内容，然后点击 **Add secret**
4. 重复上一步，添加下表中需要的 Secrets

| 名称                     | 必填 | 说明                                                      |
|------------------------|----|---------------------------------------------------------|
| `APP_ID`               | 是  | 测试号的 appID                                              |
| `APP_SECRET`           | 是  | 测试号的 appsecret                                          |
| `USERS`                | 是  | 接收消息的用户，JSON 数组                                         |
| `CALLBACK_TEMPLATE_ID` | 否  | 【推送完成提醒】的模板ID，不填则不发送回执                                   |
| `CALLBACK_USERS`       | 否  | 接收推送完成提醒的用户，JSON 数组，格式为 `[{ "name": "自己", "id": "微信号" }]` |
| `TIAN_API`             | 否  | 天行数据的 APIKEY                                            |
| `USER_INFO`            | 否  | JSON 对象，可以覆盖 `config/index.ts` 中的任意配置                    |

`USERS` 最少只需要填写名字、微信号和模板ID：

```json
[
  { "name": "宝贝", "id": "扫码关注测试号后得到的微信号", "useTemplateId": "模板ID", "city": "惠州" }
]
```

天气、生日、纪念日、星座、课程表等字段见 [配置说明](./config-demo.md#users-用户配置)。

> JSON 中的引号必须是英文双引号，最后一项后面不能有逗号。保存前可以先用 JSON 校验工具检查格式。
>
> Secret 保存后无法查看内容，只能重新填写覆盖，建议在本地留一份备份。

## 3. 启用 Actions

Fork 的仓库默认禁用了 Actions 和定时任务，需要分别启用：

1. 打开仓库的 **Actions** 页面，点击 **I understand my workflows, go ahead and enable them**
2. 在左侧选择 **weixin-push-on-time**，点击右侧提示中的 **Enable workflow**，启用定时任务

![启用定时任务](../../img/how-to-use/action-comit-2.png)

## 4. 手动运行一次

1. 在 **Actions** 页面左侧选择 **weixin-push-on-time**
2. 点击 **Run workflow → Run workflow**
3. 运行完成后点击运行记录，展开 **Run pnpm start** 步骤查看日志，每个用户都显示 `推送消息成功` 即为成功

如果只想检查配置，可以运行 **weixin-push-on-time-params-log**，它只会在日志中打印模板参数，不会推送消息。

> 公开仓库的 Actions 日志所有人都能看到，打印的参数中包含名字、纪念日等信息，检查完配置后可以删除这次运行记录。

## 5. 修改推送时间

见首页 [修改推送时间](../../README.md#修改推送时间)。

[📌返回首页](../../README.md)
