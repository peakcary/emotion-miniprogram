// pages/index/index.js
const app = getApp()

Page({
  data: {
    // 界面状态
    currentMode: 'emoji', // emoji, color, weather
    selectedEmotion: null,
    intensity: 5,
    selectedTags: [],
    
    // 时间相关
    greetingText: '',
    currentDate: '',
    
    // 记录相关
    todayRecords: [],
    averageIntensity: 0,
    dominantEmotion: '',
    
    // AI 相关
    aiInsight: '',
    healingSuggestion: null,
    
    // 弹窗相关
    showDetailModal: false,
    detailDescription: '',
    location: '',
    enableVoiceRecord: false,
    
    // 加载状态
    isLoading: false,
    loadingText: '正在保存...',
    saveButtonText: '快速保存',
    
    // 首次使用提示
    showFirstTimeTip: false,
    
    // 情绪数据
    emojiList: [
      { id: 1, emoji: '😊', name: '开心', type: 'happy', intensity: 7 },
      { id: 2, emoji: '😐', name: '平静', type: 'calm', intensity: 5 },
      { id: 3, emoji: '😔', name: '悲伤', type: 'sad', intensity: 3 },
      { id: 4, emoji: '😡', name: '愤怒', type: 'angry', intensity: 8 },
      { id: 5, emoji: '😰', name: '焦虑', type: 'anxious', intensity: 6 },
      { id: 6, emoji: '😴', name: '疲惫', type: 'tired', intensity: 4 },
      { id: 7, emoji: '🤗', name: '温暖', type: 'warm', intensity: 8 },
      { id: 8, emoji: '🤔', name: '困惑', type: 'confused', intensity: 5 }
    ],
    
    colorList: [
      { id: 11, color: '#FFD54F', name: '阳光黄', type: 'happy', intensity: 8 },
      { id: 12, color: '#81C784', name: '自然绿', type: 'calm', intensity: 6 },
      { id: 13, color: '#64B5F6', name: '忧郁蓝', type: 'sad', intensity: 4 },
      { id: 14, color: '#E57373', name: '激情红', type: 'angry', intensity: 9 },
      { id: 15, color: '#FF8A65', name: '焦虑橙', type: 'anxious', intensity: 7 },
      { id: 16, color: '#A1887F', name: '疲惫棕', type: 'tired', intensity: 3 },
      { id: 17, color: '#F8BBD9', name: '温柔粉', type: 'warm', intensity: 7 },
      { id: 18, color: '#B39DDB', name: '神秘紫', type: 'confused', intensity: 5 }
    ],
    
    weatherList: [
      { id: 21, icon: '☀️', name: '晴朗', type: 'happy', intensity: 8 },
      { id: 22, icon: '☁️', name: '多云', type: 'calm', intensity: 5 },
      { id: 23, icon: '🌧️', name: '下雨', type: 'sad', intensity: 4 },
      { id: 24, icon: '⛈️', name: '雷暴', type: 'angry', intensity: 9 },
      { id: 25, icon: '🌪️', name: '旋风', type: 'anxious', intensity: 8 },
      { id: 26, icon: '🌫️', name: '雾霾', type: 'tired', intensity: 3 },
      { id: 27, icon: '🌈', name: '彩虹', type: 'warm', intensity: 9 },
      { id: 28, icon: '🌙', name: '月夜', type: 'confused', intensity: 4 }
    ],
    
    quickTags: ['工作', '学习', '家庭', '朋友', '健康', '天气', '睡眠', '运动']
  },

  onLoad() {
    console.log('首页加载')
    this.initPage()
  },

  onShow() {
    console.log('首页显示')
    this.refreshData()
  },

  // 初始化页面
  initPage() {
    this.updateGreeting()
    this.checkFirstTimeUser()
    this.loadTodayRecords()
  },

  // 更新问候语
  updateGreeting() {
    const now = new Date()
    const hour = now.getHours()
    let greeting = ''
    
    if (hour < 6) {
      greeting = '夜深了，注意休息 🌙'
    } else if (hour < 9) {
      greeting = '早上好，新的一天开始了 ☀️'
    } else if (hour < 12) {
      greeting = '上午好，精神饱满 💪'
    } else if (hour < 14) {
      greeting = '中午好，记得休息一下 😊'
    } else if (hour < 18) {
      greeting = '下午好，继续加油 🌟'
    } else if (hour < 22) {
      greeting = '晚上好，辛苦了一天 🌅'
    } else {
      greeting = '夜晚好，准备休息了吗 🌙'
    }

    const dateStr = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })

    this.setData({
      greetingText: greeting,
      currentDate: dateStr
    })
  },

  // 检查是否首次使用
  checkFirstTimeUser() {
    const hasUsed = wx.getStorageSync('hasUsedBefore')
    if (!hasUsed) {
      this.setData({ showFirstTimeTip: true })
      wx.setStorageSync('hasUsedBefore', true)
    }
  },

  // 加载今日记录
  loadTodayRecords() {
    // 从本地存储加载今日记录
    const today = new Date().toDateString()
    const allRecords = wx.getStorageSync('emotionRecords') || []
    const todayRecords = allRecords.filter(record => 
      new Date(record.timestamp).toDateString() === today
    )
    
    this.setData({ todayRecords })
    this.calculateTodayStats(todayRecords)
    
    // 获取AI洞察
    if (todayRecords.length > 0) {
      this.generateAIInsight(todayRecords)
    }
  },

  // 计算今日统计
  calculateTodayStats(records) {
    if (records.length === 0) return

    // 计算平均强度
    const totalIntensity = records.reduce((sum, record) => sum + record.intensity, 0)
    const averageIntensity = (totalIntensity / records.length).toFixed(1)

    // 找出主要情绪
    const emotionCount = {}
    records.forEach(record => {
      emotionCount[record.emotion.name] = (emotionCount[record.emotion.name] || 0) + 1
    })
    
    const dominantEmotion = Object.keys(emotionCount).reduce((a, b) => 
      emotionCount[a] > emotionCount[b] ? a : b
    )

    this.setData({
      averageIntensity,
      dominantEmotion
    })
  },

  // 生成AI洞察
  generateAIInsight(records) {
    // 简单的规则基础分析，后续可接入真实AI
    const insights = []
    
    if (records.length >= 3) {
      insights.push('今天记录比较频繁，说明你很关注自己的情绪状态 👍')
    }
    
    const avgIntensity = records.reduce((sum, r) => sum + r.intensity, 0) / records.length
    if (avgIntensity > 7) {
      insights.push('今天情绪强度较高，建议适当放松')
      this.setHealingSuggestion('relaxation')
    } else if (avgIntensity < 4) {
      insights.push('今天情绪偏低，多关爱自己一些')
      this.setHealingSuggestion('selfcare')
    } else {
      insights.push('今天情绪比较平稳，保持这种状态')
      this.setHealingSuggestion('maintain')
    }

    this.setData({
      aiInsight: insights[Math.floor(Math.random() * insights.length)]
    })
  },

  // 设置疗愈建议
  setHealingSuggestion(type) {
    const suggestions = {
      relaxation: {
        title: '深呼吸放松',
        description: '4-7-8 呼吸法，帮助快速放松',
        icon: '../../assets/icons/breathe.png'
      },
      selfcare: {
        title: '自我关怀',
        description: '听听音乐，给自己一些温暖',
        icon: '../../assets/icons/music.png'
      },
      maintain: {
        title: '保持平衡',
        description: '适度运动，维持良好状态',
        icon: '../../assets/icons/exercise.png'
      }
    }

    this.setData({
      healingSuggestion: suggestions[type] || suggestions.maintain
    })
  },

  // 刷新数据
  refreshData() {
    this.loadTodayRecords()
  },

  // 切换输入模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      currentMode: mode,
      selectedEmotion: null,
      intensity: 5
    })
  },

  // 选择情绪
  selectEmotion(e) {
    const emotion = e.currentTarget.dataset.emotion
    this.setData({
      selectedEmotion: emotion,
      intensity: emotion.intensity || 5
    })
  },

  // 调整强度
  onIntensityChange(e) {
    this.setData({
      intensity: e.detail.value
    })
  },

  // 切换标签
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const { selectedTags } = this.data
    
    const index = selectedTags.indexOf(tag)
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      selectedTags.push(tag)
    }
    
    this.setData({ selectedTags })
  },

  // 快速保存
  quickSave() {
    const { selectedEmotion, intensity, selectedTags } = this.data
    
    if (!selectedEmotion) {
      wx.showToast({
        title: '请先选择情绪',
        icon: 'none'
      })
      return
    }

    this.setData({
      isLoading: true,
      loadingText: '正在保存...'
    })

    const record = {
      id: Date.now().toString(),
      emotion: selectedEmotion,
      intensity: intensity,
      tags: selectedTags,
      timestamp: new Date().toISOString(),
      type: 'quick',
      description: '',
      location: ''
    }

    this.saveRecord(record)
  },

  // 显示详细记录弹窗
  showDetailRecord() {
    this.setData({ showDetailModal: true })
  },

  // 隐藏详细记录弹窗
  hideDetailModal() {
    this.setData({
      showDetailModal: false,
      detailDescription: '',
      location: '',
      enableVoiceRecord: false
    })
  },

  // 输入描述
  onDescriptionInput(e) {
    this.setData({
      detailDescription: e.detail.value
    })
  },

  // 输入位置
  onLocationInput(e) {
    this.setData({
      location: e.detail.value
    })
  },

  // 切换语音记录
  toggleVoiceRecord() {
    this.setData({
      enableVoiceRecord: !this.data.enableVoiceRecord
    })
  },

  // 保存详细记录
  saveDetailRecord() {
    const { selectedEmotion, intensity, selectedTags, detailDescription, location } = this.data
    
    this.setData({
      isLoading: true,
      loadingText: '正在保存详细记录...'
    })

    const record = {
      id: Date.now().toString(),
      emotion: selectedEmotion,
      intensity: intensity,
      tags: selectedTags,
      timestamp: new Date().toISOString(),
      type: 'detail',
      description: detailDescription,
      location: location
    }

    this.saveRecord(record)
    this.hideDetailModal()
  },

  // 保存记录到本地和云端
  async saveRecord(record) {
    try {
      // 获取现有记录
      const existingRecords = wx.getStorageSync('emotionRecords') || []
      
      // 添加新记录
      existingRecords.unshift(record)
      
      // 保存到本地存储
      wx.setStorageSync('emotionRecords', existingRecords)
      
      // 同步到云端
      if (app.globalData.isLogin) {
        try {
          const { cloudService } = require('../../utils/cloudService')
          await cloudService.syncEmotionRecord(record)
          console.log('记录已同步到云端')
          
          // 请求AI分析
          this.callAIAnalysis(record)
        } catch (err) {
          console.warn('云端同步失败，仅保存到本地:', err.message)
        }
      }
      
      // 重置界面
      this.setData({
        selectedEmotion: null,
        intensity: 5,
        selectedTags: [],
        isLoading: false
      })
      
      // 刷新今日数据
      this.loadTodayRecords()
      
      // 显示成功提示
      wx.showToast({
        title: '记录保存成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('保存记录失败:', error)
      this.setData({ isLoading: false })
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    }
  },

  // 调用AI分析
  async callAIAnalysis(record) {
    if (!app.globalData.isLogin) {
      console.log('用户未登录，跳过AI分析')
      return
    }

    try {
      const { cloudService } = require('../../utils/cloudService')
      const result = await cloudService.analyzeEmotion(record)
      
      if (result.success) {
        console.log('AI分析完成:', result.data)
        
        // 更新AI洞察
        this.updateAIInsight(result.data)
      }
    } catch (err) {
      console.warn('AI分析失败:', err.message)
    }
  },

  // 更新AI洞察
  updateAIInsight(analysisData) {
    const { basicMetrics, recommendations } = analysisData
    
    let insightText = `情绪强度: ${basicMetrics.intensity}/10`
    
    if (recommendations && recommendations.length > 0) {
      const primaryRec = recommendations[0]
      insightText += `\n建议: ${primaryRec.description}`
      
      this.setData({
        healingSuggestion: {
          title: primaryRec.action,
          description: primaryRec.description,
          type: primaryRec.type
        }
      })
    }
    
    this.setData({
      aiInsight: insightText
    })
  },

  // 查看详细分析
  viewDetailAnalysis() {
    wx.switchTab({
      url: '/pages/analysis/analysis'
    })
  },

  // 尝试疗愈建议
  tryHealing() {
    const { healingSuggestion } = this.data
    if (!healingSuggestion) return

    // 这里可以跳转到具体的疗愈功能页面
    wx.showModal({
      title: healingSuggestion.title,
      content: '即将为您开启' + healingSuggestion.description,
      confirmText: '开始',
      success: (res) => {
        if (res.confirm) {
          // 跳转到疗愈功能页面
          console.log('开始疗愈:', healingSuggestion.title)
        }
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData()
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '情绪小助手 - 记录心情，关爱自己',
      path: '/pages/index/index',
      imageUrl: '../../assets/share/share-image.png'
    }
  }
})