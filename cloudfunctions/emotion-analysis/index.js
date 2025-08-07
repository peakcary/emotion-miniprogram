// 情绪分析云函数
const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 情绪分析云函数入口
 * @param {Object} event 包含情绪记录数据
 * @param {Object} context 云函数运行上下文
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { action, data, content, records } = event
    
    // 测试接口
    if (action === 'test') {
      return {
        success: true,
        message: '情绪分析云函数连接正常',
        timestamp: new Date().getTime(),
        env: wxContext.ENV
      }
    }
    
    const { action: realAction, data: realData } = event
    
    switch (action) {
      case 'analyze':
        return await analyzeEmotion(data, wxContext)
      case 'getInsights':
        return await getAIInsights(data, wxContext)
      case 'getPatterns':
        return await getEmotionPatterns(data, wxContext)
      case 'getSuggestions':
        return await getImprovementSuggestions(data, wxContext)
      default:
        throw new Error('未知的操作类型')
    }
  } catch (err) {
    console.error('情绪分析云函数错误:', err)
    return {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 分析单条情绪记录
 */
async function analyzeEmotion(emotionData, wxContext) {
  console.log('开始分析情绪:', emotionData)
  
  // 基础情绪分析
  const analysis = {
    id: emotionData.id,
    timestamp: emotionData.timestamp,
    basicMetrics: {
      intensity: emotionData.intensity,
      valence: calculateValence(emotionData.emotion),
      arousal: calculateArousal(emotionData.emotion),
      dominance: calculateDominance(emotionData.emotion)
    },
    categories: categorizeEmotion(emotionData.emotion),
    triggers: identifyTriggers(emotionData.description),
    context: analyzeContext(emotionData),
    recommendations: generateRecommendations(emotionData)
  }
  
  // 保存分析结果
  await saveAnalysisResult(emotionData.id, analysis, wxContext.OPENID)
  
  return {
    success: true,
    data: analysis,
    timestamp: new Date().toISOString()
  }
}

/**
 * 获取AI洞察
 */
async function getAIInsights(userData, wxContext) {
  console.log('生成AI洞察')
  
  // 获取用户最近的情绪记录
  const recentRecords = await getUserRecentRecords(wxContext.OPENID, 30)
  
  if (recentRecords.length === 0) {
    return {
      success: true,
      data: {
        insights: [],
        summary: '暂无足够数据生成洞察，请继续记录情绪。'
      }
    }
  }
  
  // 生成洞察
  const insights = [
    generateTrendInsight(recentRecords),
    generatePatternInsight(recentRecords),
    generateCorrelationInsight(recentRecords),
    generateSeasonalInsight(recentRecords)
  ].filter(insight => insight !== null)
  
  const summary = generateInsightSummary(insights, recentRecords)
  
  return {
    success: true,
    data: {
      insights,
      summary,
      recordCount: recentRecords.length,
      analysisDate: new Date().toISOString()
    }
  }
}

/**
 * 获取情绪模式
 */
async function getEmotionPatterns(userData, wxContext) {
  console.log('分析情绪模式')
  
  const records = await getUserRecentRecords(wxContext.OPENID, 90)
  
  if (records.length < 10) {
    return {
      success: true,
      data: {
        patterns: [],
        message: '数据量不足，需要至少10条记录才能识别模式'
      }
    }
  }
  
  const patterns = [
    analyzeTimePatterns(records),
    analyzeEmotionSequencePatterns(records),
    analyzeTriggerPatterns(records),
    analyzeIntensityPatterns(records)
  ].filter(pattern => pattern !== null)
  
  return {
    success: true,
    data: {
      patterns,
      confidence: calculatePatternConfidence(patterns, records.length),
      recordCount: records.length
    }
  }
}

/**
 * 获取改善建议
 */
async function getImprovementSuggestions(userData, wxContext) {
  console.log('生成改善建议')
  
  const records = await getUserRecentRecords(wxContext.OPENID, 30)
  const analysis = await getEmotionAnalysis(records)
  
  const suggestions = [
    generateMoodImprovementSuggestions(analysis),
    generateStressManagementSuggestions(analysis),
    generateLifestyleSuggestions(analysis),
    generateMindfulnessSuggestions(analysis)
  ].flat().filter(suggestion => suggestion !== null)
  
  // 按优先级排序
  suggestions.sort((a, b) => b.priority - a.priority)
  
  return {
    success: true,
    data: {
      suggestions: suggestions.slice(0, 5), // 返回前5个建议
      analysisBase: `基于最近${records.length}条记录的分析`
    }
  }
}

/**
 * 计算情绪效价 (正负性)
 */
function calculateValence(emotion) {
  const valenceMap = {
    '开心': 0.8, '兴奋': 0.9, '感激': 0.7, '平静': 0.5,
    '难过': -0.7, '愤怒': -0.8, '焦虑': -0.6, '困惑': -0.3
  }
  return valenceMap[emotion] || 0
}

/**
 * 计算情绪唤醒度
 */
function calculateArousal(emotion) {
  const arousalMap = {
    '兴奋': 0.9, '愤怒': 0.8, '焦虑': 0.7, '开心': 0.6,
    '困惑': 0.4, '难过': 0.3, '感激': 0.5, '平静': 0.2
  }
  return arousalMap[emotion] || 0.5
}

/**
 * 计算情绪控制感
 */
function calculateDominance(emotion) {
  const dominanceMap = {
    '开心': 0.7, '感激': 0.6, '平静': 0.8, '兴奋': 0.5,
    '愤怒': 0.3, '焦虑': 0.2, '困惑': 0.3, '难过': 0.2
  }
  return dominanceMap[emotion] || 0.5
}

/**
 * 情绪分类
 */
function categorizeEmotion(emotion) {
  const categories = {
    positive: ['开心', '兴奋', '感激', '平静'],
    negative: ['难过', '愤怒', '焦虑'],
    neutral: ['困惑']
  }
  
  for (const [category, emotions] of Object.entries(categories)) {
    if (emotions.includes(emotion)) {
      return {
        primary: category,
        secondary: getEmotionFamily(emotion)
      }
    }
  }
  
  return { primary: 'neutral', secondary: 'unknown' }
}

/**
 * 获取情绪族群
 */
function getEmotionFamily(emotion) {
  const families = {
    joy: ['开心', '兴奋'],
    sadness: ['难过'],
    anger: ['愤怒'],
    fear: ['焦虑'],
    gratitude: ['感激'],
    calm: ['平静'],
    confusion: ['困惑']
  }
  
  for (const [family, emotions] of Object.entries(families)) {
    if (emotions.includes(emotion)) {
      return family
    }
  }
  
  return 'other'
}

/**
 * 识别情绪触发因素
 */
function identifyTriggers(description) {
  if (!description) return []
  
  const triggerPatterns = {
    work: ['工作', '上班', '同事', '老板', '项目', '会议', '加班'],
    relationship: ['朋友', '家人', '恋人', '爱人', '父母', '孩子'],
    health: ['身体', '健康', '疲劳', '累', '病', '医院'],
    finance: ['钱', '经济', '工资', '消费', '贷款', '债务'],
    weather: ['天气', '下雨', '晴天', '阴天', '热', '冷'],
    sleep: ['睡觉', '失眠', '熬夜', '休息', '睡眠'],
    food: ['吃', '饿', '美食', '餐厅', '做饭']
  }
  
  const triggers = []
  const text = description.toLowerCase()
  
  for (const [category, keywords] of Object.entries(triggerPatterns)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      triggers.push({
        category,
        confidence: 0.7,
        keywords: keywords.filter(keyword => text.includes(keyword))
      })
    }
  }
  
  return triggers
}

/**
 * 分析上下文信息
 */
function analyzeContext(emotionData) {
  const context = {
    timeOfDay: getTimeOfDayCategory(emotionData.timestamp),
    dayOfWeek: getDayOfWeek(emotionData.timestamp),
    intensityLevel: getIntensityLevel(emotionData.intensity),
    inputMethod: emotionData.inputMethod || 'unknown'
  }
  
  return context
}

/**
 * 获取时间段分类
 */
function getTimeOfDayCategory(timestamp) {
  const hour = new Date(timestamp).getHours()
  
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

/**
 * 获取星期几
 */
function getDayOfWeek(timestamp) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date(timestamp).getDay()]
}

/**
 * 获取强度等级
 */
function getIntensityLevel(intensity) {
  if (intensity <= 3) return 'low'
  if (intensity <= 7) return 'medium'
  return 'high'
}

/**
 * 生成基础建议
 */
function generateRecommendations(emotionData) {
  const recommendations = []
  const emotion = emotionData.emotion
  const intensity = emotionData.intensity
  
  // 基于情绪类型的建议
  if (['难过', '焦虑'].includes(emotion) && intensity > 6) {
    recommendations.push({
      type: 'immediate',
      action: '深呼吸练习',
      description: '尝试4-7-8呼吸法：吸气4秒，屏息7秒，呼气8秒',
      priority: 'high'
    })
  }
  
  if (emotion === '愤怒' && intensity > 7) {
    recommendations.push({
      type: 'immediate',
      action: '冷静间歇',
      description: '暂时离开当前环境，散步或进行轻微运动',
      priority: 'high'
    })
  }
  
  if (['开心', '兴奋'].includes(emotion)) {
    recommendations.push({
      type: 'enhancement',
      action: '记录美好',
      description: '写下此刻的感受，为将来的低落时刻保存正能量',
      priority: 'medium'
    })
  }
  
  return recommendations
}

/**
 * 保存分析结果
 */
async function saveAnalysisResult(emotionId, analysis, openid) {
  try {
    await db.collection('emotion_analysis').add({
      data: {
        emotionId,
        analysis,
        openid,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  } catch (err) {
    console.error('保存分析结果失败:', err)
  }
}

/**
 * 获取用户最近记录
 */
async function getUserRecentRecords(openid, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data } = await db.collection('emotion_records')
      .where({
        openid,
        createTime: db.command.gte(startDate)
      })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()
    
    return data
  } catch (err) {
    console.error('获取用户记录失败:', err)
    return []
  }
}

/**
 * 生成趋势洞察
 */
function generateTrendInsight(records) {
  if (records.length < 7) return null
  
  const recentWeek = records.slice(0, 7)
  const previousWeek = records.slice(7, 14)
  
  if (previousWeek.length < 7) return null
  
  const recentAvg = recentWeek.reduce((sum, r) => sum + r.intensity, 0) / recentWeek.length
  const previousAvg = previousWeek.reduce((sum, r) => sum + r.intensity, 0) / previousWeek.length
  
  const trend = recentAvg - previousAvg
  
  let title, content, confidence
  
  if (Math.abs(trend) < 0.5) {
    title = '情绪相对稳定'
    content = '最近一周的情绪状态与上周基本持平，保持了良好的情绪稳定性。'
    confidence = 0.7
  } else if (trend > 0) {
    title = '情绪状态上升'
    content = `最近一周的平均情绪强度比上周提升了${(trend * 10).toFixed(1)}%，整体呈现积极趋势。`
    confidence = 0.8
  } else {
    title = '需要关注情绪变化'
    content = `最近一周的情绪状态有所下降，建议多关注自己的内心感受。`
    confidence = 0.8
  }
  
  return {
    type: 'trend',
    title,
    content,
    confidence,
    icon: '📈',
    data: { trend: trend.toFixed(2), recentAvg: recentAvg.toFixed(1), previousAvg: previousAvg.toFixed(1) }
  }
}

/**
 * 生成模式洞察
 */
function generatePatternInsight(records) {
  const timePatterns = analyzeTimeOfDayPatterns(records)
  
  if (!timePatterns || timePatterns.length === 0) return null
  
  const strongestPattern = timePatterns[0]
  
  return {
    type: 'pattern',
    title: '发现时间模式',
    content: `您在${getTimeDisplayName(strongestPattern.period)}的情绪状态通常${strongestPattern.trend > 0 ? '较好' : '需要关注'}。`,
    confidence: strongestPattern.confidence,
    icon: '🕐',
    data: strongestPattern
  }
}

/**
 * 生成相关性洞察
 */
function generateCorrelationInsight(records) {
  // 简化的相关性分析
  const workRelated = records.filter(r => 
    r.description && r.description.includes('工作')
  )
  
  if (workRelated.length < 3) return null
  
  const workAvg = workRelated.reduce((sum, r) => sum + r.intensity, 0) / workRelated.length
  const overallAvg = records.reduce((sum, r) => sum + r.intensity, 0) / records.length
  
  const correlation = workAvg - overallAvg
  
  if (Math.abs(correlation) < 0.5) return null
  
  return {
    type: 'correlation',
    title: '工作情绪关联',
    content: correlation > 0 
      ? '工作相关的情绪记录通常比平均水平更积极。'
      : '工作可能是影响您情绪的重要因素，建议关注工作压力。',
    confidence: 0.6,
    icon: '💼',
    data: { correlation: correlation.toFixed(2), workCount: workRelated.length }
  }
}

/**
 * 生成季节性洞察
 */
function generateSeasonalInsight(records) {
  // 这里可以添加更复杂的季节性分析
  return null
}

/**
 * 生成洞察总结
 */
function generateInsightSummary(insights, records) {
  const avgIntensity = records.reduce((sum, r) => sum + r.intensity, 0) / records.length
  const positiveCount = records.filter(r => ['开心', '兴奋', '感激', '平静'].includes(r.emotion)).length
  const positiveRatio = (positiveCount / records.length * 100).toFixed(0)
  
  return `基于最近${records.length}条记录，您的平均情绪强度为${avgIntensity.toFixed(1)}，积极情绪占比${positiveRatio}%。继续保持情绪记录有助于更好地了解自己。`
}

/**
 * 分析时间模式
 */
function analyzeTimeOfDayPatterns(records) {
  const periods = ['morning', 'afternoon', 'evening', 'night']
  const patterns = []
  
  periods.forEach(period => {
    const periodRecords = records.filter(r => getTimeOfDayCategory(r.createTime) === period)
    
    if (periodRecords.length >= 3) {
      const avgIntensity = periodRecords.reduce((sum, r) => sum + r.intensity, 0) / periodRecords.length
      const overallAvg = records.reduce((sum, r) => sum + r.intensity, 0) / records.length
      const trend = avgIntensity - overallAvg
      
      patterns.push({
        period,
        avgIntensity: avgIntensity.toFixed(1),
        trend: trend.toFixed(2),
        confidence: Math.min(0.9, periodRecords.length / 10),
        count: periodRecords.length
      })
    }
  })
  
  return patterns.sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend))
}

/**
 * 获取时间显示名称
 */
function getTimeDisplayName(period) {
  const names = {
    morning: '上午',
    afternoon: '下午', 
    evening: '傍晚',
    night: '夜晚'
  }
  return names[period] || period
}