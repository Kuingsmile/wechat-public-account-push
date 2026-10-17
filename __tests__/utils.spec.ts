import { describe, expect, test, vi } from 'vitest'

import config from '../src/config'
import type { Festival } from '../src/types'
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
} from '../src/utils'
import { selfDayjs } from '../src/utils/set-def-dayjs'

const festival = (type: string, date: string): Festival => ({ type, name: 'test', year: '2000', date })

describe('utils', () => {
  test.each([
    ['date', 'date'],
    ['minTemperature', 'min_temperature'],
    ['earthyLoveWords', 'earthy_love_words'],
    ['_earthyLoveWords', 'earthy_love_words'],
    ['NoteEn', 'note_en'],
  ])('toLowerLine %s', (src, expected) => {
    expect(toLowerLine(src)).toBe(expected)
  })

  test('getColor', () => {
    config.IS_SHOW_COLOR = false
    expect(getColor()).toBeUndefined()
    config.IS_SHOW_COLOR = true
    expect(getColor()).toMatch(/^#[\dA-Fa-f]{6}$/)
  })

  test.each([
    [1, 5],
    [10, 20],
    [50, 80],
  ])('randomNum(%i, %i)', (min, max) => {
    const random = randomNum(min, max)
    expect(random).toBeGreaterThanOrEqual(min)
    expect(random).toBeLessThanOrEqual(max)
  })

  test('sortBirthdayTime sorts by days remaining, rolling past dates into next year', () => {
    vi.setSystemTime('2022-02-09')
    const sorted = sortBirthdayTime([festival('节日', '02-04'), festival('节日', '03-06'), festival('节日', '09-09')])
    expect(sorted.map(({ date, diffDay }) => ({ date, diffDay }))).toEqual([
      { date: '03-06', diffDay: 25 },
      { date: '09-09', diffDay: 212 },
      { date: '02-04', diffDay: 360 },
    ])
  })

  test('sortBirthdayTime converts lunar dates and strips the * marker', () => {
    // 2022 年农历八月十五为公历 9 月 10 日
    vi.setSystemTime('2022-09-03')
    const input = [festival('*生日', '08-15')]
    expect(sortBirthdayTime(input)).toEqual([{ ...input[0], type: '生日', useLunar: true, diffDay: 7 }])
    // 不修改传入的配置
    expect(input[0]?.type).toBe('*生日')
  })

  test('getConstellation', () => {
    expect(getConstellation('09-22')).toEqual({ cn: '处女', en: 'virgo' })
    expect(getConstellation('09-23')).toEqual({ cn: '天秤', en: 'libra' })
  })

  test('getWeatherCityInfo', () => {
    const shunyi = {
      area_code: '010',
      city_code: '101010400',
      city_name: '顺义区',
      ctime: '2019-07-11 16:56:44',
      id: 510,
      pid: 1,
      post_code: '101300',
    }
    const changwu = {
      id: 2673,
      pid: 317,
      city_code: '101110209',
      city_name: '长武县',
      post_code: null,
      area_code: null,
      ctime: '2019-07-11 16:33:41',
    }
    expect(getWeatherCityInfo('北京', '顺义')).toEqual(shunyi)
    expect(getWeatherCityInfo('北京市', '顺义区')).toEqual(shunyi)
    expect(getWeatherCityInfo('咸阳', '长武')).toEqual(changwu)
    expect(getWeatherCityInfo('', '长武县')).toEqual(changwu)
    expect(getWeatherCityInfo('咸阳市', '长武县')).toEqual(changwu)
    expect(getWeatherCityInfo('河南', '周口')).toEqual({
      area_code: '0394',
      city_code: '101181401',
      city_name: '周口',
      ctime: '2019-07-11 17:31:01',
      id: 162,
      pid: 10,
      post_code: '466000',
    })
    // 找不到城市时回退到省份（省份需要有 city_code）
    expect(getWeatherCityInfo('北京', '未知')).toEqual({
      area_code: '010',
      city_code: '101010100',
      city_name: '北京',
      ctime: '2019-07-11 17:30:06',
      id: 1,
      pid: 0,
      post_code: '100000',
    })
    expect(getWeatherCityInfo('安徽', '未知')).toBeNull()
    expect(getWeatherCityInfo('未知', '未知')).toBeNull()
  })

  test.each([
    ['2026-10-14', { name: '周六', isHoliday: false, diffDay: 3 }],
    ['2026-09-28', { name: '国庆节', isHoliday: true, diffDay: 3 }],
    ['2026-10-03', { name: '国庆节', isHoliday: true, diffDay: 0 }],
    // 国庆节调休，周六上班
    ['2026-10-10', { name: '周日', isHoliday: false, diffDay: 1 }],
    // 还没有公布放假安排的年份，节日当天也算休息日
    ['2035-04-04', { name: '清明节', isHoliday: true, diffDay: 1 }],
    // UTC 23:30 已经是北京时间周六
    ['2026-10-16 23:30:00', { name: '周六', isHoliday: false, diffDay: 0 }],
  ])('getNextRestDay %s', (date, expected) => {
    vi.setSystemTime(date)
    expect(getNextRestDay()).toEqual(expected)
  })

  test.each([
    // 不包括今天
    ['2026-10-01', { name: '元旦', diffDay: 92 }],
    ['2026-12-31', { name: '元旦', diffDay: 1 }],
    // 农历节日
    ['2027-01-04', { name: '春节', diffDay: 33 }],
    // 节气
    ['2035-04-04', { name: '清明节', diffDay: 1 }],
  ])('getNextFestival %s', (date, expected) => {
    vi.setSystemTime(date)
    expect(getNextFestival()).toEqual(expected)
  })

  test('selfDayjs treats input as Beijing time when the server runs in UTC', () => {
    expect(selfDayjs('2022-09-09 12:00:00').hour()).toBe(4)
  })

  test('sleep', async () => {
    const start = Date.now()
    await sleep(20)
    expect(Date.now() - start).toBeGreaterThanOrEqual(15)
  })
})
