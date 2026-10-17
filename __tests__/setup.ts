import { afterEach, beforeEach, vi } from 'vitest'

import config from '../src/config'
import { clearRunTimeStorage } from '../src/store'

const initialConfig = structuredClone(config)

beforeEach(() => {
  // 测试中不输出业务日志
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  clearRunTimeStorage()
  vi.useRealTimers()
  // 还原测试中修改过的配置
  for (const key of Object.keys(config)) {
    Reflect.deleteProperty(config, key)
  }
  Object.assign(config, structuredClone(initialConfig))
})
