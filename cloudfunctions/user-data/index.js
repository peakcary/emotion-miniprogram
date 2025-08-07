// 用户数据管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 用户数据管理云函数入口
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { action, data } = event
    
    switch (action) {
      case 'test':
        return {
          success: true,
          message: '云函数连接正常',
          timestamp: new Date().getTime(),
          env: wxContext.ENV,
          openid: wxContext.OPENID
        }
      case 'syncEmotionRecord':
        return await syncEmotionRecord(data, wxContext)
      case 'getUserData':
        return await getUserData(wxContext)
      case 'updateUserProfile':
        return await updateUserProfile(data, wxContext)
      case 'backupData':
        return await backupUserData(wxContext)
      case 'deleteUserData':
        return await deleteUserData(data, wxContext)
      case 'getDataSummary':
        return await getDataSummary(wxContext)
      default:
        throw new Error('未知的操作类型')
    }
  } catch (err) {
    console.error('用户数据管理云函数错误:', err)
    return {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 同步情绪记录到云端
 */
async function syncEmotionRecord(recordData, wxContext) {
  console.log('同步情绪记录:', recordData.id)
  
  try {
    // 检查记录是否已存在
    const { data: existingRecords } = await db.collection('emotion_records')
      .where({
        recordId: recordData.id,
        openid: wxContext.OPENID
      })
      .get()
    
    if (existingRecords.length > 0) {
      // 更新现有记录
      await db.collection('emotion_records')
        .where({
          recordId: recordData.id,
          openid: wxContext.OPENID
        })
        .update({
          data: {
            ...recordData,
            openid: wxContext.OPENID,
            updateTime: db.serverDate(),
            lastSyncTime: db.serverDate()
          }
        })
    } else {
      // 创建新记录
      await db.collection('emotion_records').add({
        data: {
          recordId: recordData.id,
          emotion: recordData.emotion,
          intensity: recordData.intensity,
          timestamp: recordData.timestamp,
          description: recordData.description,
          inputMethod: recordData.inputMethod,
          tags: recordData.tags || [],
          weather: recordData.weather,
          color: recordData.color,
          openid: wxContext.OPENID,
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          lastSyncTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      message: '记录同步成功',
      recordId: recordData.id,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('同步记录失败:', err)
    throw err
  }
}

/**
 * 获取用户所有数据
 */
async function getUserData(wxContext) {
  console.log('获取用户数据')
  
  try {
    // 获取情绪记录
    const { data: emotionRecords } = await db.collection('emotion_records')
      .where({
        openid: wxContext.OPENID
      })
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get()
    
    // 获取用户配置
    const { data: userSettings } = await db.collection('user_settings')
      .where({
        openid: wxContext.OPENID
      })
      .get()
    
    // 获取分析结果
    const { data: analysisResults } = await db.collection('emotion_analysis')
      .where({
        openid: wxContext.OPENID
      })
      .orderBy('createTime', 'desc')
      .limit(100)
      .get()
    
    // 获取社区动态
    const { data: communityPosts } = await db.collection('community_posts')
      .where({
        authorId: wxContext.OPENID
      })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()
    
    return {
      success: true,
      data: {
        emotionRecords,
        userSettings: userSettings[0] || null,
        analysisResults,
        communityPosts,
        stats: {
          totalRecords: emotionRecords.length,
          totalPosts: communityPosts.length,
          lastSyncTime: new Date().toISOString()
        }
      }
    }
  } catch (err) {
    console.error('获取用户数据失败:', err)
    throw err
  }
}

/**
 * 更新用户配置
 */
async function updateUserProfile(profileData, wxContext) {
  console.log('更新用户配置')
  
  try {
    // 检查用户设置是否存在
    const { data: existingSettings } = await db.collection('user_settings')
      .where({
        openid: wxContext.OPENID
      })
      .get()
    
    const settingsData = {
      openid: wxContext.OPENID,
      nickName: profileData.nickName,
      avatarUrl: profileData.avatarUrl,
      signature: profileData.signature,
      privacyLevel: profileData.privacyLevel || 1,
      notificationEnabled: profileData.notificationEnabled !== false,
      theme: profileData.theme || '清新绿色',
      language: profileData.language || 'zh-CN',
      updateTime: db.serverDate()
    }
    
    if (existingSettings.length > 0) {
      // 更新现有设置
      await db.collection('user_settings')
        .where({
          openid: wxContext.OPENID
        })
        .update({
          data: settingsData
        })
    } else {
      // 创建新设置
      await db.collection('user_settings').add({
        data: {
          ...settingsData,
          createTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      message: '用户配置更新成功',
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('更新用户配置失败:', err)
    throw err
  }
}

/**
 * 备份用户数据
 */
async function backupUserData(wxContext) {
  console.log('备份用户数据')
  
  try {
    // 获取所有用户数据
    const userData = await getUserData(wxContext)
    
    if (!userData.success) {
      throw new Error('获取用户数据失败')
    }
    
    // 创建备份记录
    const backupId = `backup_${wxContext.OPENID}_${Date.now()}`
    
    await db.collection('data_backups').add({
      data: {
        backupId,
        openid: wxContext.OPENID,
        userData: userData.data,
        backupTime: db.serverDate(),
        version: '1.0',
        status: 'completed'
      }
    })
    
    return {
      success: true,
      message: '数据备份成功',
      backupId,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('备份用户数据失败:', err)
    throw err
  }
}

/**
 * 删除用户数据
 */
async function deleteUserData(deleteOptions, wxContext) {
  console.log('删除用户数据:', deleteOptions)
  
  try {
    const { dataTypes, confirmCode } = deleteOptions
    
    // 验证确认码（这里简化处理）
    if (confirmCode !== 'DELETE_MY_DATA') {
      throw new Error('确认码不正确')
    }
    
    const deleteResults = {}
    
    // 删除情绪记录
    if (dataTypes.includes('emotions')) {
      const { stats: emotionStats } = await db.collection('emotion_records')
        .where({
          openid: wxContext.OPENID
        })
        .remove()
      
      deleteResults.emotions = emotionStats.removed
    }
    
    // 删除分析结果
    if (dataTypes.includes('analysis')) {
      const { stats: analysisStats } = await db.collection('emotion_analysis')
        .where({
          openid: wxContext.OPENID
        })
        .remove()
      
      deleteResults.analysis = analysisStats.removed
    }
    
    // 删除社区动态
    if (dataTypes.includes('community')) {
      const { stats: communityStats } = await db.collection('community_posts')
        .where({
          authorId: wxContext.OPENID
        })
        .remove()
      
      deleteResults.community = communityStats.removed
    }
    
    // 删除用户设置
    if (dataTypes.includes('settings')) {
      const { stats: settingsStats } = await db.collection('user_settings')
        .where({
          openid: wxContext.OPENID
        })
        .remove()
      
      deleteResults.settings = settingsStats.removed
    }
    
    // 记录删除操作
    await db.collection('user_operations').add({
      data: {
        openid: wxContext.OPENID,
        operation: 'delete_data',
        dataTypes,
        deleteResults,
        timestamp: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '数据删除成功',
      deleteResults,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('删除用户数据失败:', err)
    throw err
  }
}

/**
 * 获取数据统计摘要
 */
async function getDataSummary(wxContext) {
  console.log('获取数据统计摘要')
  
  try {
    // 获取情绪记录统计
    const emotionStats = await getEmotionRecordStats(wxContext.OPENID)
    
    // 获取最近活动
    const recentActivity = await getRecentActivity(wxContext.OPENID)
    
    // 获取成就统计
    const achievements = await calculateAchievements(wxContext.OPENID)
    
    return {
      success: true,
      data: {
        emotionStats,
        recentActivity,
        achievements,
        lastUpdateTime: new Date().toISOString()
      }
    }
  } catch (err) {
    console.error('获取数据摘要失败:', err)
    throw err
  }
}

/**
 * 获取情绪记录统计
 */
async function getEmotionRecordStats(openid) {
  const { data: records } = await db.collection('emotion_records')
    .where({ openid })
    .get()
  
  if (records.length === 0) {
    return {
      totalRecords: 0,
      averageIntensity: 0,
      activeDays: 0,
      longestStreak: 0,
      currentStreak: 0,
      emotionDistribution: {}
    }
  }
  
  // 计算平均强度
  const totalIntensity = records.reduce((sum, r) => sum + r.intensity, 0)
  const averageIntensity = (totalIntensity / records.length).toFixed(1)
  
  // 计算活跃天数
  const uniqueDates = [...new Set(records.map(r => 
    new Date(r.timestamp).toDateString()
  ))]
  const activeDays = uniqueDates.length
  
  // 计算连续天数
  const streakStats = calculateStreakStats(records)
  
  // 计算情绪分布
  const emotionDistribution = {}
  records.forEach(r => {
    emotionDistribution[r.emotion] = (emotionDistribution[r.emotion] || 0) + 1
  })
  
  return {
    totalRecords: records.length,
    averageIntensity: parseFloat(averageIntensity),
    activeDays,
    longestStreak: streakStats.longest,
    currentStreak: streakStats.current,
    emotionDistribution,
    firstRecordDate: records[records.length - 1]?.timestamp,
    lastRecordDate: records[0]?.timestamp
  }
}

/**
 * 计算连续天数统计
 */
function calculateStreakStats(records) {
  if (records.length === 0) return { longest: 0, current: 0 }
  
  const dates = records.map(r => new Date(r.timestamp).toDateString())
  const uniqueDates = [...new Set(dates)].sort()
  
  let longestStreak = 1
  let currentStreakCount = 1
  let tempStreak = 1
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i])
    const prevDate = new Date(uniqueDates[i - 1])
    const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
    
    if (dayDiff === 1) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 1
    }
  }
  
  // 计算当前连续天数
  const today = new Date().toDateString()
  if (uniqueDates.includes(today)) {
    for (let i = uniqueDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(uniqueDates[i + 1])
      const prevDate = new Date(uniqueDates[i])
      const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
      
      if (dayDiff === 1) {
        currentStreakCount++
      } else {
        break
      }
    }
  } else {
    currentStreakCount = 0
  }
  
  return {
    longest: longestStreak,
    current: currentStreakCount
  }
}

/**
 * 获取最近活动
 */
async function getRecentActivity(openid) {
  // 获取最近7天的记录
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: recentRecords } = await db.collection('emotion_records')
    .where({
      openid,
      timestamp: _.gte(sevenDaysAgo.toISOString())
    })
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get()
  
  // 获取最近的社区动态
  const { data: recentPosts } = await db.collection('community_posts')
    .where({
      authorId: openid
    })
    .orderBy('createTime', 'desc')
    .limit(5)
    .get()
  
  return {
    recentRecords: recentRecords.slice(0, 5),
    recentPosts,
    weeklyCount: recentRecords.length
  }
}

/**
 * 计算成就
 */
async function calculateAchievements(openid) {
  const stats = await getEmotionRecordStats(openid)
  const achievements = []
  
  // 记录成就
  if (stats.totalRecords >= 1) {
    achievements.push({ id: 'first_record', name: '初次记录', unlocked: true })
  }
  if (stats.totalRecords >= 10) {
    achievements.push({ id: 'ten_records', name: '十次记录', unlocked: true })
  }
  if (stats.totalRecords >= 50) {
    achievements.push({ id: 'fifty_records', name: '五十次记录', unlocked: true })
  }
  if (stats.totalRecords >= 100) {
    achievements.push({ id: 'hundred_records', name: '百次记录', unlocked: true })
  }
  
  // 连续记录成就
  if (stats.longestStreak >= 7) {
    achievements.push({ id: 'week_streak', name: '坚持一周', unlocked: true })
  }
  if (stats.longestStreak >= 30) {
    achievements.push({ id: 'month_streak', name: '坚持一月', unlocked: true })
  }
  
  // 活跃成就
  if (stats.activeDays >= 15) {
    achievements.push({ id: 'active_month', name: '活跃一月', unlocked: true })
  }
  
  return {
    unlocked: achievements,
    total: 12, // 总成就数量
    unlockedCount: achievements.length
  }
}