/**
 * 重要节日
 * type 只能填 “生日” 或 “节日”；日期为阴历时在前面加 * 符号，例如 “*生日”
 */
export interface Festival {
  type: string
  name: string
  year: string
  /** 格式为 MM-DD */
  date: string
  /** 是否展示岁数，仅 type 为生日时生效 */
  isShowAge?: boolean
}

/** 自定义纪念日/倒数日，keyword 会作为模板字段暴露 */
export interface CustomizedDate {
  keyword: string
  /** 格式为 YYYY-MM-DD */
  date: string
}

/** 区分单双周的课表 */
export interface OddEvenCourseSchedule {
  /** 单双周的基准 */
  benchmark: {
    date: string
    isOdd: boolean
  }
  courses: {
    odd?: string[][]
    even?: string[][]
  }
}

/** 数组形式为不区分单双周的课表，下标 0 ~ 6 分别对应周一到周日 */
export type CourseSchedule = string[][] | OddEvenCourseSchedule

/** 自定义文本插槽，contents 为数组时每次随机取一条 */
export interface Slot {
  keyword: string
  contents: string | string[]
}

export type HoroscopeDateType = '今日' | '明日' | '本周' | '本月' | '今年'

export interface User {
  /** 想要发送的人的名字 */
  name: string
  /** 扫码关注微信测试号后生成的一段字符串，在测试号后台能看到 */
  id: string
  /** 想要对他发送的模板消息的模板ID */
  useTemplateId?: string
  province?: string
  city?: string
  /** 新历生日，仅用作获取星座运势，格式为 MM-DD */
  horoscopeDate?: string
  horoscopeDateType?: HoroscopeDateType | ''
  /** 专属节日提醒，填写后不再使用 FESTIVALS */
  festivals?: Festival[]
  /** 专属纪念日，填写后不再使用 CUSTOMIZED_DATE_LIST */
  customizedDateList?: CustomizedDate[]
  courseSchedule?: CourseSchedule | null
}

export interface CallbackUser {
  name: string
  id: string
}

/** 功能开关，填 false 关闭对应功能 */
export interface SwitchConfig {
  weather?: boolean
  holidaytts?: boolean
  /** 金山每日一句 */
  CIBA?: boolean
  oneTalk?: boolean
  earthyLoveWords?: boolean
  momentCopyrighting?: boolean
  poisonChickenSoup?: boolean
  poetry?: boolean
  horoscope?: boolean
  birthdayMessage?: boolean
  courseSchedule?: boolean
}

/** 天行API，数字表示获取条数，填 0 或 false 关闭 */
export interface TianApiConfig {
  key?: string
  morningGreeting?: boolean | number
  eveningGreeting?: boolean | number
  weather?: boolean | number
  networkHot?: boolean | number
  networkHotType?: 'default' | 'title'
}

export interface UserConfig {
  /** 微信测试号 APP_ID，推荐通过 GitHub Secrets 配置 */
  APP_ID?: string
  /** 微信测试号 APP_SECRET，推荐通过 GitHub Secrets 配置 */
  APP_SECRET?: string
  /** 每分钟最大推送数，超过后休眠 SLEEP_TIME 毫秒再继续，默认 5 */
  MAX_PUSH_ONE_MINUTE?: number
  /** 默认 65000 */
  SLEEP_TIME?: number
  SWITCH?: SwitchConfig | null
  TIAN_API?: TianApiConfig
  /** 是否给文字设置多彩颜色 */
  IS_SHOW_COLOR?: boolean
  /** 每日一言的内容类型：动画，漫画，游戏，小说，原创，网络，其他；留空则随机 */
  LITERARY_PREFERENCE?: string
  USERS: User[]
  /** 【推送完成提醒】模板id */
  CALLBACK_TEMPLATE_ID?: string
  CALLBACK_USERS?: CallbackUser[]
  PROVINCE?: string
  CITY?: string
  FESTIVALS?: Festival[] | null
  /** 仅展示最近的 N 个重要节日，0 为全部展示 */
  FESTIVALS_LIMIT?: number
  CUSTOMIZED_DATE_LIST?: CustomizedDate[] | null
  COURSE_SCHEDULE?: CourseSchedule | null
  SLOT_LIST?: Slot[] | null
}

export type TemplateParamValue = string | number | null | undefined

/** 推送给微信模板的单个字段，name 对应模板中的 {{name.DATA}} */
export interface TemplateParam {
  name: string
  value: TemplateParamValue
  color?: string | undefined
}

/** 消息接收者 */
export interface Recipient {
  name: string
  id: string
  useTemplateId?: string | undefined
  wxTemplateParams?: TemplateParam[]
}

export interface SendResult {
  name: string
  success: boolean
}

export interface SendSummary {
  needPostNum: number
  successPostNum: number
  failPostNum: number
  successPostIds: string
  failPostIds: string
}

export interface WeatherCity {
  id: number
  pid: number
  city_code: string
  city_name: string
  post_code: string | null
  area_code: string | null
  ctime: string | null
}
