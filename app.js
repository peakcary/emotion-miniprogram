// app.js
App({
  onLaunch() {
    console.log('情绪小助手启动')
    
    // 初始化云开发
    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: this.globalData.cloudEnv,
          traceUser: true,
        })
        console.log('云开发初始化成功')
      } catch (error) {
        console.error('云开发初始化失败:', error)
        this.reportError(error)
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
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏') 
  },

  onError(error) {
    console.error('小程序错误:', error)
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

  // 全局数据
  globalData: {
    userInfo: null,
    isLogin: false,
    openid: null,
    systemInfo: null,
    screenRatio: 1,
    version: '1.0.0',
    isDev: false, // 通过构建脚本设置
    cloudEnv: 'emotion-helper-prod', // 云开发环境ID
    // 应用配置
    config: {
      privacyLevel: 1, // 隐私等级：1-基础 2-匿名 3-透明
      reminderEnabled: true, // 是否开启提醒
      aiAnalysisEnabled: true, // 是否开启AI分析
      communityEnabled: true // 是否开启社区功能
    }
  }
})