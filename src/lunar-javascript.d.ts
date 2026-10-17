// lunar-javascript 没有自带类型声明，这里只声明项目中用到的部分
declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar
    getYear(): number
    getMonth(): number
    getDay(): number
    /** 星期，0 为星期日 */
    getWeek(): number
    getXingZuo(): string
    getLunar(): Lunar
    /** 推移天数，负数为往前推 */
    next(days: number): Solar
    /** 与另一个日期相差的天数 */
    subtract(solar: Solar): number
    /** YYYY-MM-DD */
    toYmd(): string
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar
    getSolar(): Solar
    /** 节气表，key 为节气名称 */
    getJieQiTable(): Record<string, Solar>
  }

  /** 法定节假日或调休 */
  export class Holiday {
    getDay(): string
    getName(): string
    /** 是否调休上班 */
    isWork(): boolean
    getTarget(): string
  }

  export const HolidayUtil: {
    /** 日期格式为 YYYY-MM-DD，不是节假日或调休时返回 null */
    getHoliday(ymd: string): Holiday | null
  }
}
