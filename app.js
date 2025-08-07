// app.js
App({
  onLaunch() {
    console.log('情绪小助手启动')
    
    // 初始化云开发
    if (wx.cloud) {
      try {
        console.log('开始初始化云开发，环境ID:', this.globalData.cloudEnv)
        wx.cloud.init({
          env: this.globalData.cloudEnv,
          traceUser: true,
        })
        console.log('云开发初始化成功')
        
        // 验证云开发状态
        setTimeout(() => {
          this.testCloudFunction()
        }, 1000)
      } catch (error) {
        console.error('云开发初始化失败:', error)
        this.reportError(error)
        this.globalData.cloudAvailable = false
        // 不影响应用正常运行，降级到本地模式
      }
    } else if (!this.globalData.isDev) {
      wx.showModal({
        title: '版本提示',
        content: '当前微信版本过低，部分功能可能无法使用，建议升级微信到最新版本。',
        showCancel: false
      })
    }

    // 检查用户登录状态
    this.checkLoginStatus()
    
    // 获取系统信息
    this.getSystemInfo()
    
    // 初始化测试数据
    this.initTestData()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏') 
  },

  onError(error) {
    console.error('小程序错误:', error)
    
    // 特殊处理常见错误
    if (error && error.includes && error.includes('_getData is not a function')) {
      console.error('检测到_getData方法调用错误，可能的原因：')
      console.error('1. 页面中调用了不存在的_getData方法')
      console.error('2. 组件绑定了错误的事件处理函数')
      console.error('3. 代码中有拼写错误')
      
      // 显示用户友好的错误信息
      wx.showModal({
        title: '应用错误',
        content: '检测到功能调用异常，请尝试重启小程序。如果问题持续存在，请联系开发者。',
        showCancel: false,
        confirmText: '重启小程序',
        success: () => {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }
      })
    }
    
    // 错误上报
    this.reportError(error)
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLogin = true
    }
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        // 适配不同屏幕
        const { windowHeight, windowWidth } = res
        this.globalData.screenRatio = windowWidth / 375 // 以375为基准
      }
    })
  },

  // 用户登录
  login() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('获取用户信息成功', res)
          this.globalData.userInfo = res.userInfo
          this.globalData.isLogin = true
          
          // 保存用户信息到本地
          wx.setStorageSync('userInfo', res.userInfo)
          
          // 调用云函数获取openid
          this.getOpenId().then(openid => {
            this.globalData.openid = openid
            resolve({ userInfo: res.userInfo, openid })
          }).catch(reject)
        },
        fail: reject
      })
    })
  },

  // 获取用户openid
  getOpenId() {
    return new Promise((resolve, reject) => {
      // 直接从云开发上下文获取openid，无需云函数
      if (wx.cloud) {
        resolve(wx.cloud.getOpenId?.() || 'mock_openid_' + Date.now())
      } else {
        // 降级处理：生成临时ID
        const tempId = wx.getStorageSync('tempUserId') || ('temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9))
        wx.setStorageSync('tempUserId', tempId)
        resolve(tempId)
      }
    })
  },

  // 初始化测试数据
  initTestData() {
    try {
      // 检查是否已有数据
      const existingRecords = wx.getStorageSync('emotionRecords')
      if (existingRecords && existingRecords.length > 0) {
        console.log('已有情绪记录数据，跳过初始化')
        return
      }

      // 创建一些测试数据
      const now = new Date()
      const testRecords = []
      
      // 最近7天的测试数据
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        testRecords.push({
          id: `test_${i}_${Date.now()}`,
          emotion: {
            id: Math.floor(Math.random() * 8) + 1,
            emoji: ['😊', '😐', '😔', '😡', '😰', '😴', '🤗', '🤔'][Math.floor(Math.random() * 8)],
            name: ['开心', '平静', '悲伤', '愤怒', '焦虑', '疲惫', '温暖', '困惑'][Math.floor(Math.random() * 8)]
          },
          intensity: Math.floor(Math.random() * 10) + 1,
          tags: ['工作', '学习', '家庭'][Math.floor(Math.random() * 3)],
          description: '测试情绪记录',
          timestamp: date.getTime(),
          location: '',
          source: 'test_data'
        })
      }
      
      // 保存测试数据
      wx.setStorageSync('emotionRecords', testRecords)
      console.log('初始化测试数据完成，共', testRecords.length, '条记录')
      
    } catch (error) {
      console.error('初始化测试数据失败:', error)
    }
  },

  // 错误上报
  reportError(error) {
    try {
      // 开发环境下直接输出到控制台
      if (this.globalData.isDev) {
        console.error('应用错误:', error)
        return
      }
      
      // 生产环境上报错误（移除敏感信息）
      const errorInfo = {
        error: typeof error === 'string' ? error : error.message || 'Unknown error',
        page: getCurrentPages().pop()?.route || 'unknown',
        timestamp: new Date().getTime(),
        version: this.globalData.version || '1.0.0'
      }
      
      // 保存到本地，避免云函数依赖
      const errorLogs = wx.getStorageSync('errorLogs') || []
      errorLogs.push(errorInfo)
      
      // 只保留最近50条错误日志
      if (errorLogs.length > 50) {
        errorLogs.splice(0, errorLogs.length - 50)
      }
      
      wx.setStorageSync('errorLogs', errorLogs)
    } catch (reportError) {
      console.error('错误上报自身失败:', reportError)
    }
  },

  // 云函数测试
  testCloudFunction() {
    console.log('开始测试云函数连接...')
    wx.cloud.callFunction({
      name: 'user-data',
      data: {
        action: 'test'
      }
    }).then(res => {
      console.log('✅ 云函数连接成功:', res)
      this.globalData.cloudAvailable = true
    }).catch(err => {
      console.error('❌ 云函数连接失败:', err)
      this.globalData.cloudAvailable = false
      
      // 显示友好错误信息
      if (err.message && err.message.includes('env check invalid')) {
        wx.showModal({
          title: '云环境配置问题',
          content: '请检查云开发环境是否正确配置，或者使用本地模式继续使用。',
          confirmText: '了解',
          showCancel: false
        })
      }
    })
  },

  // 全局数据
  globalData: {
    userInfo: null,
    isLogin: false,
    openid: null,
    systemInfo: null,
    screenRatio: 1,
    version: '1.0.0',
    isDev: false, // 通过构建脚本设置
    cloudEnv: 'cloud1-8g0nzxjxe1f94684', // 云开发环境ID
    cloudAvailable: false, // 云开发可用状态
    // 应用配置
    config: {
      privacyLevel: 1, // 隐私等级：1-基础 2-匿名 3-透明
      reminderEnabled: true, // 是否开启提醒
      aiAnalysisEnabled: true, // 是否开启AI分析
      communityEnabled: true // 是否开启社区功能
    }
  }
})