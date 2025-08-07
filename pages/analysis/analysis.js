// pages/analysis/analysis.js
const app = getApp()

Page({
  data: {
    // 时间选择
    currentPeriod: 'week',
    timePeriods: [
      { label: '最近7天', value: 'week' },
      { label: '最近30天', value: 'month' },
      { label: '最近90天', value: 'quarter' },
      { label: '自定义', value: 'custom' }
    ],
    startDate: '',
    endDate: '',
    periodSummary: '',

    // 图表相关
    chartType: 'line', // line, bar
    hasChartData: false,
    chartLegend: [],

    // 统计数据
    totalRecords: 0,
    averageIntensity: 0,
    streakDays: 0,
    dominantEmotion: '',
    dominantPercentage: 0,
    emotionStats: [],

    // AI洞察
    aiInsights: [],
    insightLoading: false,

    // 模式识别
    currentPatternType: 'time',
    patternTypes: [
      { label: '时间模式', value: 'time' },
      { label: '触发模式', value: 'trigger' },
      { label: '关联模式', value: 'correlation' }
    ],
    timePatterns: [],
    triggerPatterns: [],
    correlationPatterns: [],
    currentPatterns: [],

    // 改善建议
    suggestions: [],

    // 导出相关
    showReportModal: false,
    reportTypes: [
      { label: '简洁版', value: 'simple' },
      { label: '详细版', value: 'detailed' },
      { label: '专业版', value: 'professional' }
    ],
    selectedReportType: 'simple',

    // 加载状态
    isLoading: false,
    loadingText: '正在分析数据...'
  },

  onLoad() {
    console.log('分析页面加载')
    try {
      // 添加安全检查
      if (typeof this.initAnalysis === 'function') {
        this.initAnalysis()
      } else {
        console.error('initAnalysis方法不存在')
        this.loadEmotionData() // 降级处理
      }
    } catch (error) {
      console.error('分析页面初始化错误:', error)
      // 降级处理：只加载基础数据
      try {
        this.loadEmotionData()
      } catch (loadError) {
        console.error('基础数据加载失败:', loadError)
        wx.showToast({
          title: '数据加载失败，请重试',
          icon: 'none'
        })
      }
    }
  },

  onShow() {
    console.log('分析页面显示')
    try {
      this.refreshAnalysis()
    } catch (error) {
      console.error('分析页面刷新错误:', error)
    }
  },

  // 初始化分析
  initAnalysis() {
    try {
      this.loadEmotionData()
      this.generateAIInsights()
      this.identifyPatterns()
      this.generateSuggestions()
    } catch (error) {
      console.error('初始化分析过程错误:', error)
      // 最小化处理，只加载基础数据
      try {
        this.loadEmotionData()
      } catch (loadError) {
        console.error('加载基础数据也失败:', loadError)
        this.setData({
          totalRecords: 0,
          hasChartData: false
        })
      }
    }
  },

  // 刷新分析数据
  refreshAnalysis() {
    this.loadEmotionData()
  },

  // 切换时间周期
  switchPeriod(e) {
    const period = e.currentTarget.dataset.period
    this.setData({ currentPeriod: period })
    
    if (period !== 'custom') {
      this.setData({
        startDate: '',
        endDate: ''
      })
    }
    
    this.loadEmotionData()
  },

  // 开始日期选择
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value })
    this.loadEmotionData()
  },

  // 结束日期选择
  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value })
    this.loadEmotionData()
  },

  // 加载情绪数据
  loadEmotionData() {
    try {
      const { currentPeriod, startDate, endDate } = this.data
      
      // 获取所有记录
      const allRecords = wx.getStorageSync('emotionRecords') || []
      console.log('获取到记录数:', allRecords.length)
      
      // 根据时间周期过滤数据
      let filteredRecords = this.filterRecordsByPeriod(allRecords, currentPeriod, startDate, endDate)
      console.log('过滤后记录数:', filteredRecords.length)
      
      // 更新周期摘要
      this.updatePeriodSummary(filteredRecords)
      
      // 生成统计数据
      this.generateStatistics(filteredRecords)
      
      // 绘制图表
      this.drawTrendChart(filteredRecords)
      this.drawEmotionPieChart(filteredRecords)
      
    } catch (error) {
      console.error('加载情绪数据错误:', error)
      // 设置默认状态
      this.setData({
        totalRecords: 0,
        hasChartData: false,
        periodSummary: '数据加载失败'
      })
    }
  },

  // 根据周期过滤记录
  filterRecordsByPeriod(records, period, startDate, endDate) {
    const now = new Date()
    let filterDate

    switch (period) {
      case 'week':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (startDate && endDate) {
          return records.filter(record => {
            const recordDate = new Date(record.timestamp).toDateString()
            return recordDate >= new Date(startDate).toDateString() && 
                   recordDate <= new Date(endDate).toDateString()
          })
        }
        return records
      default:
        return records
    }

    return records.filter(record => new Date(record.timestamp) >= filterDate)
  },

  // 更新周期摘要
  updatePeriodSummary(records) {
    const { currentPeriod } = this.data
    let summary = ''

    if (records.length === 0) {
      summary = '该时期暂无记录'
    } else {
      const days = this.calculateDaySpan(records)
      summary = `${days}天内共${records.length}条记录`
    }

    this.setData({ periodSummary: summary })
  },

  // 计算天数跨度
  calculateDaySpan(records) {
    if (records.length === 0) return 0
    
    const dates = records.map(r => new Date(r.timestamp).toDateString())
    const uniqueDates = [...new Set(dates)]
    return uniqueDates.length
  },

  // 生成统计数据
  generateStatistics(records) {
    if (records.length === 0) {
      this.setData({
        totalRecords: 0,
        averageIntensity: 0,
        streakDays: 0,
        dominantEmotion: '暂无',
        dominantPercentage: 0,
        emotionStats: [],
        hasChartData: false
      })
      return
    }

    // 基础统计
    const totalRecords = records.length
    const totalIntensity = records.reduce((sum, r) => sum + r.intensity, 0)
    const averageIntensity = (totalIntensity / totalRecords).toFixed(1)

    // 计算连续记录天数
    const streakDays = this.calculateStreak(records)

    // 情绪分布统计
    const emotionCount = {}
    records.forEach(record => {
      const emotion = record.emotion.name
      emotionCount[emotion] = (emotionCount[emotion] || 0) + 1
    })

    // 生成情绪统计数组
    const emotionStats = Object.entries(emotionCount)
      .map(([emotion, count]) => {
        const percentage = ((count / totalRecords) * 100).toFixed(1)
        const record = records.find(r => r.emotion.name === emotion)
        return {
          emotion,
          count,
          percentage: parseFloat(percentage),
          emoji: record?.emotion.emoji || '😊',
          color: this.getEmotionColor(emotion)
        }
      })
      .sort((a, b) => b.count - a.count)

    // 主要情绪
    const dominantEmotion = emotionStats[0]?.emotion || '暂无'
    const dominantPercentage = emotionStats[0]?.percentage || 0

    this.setData({
      totalRecords,
      averageIntensity,
      streakDays,
      dominantEmotion,
      dominantPercentage,
      emotionStats,
      hasChartData: true
    })
  },

  // 计算连续记录天数
  calculateStreak(records) {
    if (records.length === 0) return 0

    const dates = records.map(r => new Date(r.timestamp).toDateString())
    const uniqueDates = [...new Set(dates)].sort()
    
    let streak = 1
    const today = new Date().toDateString()
    
    // 检查是否包含今天
    if (!uniqueDates.includes(today)) return 0

    // 从今天开始往前计算连续天数
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(uniqueDates[i + 1])
      const prevDate = new Date(uniqueDates[i])
      const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
      
      if (dayDiff === 1) {
        streak++
      } else {
        break
      }
    }

    return streak
  },

  // 获取情绪颜色
  getEmotionColor(emotion) {
    const colorMap = {
      '开心': '#FFD54F',
      '平静': '#81C784', 
      '悲伤': '#64B5F6',
      '愤怒': '#E57373',
      '焦虑': '#FF8A65',
      '疲惫': '#A1887F',
      '温暖': '#F8BBD9',
      '困惑': '#B39DDB'
    }
    return colorMap[emotion] || '#9E9E9E'
  },

  // 绘制趋势图
  drawTrendChart(records) {
    try {
      if (records.length === 0) return

      const ctx = wx.createCanvasContext('trendChart')
      if (!ctx) {
        console.error('无法创建Canvas上下文')
        return
      }
      
      const canvasWidth = 300
      const canvasHeight = 200
      const padding = 40

      // 准备数据
      const chartData = this.prepareChartData(records)
      
      // 清空画布
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)
      
      if (this.data.chartType === 'line') {
        this.drawLineChart(ctx, chartData, canvasWidth, canvasHeight, padding)
      } else {
        this.drawBarChart(ctx, chartData, canvasWidth, canvasHeight, padding)
      }
      
      ctx.draw()
    } catch (error) {
      console.error('绘制趋势图错误:', error)
    }
  },

  // 准备图表数据
  prepareChartData(records) {
    // 按日期分组
    const dailyData = {}
    records.forEach(record => {
      const date = new Date(record.timestamp).toDateString()
      if (!dailyData[date]) {
        dailyData[date] = []
      }
      dailyData[date].push(record.intensity)
    })

    // 计算每日平均强度
    const chartData = Object.entries(dailyData)
      .map(([date, intensities]) => ({
        date: new Date(date),
        intensity: intensities.reduce((sum, i) => sum + i, 0) / intensities.length
      }))
      .sort((a, b) => a.date - b.date)

    return chartData
  },

  // 绘制折线图
  drawLineChart(ctx, data, width, height, padding) {
    if (data.length === 0) return

    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding
    
    // 绘制坐标轴
    ctx.setStrokeStyle('#E0E0E0')
    ctx.setLineWidth(1)
    
    // Y轴
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()
    
    // X轴
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // 绘制网格线
    for (let i = 1; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i
      ctx.setStrokeStyle('#F5F5F5')
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // 绘制数据线
    ctx.setStrokeStyle('#4CAF50')
    ctx.setLineWidth(2)
    ctx.beginPath()

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = height - padding - (point.intensity / 10) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()

    // 绘制数据点
    ctx.setFillStyle('#4CAF50')
    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index
      const y = height - padding - (point.intensity / 10) * chartHeight
      
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })
  },

  // 绘制柱状图
  drawBarChart(ctx, data, width, height, padding) {
    if (data.length === 0) return

    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding
    const barWidth = chartWidth / data.length * 0.6

    // 绘制坐标轴
    ctx.setStrokeStyle('#E0E0E0')
    ctx.setLineWidth(1)
    
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // 绘制柱子
    data.forEach((point, index) => {
      const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length - barWidth) / 2
      const barHeight = (point.intensity / 10) * chartHeight
      const y = height - padding - barHeight
      
      ctx.setFillStyle('#4CAF50')
      ctx.fillRect(x, y, barWidth, barHeight)
    })
  },

  // 绘制情绪饼图
  drawEmotionPieChart(records) {
    try {
      if (records.length === 0) return

      const ctx = wx.createCanvasContext('emotionPieChart')
      if (!ctx) {
        console.error('无法创建饼图Canvas上下文')
        return
      }
      
      const centerX = 75
      const centerY = 75
      const radius = 60

      // 清空画布
      ctx.clearRect(0, 0, 150, 150)

      // 计算角度
      let startAngle = 0
      if (this.data.emotionStats && this.data.emotionStats.length > 0) {
        this.data.emotionStats.forEach(stat => {
          const angle = (stat.percentage / 100) * 2 * Math.PI
          
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle)
          ctx.setFillStyle(stat.color)
          ctx.fill()
          
          startAngle += angle
        })
      }

      ctx.draw()
    } catch (error) {
      console.error('绘制情绪饼图错误:', error)
    }
  },

  // 切换图表类型
  switchChartType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ chartType: type })
    
    // 重新绘制图表
    const allRecords = wx.getStorageSync('emotionRecords') || []
    const filteredRecords = this.filterRecordsByPeriod(
      allRecords, 
      this.data.currentPeriod, 
      this.data.startDate, 
      this.data.endDate
    )
    this.drawTrendChart(filteredRecords)
  },

  // 图表触摸事件
  onChartTouch(e) {
    // 可以实现图表交互功能
    console.log('图表触摸:', e)
  },

  // 生成AI洞察
  generateAIInsights() {
    try {
      this.setData({ insightLoading: true })

      // 模拟AI分析延迟
      setTimeout(() => {
        try {
          const insights = this.mockAIInsights()
          this.setData({
            aiInsights: insights,
            insightLoading: false
          })
        } catch (error) {
          console.error('生成AI洞察错误:', error)
          this.setData({
            aiInsights: [],
            insightLoading: false
          })
        }
      }, 2000)
    } catch (error) {
      console.error('启动AI洞察分析错误:', error)
      this.setData({
        aiInsights: [],
        insightLoading: false
      })
    }
  },

  // 模拟AI洞察数据
  mockAIInsights() {
    const { totalRecords, averageIntensity, dominantEmotion } = this.data
    
    if (totalRecords === 0) return []

    const insights = []

    // 情绪稳定性分析
    if (averageIntensity > 7) {
      insights.push({
        id: 'intensity_high',
        title: '情绪强度偏高',
        content: '最近情绪波动较大，建议关注压力管理',
        icon: '../../assets/icons/warning.png',
        confidence: 85,
        actions: ['查看放松练习', '设置提醒']
      })
    } else if (averageIntensity < 4) {
      insights.push({
        id: 'intensity_low',
        title: '情绪强度偏低',
        content: '可能处于低迷状态，建议增加积极活动',
        icon: '../../assets/icons/boost.png',
        confidence: 78,
        actions: ['查看激励内容', '制定计划']
      })
    }

    // 主要情绪分析
    if (dominantEmotion === '焦虑') {
      insights.push({
        id: 'anxiety_pattern',
        title: '焦虑情绪突出',
        content: '焦虑是主要情绪状态，建议学习应对技巧',
        icon: '../../assets/icons/anxiety.png',
        confidence: 92,
        actions: ['深呼吸练习', '专业咨询']
      })
    }

    return insights
  },

  // 识别模式
  identifyPatterns() {
    const allRecords = wx.getStorageSync('emotionRecords') || []
    
    this.identifyTimePatterns(allRecords)
    this.identifyTriggerPatterns(allRecords)
    this.identifyCorrelationPatterns(allRecords)
    
    // 设置当前显示的模式
    this.updateCurrentPatterns()
  },

  // 识别时间模式
  identifyTimePatterns(records) {
    const timePatterns = []
    
    // 分析一周中的模式
    const weekdayStats = {}
    records.forEach(record => {
      const weekday = new Date(record.timestamp).getDay()
      if (!weekdayStats[weekday]) {
        weekdayStats[weekday] = []
      }
      weekdayStats[weekday].push(record.intensity)
    })

    // 找出最差的一天
    let worstDay = -1
    let worstAvg = 10
    Object.entries(weekdayStats).forEach(([day, intensities]) => {
      const avg = intensities.reduce((sum, i) => sum + i, 0) / intensities.length
      if (avg < worstAvg) {
        worstAvg = avg
        worstDay = parseInt(day)
      }
    })

    if (worstDay !== -1) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      timePatterns.push({
        id: 'worst_weekday',
        title: `${dayNames[worstDay]}情绪较低`,
        description: `${dayNames[worstDay]}的平均情绪强度为${worstAvg.toFixed(1)}，明显低于其他日期`,
        confidence: 75
      })
    }

    this.setData({ timePatterns })
  },

  // 识别触发模式
  identifyTriggerPatterns(records) {
    const triggerPatterns = []
    
    // 分析标签相关性
    const tagEmotions = {}
    records.forEach(record => {
      record.tags?.forEach(tag => {
        if (!tagEmotions[tag]) {
          tagEmotions[tag] = []
        }
        tagEmotions[tag].push({
          emotion: record.emotion.name,
          intensity: record.intensity
        })
      })
    })

    // 找出问题标签
    Object.entries(tagEmotions).forEach(([tag, emotions]) => {
      if (emotions.length >= 3) {
        const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length
        const negativeCount = emotions.filter(e => 
          ['悲伤', '愤怒', '焦虑'].includes(e.emotion)
        ).length
        
        if (avgIntensity < 5 || negativeCount / emotions.length > 0.6) {
          triggerPatterns.push({
            id: `trigger_${tag}`,
            title: `${tag}相关情绪波动`,
            description: `与"${tag}"相关的记录中，情绪强度平均为${avgIntensity.toFixed(1)}`,
            tags: [tag],
            confidence: Math.min(90, emotions.length * 10)
          })
        }
      }
    })

    this.setData({ triggerPatterns })
  },

  // 识别关联模式
  identifyCorrelationPatterns(records) {
    const correlationPatterns = []
    
    // 简单的强度-时间关联分析
    const hourIntensity = {}
    records.forEach(record => {
      const hour = new Date(record.timestamp).getHours()
      if (!hourIntensity[hour]) {
        hourIntensity[hour] = []
      }
      hourIntensity[hour].push(record.intensity)
    })

    // 找出强度与时间的关联
    const hourAvgs = Object.entries(hourIntensity).map(([hour, intensities]) => ({
      hour: parseInt(hour),
      avg: intensities.reduce((sum, i) => sum + i, 0) / intensities.length
    }))

    if (hourAvgs.length >= 3) {
      const sorted = hourAvgs.sort((a, b) => a.avg - b.avg)
      const lowest = sorted[0]
      const highest = sorted[sorted.length - 1]
      
      if (highest.avg - lowest.avg > 2) {
        correlationPatterns.push({
          id: 'time_intensity_correlation',
          title: '时间-情绪强度关联',
          description: `${lowest.hour}:00左右情绪强度最低(${lowest.avg.toFixed(1)})，${highest.hour}:00左右最高(${highest.avg.toFixed(1)})`,
          strength: Math.min(95, (highest.avg - lowest.avg) * 20)
        })
      }
    }

    this.setData({ correlationPatterns })
  },

  // 切换模式类型
  switchPatternType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ currentPatternType: type })
    this.updateCurrentPatterns()
  },

  // 更新当前显示的模式
  updateCurrentPatterns() {
    const { currentPatternType, timePatterns, triggerPatterns, correlationPatterns } = this.data
    let currentPatterns = []

    switch (currentPatternType) {
      case 'time':
        currentPatterns = timePatterns
        break
      case 'trigger':
        currentPatterns = triggerPatterns
        break
      case 'correlation':
        currentPatterns = correlationPatterns
        break
    }

    this.setData({ currentPatterns })
  },

  // 생성 개선 제안
  generateSuggestions() {
    const { averageIntensity, dominantEmotion, streakDays } = this.data
    const suggestions = []

    // 基于平均强度的建议
    if (averageIntensity < 5) {
      suggestions.push({
        id: 'mood_boost',
        title: '情绪提升计划',
        description: '制定积极活动计划，每天至少做一件让自己开心的事',
        priority: '高优先级',
        score: 8,
        icon: '../../assets/icons/boost.png'
      })
    }

    // 基于连续天数的建议  
    if (streakDays >= 7) {
      suggestions.push({
        id: 'consistency_reward',
        title: '坚持奖励',
        description: '已连续记录${streakDays}天！奖励自己一个小礼物吧',
        priority: '建议执行',
        score: 7,
        icon: '../../assets/icons/reward.png'
      })
    } else if (streakDays < 3) {
      suggestions.push({
        id: 'consistency_improve',
        title: '规律记录',
        description: '建议设置每日提醒，养成规律的情绪记录习惯',
        priority: '建议执行',
        score: 6,
        icon: '../../assets/icons/reminder.png'
      })
    }

    // 基于主要情绪的建议
    if (dominantEmotion === '焦虑') {
      suggestions.push({
        id: 'anxiety_management',
        title: '焦虑管理',
        description: '学习4-7-8呼吸法，每天练习10分钟缓解焦虑',
        priority: '高优先级',
        score: 9,
        icon: '../../assets/icons/breathe.png'
      })
    }

    this.setData({ suggestions })
  },

  // 处理洞察操作
  handleInsightAction(e) {
    const action = e.currentTarget.dataset.action
    console.log('处理洞察操作:', action)
    
    wx.showModal({
      title: '功能提示',
      content: `即将为您打开"${action}"功能`,
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到具体功能页面
          console.log('执行操作:', action)
        }
      }
    })
  },

  // 忽略建议
  dismissSuggestion(e) {
    const id = e.currentTarget.dataset.id
    const suggestions = this.data.suggestions.filter(s => s.id !== id)
    this.setData({ suggestions })
    
    wx.showToast({
      title: '已忽略该建议',
      icon: 'success'
    })
  },

  // 应用建议
  applySuggestion(e) {
    const suggestion = e.currentTarget.dataset.suggestion
    console.log('应用建议:', suggestion)
    
    wx.showModal({
      title: suggestion.title,
      content: `准备执行：${suggestion.description}`,
      confirmText: '开始',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到具体的执行页面
          wx.showToast({
            title: '已开始执行',
            icon: 'success'
          })
        }
      }
    })
  },

  // 生成报告
  generateReport() {
    this.setData({ showReportModal: true })
    this.drawReportPreview()
  },

  // 绘制报告预览
  drawReportPreview() {
    // 简单的报告预览绘制
    const ctx = wx.createCanvasContext('reportPreview')
    ctx.setFillStyle('#4CAF50')
    ctx.fillRect(10, 10, 280, 200)
    ctx.setFillStyle('#FFFFFF')
    ctx.font = '16px Arial'
    ctx.fillText('情绪分析报告预览', 50, 50)
    ctx.draw()
  },

  // 选择报告类型
  selectReportType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ selectedReportType: type })
  },

  // 确认生成报告
  confirmReport() {
    this.setData({
      isLoading: true,
      loadingText: '正在生成报告...'
    })

    setTimeout(() => {
      this.setData({
        isLoading: false,
        showReportModal: false
      })
      
      wx.showToast({
        title: '报告生成成功',
        icon: 'success'
      })
    }, 3000)
  },

  // 隐藏报告弹窗
  hideReportModal() {
    this.setData({ showReportModal: false })
  },

  // 分享给朋友
  shareToFriends() {
    // 生成分享内容
    const shareData = {
      title: '我的情绪成长报告',
      imageUrl: '../../assets/share/analysis-share.png'
    }
    
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 导出数据
  exportData() {
    wx.showActionSheet({
      itemList: ['导出为Excel', '导出为PDF', '导出为JSON'],
      success: (res) => {
        const formats = ['Excel', 'PDF', 'JSON']
        const format = formats[res.tapIndex]
        
        wx.showModal({
          title: '导出确认',
          content: `将导出为${format}格式，是否继续？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.performExport(format)
            }
          }
        })
      }
    })
  },

  // 执行导出
  performExport(format) {
    this.setData({
      isLoading: true,
      loadingText: `正在导出${format}文件...`
    })

    // 模拟导出过程
    setTimeout(() => {
      this.setData({ isLoading: false })
      
      wx.showModal({
        title: '导出完成',
        content: `${format}文件已保存到相册`,
        showCancel: false
      })
    }, 2000)
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshAnalysis()
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '查看我的情绪分析报告',
      path: '/pages/analysis/analysis',
      imageUrl: '../../assets/share/analysis-share.png'
    }
  }
})