export const REGULATORY_MONITORING_SOURCE = Object.freeze({
  name: '中国网信网',
  regulator: '中华人民共和国国家互联网信息办公室',
  url: 'https://www.cac.gov.cn/wxzw/sjzl/zcfg/A09370805index_1.htm',
  allowedHostnames: ['www.cac.gov.cn', 'cac.gov.cn'],
})

export const REGULATORY_RELEVANCE_KEYWORDS = Object.freeze([
  '汽车',
  '智能网联汽车',
  '新能源汽车',
  '数据安全',
  '个人信息',
  '人工智能',
  '算法',
  '网络安全',
  '数据出境',
])

export const REGULATORY_MONITORING_REQUEST = Object.freeze({
  timeoutMs: 12_000,
  sourceContentMaxCharacters: 60_000,
  userAgent:
    'EV-Legal-Radar/0.1 (on-demand regulatory research prototype)',
})
