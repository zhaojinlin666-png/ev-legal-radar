/**
 * @typedef {Object} LegalSource
 * @property {string} title
 * @property {string} article
 * @property {string} issuingAuthorities
 * @property {string} effectiveDate
 * @property {string} officialSource
 */

/**
 * @typedef {Object} LegalReviewItem
 * @property {string} requirement
 * @property {string[]} affectedActivities
 * @property {string[]} reviewQuestions
 * @property {string[]} documentsToReview
 * @property {'High'|'Medium'|'Low'} priority
 * @property {'Not reviewed'|'Under review'|'Further information required'|'Reviewed'} reviewStatus
 * @property {string|null} preliminaryObservation
 * @property {string} suggestedLegalAction
 * @property {'AI-generated'|'Human-reviewed'|'Source Verified'} verificationStatus
 * @property {LegalSource|null} legalSource
 */

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
 * @property {LegalReviewItem[]} legalReviewItems
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
    legalReviewItems: [],
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
    sourceUrl:
      'https://www.cac.gov.cn/2021-08/20/c_1631049984897667.htm',
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
    legalReviewItems: [
      {
        requirement:
          '识别并分类汽车数据处理中涉及的个人信息、敏感个人信息及重要数据。',
        affectedActivities: [
          '智能座舱、车联网平台、自动驾驶及车辆运营数据处理。',
        ],
        reviewQuestions: [
          '目前处理的汽车数据中包含哪些个人信息、敏感个人信息及重要数据？',
          '是否已有数据资产清单、数据分类分级记录及数据处理流程图可供核查？',
        ],
        documentsToReview: [
          '数据资产清单',
          '数据分类分级记录',
          '数据处理流程图',
        ],
        priority: 'High',
        reviewStatus: 'Not reviewed',
        preliminaryObservation: null,
        suggestedLegalAction:
          '建立汽车数据分类分级清单，并确认不同数据类型对应的处理规则。',
        verificationStatus: 'AI-generated',
        legalSource: null,
      },
      {
        requirement:
          '审查车辆及相关应用的个人信息告知机制是否完整覆盖法定告知事项。',
        affectedActivities: [
          '车机隐私设置',
          '首次启动车辆时的隐私提示',
          '车载显示面板',
          '用户手册',
          '汽车相关 App 中涉及个人信息处理的告知场景',
        ],
        reviewQuestions: [
          '用户手册、车机界面或 App 是否明确说明收集哪些个人信息？',
          '是否说明车辆行踪轨迹、驾驶习惯、音频、视频、图像、生物识别等信息的具体收集场景？',
          '是否说明停止收集相关信息的方法和途径？',
          '是否说明个人信息处理的目的、用途和方式？',
          '是否说明个人信息保存地点和保存期限，或者相应确定规则？',
          '是否提供查询、复制和删除个人信息的方式和途径？',
          '是否提供用户权益事务联系人的姓名和联系方式？',
        ],
        documentsToReview: [
          '用户隐私政策',
          'App 隐私政策',
          '用户手册',
          '车机隐私设置截图',
          '首次启动隐私提示截图',
          '数据字段清单',
          '数据保存规则',
        ],
        priority: 'High',
        reviewStatus: 'Not reviewed',
        preliminaryObservation: null,
        suggestedLegalAction:
          '逐项核对现有个人信息告知材料是否覆盖《汽车数据安全管理若干规定（试行）》第七条要求的告知事项，并记录缺失或尚待核实的信息。',
        verificationStatus: 'Source Verified',
        legalSource: {
          title: '汽车数据安全管理若干规定（试行）',
          article: 'Article 7',
          issuingAuthorities:
            '国家互联网信息办公室、国家发展和改革委员会、工业和信息化部、公安部、交通运输部',
          effectiveDate: '2021-10-01',
          officialSource:
            'https://www.cac.gov.cn/2021-08/20/c_1631049984897667.htm',
        },
      },
      {
        requirement:
          '识别涉及汽车数据跨境传输的业务场景，并判断是否需要进一步合规审查。',
        affectedActivities: [
          '境外研发中心访问车辆数据、全球云平台同步、跨境技术支持。',
        ],
        reviewQuestions: [
          '哪些境外研发中心、全球云平台或跨境技术支持场景会访问或同步车辆数据？',
          '相关场景中的数据类型、接收方、传输目的和存储地点是否已有记录可供核查？',
        ],
        documentsToReview: [
          '跨境数据流转图',
          '接收方清单',
          '数据传输记录',
          '相关合同及数据条款',
        ],
        priority: 'High',
        reviewStatus: 'Not reviewed',
        preliminaryObservation: null,
        suggestedLegalAction:
          '建立跨境数据传输场景台账，对数据类型、接收方、传输目的和存储地点进行记录，并进行进一步审查。',
        verificationStatus: 'AI-generated',
        legalSource: null,
      },
      {
        requirement:
          '建立针对汽车数据处理活动的用户投诉和权利响应机制。',
        affectedActivities: [
          '用户提出访问、更正、删除个人信息或投诉数据处理行为。',
        ],
        reviewQuestions: [
          '目前通过哪些渠道接收用户的数据权利请求或投诉？',
          '是否已有受理、核验、内部流转、回复和留痕记录可供核查？',
        ],
        documentsToReview: [
          '用户请求处理 SOP',
          '投诉记录',
          '内部处理日志',
          '回复模板',
        ],
        priority: 'Medium',
        reviewStatus: 'Not reviewed',
        preliminaryObservation: null,
        suggestedLegalAction:
          '建立统一的数据权利请求和投诉处理流程，明确受理、核验、内部流转、回复和留痕机制。',
        verificationStatus: 'AI-generated',
        legalSource: null,
      },
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
    legalReviewItems: [],
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
    legalReviewItems: [],
    verificationStatus: null,
  },
]
