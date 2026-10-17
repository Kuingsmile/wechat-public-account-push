import dayjs from 'dayjs'

import config from './config'
import { getAggregatedData, getCallbackTemplateParams, sendMessageReply } from './services'

/**
 * 获取数据并推送消息
 */
const pushMessages = async (): Promise<void> => {
  console.log('\n\n')
  console.log(dayjs().format('YYYY-MM-DD HH:mm:ss'))

  // 处理好的用户数据
  console.log('---')
  console.log('【数据获取】开始')
  const aggregatedData = await getAggregatedData()
  console.log('【数据获取】结束')
  console.log('---')

  // 公众号推送消息
  console.log('---')
  console.log('【常规模板】推送开始')
  const summary = await sendMessageReply(aggregatedData)
  console.log('【常规模板】推送结束')
  console.log('---')

  // 发送回执
  if (config.CALLBACK_TEMPLATE_ID) {
    console.log('---')
    console.log('【推送完成提醒】推送开始')
    await sendMessageReply(config.CALLBACK_USERS ?? [], config.CALLBACK_TEMPLATE_ID, getCallbackTemplateParams(summary))
    console.log('【推送完成提醒】推送结束')
    console.log('---')
  }
}

/**
 * 仅打印模板参数，不推送消息，用于检查配置
 */
const logParams = async (): Promise<void> => {
  const aggregatedData = await getAggregatedData()
  aggregatedData.forEach((item) => {
    console.log(item.wxTemplateParams)
  })
}

if (process.argv.includes('--params-log')) {
  await logParams()
} else {
  await pushMessages()
}
