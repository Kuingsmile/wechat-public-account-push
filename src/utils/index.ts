import { HolidayUtil, Lunar, Solar } from 'lunar-javascript'

import config from '../config'
import { WEATHER_CITY } from '../store'
import type { Festival, WeatherCity } from '../types'
import { selfDayjs } from './set-def-dayjs'

export interface SortedFestival extends Festival {
  /** 是否为阴历日期 */
  useLunar: boolean
  /** 距离今天的天数 */
  diffDay: number
}

/**
 * 驼峰转下划线
 */
export const toLowerLine = (str: string): string => {
  const temp = str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
  // 如果首字母是大写，执行replace时会多一个_，这里需要去掉
  return temp.startsWith('_') ? temp.slice(1) : temp
}

/**
 * 获取随机颜色
 */
export const getColor = (): string | undefined => {
  if (config.IS_SHOW_COLOR === false) {
    return undefined
  }
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padEnd(6, '0')}`
}

/**
 * 生成一个从min 到 max 的随机数
 */
export const randomNum = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

/**
 * 解析 MM-DD 格式的日期
 */
const parseMonthDay = (date: string): [month: number, day: number] => {
  const [month = NaN, day = NaN] = date.split('-').map(Number)
  return [month, day]
}

/**
 * 计算距离今天的天数并对生日时间倒计时进行排序
 */
export const sortBirthdayTime = (list: Festival[]): SortedFestival[] =>
  list
    .map((item): SortedFestival => {
      const { type = '' } = item
      const useLunar = type.startsWith('*')
      let diffDay: number

      if (useLunar) {
        const [month, day] = parseMonthDay(item.date)
        let yearOffset = -1
        do {
          const solar = Lunar.fromYmd(selfDayjs().year() + yearOffset, month, day).getSolar()
          diffDay = Math.ceil(
            selfDayjs(`${solar.getYear()}-${solar.getMonth()}-${solar.getDay()}`).diff(selfDayjs(), 'day', true),
          )
          yearOffset++
        } while (diffDay < 0)
      } else {
        diffDay = Math.ceil(selfDayjs(`${selfDayjs().format('YYYY')}-${item.date}`).diff(selfDayjs(), 'day', true))
        if (diffDay < 0) {
          diffDay = Math.ceil(
            selfDayjs(`${selfDayjs().add(1, 'year').format('YYYY')}-${item.date}`).diff(selfDayjs(), 'day', true),
          )
        }
      }

      return { ...item, type: type.replace(/^\*/, ''), useLunar, diffDay }
    })
    .sort((a, b) => a.diffDay - b.diffDay)

const CONSTELLATION_CN = [
  '白羊',
  '金牛',
  '双子',
  '巨蟹',
  '狮子',
  '处女',
  '天秤',
  '天蝎',
  '射手',
  '摩羯',
  '水瓶',
  '双鱼',
]
const CONSTELLATION_EN = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
]

/**
 * 根据月日获取星座信息
 */
export const getConstellation = (date: string): { cn: string; en: string } => {
  const [month, day] = parseMonthDay(date)
  const cn = Solar.fromYmd(selfDayjs().year(), month, day).getXingZuo()
  return {
    cn,
    en: CONSTELLATION_EN[CONSTELLATION_CN.indexOf(cn)] ?? '',
  }
}

/**
 * 获取天气城市信息
 */
export const getWeatherCityInfo = (province?: string, city?: string): WeatherCity | null => {
  let prov: WeatherCity | undefined
  if (province) {
    const provName = province.replace(/[省市]$/, '')
    prov = WEATHER_CITY.find((it) => it.city_name.includes(provName))
  }
  if (!prov) {
    console.log(`您当前填写的province: 【${province}】, 找不到该城市或省份，城市天气可能会因此不准确。请知悉 `)
  }

  // 如果找到父级地区，则在父级地区中找
  if (city) {
    const cName = city.replace(/[市区县]$/, '')
    // 先后顺序县 => 区 => 市 => 无
    for (const suffix of ['县', '区', '市', '']) {
      const c = WEATHER_CITY.find((it) => (!prov || it.pid === prov.id) && it.city_name === `${cName}${suffix}`)
      if (c) {
        return c
      }
    }
  }

  // city 找不到，那就返回prov的
  if (prov?.city_code) {
    return prov
  }

  return null
}

/**
 * 北京时间的今天
 */
const getToday = (): Solar => {
  const now = selfDayjs()
  return Solar.fromYmd(now.year(), now.month() + 1, now.date())
}

/** 法定节日，按节日当天计算 */
const STATUTORY_FESTIVALS: { name: string; getSolar: (year: number) => Solar }[] = [
  { name: '元旦', getSolar: (year) => Solar.fromYmd(year, 1, 1) },
  { name: '春节', getSolar: (year) => Lunar.fromYmd(year, 1, 1).getSolar() },
  // 清明为节气，一般在 4 月 4 日或 5 日
  {
    name: '清明节',
    getSolar: (year) => Solar.fromYmd(year, 4, 1).getLunar().getJieQiTable()['清明'] ?? Solar.fromYmd(year, 4, 5),
  },
  { name: '劳动节', getSolar: (year) => Solar.fromYmd(year, 5, 1) },
  { name: '端午节', getSolar: (year) => Lunar.fromYmd(year, 5, 5).getSolar() },
  { name: '中秋节', getSolar: (year) => Lunar.fromYmd(year, 8, 15).getSolar() },
  { name: '国庆节', getSolar: (year) => Solar.fromYmd(year, 10, 1) },
]

const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export interface RestDay {
  /** 法定节假日名称，或者 周六 / 周日 */
  name: string
  /** 是否为法定节假日 */
  isHoliday: boolean
  /** 距离今天的天数，0 为今天 */
  diffDay: number
}

/**
 * 获取下一个休息日（包括今天），会跳过调休上班的周末
 * 法定节假日和调休数据来自 lunar-javascript，还没有公布安排的年份只按节日当天和周末计算
 */
export const getNextRestDay = (): RestDay => {
  const today = getToday()
  for (let diffDay = 0; ; diffDay++) {
    const day = today.next(diffDay)
    const holiday = HolidayUtil.getHoliday(day.toYmd())
    if (holiday?.isWork()) {
      continue
    }
    if (holiday) {
      return { name: holiday.getName(), isHoliday: true, diffDay }
    }
    const festival = STATUTORY_FESTIVALS.find((item) => item.getSolar(day.getYear()).toYmd() === day.toYmd())
    if (festival) {
      return { name: festival.name, isHoliday: true, diffDay }
    }
    const week = day.getWeek()
    if (week === 0 || week === 6) {
      return { name: WEEK_NAMES[week] ?? '', isHoliday: false, diffDay }
    }
  }
}

/**
 * 获取下一个法定节日（不包括今天）
 */
export const getNextFestival = (): { name: string; diffDay: number } => {
  const today = getToday()
  const year = today.getYear()
  return [year, year + 1]
    .flatMap((y) => STATUTORY_FESTIVALS.map(({ name, getSolar }) => ({ name, diffDay: getSolar(y).subtract(today) })))
    .filter((item) => item.diffDay > 0)
    .reduce((nearest, item) => (item.diffDay < nearest.diffDay ? item : nearest))
}

/**
 * 带promise的sleep
 */
export const sleep = (time: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })
