import type { UserConfig } from '../src/types'

/**
 * 基础配置
 *
 * 此文件会公开在仓库中，请不要在这里填写任何个人信息。
 * appID、appsecret、接收消息的用户、模板ID 等敏感信息请通过环境变量（GitHub Secrets）传入：
 * APP_ID、APP_SECRET、USERS、CALLBACK_TEMPLATE_ID、CALLBACK_USERS、TIAN_API
 *
 * 其他配置也可以通过 USER_INFO 环境变量以 JSON 格式覆盖
 * 全部配置项请查看 docs/how-to-use/config-demo.md
 */
const USER_CONFIG: UserConfig = {
  // 天行API，key 通过 TIAN_API 环境变量传入
  TIAN_API: {
    morningGreeting: false,
    eveningGreeting: false,
    weather: 3,
    networkHot: 0,
    networkHotType: 'default',
  },

  // 默认所在省份和城市，USERS 中没有填写 province / city 时使用
  PROVINCE: '',
  CITY: '',

  // 接收消息的用户，通过 USERS 环境变量传入
  USERS: [],
}

export default USER_CONFIG
