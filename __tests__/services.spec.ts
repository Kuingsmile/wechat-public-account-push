import axios, { type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import config from '../src/config'
import {
  buildTianApi,
  getAccessToken,
  getAggregatedData,
  getBing,
  getBirthdayMessage,
  getCallbackTemplateParams,
  getCIBA,
  getConstellationFortune,
  getCourseSchedule,
  getDateDiffList,
  getEarthyLoveWords,
  getHolidaytts,
  getMomentCopyrighting,
  getOneTalk,
  getPoetry,
  getPoisonChickenSoup,
  getSlotList,
  getTianApiEveningGreeting,
  getTianApiMorningGreeting,
  getTianApiNetworkHot,
  getTianApiWeather,
  getWeather,
  getWeatherIcon,
  getWordsFromApiShadiao,
  sendMessage,
  sendMessageReply,
} from '../src/services'
import { clearRunTimeStorage, DEFAULT_OUTPUT, RUN_TIME_STORAGE } from '../src/store'
import type { Festival, HoroscopeDateType, SwitchConfig } from '../src/types'

const response = (data: unknown, status = 200) => ({ status, data }) as AxiosResponse
const mockGet = (data: unknown, status = 200) => vi.spyOn(axios, 'get').mockResolvedValue(response(data, status))
const mockGetError = () => vi.spyOn(axios, 'get').mockRejectedValue(new Error('network error'))
const mockPost = (data: unknown) => vi.spyOn(axios, 'post').mockResolvedValue(response(data))
const mockPostError = () => vi.spyOn(axios, 'post').mockRejectedValue(new Error('network error'))

beforeEach(() => {
  config.SWITCH = {}
  config.IS_SHOW_COLOR = false
})

describe('getWeather', () => {
  const weatherResponse = {
    status: 200,
    data: {
      shidu: '29%',
      pm25: 27,
      pm10: 61,
      quality: '良',
      ganmao: '极少数敏感人群应减少户外活动',
      forecast: [
        {
          high: '高温 26℃',
          low: '低温 15℃',
          sunrise: '06:01',
          sunset: '18:05',
          aqi: 47,
          fx: '西南风',
          fl: '3级',
          type: '多云',
          notice: '阴晴之间，谨防紫外线侵扰',
        },
      ],
    },
  }

  test('parses the forecast and caches it', async () => {
    const get = mockGet(weatherResponse)
    const expected = {
      shidu: '29%',
      pm25: 27,
      pm10: 61,
      quality: '良',
      ganmao: '极少数敏感人群应减少户外活动',
      sunrise: '06:01',
      sunset: '18:05',
      aqi: 47,
      weather: '多云',
      maxTemperature: '26℃',
      minTemperature: '15℃',
      windDirection: '西南风',
      windScale: '3级',
      notice: '阴晴之间，谨防紫外线侵扰',
    }
    await expect(getWeather('北京', '顺义')).resolves.toEqual(expected)
    await expect(getWeather('北京', '顺义')).resolves.toEqual(expected)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('http://t.weather.itboy.net/api/weather/city/101010400', expect.anything())
  })

  test('returns an empty object when the forecast is missing', async () => {
    mockGet({ status: 200, data: { forecast: [] } })
    await expect(getWeather('北京', '顺义')).resolves.toEqual({})
  })

  test('returns an empty object on a bad status', async () => {
    mockGet({ status: 404 })
    await expect(getWeather('北京', '顺义')).resolves.toEqual({})
  })

  test('returns an empty object on request error', async () => {
    mockGetError()
    await expect(getWeather('北京', '顺义')).resolves.toEqual({})
  })

  test('skips the request when the city is unknown or the switch is off', async () => {
    const get = mockGet(weatherResponse)
    await expect(getWeather('未知', '未知')).resolves.toEqual({})
    config.SWITCH = { weather: false }
    await expect(getWeather('北京', '顺义')).resolves.toEqual({})
    expect(get).not.toHaveBeenCalled()
  })
})

describe('getAccessToken', () => {
  test('returns null without appId or appSecret', async () => {
    const get = mockGet({ access_token: 'token' })
    config.APP_ID = ''
    config.APP_SECRET = '123'
    await expect(getAccessToken()).resolves.toBeNull()
    config.APP_ID = '123'
    config.APP_SECRET = undefined
    await expect(getAccessToken()).resolves.toBeNull()
    expect(get).not.toHaveBeenCalled()
  })

  test('requests the token without logging secrets', async () => {
    config.APP_ID = 'app-id'
    config.APP_SECRET = 'app-secret'
    const log = vi.spyOn(console, 'log')
    const get = mockGet({ access_token: 'token' })
    await expect(getAccessToken()).resolves.toBe('token')
    expect(get).toHaveBeenCalledWith(expect.stringContaining('appid=app-id&secret=app-secret'))
    const logged = JSON.stringify(log.mock.calls)
    expect(logged).not.toContain('app-secret')
    expect(logged).not.toContain('token')
  })

  test('returns null when wechat rejects the credentials or the request fails', async () => {
    config.APP_ID = '123'
    config.APP_SECRET = '123'
    mockGet({ errcode: 40001, errmsg: 'invalid credential' })
    await expect(getAccessToken()).resolves.toBeNull()
    mockGetError()
    await expect(getAccessToken()).resolves.toBeNull()
  })
})

describe('getCIBA', () => {
  test('returns the daily sentence', async () => {
    mockGet({ content: 'en', note: 'ch' })
    await expect(getCIBA()).resolves.toEqual({ content: 'en', note: 'ch' })
  })

  test('returns an empty object on failure', async () => {
    mockGet('error', 500)
    await expect(getCIBA()).resolves.toEqual({})
    mockGetError()
    await expect(getCIBA()).resolves.toEqual({})
  })

  test('skips the request when switched off', async () => {
    const get = mockGet({ content: 'en', note: 'ch' })
    config.SWITCH = { CIBA: false }
    await expect(getCIBA()).resolves.toEqual({})
    expect(get).not.toHaveBeenCalled()
  })
})

describe('getHolidaytts', () => {
  test.each([
    ['2026-10-14', '还有3天就周六了，好好工作吧！距离元旦还有79天'],
    ['2026-10-16', '明天就是周六了，再坚持一下！距离元旦还有77天'],
    ['2026-10-18', '今天是周日，好好休息吧！距离元旦还有75天'],
    ['2026-09-28', '还有3天就国庆节假期了，好好工作吧！距离国庆节还有3天'],
    ['2026-10-03', '今天是国庆节假期，好好玩吧！距离元旦还有90天'],
    // 国庆节调休，周六上班
    ['2026-10-10', '明天就是周日了，再坚持一下！距离元旦还有83天'],
  ])('%s', (date, tts) => {
    vi.setSystemTime(date)
    expect(getHolidaytts()).toBe(tts)
  })

  test('returns null when switched off', () => {
    config.SWITCH = { holidaytts: false }
    expect(getHolidaytts()).toBeNull()
  })
})

describe('getOneTalk', () => {
  test('requests the matching type', async () => {
    const get = mockGet({ hitokoto: 'test', from: 'from' })
    await expect(getOneTalk('动画')).resolves.toEqual({ hitokoto: 'test', from: 'from' })
    expect(get).toHaveBeenCalledWith('https://v1.hitokoto.cn/?c=a')
  })

  test('picks a random type when the type is unknown', async () => {
    const get = mockGet({})
    await getOneTalk('xxx')
    expect(get).toHaveBeenCalledWith(expect.stringMatching(/\?c=[a-g]$/))
  })

  test('returns an empty object on failure or when switched off', async () => {
    mockGetError()
    await expect(getOneTalk('动画')).resolves.toEqual({})
    config.SWITCH = { oneTalk: false }
    await expect(getOneTalk('动画')).resolves.toEqual({})
  })
})

describe('shadiao api', () => {
  test('getWordsFromApiShadiao', async () => {
    const get = mockGet({ data: { text: 'test' } })
    await expect(getWordsFromApiShadiao('du')).resolves.toBe('test')
    expect(get).toHaveBeenCalledWith('https://api.shadiao.pro/du', { responseType: 'json' })
    mockGet({})
    await expect(getWordsFromApiShadiao('pyq')).resolves.toBe('')
    mockGetError()
    await expect(getWordsFromApiShadiao('chp')).resolves.toBe('')
  })

  test.each([
    ['earthyLoveWords', getEarthyLoveWords, 'chp'],
    ['momentCopyrighting', getMomentCopyrighting, 'pyq'],
    ['poisonChickenSoup', getPoisonChickenSoup, 'du'],
  ] as const)('%s', async (switchKey, fn, type) => {
    const get = mockGet({ data: { text: type } })
    await expect(fn()).resolves.toBe(type)
    expect(get).toHaveBeenCalledWith(`https://api.shadiao.pro/${type}`, expect.anything())

    get.mockClear()
    config.SWITCH = { [switchKey]: false } satisfies SwitchConfig
    await expect(fn()).resolves.toBe('')
    expect(get).not.toHaveBeenCalled()
  })
})

describe('getPoetry', () => {
  test('returns the poetry', async () => {
    mockGet({
      status: 'success',
      data: { content: '床前明月光', origin: { author: '李白', dynasty: '唐', title: '静夜思' } },
    })
    await expect(getPoetry()).resolves.toEqual({
      content: '床前明月光',
      author: '李白',
      dynasty: '唐',
      title: '静夜思',
    })
  })

  test('fills missing fields with empty strings', async () => {
    mockGet({ status: 'success' })
    await expect(getPoetry()).resolves.toEqual({ author: '', content: '', dynasty: '', title: '' })
  })

  test('returns an empty object on failure or when switched off', async () => {
    mockGet({ status: 'failed' })
    await expect(getPoetry()).resolves.toEqual({})
    mockGetError()
    await expect(getPoetry()).resolves.toEqual({})
    config.SWITCH = { poetry: false }
    await expect(getPoetry()).resolves.toEqual({})
  })
})

describe('getConstellationFortune', () => {
  const fortune = (values: (string | undefined)[], period = '今日') =>
    [
      ['comprehensive_horoscope', '综合运势'],
      ['love_horoscope', '爱情运势'],
      ['career_horoscope', '事业学业'],
      ['wealth_horoscope', '财富运势'],
      ['healthy_horoscope', '健康运势'],
    ].map(([name, label], index) => ({
      name,
      value: `${period}${label}: ${values[index] ?? DEFAULT_OUTPUT.constellationFortune}`,
      color: undefined,
    }))

  test('returns an empty list without a valid date or period', async () => {
    const get = mockGet('')
    await expect(getConstellationFortune()).resolves.toEqual([])
    await expect(getConstellationFortune('09-02', '昨日' as HoroscopeDateType)).resolves.toEqual([])
    config.SWITCH = { horoscope: false }
    await expect(getConstellationFortune('09-02', '今日')).resolves.toEqual([])
    expect(get).not.toHaveBeenCalled()
  })

  test('falls back to the default text when the request fails', async () => {
    mockGetError()
    await expect(getConstellationFortune('09-02', '本周')).resolves.toEqual(fortune([], '本周'))
  })

  test('parses the page and caches the result', async () => {
    const get = mockGet(`
      <article class="cont"><ul>
        <li class="p1"><div class="info"><strong>综合运势</strong><p><small>(x)</small></p></div></li>
        <li class="p2"><div class="info"><strong>爱情运势</strong><p>单身的遇到一些契机。</p></div></li>
        <li class="p4"><div class="info"><strong>财富运势</strong><p>求财方面陆续进账。<small>more</small></p></div></li>
        <li class="p5"><div class="info"><strong>健康运势</strong><p>玩手机要适度。</p></div></li>
      </ul></article>
    `)
    const expected = fortune([undefined, '单身的遇到一些契机。', undefined, '求财方面陆续进账。', '玩手机要适度。'])
    await expect(getConstellationFortune('09-02', '')).resolves.toEqual(expected)
    await expect(getConstellationFortune('09-02')).resolves.toEqual(expected)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('https://m.xzw.com/fortune/virgo/0.html')
  })
})

describe('getCourseSchedule', () => {
  const courses = ['08:00-09:35 高等数学', '09:50-11:35 高等物理']
  // 2022-09-24 为星期六，对应下标 5
  const week = [[], [], [], [], [], courses, []]

  beforeEach(() => {
    vi.setSystemTime('2022-09-24 08:00:00')
  })

  test('returns an empty schedule when not configured or switched off', () => {
    const empty = { schedule: '', wechatTestCourseSchedule: [] }
    expect(getCourseSchedule(null)).toEqual(empty)
    config.SWITCH = { courseSchedule: false }
    expect(getCourseSchedule(week)).toEqual(empty)
  })

  test('reads a weekly schedule', () => {
    expect(getCourseSchedule(week)).toEqual({
      schedule: courses.join('\n'),
      wechatTestCourseSchedule: [
        { name: 'wx_course_schedule_0', value: courses[0], color: undefined },
        { name: 'wx_course_schedule_1', value: courses[1], color: undefined },
      ],
    })
    expect(getCourseSchedule([[], []]).schedule).toBe('')
  })

  test.each([
    ['2022-09-23', true, 'odd'],
    ['2022-09-23', false, 'even'],
    ['2022-09-26', true, 'even'],
    ['2022-09-18', true, 'even'],
  ] as const)('benchmark %s (isOdd: %s) selects the %s week', (date, isOdd, kind) => {
    const schedule = getCourseSchedule({ benchmark: { date, isOdd }, courses: { [kind]: week } })
    expect(schedule.schedule).toBe(courses.join('\n'))
  })
})

describe('getBirthdayMessage', () => {
  const festivals: Festival[] = [
    { type: '*生日', name: '老婆', year: '1999', date: '09-19', isShowAge: true },
    { type: '节日', name: '结婚纪念日', year: '2020', date: '09-03' },
    { type: '生日', name: '李四', year: '1996', date: '09-31', isShowAge: true },
    { type: '节日', name: '被搭讪纪念日', year: '2021', date: '09-01' },
  ]
  const messages = [
    '今天是 「结婚纪念日」 哦，要开心！',
    '距离 「李四」 的26岁公历生日还有28天',
    '距离 「老婆」 的23岁阴历生日还有41天',
    '距离 「被搭讪纪念日」 还有363天',
  ]

  beforeEach(() => {
    vi.setSystemTime('2022-09-03')
  })

  test('lists upcoming festivals sorted by date', () => {
    config.FESTIVALS = festivals
    expect(getBirthdayMessage()).toEqual({
      resMessage: messages.map((message) => `${message} \n`).join(''),
      wechatTestBirthdayMessage: messages.map((value, index) => ({
        name: `wx_birthday_${index}`,
        value,
        color: undefined,
      })),
    })
  })

  test('prefers the festivals of the user', () => {
    config.FESTIVALS = festivals
    const { resMessage } = getBirthdayMessage([{ type: '节日', name: '纪念日', year: '2020', date: '09-04' }])
    expect(resMessage).toBe('距离 「纪念日」 还有1天 \n')
  })

  test('respects FESTIVALS_LIMIT', () => {
    config.FESTIVALS = festivals
    config.FESTIVALS_LIMIT = 2
    expect(getBirthdayMessage().wechatTestBirthdayMessage.map((item) => item.value)).toEqual(messages.slice(0, 2))
    config.FESTIVALS_LIMIT = -1
    expect(getBirthdayMessage().resMessage).toBe('')
  })

  test('congratulates on the birthday', () => {
    vi.setSystemTime('2022-10-01')
    expect(getBirthdayMessage(festivals.slice(2, 3)).resMessage).toBe(
      '今天是 「李四」 的26岁公历生日哦，祝李四生日快乐！ \n',
    )
  })

  test('ignores unknown types and returns nothing when switched off', () => {
    expect(getBirthdayMessage([{ type: '测试日', name: 'x', year: '2020', date: '09-03' }]).resMessage).toBe('')
    config.FESTIVALS = null
    expect(getBirthdayMessage().resMessage).toBe('')
    config.SWITCH = { birthdayMessage: false }
    expect(getBirthdayMessage(festivals)).toEqual({ resMessage: '', wechatTestBirthdayMessage: [] })
  })
})

describe('getDateDiffList', () => {
  test('computes the days since or until each date', () => {
    vi.setSystemTime('2022-09-03 08:00:00')
    config.CUSTOMIZED_DATE_LIST = [
      { keyword: 'love_day', date: '2015-05-01' },
      { keyword: 'marry_day', date: '2020-01-04' },
      { keyword: 'ex_day', date: '2022-09-09' },
    ]
    expect(getDateDiffList()).toEqual([
      { keyword: 'love_day', date: '2015-05-01', diffDay: 2683 },
      { keyword: 'marry_day', date: '2020-01-04', diffDay: 974 },
      { keyword: 'ex_day', date: '2022-09-09', diffDay: 6 },
    ])
    // 不修改原配置
    expect(config.CUSTOMIZED_DATE_LIST[0]).not.toHaveProperty('diffDay')
    expect(getDateDiffList([{ keyword: 'user_day', date: '2022-09-01' }])).toEqual([
      { keyword: 'user_day', date: '2022-09-01', diffDay: 3 },
    ])
  })

  test('returns an empty list when not configured', () => {
    config.CUSTOMIZED_DATE_LIST = null
    expect(getDateDiffList(null)).toEqual([])
  })
})

describe('getSlotList', () => {
  test('picks the slot contents', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    config.SLOT_LIST = [
      { keyword: 'encourage_oneself', contents: '你主要的问题在于读书太少而想得太多' },
      { keyword: 'lover_prattle', contents: ['因为太喜欢你，所以看谁都像是情敌。', '申请成为你爱里的永久居民。'] },
      { keyword: 'empty', contents: [] },
    ]
    expect(getSlotList().map(({ keyword, checkout }) => ({ keyword, checkout }))).toEqual([
      { keyword: 'encourage_oneself', checkout: '你主要的问题在于读书太少而想得太多' },
      { keyword: 'lover_prattle', checkout: '申请成为你爱里的永久居民。' },
      { keyword: 'empty', checkout: '' },
    ])
  })

  test('returns an empty list when not configured', () => {
    config.SLOT_LIST = null
    expect(getSlotList()).toEqual([])
  })
})

describe('tian api', () => {
  test('returns an empty list when disabled or the key is missing', async () => {
    const get = mockGet({ code: 200, result: { list: [1] } })
    config.TIAN_API = {}
    await expect(buildTianApi('tianqi')).resolves.toEqual([])
    config.TIAN_API = { weather: 3 }
    await expect(buildTianApi('tianqi')).resolves.toEqual([])
    expect(get).not.toHaveBeenCalled()
  })

  test('returns an empty list on failure', async () => {
    config.TIAN_API = { key: 'secret', weather: 3 }
    mockGet({ code: 150, msg: 'error msg' })
    await expect(buildTianApi('tianqi')).resolves.toEqual([])
    mockGetError()
    await expect(buildTianApi('tianqi')).resolves.toEqual([])
  })

  test('limits the result count and caches it', async () => {
    config.TIAN_API = { key: 'secret', weather: 3, networkHot: true }
    const get = mockGet({ code: 200, result: { list: [1, 2, 3, 4, 5] } })
    await expect(buildTianApi('tianqi', { city: '杭州' })).resolves.toEqual([1, 2, 3])
    await expect(buildTianApi('tianqi', { city: '杭州' })).resolves.toEqual([1, 2, 3])
    await expect(buildTianApi('networkhot')).resolves.toEqual([1])
    expect(get).toHaveBeenCalledTimes(2)
    expect(get).toHaveBeenCalledWith('https://apis.tianapi.com/tianqi/index', {
      params: { key: 'secret', city: '杭州' },
    })
  })

  test('wraps a single result in a list', async () => {
    config.TIAN_API = { key: 'secret', morningGreeting: true }
    mockGet({ code: 200, result: { content: 'xxx' } })
    await expect(buildTianApi('zaoan')).resolves.toEqual([{ content: 'xxx' }])
    clearRunTimeStorage()
    mockGet({ code: 200 })
    await expect(buildTianApi('zaoan')).resolves.toEqual([])
  })

  test('wrappers', async () => {
    config.TIAN_API = { key: 'secret', morningGreeting: true, eveningGreeting: true, weather: 1, networkHot: 2 }
    config.CITY = '杭州'
    const get = mockGet({ code: 200, result: { content: 'xxx' } })
    await expect(getTianApiMorningGreeting()).resolves.toBe('xxx')
    await expect(getTianApiEveningGreeting()).resolves.toBe('xxx')
    await expect(getTianApiWeather({})).resolves.toEqual([{ content: 'xxx' }])
    expect(get).toHaveBeenLastCalledWith(expect.any(String), { params: { key: 'secret', city: '杭州', type: '7' } })

    mockGet({ code: 200, result: { list: [{ title: 't1', digest: 'd1' }, { title: 't2' }] } })
    await expect(getTianApiNetworkHot()).resolves.toBe('1、 d1 \n')
    await expect(getTianApiNetworkHot('title')).resolves.toBe('1、 t1 \n')
  })
})

describe('sendMessage', () => {
  const params = [
    { name: 'name1', value: 'value1', color: 'color1' },
    { name: '', value: 'ignored' },
  ]

  test('fails without an access token', async () => {
    config.APP_ID = ''
    const post = mockPost({ errcode: 0 })
    await expect(sendMessage('templateId', { id: '123', name: 'me' }, params)).resolves.toEqual({
      name: 'me',
      success: false,
    })
    expect(post).not.toHaveBeenCalled()
  })

  test('sends the template message', async () => {
    RUN_TIME_STORAGE.accessToken = 'token'
    const post = mockPost({ errcode: 0 })
    await expect(sendMessage('templateId', { id: '123', name: 'me' }, params)).resolves.toEqual({
      name: 'me',
      success: true,
    })
    expect(post).toHaveBeenCalledWith(
      'https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=token',
      {
        touser: '123',
        template_id: 'templateId',
        url: '',
        topcolor: '#FF0000',
        data: { name1: { value: 'value1', color: 'color1' } },
      },
      expect.anything(),
    )
  })

  test.each([40003, 40036, 45009])('fails on errcode %i', async (errcode) => {
    RUN_TIME_STORAGE.accessToken = 'token'
    mockPost({ errcode })
    await expect(sendMessage('templateId', { id: '123', name: 'me' }, params)).resolves.toEqual({
      name: 'me',
      success: false,
    })
  })

  test('fails on request error', async () => {
    RUN_TIME_STORAGE.accessToken = 'token'
    mockPostError()
    await expect(sendMessage('templateId', { id: '123', name: 'me' }, params)).resolves.toEqual({
      name: 'me',
      success: false,
    })
  })
})

describe('sendMessageReply', () => {
  beforeEach(() => {
    RUN_TIME_STORAGE.accessToken = 'token'
  })

  test('summarizes the results', async () => {
    vi.spyOn(axios, 'post').mockImplementation((_url, data) =>
      Promise.resolve(response({ errcode: (data as { touser: string }).touser === '1' ? 0 : 40003 })),
    )
    await expect(
      sendMessageReply([
        { id: '1', name: 'me' },
        { id: '2', name: 'you' },
      ]),
    ).resolves.toEqual({
      needPostNum: 2,
      successPostNum: 1,
      failPostNum: 1,
      successPostIds: 'me',
      failPostIds: 'you',
    })
  })

  test('reports when nothing is sent', async () => {
    mockPostError()
    await expect(sendMessageReply([{ id: '1', name: 'me' }])).resolves.toEqual({
      needPostNum: 1,
      successPostNum: 0,
      failPostNum: 1,
      successPostIds: '无',
      failPostIds: 'me',
    })
  })

  test('uses the template and params of each user by default', async () => {
    const post = mockPost({ errcode: 0 })
    await sendMessageReply([{ id: '1', name: 'me', useTemplateId: 'tpl', wxTemplateParams: [{ name: 'a', value: 1 }] }])
    expect(post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ template_id: 'tpl', data: { a: { value: 1, color: undefined } } }),
      expect.anything(),
    )
    await sendMessageReply([{ id: '1', name: 'me', useTemplateId: 'tpl' }], 'callback', [{ name: 'b', value: 2 }])
    expect(post).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ template_id: 'callback', data: { b: { value: 2, color: undefined } } }),
      expect.anything(),
    )
  })

  test('sleeps after MAX_PUSH_ONE_MINUTE messages', async () => {
    config.MAX_PUSH_ONE_MINUTE = 2
    config.SLEEP_TIME = 1
    const log = vi.spyOn(console, 'log')
    mockPost({ errcode: 0 })
    const users = ['1', '2', '3'].map((id) => ({ id, name: id }))
    await expect(sendMessageReply(users)).resolves.toMatchObject({ successPostNum: 3 })
    expect(log).toHaveBeenCalledWith(expect.stringContaining('单次脚本已发送 2 条消息'))
    expect(RUN_TIME_STORAGE.pushNum).toBe(1)
  })
})

describe('getAggregatedData', () => {
  test('aggregates the template params of every user, using defaults on failure', async () => {
    vi.setSystemTime('2022-09-03')
    mockGetError()
    config.TIAN_API = {}
    config.FESTIVALS = null
    config.SLOT_LIST = [{ keyword: 'slot', contents: 'hi' }]
    config.USERS = [
      {
        name: '老婆',
        id: 'id',
        useTemplateId: 'tpl',
        province: '北京',
        city: '顺义',
        horoscopeDate: '09-02',
        customizedDateList: [{ keyword: 'love_day', date: '2022-09-01' }],
        festivals: [{ type: '节日', name: '纪念日', year: '2020', date: '09-04' }],
      },
    ]

    const [user, ...rest] = await getAggregatedData()
    expect(rest).toHaveLength(0)
    expect(user).toMatchObject({ name: '老婆', id: 'id', useTemplateId: 'tpl' })
    const params = Object.fromEntries((user?.wxTemplateParams ?? []).map((item) => [item.name, item.value]))
    expect(params).toMatchObject({
      to_name: '老婆',
      date: '2022-09-03 星期六',
      province: '北京',
      city: '顺义',
      birthday_message: '距离 「纪念日」 还有1天 \n',
      wx_birthday_0: '距离 「纪念日」 还有1天',
      note_en: DEFAULT_OUTPUT.noteEn,
      note_ch: DEFAULT_OUTPUT.noteCh,
      holidaytts: '今天是周六，好好休息吧！距离中秋节还有7天',
      one_talk: DEFAULT_OUTPUT.oneTalk,
      talk_from: DEFAULT_OUTPUT.talkFrom,
      earthy_love_words: DEFAULT_OUTPUT.earthyLoveWords,
      moment_copyrighting: DEFAULT_OUTPUT.momentCopyrighting,
      poison_chicken_soup: DEFAULT_OUTPUT.poisonChickenSoup,
      poetry_content: DEFAULT_OUTPUT.poetryContent,
      course_schedule: DEFAULT_OUTPUT.courseSchedule,
      comprehensive_horoscope: `今日综合运势: ${DEFAULT_OUTPUT.constellationFortune}`,
      love_day: 3,
      slot: 'hi',
      tian_api_network_hot: '',
    })
    // 不修改原配置
    expect(config.USERS[0]).not.toHaveProperty('wxTemplateParams')
  })

  test('throws before any request when USERS is missing or empty', async () => {
    const get = mockGetError()
    config.USERS = []
    await expect(getAggregatedData()).rejects.toThrow('请在 GitHub Secrets 中配置 USERS')
    config.USERS = undefined as never
    await expect(getAggregatedData()).rejects.toThrow('请在 GitHub Secrets 中配置 USERS')
    expect(get).not.toHaveBeenCalled()
  })
})

describe('getCallbackTemplateParams', () => {
  test('maps the summary to template params', () => {
    const params = getCallbackTemplateParams({
      needPostNum: 2,
      successPostNum: 1,
      failPostNum: 1,
      successPostIds: 'me',
      failPostIds: 'you',
    })
    expect(Object.fromEntries(params.map((item) => [item.name, item.value]))).toMatchObject({
      post_time_zone: 'UTC',
      need_post_num: 2,
      success_post_num: 1,
      fail_post_num: 1,
      success_post_ids: 'me',
      fail_post_ids: 'you',
    })
  })
})

describe('getWeatherIcon', () => {
  test.each([
    ['晴', '☀️'],
    ['多云转小雨', '🌧️'],
    ['未知', '🌈'],
  ])('%s', (weather, icon) => {
    expect(getWeatherIcon(weather)).toBe(icon)
  })
})

describe('getBing', () => {
  test('returns the image info', async () => {
    mockGet({ images: [{ url: 'url', title: 'title', copyright: 'abc(def)ghi(jkl)' }] })
    await expect(getBing()).resolves.toEqual({
      imgUrl: 'https://cn.bing.com/url',
      imgTitle: 'title',
      imgContent: 'abcghi(jkl)',
    })
  })

  test('returns an empty object on failure', async () => {
    mockGetError()
    await expect(getBing()).resolves.toEqual({})
  })
})
