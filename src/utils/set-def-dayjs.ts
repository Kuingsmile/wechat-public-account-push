import dayjs, { type ConfigType, type Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 以北京时间为准的 dayjs
 * 服务器时区为 UTC 时（如 GitHub Actions），传入的时间视为北京时间
 */
export const selfDayjs = (time?: ConfigType): Dayjs => {
  if (dayjs.tz.guess() === 'UTC' && time) {
    return dayjs(time).subtract(8, 'hour')
  }
  return dayjs(time).tz('Asia/Shanghai')
}

export const timeZone = (): string => dayjs.tz.guess()
