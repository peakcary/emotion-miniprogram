// 云服务工具类
const app = getApp()

/**
 * 云服务管理类
 */
class CloudService {
  constructor() {
    this.isInitialized = false
    this.retryCount = 3
    this.retryDelay = 1000
  }

  /**
   * 初始化云开发
   */
  init() {
    if (this.isInitialized) return Promise.resolve()

    return new Promise((resolve, reject) => {
      if (typeof wx.cloud === 'undefined') {
        console.error('请使用 2.2.3 或以上的基础库以使用云能力')
        reject(new Error('云开发基础库版本过低'))
        return
      }

      try {
        wx.cloud.init({
          env: 'emotion-helper-prod', // 云开发环境ID
          traceUser: true
        })
        
        this.isInitialized = true
        console.log('云开发初始化成功')
        resolve()
      } catch (err) {
        console.error('云开发初始化失败:', err)
        reject(err)
      }
    })
  }

  /**
   * 调用云函数
   * @param {string} name 云函数名称
   * @param {object} data 传递的数据
   * @param {object} options 选项
   */
  async callFunction(name, data = {}, options = {}) {
    await this.init()
    
    const { showLoading = false, retryOnFail = true } = options
    
    if (showLoading) {
      wx.showLoading({
        title: '处理中...',
        mask: true
      })
    }

    try {
      const result = await this._callWithRetry(name, data, retryOnFail ? this.retryCount : 1)
      
      if (showLoading) {
        wx.hideLoading()
      }

      return this._handleResponse(result)
    } catch (err) {
      if (showLoading) {
        wx.hideLoading()
      }
      
      console.error(`云函数 ${name} 调用失败:`, err)
      throw this._handleError(err, name)
    }
  }

  /**
   * 带重试的云函数调用
   */
  async _callWithRetry(name, data, maxRetries) {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await wx.cloud.callFunction({
          name,
          data
        })
        return result
      } catch (err) {
        lastError = err
        console.warn(`云函数 ${name} 第 ${i + 1} 次调用失败:`, err)
        
        if (i < maxRetries - 1) {
          await this._delay(this.retryDelay * (i + 1))
        }
      }
    }
    
    throw lastError
  }

  /**
   * 延迟函数
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 处理响应
   */
  _handleResponse(result) {
    if (result.errMsg && result.errMsg.includes('fail')) {
      throw new Error(result.errMsg)
    }

    const { result: data } = result
    
    if (!data) {
      throw new Error('云函数返回数据为空')
    }

    if (!data.success) {
      throw new Error(data.error || '云函数执行失败')
    }

    return data
  }

  /**
   * 处理错误
   */
  _handleError(err, functionName) {
    let message = '服务暂时不可用，请稍后重试'
    
    if (err.message) {
      if (err.message.includes('timeout')) {
        message = '网络超时，请检查网络连接'
      } else if (err.message.includes('auth')) {
        message = '用户身份验证失败，请重新登录'
      } else if (err.message.includes('quota')) {
        message = '服务暂时繁忙，请稍后重试'
      } else {
        message = err.message
      }
    }

    return new CloudServiceError(message, functionName, err)
  }

  // ==================== 情绪分析相关 ====================

  /**
   * 分析情绪记录
   */
  async analyzeEmotion(emotionData) {
    return await this.callFunction('emotion-analysis', {
      action: 'analyze',
      data: emotionData
    }, { showLoading: true })
  }

  /**
   * 获取AI洞察
   */
  async getAIInsights(userData = {}) {
    return await this.callFunction('emotion-analysis', {
      action: 'getInsights',
      data: userData
    }, { showLoading: true })
  }

  /**
   * 获取情绪模式
   */
  async getEmotionPatterns(userData = {}) {
    return await this.callFunction('emotion-analysis', {
      action: 'getPatterns',
      data: userData
    })
  }

  /**
   * 获取改善建议
   */
  async getImprovementSuggestions(userData = {}) {
    return await this.callFunction('emotion-analysis', {
      action: 'getSuggestions',
      data: userData
    })
  }

  // ==================== 用户数据相关 ====================

  /**
   * 同步情绪记录
   */
  async syncEmotionRecord(recordData) {
    return await this.callFunction('user-data', {
      action: 'syncEmotionRecord',
      data: recordData
    })
  }

  /**
   * 获取用户数据
   */
  async getUserData() {
    return await this.callFunction('user-data', {
      action: 'getUserData'
    }, { showLoading: true })
  }

  /**
   * 更新用户配置
   */
  async updateUserProfile(profileData) {
    return await this.callFunction('user-data', {
      action: 'updateUserProfile',
      data: profileData
    }, { showLoading: true })
  }

  /**
   * 备份用户数据
   */
  async backupUserData() {
    return await this.callFunction('user-data', {
      action: 'backupData'
    }, { showLoading: true })
  }

  /**
   * 删除用户数据
   */
  async deleteUserData(deleteOptions) {
    return await this.callFunction('user-data', {
      action: 'deleteUserData',
      data: deleteOptions
    }, { showLoading: true })
  }

  /**
   * 获取数据摘要
   */
  async getDataSummary() {
    return await this.callFunction('user-data', {
      action: 'getDataSummary'
    })
  }

  // ==================== 社区功能相关 ====================

  /**
   * 发布动态
   */
  async publishPost(postData) {
    return await this.callFunction('community', {
      action: 'publishPost',
      data: postData
    }, { showLoading: true })
  }

  /**
   * 获取动态列表
   */
  async getPosts(queryData = {}) {
    return await this.callFunction('community', {
      action: 'getPosts',
      data: queryData
    })
  }

  /**
   * 点赞动态
   */
  async likePost(postId, isLike) {
    return await this.callFunction('community', {
      action: 'likePost',
      data: { postId, isLike }
    })
  }

  /**
   * 评论动态
   */
  async commentPost(postId, content, replyToCommentId = null) {
    return await this.callFunction('community', {
      action: 'commentPost',
      data: { postId, content, replyToCommentId }
    }, { showLoading: true })
  }

  /**
   * 获取评论列表
   */
  async getComments(postId, page = 1, limit = 20) {
    return await this.callFunction('community', {
      action: 'getComments',
      data: { postId, page, limit }
    })
  }

  /**
   * 删除动态
   */
  async deletePost(postId) {
    return await this.callFunction('community', {
      action: 'deletePost',
      data: { postId }
    }, { showLoading: true })
  }

  /**
   * 举报动态
   */
  async reportPost(postId, reason, description) {
    return await this.callFunction('community', {
      action: 'reportPost',
      data: { postId, reason, description }
    }, { showLoading: true })
  }

  /**
   * 获取热门话题
   */
  async getHotTopics() {
    return await this.callFunction('community', {
      action: 'getHotTopics'
    })
  }

  /**
   * 关注用户
   */
  async followUser(userId, isFollow) {
    return await this.callFunction('community', {
      action: 'followUser',
      data: { userId, isFollow }
    })
  }

  /**
   * 获取用户动态
   */
  async getUserPosts(userId, page = 1, limit = 10) {
    return await this.callFunction('community', {
      action: 'getUserPosts',
      data: { userId, page, limit }
    })
  }

  // ==================== 批量操作 ====================

  /**
   * 批量同步情绪记录
   */
  async batchSyncEmotionRecords(records) {
    const results = []
    const batchSize = 5 // 每批次处理5条记录
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const batchPromises = batch.map(record => 
        this.syncEmotionRecord(record).catch(err => ({
          error: true,
          recordId: record.id,
          message: err.message
        }))
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // 批次间延迟，避免并发过高
      if (i + batchSize < records.length) {
        await this._delay(500)
      }
    }
    
    return results
  }

  /**
   * 同步所有本地数据到云端
   */
  async syncAllLocalData() {
    try {
      // 获取本地数据
      const emotionRecords = wx.getStorageSync('emotionRecords') || []
      const userInfo = wx.getStorageSync('userInfo')
      const appSettings = wx.getStorageSync('appSettings')
      
      const syncResults = {
        emotions: { success: 0, failed: 0, errors: [] },
        profile: { success: false, error: null },
        settings: { success: false, error: null }
      }

      // 同步情绪记录
      if (emotionRecords.length > 0) {
        console.log(`开始同步 ${emotionRecords.length} 条情绪记录`)
        const emotionResults = await this.batchSyncEmotionRecords(emotionRecords)
        
        emotionResults.forEach(result => {
          if (result.error) {
            syncResults.emotions.failed++
            syncResults.emotions.errors.push(result)
          } else {
            syncResults.emotions.success++
          }
        })
      }

      // 同步用户配置
      if (userInfo) {
        try {
          await this.updateUserProfile({
            ...userInfo,
            ...appSettings
          })
          syncResults.profile.success = true
        } catch (err) {
          syncResults.profile.error = err.message
        }
      }

      return {
        success: true,
        data: syncResults,
        timestamp: new Date().toISOString()
      }
    } catch (err) {
      console.error('同步本地数据失败:', err)
      throw err
    }
  }
}

/**
 * 云服务错误类
 */
class CloudServiceError extends Error {
  constructor(message, functionName, originalError) {
    super(message)
    this.name = 'CloudServiceError'
    this.functionName = functionName
    this.originalError = originalError
    this.timestamp = new Date().toISOString()
  }
}

// 创建单例实例
const cloudService = new CloudService()

// 导出
module.exports = {
  cloudService,
  CloudServiceError
}