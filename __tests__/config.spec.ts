import { describe, expect, test } from 'vitest'

import { loadConfig } from '../src/config'
import type { UserConfig } from '../src/types'

const fileConfig: UserConfig = {
  TIAN_API: { weather: 3 },
  PROVINCE: '',
  CITY: '',
  USERS: [],
}

const users = [{ name: '老婆', id: 'open-id', useTemplateId: 'template-id' }]

describe('loadConfig', () => {
  test('returns the file config without environment variables', () => {
    expect(loadConfig(fileConfig, {})).toEqual(fileConfig)
  })

  test('reads sensitive values from environment variables', () => {
    const config = loadConfig(fileConfig, {
      APP_ID: 'app-id',
      APP_SECRET: 'app-secret',
      TIAN_API: 'tian-key',
      USERS: JSON.stringify(users),
      CALLBACK_TEMPLATE_ID: 'callback-template',
      CALLBACK_USERS: JSON.stringify([{ name: '自己', id: 'my-id' }]),
    })
    expect(config).toEqual({
      ...fileConfig,
      APP_ID: 'app-id',
      APP_SECRET: 'app-secret',
      TIAN_API: { weather: 3, key: 'tian-key' },
      USERS: users,
      CALLBACK_TEMPLATE_ID: 'callback-template',
      CALLBACK_USERS: [{ name: '自己', id: 'my-id' }],
    })
    // 不修改原配置
    expect(fileConfig.TIAN_API).toEqual({ weather: 3 })
  })

  test('ignores empty values, since GitHub passes unset secrets as empty strings', () => {
    const config = loadConfig(fileConfig, { APP_ID: '', APP_SECRET: '  ', USERS: '', USER_INFO: '' })
    expect(config).toEqual(fileConfig)
  })

  test('trims whitespace around secrets', () => {
    expect(loadConfig(fileConfig, { APP_ID: ' app-id\n' }).APP_ID).toBe('app-id')
  })

  test('applies USER_INFO over the file config, and single variables over USER_INFO', () => {
    const config = loadConfig(fileConfig, {
      USER_INFO: JSON.stringify({ CITY: '杭州', APP_ID: 'from-user-info', USERS: users }),
      APP_ID: 'from-env',
    })
    expect(config).toMatchObject({ CITY: '杭州', APP_ID: 'from-env', USERS: users })
  })

  test('rejects invalid JSON without echoing its content', () => {
    expect(() => loadConfig(fileConfig, { USERS: '[{"id": "secret-open-id",' })).toThrow(
      '环境变量 USERS 不是合法的 JSON，请检查格式',
    )
    expect(() => loadConfig(fileConfig, { USERS: '[{"id": "secret-open-id",' })).not.toThrow(/secret-open-id/)
  })

  test('rejects JSON of the wrong shape', () => {
    expect(() => loadConfig(fileConfig, { USERS: '{}' })).toThrow('环境变量 USERS 必须是 JSON 数组')
    expect(() => loadConfig(fileConfig, { CALLBACK_USERS: '"x"' })).toThrow('环境变量 CALLBACK_USERS 必须是 JSON 数组')
    expect(() => loadConfig(fileConfig, { USER_INFO: '[]' })).toThrow('环境变量 USER_INFO 必须是 JSON 对象')
  })
})
