import axios from 'axios'
import dayjs from 'dayjs'
import { JSDOM } from 'jsdom'

import config from '../config'
import { DEFAULT_OUTPUT, RUN_TIME_STORAGE, TYPE_LIST } from '../store'
import type {
  CourseSchedule,
  CustomizedDate,
  Festival,
  HoroscopeDateType,
  Recipient,
  SendResult,
  SendSummary,
  Slot,
  TemplateParam,
  TemplateParamValue,
  User,
} from '../types'
import {
  getColor,
  getConstellation,
  getNextFestival,
  getNextRestDay,
  getWeatherCityInfo,
  randomNum,
  sleep,
  sortBirthdayTime,
  toLowerLine,
} from '../utils'
import { selfDayjs, timeZone } from '../utils/set-def-dayjs'

axios.defaults.timeout = 10000

const LINE_BREAK = '\n'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'

interface WechatTokenResponse {
  access_token?: string
  errcode?: number
  errmsg?: string
}

interface WechatSendResponse {
  errcode?: number
  errmsg?: string
}

interface WeatherForecast {
  high: string
  low: string
  sunrise: string
  sunset: string
  aqi: number
  fx: string
  fl: string
  type: string
  notice: string
}

interface WeatherResponse {
  status?: number
  data?: {
    shidu?: string
    pm25?: number
    pm10?: number
    quality?: string
    ganmao?: string
    forecast?: WeatherForecast[]
  }
}

export interface WeatherInfo {
  /** 湿度 */
  shidu?: string | undefined
  /** PM2.5 */
  pm25?: number | undefined
  /** PM1.0 */
  pm10?: number | undefined
  /** 空气质量 */
  quality?: string | undefined
  /** 预防感冒提醒 */
  ganmao?: string | undefined
  /** 日出时间 */
  sunrise: string
  /** 日落时间 */
  sunset: string
  /** 空气质量指数 */
  aqi: number
  /** 天气情况 */
  weather: string
  /** 最高温度 */
  maxTemperature: string
  /** 最低温度 */
  minTemperature: string
  /** 风向 */
  windDirection: string
  /** 风力等级 */
  windScale: string
  /** 温馨提示 */
  notice: string
}

interface CibaResponse {
  content?: string
  note?: string
}

interface HitokotoResponse {
  hitokoto?: string
  from?: string
}

interface ShadiaoResponse {
  data?: {
    text?: string
  }
}

interface JinrishiciResponse {
  status?: string
  warning?: string
  data?: {
    content?: string
    origin?: {
      title?: string
      author?: string
      dynasty?: string
    }
  }
}

export interface Poetry {
  content: string
  title: string
  author: string
  dynasty: string
}

interface BingResponse {
  images?: {
    url: string
    title: string
    copyright: string
  }[]
}

interface TianApiResponse<T> {
  code?: number
  msg?: string
  /** 单个结果直接放在 result 中，多个结果放在 result.list 中 */
  result?: T & { list?: T[] }
}

export interface BirthdayMessage {
  resMessage: string
  wechatTestBirthdayMessage: TemplateParam[]
}

export interface CourseScheduleMessage {
  schedule: string
  wechatTestCourseSchedule: TemplateParam[]
}

export type AggregatedUser = User & { wxTemplateParams: TemplateParam[] }

/**
 * 获取 accessToken
 */
export const getAccessToken = async (): Promise<string | null> => {
  const { APP_ID: appId, APP_SECRET: appSecret } = config

  // 打印日志
  if (!appId) {
    console.log('未配置 APP_ID，请检查 GitHub Secrets 中的 APP_ID 是否填写正确')
    return null
  }
  if (!appSecret) {
    console.log('未配置 APP_SECRET，请检查 GitHub Secrets 中的 APP_SECRET 是否填写正确')
    return null
  }

  console.log('已获取appId', appId)
  console.log('已获取appSecret')

  const postUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`

  try {
    const res = await axios.get<WechatTokenResponse>(postUrl)
    if (res.status === 200 && res.data.access_token) {
      console.log('---')
      console.log('获取 accessToken: 成功')
      console.log('---')
      return res.data.access_token
    }
    console.log('---')
    console.error('获取 accessToken: 请求失败', res.data.errmsg ?? res.data)
    console.log('---')
    console.log(`40001: 请检查appId，appSecret 填写是否正确；
                  如果第一次使用微信测试号请关闭测试号平台后重新扫码登陆测试号平台获取最新的appId，appSecret`)
  } catch (e) {
    console.error('获取 accessToken: ', e)
  }

  return null
}

/**
 * 获取天气icon
 */
export const getWeatherIcon = (weather: string): string => {
  let weatherIcon = '🌈'
  const weatherIconList = ['☀️', '☁️', '⛅️', '☃️', '⛈️', '🏜️', '🏜️', '🌫️', '🌫️', '🌪️', '🌧️']
  const weatherType = ['晴', '阴', '云', '雪', '雷', '沙', '尘', '雾', '霾', '风', '雨']

  weatherType.forEach((item, index) => {
    if (weather.includes(item)) {
      weatherIcon = weatherIconList[index] ?? weatherIcon
    }
  })

  return weatherIcon
}

/**
 * 获取天气情况
 * @param province 省份
 * @param city 城市
 */
export const getWeather = async (province?: string, city?: string): Promise<Partial<WeatherInfo>> => {
  if (config.SWITCH?.weather === false) {
    return {}
  }

  // 读取缓存
  const cacheKey = `${province}_${city}`
  const cached = RUN_TIME_STORAGE[cacheKey] as WeatherInfo | undefined
  if (cached) {
    console.log(`获取了相同的数据，读取缓存 >>> ${cacheKey}`)
    return cached
  }

  const cityInfo = getWeatherCityInfo(province, city)
  if (!cityInfo) {
    console.error('配置文件中找不到相应的省份或城市')
    return {}
  }
  const url = `http://t.weather.itboy.net/api/weather/city/${cityInfo.city_code}`

  try {
    const res = await axios.get<WeatherResponse>(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (res.status !== 200 || res.data.status !== 200) {
      console.error('天气情况获取失败', res)
      return {}
    }

    const commonInfo = res.data.data
    const info = commonInfo?.forecast?.[0]
    if (!commonInfo || !info) {
      console.error('天气情况: 找不到天气信息, 获取失败')
      return {}
    }

    const result: WeatherInfo = {
      shidu: commonInfo.shidu,
      pm25: commonInfo.pm25,
      pm10: commonInfo.pm10,
      quality: commonInfo.quality,
      ganmao: commonInfo.ganmao,
      sunrise: info.sunrise,
      sunset: info.sunset,
      aqi: info.aqi,
      weather: info.type,
      maxTemperature: info.high.replace(/^高温\s*/, ''),
      minTemperature: info.low.replace(/^低温\s*/, ''),
      windDirection: info.fx,
      windScale: info.fl,
      notice: info.notice,
    }

    RUN_TIME_STORAGE[cacheKey] = structuredClone(result)

    return result
  } catch (e) {
    console.error('天气情况获取失败', e)
    return {}
  }
}

/**
 * 金山词霸每日一句
 */
export const getCIBA = async (): Promise<CibaResponse> => {
  if (config.SWITCH?.CIBA === false) {
    return {}
  }

  const url = 'https://open.iciba.com/dsapi/'
  try {
    const res = await axios.get<CibaResponse>(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
    })
    if (res.status === 200 && res.data) {
      return res.data
    }
    console.error('金山词霸每日一句: 发生错误', res)
  } catch (e) {
    console.error('金山词霸每日一句: 发生错误', e)
  }
  return {}
}

/**
 * 获取下一休息日tts，例如：还有3天就周六了，好好工作吧！距离国庆节还有18天
 */
export const getHolidaytts = (): string | null => {
  if (config.SWITCH?.holidaytts === false) {
    return null
  }

  const restDay = getNextRestDay()
  const restName = restDay.isHoliday ? `${restDay.name}假期` : restDay.name
  let message: string
  if (restDay.diffDay === 0) {
    message = `今天是${restName}，${restDay.isHoliday ? '好好玩吧' : '好好休息吧'}！`
  } else if (restDay.diffDay === 1) {
    message = `明天就是${restName}了，再坚持一下！`
  } else {
    message = `还有${restDay.diffDay}天就${restName}了，好好工作吧！`
  }

  const festival = getNextFestival()
  return `${message}距离${festival.name}还有${festival.diffDay}天`
}

/**
 * 每日一言
 * @param type 内容类型，找不到时随机
 */
export const getOneTalk = async (type?: string): Promise<HitokotoResponse> => {
  if (config.SWITCH?.oneTalk === false) {
    return {}
  }

  const query =
    TYPE_LIST.find((item) => item.name === type)?.type ?? TYPE_LIST[randomNum(0, TYPE_LIST.length - 1)]?.type ?? ''
  const url = `https://v1.hitokoto.cn/?c=${query}`

  try {
    const res = await axios.get<HitokotoResponse>(url)
    if (res.status === 200) {
      return res.data
    }
    console.error('每日一言: 发生错误', res)
  } catch (e) {
    console.error('每日一言: 发生错误', e)
  }
  return {}
}

const SHADIAO_TYPE_NAME = {
  chp: '土味情话(彩虹屁)',
  pyq: '朋友圈文案',
  du: '毒鸡汤',
} as const

/**
 * 从沙雕APP开放接口中获取数据
 */
export const getWordsFromApiShadiao = async (type: keyof typeof SHADIAO_TYPE_NAME): Promise<string> => {
  const url = `https://api.shadiao.pro/${type}`
  try {
    const res = await axios.get<ShadiaoResponse>(url, {
      responseType: 'json',
    })
    return res.data.data?.text ?? ''
  } catch (e) {
    console.error(`${SHADIAO_TYPE_NAME[type]}：发生错误`, e)
    return ''
  }
}

/**
 * 土味情话（彩虹屁）
 */
export const getEarthyLoveWords = async (): Promise<string> => {
  if (config.SWITCH?.earthyLoveWords === false) {
    return ''
  }
  return getWordsFromApiShadiao('chp')
}

/**
 * 朋友圈文案
 */
export const getMomentCopyrighting = async (): Promise<string> => {
  if (config.SWITCH?.momentCopyrighting === false) {
    return ''
  }
  return getWordsFromApiShadiao('pyq')
}

/**
 * 毒鸡汤
 */
export const getPoisonChickenSoup = async (): Promise<string> => {
  if (config.SWITCH?.poisonChickenSoup === false) {
    return ''
  }
  return getWordsFromApiShadiao('du')
}

/**
 * 古诗古文
 */
export const getPoetry = async (): Promise<Partial<Poetry>> => {
  if (config.SWITCH?.poetry === false) {
    return {}
  }

  const url = 'https://v2.jinrishici.com/sentence'
  try {
    const res = await axios.get<JinrishiciResponse>(url, {
      headers: {
        'X-User-Token': 'FW8KNlfULPtZ9Ci6aNy8aTfPJPwI+/Ln',
      },
      responseType: 'json',
    })
    const { status, data, warning } = res.data
    if (status !== 'success') {
      console.error('古诗古文：发生错误', warning ?? '')
      return {}
    }
    const { content = '', origin } = data ?? {}
    const { title = '', author = '', dynasty = '' } = origin ?? {}
    return {
      content,
      title,
      author,
      dynasty,
    }
  } catch (e) {
    console.error('古诗古文：发生错误', e)
    return {}
  }
}

const HOROSCOPE_PERIODS: HoroscopeDateType[] = ['今日', '明日', '本周', '本月', '今年']
const HOROSCOPE_TYPES = [
  { name: '综合运势', key: 'comprehensiveHoroscope' },
  { name: '爱情运势', key: 'loveHoroscope' },
  { name: '事业学业', key: 'careerHoroscope' },
  { name: '财富运势', key: 'wealthHoroscope' },
  { name: '健康运势', key: 'healthyHoroscope' },
]

/**
 * 星座运势请求
 * @param date 新历生日 MM-DD
 * @param dateType 运势时段，未填写时取今日
 */
export const getConstellationFortune = async (
  date?: string,
  dateType?: HoroscopeDateType | '',
): Promise<TemplateParam[]> => {
  if (config.SWITCH?.horoscope === false || !date) {
    return []
  }

  const period = dateType || '今日'
  const periodIndex = HOROSCOPE_PERIODS.indexOf(period)
  if (periodIndex === -1) {
    console.error('星座日期类型horoscopeDateType错误, 请确认是否按要求填写!')
    return []
  }

  // 获取星座id
  const { en: constellation } = getConstellation(date)

  // 读取缓存
  const cacheKey = `${constellation}_${periodIndex}`
  const cached = RUN_TIME_STORAGE[cacheKey] as TemplateParam[] | undefined
  if (cached) {
    console.log(`获取了相同的数据，读取缓存 >>> ${cacheKey}`)
    return cached
  }

  // 拿不到数据则使用默认内容, 保证运行
  // www.xzw.com 不支持 TLS 安全重协商，Node.js 无法访问，这里使用移动版
  let document: Document | undefined
  try {
    const { data } = await axios.get<string>(`https://m.xzw.com/fortune/${constellation}/${periodIndex}.html`)
    if (data) {
      document = new JSDOM(data).window.document
    }
  } catch (e) {
    console.error('星座运势：发生错误', e)
  }

  const res = HOROSCOPE_TYPES.map((item, index) => {
    let value = document?.querySelector(`.cont li.p${index + 1} .info > p`)?.innerHTML.replace(/<small.*/, '')
    if (!value) {
      value = DEFAULT_OUTPUT.constellationFortune
      if (document) {
        console.error(`${item.name}获取失败`)
      }
    }
    return {
      name: toLowerLine(item.key),
      value: `${period}${item.name}: ${value}`,
      color: getColor(),
    }
  })

  RUN_TIME_STORAGE[cacheKey] = structuredClone(res)

  return res
}

/**
 * 获取课程表
 */
export const getCourseSchedule = (courseSchedule?: CourseSchedule | null): CourseScheduleMessage => {
  if (config.SWITCH?.courseSchedule === false || !courseSchedule) {
    return { schedule: '', wechatTestCourseSchedule: [] }
  }
  const week = (selfDayjs().day() + 6) % 7
  let courses: string[]
  if (Array.isArray(courseSchedule)) {
    // 如果课程表是一个数组，认为只有单周的课表
    courses = courseSchedule[week] ?? []
  } else {
    // 如果是一个对象，则根据基准日期判断单双周
    const benchmarkDate = selfDayjs(courseSchedule.benchmark.date)
    const diff = selfDayjs().diff(
      benchmarkDate.set('day', 0).set('hour', 0).set('minute', 0).set('second', 0).set('millisecond', 0),
      'millisecond',
    )
    const isSameKind = Math.floor(diff / 7 / 86400000) % 2 === 0
    const { isOdd } = courseSchedule.benchmark
    const kind = (isSameKind && isOdd) || (!isSameKind && !isOdd) ? 'odd' : 'even'
    courses = courseSchedule.courses[kind]?.[week] ?? []
  }

  return {
    schedule: courses.join(LINE_BREAK),
    wechatTestCourseSchedule: courses.map((item, index) => ({
      name: toLowerLine(`wxCourseSchedule_${index}`),
      value: item,
      color: getColor(),
    })),
  }
}

/**
 * 获取bing每日壁纸数据
 */
export const getBing = async (): Promise<{ imgUrl?: string; imgTitle?: string; imgContent?: string }> => {
  const url = 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1'
  try {
    const res = await axios.get<BingResponse>(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const image = res.data.images?.[0]
    if (image) {
      return {
        imgUrl: `https://cn.bing.com/${image.url}`,
        imgTitle: image.title,
        imgContent: image.copyright.replace(/\(.*?\)/, ''),
      }
    }
  } catch (e) {
    console.error('获取bing每日壁纸: 发生错误', e)
  }
  return {}
}

/**
 * 获取重要节日信息
 * @param festivals 用户专属节日，为空时使用 config.FESTIVALS
 */
export const getBirthdayMessage = (festivals?: Festival[] | null): BirthdayMessage => {
  const resList: BirthdayMessage = { resMessage: '', wechatTestBirthdayMessage: [] }
  if (config.SWITCH?.birthdayMessage === false) {
    return resList
  }

  const list = Array.isArray(festivals) && festivals.length > 0 ? festivals : (config.FESTIVALS ?? [])

  // 计算重要节日倒数
  sortBirthdayTime(list).forEach((item, index) => {
    if (config.FESTIVALS_LIMIT && index >= config.FESTIVALS_LIMIT) {
      return
    }
    let message: string | null = null

    // 生日相关
    if (item.type === '生日') {
      // 获取周岁
      const age = item.useLunar
        ? selfDayjs().year() - Number(item.year) - 1
        : selfDayjs().diff(`${item.year}-${item.date}`, 'year')
      const calendar = item.useLunar ? '阴历' : '公历'

      if (item.diffDay === 0) {
        const ageText = age && item.isShowAge ? `${(item.useLunar ? 1 : 0) + age}岁` : ''
        message = `今天是 「${item.name}」 的${ageText}${calendar}生日哦，祝${item.name}生日快乐！`
      } else {
        const ageText = age && item.isShowAge ? `${age + 1}岁` : ''
        message = `距离 「${item.name}」 的${ageText}${calendar}生日还有${item.diffDay}天`
      }
    }

    // 节日相关
    if (item.type === '节日') {
      message =
        item.diffDay === 0 ? `今天是 「${item.name}」 哦，要开心！` : `距离 「${item.name}」 还有${item.diffDay}天`
    }

    // 存储数据
    if (message) {
      resList.resMessage += `${message} ${LINE_BREAK}`
      resList.wechatTestBirthdayMessage.push({
        name: toLowerLine(`wxBirthday_${index}`),
        value: message,
        color: getColor(),
      })
    }
  })

  return resList
}

/**
 * 计算每个重要日子的日期差
 * @param customizedDateList 用户专属纪念日，为空时使用 config.CUSTOMIZED_DATE_LIST
 */
export const getDateDiffList = (
  customizedDateList?: CustomizedDate[] | null,
): (CustomizedDate & { diffDay: number })[] => {
  const dateList = Array.isArray(customizedDateList) ? customizedDateList : config.CUSTOMIZED_DATE_LIST
  if (!Array.isArray(dateList)) {
    return []
  }

  return dateList.map((item) => {
    const diff = selfDayjs().diff(selfDayjs(item.date), 'day', true)
    const diffDay = Math.ceil(diff) > 0 ? Math.ceil(diff) : Math.abs(Math.floor(diff))
    return { ...item, diffDay }
  })
}

/**
 * 自定义插槽信息
 */
export const getSlotList = (): (Slot & { checkout: string })[] => {
  if (!Array.isArray(config.SLOT_LIST)) {
    return []
  }

  return config.SLOT_LIST.map((item) => {
    let checkout = ''
    if (Array.isArray(item.contents)) {
      checkout = item.contents[Math.floor(Math.random() * item.contents.length)] ?? ''
    } else if (typeof item.contents === 'string') {
      checkout = item.contents
    }
    return { ...item, checkout }
  })
}

const TIAN_API_TYPE_MAP = {
  zaoan: 'morningGreeting',
  wanan: 'eveningGreeting',
  networkhot: 'networkHot',
  tianqi: 'weather',
} as const

/**
 * 天行统一调用接口
 */
export const buildTianApi = async <T = Record<string, TemplateParamValue>>(
  apiType: keyof typeof TIAN_API_TYPE_MAP,
  params: Record<string, string | undefined> | null = null,
): Promise<T[]> => {
  const option = config.TIAN_API?.[TIAN_API_TYPE_MAP[apiType]]
  if (!option) {
    return []
  }
  const count = typeof option === 'number' ? option : 1
  const key = config.TIAN_API?.key
  if (!key) {
    console.error('配置中config.TIAN_API.key 未填写，无法请求TIAN_API')
    return []
  }

  const cacheKey = `${apiType}_${JSON.stringify(params)}_${count}`
  const cached = RUN_TIME_STORAGE[cacheKey] as T[] | undefined
  if (cached) {
    console.log(`获取了相同的数据，读取缓存 >>> ${cacheKey}`)
    return cached
  }

  const url = `https://apis.tianapi.com/${apiType}/index`
  try {
    const res = await axios.get<TianApiResponse<T>>(url, {
      params: { key, ...params },
    })
    if (res.data.code === 200) {
      const data = res.data.result
      const result = (data?.list ?? (data ? [data] : [])).slice(0, count)
      RUN_TIME_STORAGE[cacheKey] = structuredClone(result)
      return result
    }
    console.error(`获取天行API接口 ${apiType} 发生错误: `, res.data)
  } catch (e) {
    console.error(`获取天行API接口 ${apiType} 发生错误: `, e)
  }
  return []
}

/**
 * 天行-早安心语
 */
export const getTianApiMorningGreeting = async (): Promise<string | undefined> =>
  (await buildTianApi<{ content?: string }>('zaoan'))[0]?.content

/**
 * 天行-晚安心语
 */
export const getTianApiEveningGreeting = async (): Promise<string | undefined> =>
  (await buildTianApi<{ content?: string }>('wanan'))[0]?.content

/**
 * 天行-天气（付费），查询七天天气后按配置截取前 N 天
 */
export const getTianApiWeather = (user: Pick<User, 'city'>): Promise<Record<string, TemplateParamValue>[]> =>
  buildTianApi('tianqi', { city: user.city || config.CITY, type: '7' })

/**
 * 天行-每日热搜
 * @param type 'default' 展示概要信息，'title' 仅展示标题
 */
export const getTianApiNetworkHot = async (type: 'default' | 'title' = 'default'): Promise<string> => {
  let result = ''
  const res = await buildTianApi<{ title?: string; digest?: string }>('networkhot')
  res.forEach((item, index) => {
    if (item.digest) {
      result += `${index + 1}、 ${type === 'default' ? item.digest : item.title} ${LINE_BREAK}`
    }
  })
  return result
}

/**
 * 获取全部处理好的用户数据
 */
export const getAggregatedData = async (): Promise<AggregatedUser[]> => {
  if (!Array.isArray(config.USERS) || config.USERS.length === 0) {
    throw new Error('没有需要推送的用户，请在 GitHub Secrets 中配置 USERS')
  }

  const weekList = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  // 获取金山词霸每日一句
  const { content: noteEn = DEFAULT_OUTPUT.noteEn, note: noteCh = DEFAULT_OUTPUT.noteCh } = await getCIBA()
  // 获取下一休息日
  const holidaytts = getHolidaytts() || DEFAULT_OUTPUT.holidaytts
  // 获取每日一言
  const { hitokoto: oneTalk = DEFAULT_OUTPUT.oneTalk, from: talkFrom = DEFAULT_OUTPUT.talkFrom } = await getOneTalk(
    config.LITERARY_PREFERENCE,
  )
  // 获取土味情话
  const earthyLoveWords = (await getEarthyLoveWords()) || DEFAULT_OUTPUT.earthyLoveWords
  // 获取朋友圈文案
  const momentCopyrighting = (await getMomentCopyrighting()) || DEFAULT_OUTPUT.momentCopyrighting
  // 获取毒鸡汤
  const poisonChickenSoup = (await getPoisonChickenSoup()) || DEFAULT_OUTPUT.poisonChickenSoup
  // 获取古诗古文 poetry
  const {
    dynasty: poetryDynasty = DEFAULT_OUTPUT.poetryDynasty,
    author: poetryAuthor = DEFAULT_OUTPUT.poetryAuthor,
    title: poetryTitle = DEFAULT_OUTPUT.poetryTitle,
    content: poetryContent = DEFAULT_OUTPUT.poetryContent,
  } = await getPoetry()
  // 获取插槽中的数据
  const slotParams = getSlotList().map((item) => ({ name: item.keyword, value: item.checkout, color: getColor() }))

  const users: AggregatedUser[] = []
  for (const user of config.USERS) {
    // 获取每日天气
    const useProvince = user.province || config.PROVINCE
    const useCity = user.city || config.CITY
    const weatherInfo = await getWeather(useProvince, useCity)
    const weatherMessage = Object.entries(weatherInfo).map(([key, value]) => ({
      name: toLowerLine(key),
      value: value || '获取失败',
      color: getColor(),
    }))

    // 统计日列表计算日期差
    const dateDiffParams = getDateDiffList(user.customizedDateList).map((item) => ({
      name: item.keyword,
      value: item.diffDay,
      color: getColor(),
    }))

    // 获取生日/生日信息
    const { resMessage: birthdayMessage, wechatTestBirthdayMessage } = getBirthdayMessage(user.festivals)

    // 获取星座运势
    const constellationFortune = await getConstellationFortune(user.horoscopeDate, user.horoscopeDateType)

    // 获取课表信息
    const { schedule, wechatTestCourseSchedule } = getCourseSchedule(user.courseSchedule ?? config.COURSE_SCHEDULE)
    const courseSchedule = schedule || DEFAULT_OUTPUT.courseSchedule

    // 天行-早晚安
    const tianApiGreeting = [
      {
        name: toLowerLine('tianApiMorningGreeting'),
        value: await getTianApiMorningGreeting(),
        color: getColor(),
      },
      {
        name: toLowerLine('tianApiEveningGreeting'),
        value: await getTianApiEveningGreeting(),
        color: getColor(),
      },
    ].filter((it) => it.value)

    // 天行-天气
    const tianApiWeather = (await getTianApiWeather(user)).flatMap((it, index) =>
      Object.keys(it)
        .filter((weatherKey) => !['province', 'area', 'weatherimg'].includes(weatherKey))
        .map((key) => ({
          name: toLowerLine(`tianApiWeather_${key}_${index}`),
          value: it[key],
          color: getColor(),
        })),
    )

    // 天行-热榜
    const tianApiNetworkHot = [
      {
        name: toLowerLine('tianApiNetworkHot'),
        value: await getTianApiNetworkHot(config.TIAN_API?.networkHotType),
        color: getColor(),
      },
    ]

    // 集成所需信息
    const wxTemplateParams: TemplateParam[] = [
      { name: toLowerLine('toName'), value: user.name, color: getColor() },
      {
        name: toLowerLine('date'),
        value: `${selfDayjs().format('YYYY-MM-DD')} ${weekList[selfDayjs().day()]}`,
        color: getColor(),
      },
      { name: toLowerLine('province'), value: useProvince, color: getColor() },
      { name: toLowerLine('city'), value: useCity, color: getColor() },
      { name: toLowerLine('birthdayMessage'), value: birthdayMessage, color: getColor() },
      { name: toLowerLine('noteEn'), value: noteEn, color: getColor() },
      { name: toLowerLine('noteCh'), value: noteCh, color: getColor() },
      { name: toLowerLine('holidaytts'), value: holidaytts, color: getColor() },
      { name: toLowerLine('oneTalk'), value: oneTalk, color: getColor() },
      { name: toLowerLine('talkFrom'), value: talkFrom, color: getColor() },
      { name: toLowerLine('earthyLoveWords'), value: earthyLoveWords, color: getColor() },
      { name: toLowerLine('momentCopyrighting'), value: momentCopyrighting, color: getColor() },
      { name: toLowerLine('poisonChickenSoup'), value: poisonChickenSoup, color: getColor() },
      { name: toLowerLine('poetryContent'), value: poetryContent, color: getColor() },
      { name: toLowerLine('poetryAuthor'), value: poetryAuthor, color: getColor() },
      { name: toLowerLine('poetryDynasty'), value: poetryDynasty, color: getColor() },
      { name: toLowerLine('poetryTitle'), value: poetryTitle, color: getColor() },
      { name: toLowerLine('courseSchedule'), value: courseSchedule, color: getColor() },
      ...weatherMessage,
      ...constellationFortune,
      ...dateDiffParams,
      ...slotParams,
      ...tianApiGreeting,
      ...tianApiWeather,
      ...tianApiNetworkHot,
      ...wechatTestBirthdayMessage,
      ...wechatTestCourseSchedule,
    ]

    users.push({ ...user, wxTemplateParams })
  }

  return users
}

/**
 * 获取处理好的回执消息
 */
export const getCallbackTemplateParams = (messageReply: SendSummary): TemplateParam[] => {
  const postTimeZone = timeZone()
  const postTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  return [
    { name: toLowerLine('postTimeZone'), value: postTimeZone, color: getColor() },
    { name: toLowerLine('postTime'), value: postTime, color: getColor() },
    { name: toLowerLine('needPostNum'), value: messageReply.needPostNum, color: getColor() },
    { name: toLowerLine('successPostNum'), value: messageReply.successPostNum, color: getColor() },
    { name: toLowerLine('failPostNum'), value: messageReply.failPostNum, color: getColor() },
    { name: toLowerLine('successPostIds'), value: messageReply.successPostIds, color: getColor() },
    { name: toLowerLine('failPostIds'), value: messageReply.failPostIds, color: getColor() },
  ]
}

/**
 * 通过微信测试号发送模板消息
 */
export const sendMessage = async (
  templateId: string | undefined,
  user: Recipient,
  params: TemplateParam[] | undefined,
): Promise<SendResult> => {
  let accessToken = RUN_TIME_STORAGE.accessToken
  if (accessToken) {
    console.log('获取了相同的数据，读取缓存 >>> accessToken')
  } else {
    accessToken = await getAccessToken()
    RUN_TIME_STORAGE.accessToken = accessToken
  }

  if (!accessToken) {
    return { name: user.name, success: false }
  }

  const wxTemplateData = Object.fromEntries(
    (params ?? []).filter((item) => item.name).map((item) => [item.name, { value: item.value, color: item.color }]),
  )

  const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`
  const data = {
    touser: user.id,
    template_id: templateId,
    url: '',
    topcolor: '#FF0000',
    data: wxTemplateData,
  }

  try {
    const res = await axios.post<WechatSendResponse>(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
    })

    if (res.data.errcode === 0) {
      console.log(`${user.name}: 推送消息成功`)
      return { name: user.name, success: true }
    }

    if (res.data.errcode === 40003) {
      console.error(
        `${user.name}: 推送消息失败! id填写不正确！应该填用户扫码后生成的id！要么就是填错了！请检查配置文件！`,
      )
    } else if (res.data.errcode === 40036) {
      console.error(`${user.name}: 推送消息失败! 模板id填写不正确！应该填模板id！要么就是填错了！请检查配置文件！`)
    } else {
      console.error(`${user.name}: 推送消息失败`, res.data)
    }
  } catch (e) {
    console.error(`${user.name}: 推送消息失败`, e)
  }

  return { name: user.name, success: false }
}

/**
 * 推送消息, 进行成功失败统计
 * @param users 接收者
 * @param templateId 不填时使用 user.useTemplateId
 * @param params 不填时使用 user.wxTemplateParams
 */
export const sendMessageReply = async (
  users: Recipient[],
  templateId: string | null = null,
  params: TemplateParam[] | null = null,
): Promise<SendSummary> => {
  const resList: SendResult[] = []

  const maxPushOneMinute =
    typeof config.MAX_PUSH_ONE_MINUTE === 'number' && config.MAX_PUSH_ONE_MINUTE > 0 ? config.MAX_PUSH_ONE_MINUTE : 5
  const sleepTime = config.SLEEP_TIME || 65000
  for (const user of users) {
    if ((RUN_TIME_STORAGE.pushNum ?? 0) >= maxPushOneMinute) {
      RUN_TIME_STORAGE.pushNum = 0
      // 请求超过N个则等待60秒再发送
      console.log(
        `单次脚本已发送 ${maxPushOneMinute} 条消息，为避免推送服务器识别为恶意推送，脚本将休眠 ${sleepTime / 1000} 秒。休眠结束后将自动推送剩下的消息。`,
      )
      await sleep(sleepTime)
    }
    resList.push(await sendMessage(templateId || user.useTemplateId, user, params ?? user.wxTemplateParams))
    RUN_TIME_STORAGE.pushNum = (RUN_TIME_STORAGE.pushNum ?? 0) + 1
  }

  const successPostIds = resList.filter((item) => item.success).map((item) => item.name)
  const failPostIds = resList.filter((item) => !item.success).map((item) => item.name)

  return {
    needPostNum: users.length,
    successPostNum: successPostIds.length,
    failPostNum: failPostIds.length,
    successPostIds: successPostIds.length ? successPostIds.join(',') : '无',
    failPostIds: failPostIds.length ? failPostIds.join(',') : '无',
  }
}
