[📌返回首页](../../README.md)

# 微信测试号配置教程

## 1. 注册微信测试号

- 浏览器打开并登录 [微信公众平台测试号](https://mp.weixin.qq.com/debug/cgi-bin/sandbox?t=sandbox/login)
- 登录成功后，页面上会显示测试号的 **appID** 和 **appsecret**，分别对应 Secrets 中的 `APP_ID` 和 `APP_SECRET`

![测试号信息](../../img/how-to-use/wx-test-id.png)

- 用微信扫描测试号二维码关注测试号，右侧的用户列表中会出现对应的 **微信号**，即 `USERS` 中每个用户的 `id`

![用户列表](../../img/how-to-use/wx-test-follow.png)

## 2. 新增模板

在 **模板消息接口** 中点击 **新增测试模板**，填写模板标题和模板内容。保存后得到的 **模板ID** 即 `USERS` 中的 `useTemplateId`。

![模板列表](../../img/how-to-use/wx-test-tmp.png)

模板中的每一个 `{{xxx.DATA}}` 都会被替换为对应的数据，全部可用的参数见首页 [模板参数](../../README.md#模板参数)。

> 测试号模板不支持换行和自定义颜色，`{{xxx.DATA}}` 前面需要有文字，否则可能无法显示，更多注意事项见 [常用的推送模板样例](../how-to-use/default-model.md)。

模板标题：`亲爱的，早上好`

模板内容：

```text
日期：{{date.DATA}}
城市：{{city.DATA}}
天气：{{weather.DATA}}
最低气温：{{min_temperature.DATA}}
最高气温：{{max_temperature.DATA}}
在一起：{{love_day.DATA}}天
纪念日：{{wx_birthday_0.DATA}}
每日一句：{{note_ch.DATA}}
```

如果需要在推送完成后收到回执，可以再新增一个模板，并把模板ID 填写到 `CALLBACK_TEMPLATE_ID` 中：

模板标题：`推送完成提醒`

模板内容：

```text
服务器时间：{{post_time.DATA}}
推送人数：{{need_post_num.DATA}}
成功人数：{{success_post_num.DATA}}
失败人数：{{fail_post_num.DATA}}
成功用户：{{success_post_ids.DATA}}
失败用户：{{fail_post_ids.DATA}}
```

完成后请返回首页继续配置 GitHub Secrets。

[📌返回首页](../../README.md)
