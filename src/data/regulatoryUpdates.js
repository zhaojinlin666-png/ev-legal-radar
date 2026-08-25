/**
 * @typedef {Object} RegulatoryUpdate
 * @property {number} id
 * @property {string} title
 * @property {string} jurisdiction
 * @property {string} regulator
 * @property {string} publicationDate
 * @property {string|null} effectiveDate
 * @property {string|null} sourceUrl
 * @property {string[]} businessAreas
 * @property {string[]} legalTopics
 * @property {'High'|'Medium'|'Low'} riskLevel
 * @property {string} summary
 * @property {string} businessImpact
 * @property {string[]} recommendedActions
 * @property {string|null} verificationStatus
 */

/** @type {RegulatoryUpdate[]} */
export const regulatoryUpdates = [
  {
    id: 1,
    title: 'EU AI Act Guidance',
    jurisdiction: 'EU',
    regulator: 'European Commission',
    publicationDate: '2026-08-18',
    effectiveDate: null,
    sourceUrl: null,
    businessAreas: ['AI Governance'],
    legalTopics: ['AI'],
    riskLevel: 'High',
    summary:
      'New implementation guidance clarifies risk classification, technical documentation and governance duties for AI systems used in connected vehicles.',
    businessImpact: '',
    recommendedActions: [],
    verificationStatus: null,
  },
  {
    id: 2,
    title: '汽车数据安全管理若干规定（试行）',
    jurisdiction: 'China',
    regulator:
      '国家互联网信息办公室、国家发展和改革委员会、工业和信息化部、公安部、交通运输部',
    publicationDate: '2021-08-20',
    effectiveDate: '2021-10-01',
    sourceUrl: null,
    businessAreas: [
      'R&D',
      'Manufacturing',
      'Sales',
      'After-sales',
      'Data',
      'Autonomous Driving',
    ],
    legalTopics: [
      'Data Protection',
      'Cybersecurity',
      'Cross-border Data',
      'Important Data',
      'Personal Information',
    ],
    riskLevel: 'High',
    summary:
      '该规定针对汽车设计、生产、销售、使用和运维过程中产生的个人信息和重要数据建立专门的数据安全规则，明确汽车制造商、零部件及软件供应商、经销商、维修机构和出行服务企业等主体的数据处理义务，并对敏感个人信息、重要数据、数据出境、安全评估及年度报告等事项作出要求。',
    businessImpact:
      '对新能源汽车企业而言，车辆摄像头、雷达、定位系统、车联网平台、智能座舱及自动驾驶功能产生的数据都可能进入监管范围。企业需要识别个人信息、敏感个人信息和重要数据，审查数据收集必要性，并建立数据本地存储、重要数据出境、安全评估、年度报告及用户投诉处理机制。',
    recommendedActions: [
      '建立汽车数据分类分级清单',
      '识别敏感个人信息及重要数据',
      '审查智能座舱、自动驾驶和车联网的数据采集必要性',
      '检查数据跨境传输场景',
      '建立汽车数据安全年度报告机制',
      '建立用户数据投诉与权利响应流程',
    ],
    verificationStatus: 'Human-verified',
  },
  {
    id: 3,
    title: 'EU Battery Regulation',
    jurisdiction: 'EU',
    regulator: 'European Commission',
    publicationDate: '2026-08-07',
    effectiveDate: null,
    sourceUrl: null,
    businessAreas: ['Manufacturing'],
    legalTopics: [],
    riskLevel: 'Medium',
    summary:
      'The latest delegated measures detail carbon-footprint declarations, supply-chain due diligence and battery passport readiness requirements.',
    businessImpact: '',
    recommendedActions: [],
    verificationStatus: null,
  },
  {
    id: 4,
    title: 'US NHTSA Autonomous Vehicle Guidance',
    jurisdiction: 'US',
    regulator: 'NHTSA',
    publicationDate: '2026-07-29',
    effectiveDate: null,
    sourceUrl: null,
    businessAreas: ['Autonomous Driving'],
    legalTopics: [],
    riskLevel: 'Low',
    summary:
      'Revised voluntary guidance outlines recommended safety assessment, incident reporting and transparency practices for automated driving systems.',
    businessImpact: '',
    recommendedActions: [],
    verificationStatus: null,
  },
]
