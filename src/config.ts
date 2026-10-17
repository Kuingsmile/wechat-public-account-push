import USER_CONFIG from '../config'
import type { CallbackUser, User, UserConfig } from './types'

type Env = Record<string, string | undefined>

const readString = (env: Env, name: string): string | undefined => env[name]?.trim() || undefined

/**
 * 读取 JSON 格式的环境变量
 * 解析失败时不输出原始内容，避免在日志中泄露敏感信息
 */
const readJson = (env: Env, name: string): unknown => {
  const value = readString(env, name)
  if (value === undefined) {
    return undefined
  }
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`环境变量 ${name} 不是合法的 JSON，请检查格式`)
  }
}

const readJsonArray = <T>(env: Env, name: string): T[] | undefined => {
  const value = readJson(env, name)
  if (value !== undefined && !Array.isArray(value)) {
    throw new Error(`环境变量 ${name} 必须是 JSON 数组`)
  }
  return value as T[] | undefined
}

const readJsonObject = <T>(env: Env, name: string): T | undefined => {
  const value = readJson(env, name)
  if (value !== undefined && (typeof value !== 'object' || value === null || Array.isArray(value))) {
    throw new Error(`环境变量 ${name} 必须是 JSON 对象`)
  }
  return value as T | undefined
}

/**
 * 合并配置，优先级：单项环境变量 > USER_INFO > config/index.ts
 * 敏感信息（appID、用户微信号、模板ID 等）只通过环境变量传入，不写在仓库中
 */
export const loadConfig = (fileConfig: UserConfig, env: Env): UserConfig => {
  const config: UserConfig = { ...fileConfig, ...readJsonObject<Partial<UserConfig>>(env, 'USER_INFO') }

  const appId = readString(env, 'APP_ID')
  const appSecret = readString(env, 'APP_SECRET')
  const tianApiKey = readString(env, 'TIAN_API')
  const users = readJsonArray<User>(env, 'USERS')
  const callbackTemplateId = readString(env, 'CALLBACK_TEMPLATE_ID')
  const callbackUsers = readJsonArray<CallbackUser>(env, 'CALLBACK_USERS')

  if (appId) {
    config.APP_ID = appId
  }
  if (appSecret) {
    config.APP_SECRET = appSecret
  }
  if (tianApiKey) {
    config.TIAN_API = { ...config.TIAN_API, key: tianApiKey }
  }
  if (users) {
    config.USERS = users
  }
  if (callbackTemplateId) {
    config.CALLBACK_TEMPLATE_ID = callbackTemplateId
  }
  if (callbackUsers) {
    config.CALLBACK_USERS = callbackUsers
  }

  return config
}

const config = loadConfig(USER_CONFIG, process.env)

export default config
