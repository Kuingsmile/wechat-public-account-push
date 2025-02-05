/* eslint-disable */

/**
 * 此项目配置为方便新人使用，已缩减至最简配置。
 * 如若想使用更多功能，请查考文档中的 【3. config参数说明】 
 * 自行添加属性，以支持更多个性化功能
 */
const USER_CONFIG = {

  TIAN_API: {
    key: process.env.TIAN_API,
    morningGreeting: false,
    eveningGreeting: false,
    weather: 3,
    networkHot: 0,
    networkHotType: 'default'
  },

  // 使用微信测试号：公众号APP_ID
  APP_ID: '',

  // 使用微信测试号：公众号APP_SECRET
  APP_SECRET: '',

  PROVINCE: '浙江',
  CITY: '杭州',

  USERS: [
    {
      // 想要发送的人的名字
      name: '我自己',
      // 使用微信测试号：扫码关注你的微信测试号后生成的一段字符串，在测试号后台能看到
      id: 'osC4I6opo03RdPf9my9ugx9y93bM',
      // 使用微信测试号：你想对他发送的模板消息的模板ID
      useTemplateId: 'aFw7FkDH2QBo_6eNZ5vCbMDWlC0Z2Rf7K8Uo2ealI_k',
      // 新历生日, 仅用作获取星座运势, 格式必须为MM-DD
      horoscopeDate: '08-06',
      festivals: [
        // 注意：此条配置日期为阴历日期，因为`type`中 “生日” 之前有 * 符号
        {
          type: '*生日', name: '老婆', year: '1992', date: '07-08',
        },
        // 注意：此条配置日期为阳历日期，因为`type`中 “生日” 之前没有 * 符号
        {
          type: '生日', name: '老婆', year: '1992', date: '08-06',
        },
        {
          type: '节日', name: '相识纪念日', year: '2021', date: '05-29',
        },
      ],
      // 我们在一起已经有xxxx天了的配置
      customizedDateList: [
        // 在一起的日子
        { keyword: 'love_day', date: '2021-05-29' },
        // 结婚纪念日
        { keyword: 'marry_day', date: '2022-04-16' },
      ],
    },
    {
      // 想要发送的人的名字
      name: '老婆',
      // 使用微信测试号：扫码关注你的微信测试号后生成的一段字符串，在测试号后台能看到
      id: 'osC4I6iqsydJcBi-JCL0Czd8VRGM',
      // 使用微信测试号：你想对他发送的模板消息的模板ID
      useTemplateId: 'aFw7FkDH2QBo_6eNZ5vCbMDWlC0Z2Rf7K8Uo2ealI_k',
      // 新历生日, 仅用作获取星座运势, 格式必须为MM-DD
      horoscopeDate: '08-06',
      festivals: [
        // 注意：此条配置日期为阴历日期，因为`type`中 “生日” 之前有 * 符号
        {
          type: '*生日', name: '老婆', year: '1992', date: '07-08',
        },
        // 注意：此条配置日期为阳历日期，因为`type`中 “生日” 之前没有 * 符号
        {
          type: '生日', name: '老婆', year: '1992', date: '08-06',
        },
        {
          type: '节日', name: '相识纪念日', year: '2021', date: '05-29',
        },
      ],
      // 我们在一起已经有xxxx天了的配置
      customizedDateList: [
        // 在一起的日子
        { keyword: 'love_day', date: '2021-05-29' },
        // 结婚纪念日
        { keyword: 'marry_day', date: '2022-04-16' },
      ],
    },
  ],


  // 【推送完成提醒】模板id, 用来看自己有没有发送成功的那个模板
  CALLBACK_TEMPLATE_ID: '',

  CALLBACK_USERS: [
    {
      name: '自己',
      // 使用微信测试号：自己的微信id，扫码关注你的微信测试号后生成的一段字符串，在测试号后台能看到
      id: 'osC4I6opo03RdPf9my9ugx9y93bM',
    }
  ],

}

module.exports = USER_CONFIG

