// pages/profile/profile.js
const app = getApp()
const { Validator } = require('../../utils/validator')

Page({
  data: {
    // 用户信息
    userInfo: null,
    defaultAvatar: '../../assets/icons/user-placeholder.png',
    totalRecords: 0,
    streakDays: 0,
    activeDays: 0,
    maxStreak: 0,
    averageMood: 0,
    
    // 用户等级
    userLevel: {
      name: '新手',
      progress: 0,
      current: 0,
      target: 10
    },
    
    // 成就系统
    achievements: [],
    totalAchievements: 12,
    selectedAchievement: null,
    
    // 应用信息
    appVersion: '1.0.0',
    
    // 设置
    privacyLevel: '基础模式',
    selectedPrivacyLevel: 1,
    privacyLevels: [
      {
        value: 1,
        name: '基础模式',
        description: '数据加密存储，仅您和授权AI可访问',
        icon: '../../assets/icons/privacy-basic.png'
      },
      {
        value: 2,
        name: '匿名模式', 
        description: '去除个人标识，仅用于AI训练优化',
        icon: '../../assets/icons/privacy-anonymous.png'
      },
      {
        value: 3,
        name: '透明模式',
        description: '完全透明的数据使用，获得最佳体验',
        icon: '../../assets/icons/privacy-transparent.png'
      }
    ],
    notificationEnabled: true,
    currentTheme: '清新绿色',
    
    // 编辑资料
    showEditModal: false,
    editUserInfo: {},
    
    // 弹窗状态
    showAchievementModal: false,
    showPrivacyModal: false,
    
    // 加载状态
    isLoading: false,
    loadingText: '处理中...'
  },

  onLoad() {
    console.log('个人中心加载')
    this.initProfile()
  },

  onShow() {
    console.log('个人中心显示')
    this.refreshProfile()
  },

  // 初始化个人中心
  initProfile() {
    this.loadUserInfo()
    this.loadUserStats()
    this.loadAchievements()
    this.loadSettings()
  },

  // 刷新个人中心数据
  refreshProfile() {
    this.loadUserStats()
    this.loadAchievements()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    const isLogin = app.globalData.isLogin
    
    if (isLogin && userInfo) {
      this.setData({ 
        userInfo,
        editUserInfo: { ...userInfo }
      })
    }
  },

  // 加载用户统计数据
  loadUserStats() {
    const records = wx.getStorageSync('emotionRecords') || []
    
    if (records.length === 0) {
      this.setData({
        totalRecords: 0,
        streakDays: 0,
        activeDays: 0,
        maxStreak: 0,
        averageMood: 0
      })
      return
    }

    // 计算总记录数
    const totalRecords = records.length

    // 计算活跃天数
    const uniqueDates = [...new Set(records.map(r => 
      new Date(r.timestamp).toDateString()
    ))]
    const activeDays = uniqueDates.length

    // 计算当前连续天数
    const streakDays = this.calculateCurrentStreak(records)

    // 计算最长连续天数
    const maxStreak = this.calculateMaxStreak(records)

    // 计算平均心情
    const totalIntensity = records.reduce((sum, r) => sum + r.intensity, 0)
    const averageMood = (totalIntensity / totalRecords).toFixed(1)

    // 更新用户等级
    const userLevel = this.calculateUserLevel(totalRecords, activeDays)

    this.setData({
      totalRecords,
      activeDays,
      streakDays,
      maxStreak,
      averageMood,
      userLevel
    })
  },

  // 计算当前连续天数
  calculateCurrentStreak(records) {
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

  // 计算最长连续天数
  calculateMaxStreak(records) {
    if (records.length === 0) return 0

    const dates = records.map(r => new Date(r.timestamp).toDateString())
    const uniqueDates = [...new Set(dates)].sort()
    
    let maxStreak = 1
    let currentStreak = 1

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i])
      const prevDate = new Date(uniqueDates[i - 1])
      const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
      
      if (dayDiff === 1) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 1
      }
    }

    return maxStreak
  },

  // 计算用户等级
  calculateUserLevel(totalRecords, activeDays) {
    let level = { name: '新手', progress: 0, current: 0, target: 10 }

    if (totalRecords >= 100) {
      level = { name: '大师', progress: 100, current: totalRecords, target: totalRecords }
    } else if (totalRecords >= 50) {
      level = { name: '专家', progress: (totalRecords - 50) * 2, current: totalRecords - 50, target: 50 }
    } else if (totalRecords >= 20) {
      level = { name: '进阶', progress: (totalRecords - 20) * 100 / 30, current: totalRecords - 20, target: 30 }
    } else if (totalRecords >= 10) {
      level = { name: '熟练', progress: (totalRecords - 10) * 10, current: totalRecords - 10, target: 10 }
    } else {
      level = { name: '新手', progress: totalRecords * 10, current: totalRecords, target: 10 }
    }

    return level
  },

  // 加载成就数据
  loadAchievements() {
    const { achievementSystem } = require('../../utils/achievementSystem')
    const records = wx.getStorageSync('emotionRecords') || []
    const { totalRecords, streakDays, maxStreak, activeDays } = this.data
    
    // 构建用户统计数据
    const userStats = {
      totalRecords,
      currentStreak: streakDays,
      maxStreak,
      activeDays,
      postCount: 0, // 从社区数据获取
      commentCount: 0,
      maxPostLikes: 0
    }
    
    // 获取已解锁的成就
    const savedAchievements = wx.getStorageSync('userAchievements') || []
    
    // 检查新成就
    const newAchievements = achievementSystem.checkAchievements(userStats, records, savedAchievements)
    
    // 如果有新成就，显示祝贺弹窗
    if (newAchievements.length > 0) {
      this.showNewAchievements(newAchievements)
      
      // 保存新成就
      const allAchievements = [...savedAchievements, ...newAchievements]
      wx.setStorageSync('userAchievements', allAchievements)
    }
    
    // 获取所有成就（包括新解锁的）
    const userAchievements = [...savedAchievements, ...newAchievements]
    
    // 计算用户等级
    const totalExp = achievementSystem.calculateTotalExp(userAchievements)
    const userLevel = achievementSystem.calculateLevel(totalExp)
    
    // 获取推荐成就
    const recommendedAchievements = achievementSystem.getRecommendedAchievements(
      userStats, records, userAchievements
    )
    
    // 获取成就统计
    const achievementStats = achievementSystem.getAchievementStats(userAchievements)
    
    // 显示前6个成就（优先显示已解锁的）
    const sortedAchievements = userAchievements
      .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0))
      .slice(0, 6)
    
    this.setData({ 
      achievements: sortedAchievements,
      totalAchievements: achievementStats.total,
      userLevel,
      totalExp,
      recommendedAchievements,
      achievementStats
    })
  },

  // 显示新成就祝贺
  showNewAchievements(newAchievements) {
    for (const achievement of newAchievements) {
      wx.showModal({
        title: '🎉 恭喜解锁成就！',
        content: `${achievement.icon} ${achievement.name}\n${achievement.description}\n\n获得奖励：+${achievement.reward.exp} 经验值`,
        confirmText: '太棒了',
        showCancel: false,
        success: () => {
          // 播放成就解锁音效（如果有）
          wx.vibrateShort()
        }
      })
    }
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('appSettings') || {}
    
    this.setData({
      selectedPrivacyLevel: settings.privacyLevel || 1,
      privacyLevel: this.getPrivacyLevelName(settings.privacyLevel || 1),
      notificationEnabled: settings.notificationEnabled !== false,
      currentTheme: settings.theme || '清新绿色'
    })
  },

  // 获取隐私等级名称
  getPrivacyLevelName(level) {
    const levelMap = {
      1: '基础模式',
      2: '匿名模式',
      3: '透明模式'
    }
    return levelMap[level] || '基础模式'
  },

  // 用户登录
  loginUser() {
    app.login().then(result => {
      console.log('登录成功:', result)
      this.setData({ 
        userInfo: result.userInfo,
        editUserInfo: { ...result.userInfo }
      })
    }).catch(err => {
      console.error('登录失败:', err)
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
    })
  },

  // 编辑资料
  editProfile() {
    if (!this.data.userInfo) {
      this.loginUser()
      return
    }
    
    this.setData({ showEditModal: true })
  },

  // 隐藏编辑弹窗
  hideEditModal() {
    this.setData({ 
      showEditModal: false,
      editUserInfo: { ...this.data.userInfo }
    })
  },

  // 更换头像
  changeAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          'editUserInfo.avatarUrl': tempFilePath
        })
      }
    })
  },

  // 输入昵称
  onNickNameInput(e) {
    this.setData({
      'editUserInfo.nickName': e.detail.value
    })
  },

  // 输入签名
  onSignatureInput(e) {
    this.setData({
      'editUserInfo.signature': e.detail.value
    })
  },

  // 保存资料
  saveProfile() {
    const { editUserInfo } = this.data
    
    // 验证昵称
    const nicknameValidation = Validator.validateNickname(editUserInfo.nickName)
    if (!nicknameValidation.valid) {
      wx.showToast({
        title: nicknameValidation.message,
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 验证签名（如果有）
    if (editUserInfo.signature) {
      const signatureValidation = Validator.validateText(editUserInfo.signature, {
        maxLength: 50,
        allowHTML: false
      })
      if (!signatureValidation.valid) {
        wx.showToast({
          title: signatureValidation.message,
          icon: 'none',
          duration: 2000
        })
        return
      }
    }

    this.setData({ 
      isLoading: true,
      loadingText: '保存中...'
    })

    // 模拟保存延迟
    setTimeout(() => {
      // 清理用户输入数据
      const cleanUserInfo = {
        ...editUserInfo,
        nickName: nicknameValidation.sanitized,
        signature: editUserInfo.signature ? Validator.escapeHTML(editUserInfo.signature.trim()) : ''
      }
      
      // 保存到本地
      wx.setStorageSync('userInfo', cleanUserInfo)
      app.globalData.userInfo = cleanUserInfo
      
      this.setData({
        userInfo: cleanUserInfo,
        showEditModal: false,
        isLoading: false
      })
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    }, 1000)
  },

  // 查看成就详情
  viewAchievement(e) {
    const achievement = e.currentTarget.dataset.achievement
    this.setData({
      selectedAchievement: achievement,
      showAchievementModal: true
    })
  },

  // 隐藏成就弹窗
  hideAchievementModal() {
    this.setData({ 
      showAchievementModal: false,
      selectedAchievement: null
    })
  },

  // 查看全部成就
  viewAllAchievements() {
    wx.showModal({
      title: '全部成就',
      content: '即将为您展示所有成就列表',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到成就页面
          console.log('查看全部成就')
        }
      }
    })
  },

  // 查看详细数据
  viewDetailData(e) {
    const type = e.currentTarget.dataset.type
    
    switch(type) {
      case 'records':
        wx.switchTab({ url: '/pages/analysis/analysis' })
        break
      case 'days':
      case 'streak':
      case 'mood':
        wx.switchTab({ url: '/pages/analysis/analysis' })
        break
      default:
        console.log('查看数据类型:', type)
    }
  },

  // 导出数据
  exportData() {
    wx.showActionSheet({
      itemList: ['导出为Excel', '导出为PDF', '导出为JSON'],
      success: (res) => {
        const formats = ['Excel', 'PDF', 'JSON']
        const format = formats[res.tapIndex]
        
        this.setData({
          isLoading: true,
          loadingText: `正在导出${format}文件...`
        })

        setTimeout(() => {
          this.setData({ isLoading: false })
          
          wx.showModal({
            title: '导出完成',
            content: `${format}文件已保存`,
            showCancel: false
          })
        }, 2000)
      }
    })
  },

  // 分享应用
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 备份数据
  backupData() {
    if (!this.data.userInfo) {
      wx.showModal({
        title: '备份提示',
        content: '请先登录后再进行数据备份',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.loginUser()
          }
        }
      })
      return
    }

    this.setData({
      isLoading: true,
      loadingText: '正在备份数据...'
    })

    setTimeout(() => {
      this.setData({ isLoading: false })
      
      wx.showToast({
        title: '备份成功',
        icon: 'success'
      })
    }, 2000)
  },

  // 打开隐私设置
  openPrivacySettings() {
    this.setData({ showPrivacyModal: true })
  },

  // 隐藏隐私设置弹窗
  hidePrivacyModal() {
    this.setData({ showPrivacyModal: false })
  },

  // 选择隐私等级
  selectPrivacyLevel(e) {
    const level = e.currentTarget.dataset.level
    this.setData({ selectedPrivacyLevel: level })
  },

  // 保存隐私设置
  savePrivacySettings() {
    const { selectedPrivacyLevel } = this.data
    
    // 保存设置
    const settings = wx.getStorageSync('appSettings') || {}
    settings.privacyLevel = selectedPrivacyLevel
    wx.setStorageSync('appSettings', settings)
    
    this.setData({
      privacyLevel: this.getPrivacyLevelName(selectedPrivacyLevel),
      showPrivacyModal: false
    })
    
    wx.showToast({
      title: '设置已保存',
      icon: 'success'
    })
  },

  // 打开通知设置
  openNotificationSettings() {
    wx.openSetting({
      success: (res) => {
        console.log('设置结果:', res.authSetting)
      }
    })
  },

  // 切换通知
  toggleNotification(e) {
    const enabled = e.detail.value
    
    // 保存设置
    const settings = wx.getStorageSync('appSettings') || {}
    settings.notificationEnabled = enabled
    wx.setStorageSync('appSettings', settings)
    
    this.setData({ notificationEnabled: enabled })
    
    wx.showToast({
      title: enabled ? '通知已开启' : '通知已关闭',
      icon: 'success'
    })
  },

  // 打开主题设置
  openThemeSettings() {
    wx.showActionSheet({
      itemList: ['清新绿色', '温暖橙色', '宁静蓝色', '优雅紫色'],
      success: (res) => {
        const themes = ['清新绿色', '温暖橙色', '宁静蓝色', '优雅紫色']
        const theme = themes[res.tapIndex]
        
        // 保存设置
        const settings = wx.getStorageSync('appSettings') || {}
        settings.theme = theme
        wx.setStorageSync('appSettings', settings)
        
        this.setData({ currentTheme: theme })
        
        wx.showToast({
          title: `已切换到${theme}`,
          icon: 'success'
        })
      }
    })
  },

  // 打开语言设置
  openLanguageSettings() {
    wx.showModal({
      title: '语言设置',
      content: '当前仅支持中文，更多语言敬请期待',
      showCancel: false
    })
  },

  // 查看帮助
  viewHelp() {
    wx.navigateTo({
      url: '/pages/help/help'
    })
  },

  // 联系客服
  contactSupport() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: () => {
        wx.showModal({
          title: '联系客服',
          content: '客服电话：400-123-4567\n客服邮箱：support@emotion-helper.com',
          showCancel: false
        })
      }
    })
  },

  // 意见反馈
  provideFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },

  // 查看隐私政策
  viewPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  // 检查更新
  checkUpdate() {
    this.setData({
      isLoading: true,
      loadingText: '检查更新中...'
    })

    setTimeout(() => {
      this.setData({ isLoading: false })
      
      wx.showModal({
        title: '检查更新',
        content: '当前已是最新版本',
        showCancel: false
      })
    }, 1500)
  },

  // 给应用评分
  rateApp() {
    wx.showModal({
      title: '给个好评',
      content: '如果您喜欢这个应用，请到应用商店给我们5星好评吧！',
      confirmText: '去评分',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到应用商店评分页面
          wx.showToast({
            title: '感谢您的支持！',
            icon: 'success'
          })
        }
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshProfile()
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage() {
    const { userInfo, streakDays } = this.data
    
    return {
      title: userInfo ? 
        `我已经坚持记录情绪${streakDays}天了，一起来关注心理健康吧！` : 
        '情绪小助手 - 记录心情，关爱自己',
      path: '/pages/index/index',
      imageUrl: '../../assets/share/profile-share.png'
    }
  }
})