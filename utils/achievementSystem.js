// 成就系统工具类
class AchievementSystem {
  constructor() {
    this.achievements = [
      // 记录成就
      {
        id: 'first_record',
        name: '初次记录',
        description: '记录第一次情绪',
        icon: '../../assets/icons/target.png',
        type: 'milestone',
        category: 'record',
        condition: { type: 'recordCount', value: 1 },
        reward: { exp: 10, title: '情绪探索者' },
        rarity: 'common'
      },
      {
        id: 'ten_records',
        name: '十次记录',
        description: '累计记录10次情绪',
        icon: '../../assets/icons/running.png',
        type: 'milestone',
        category: 'record',
        condition: { type: 'recordCount', value: 10 },
        reward: { exp: 25, title: '情绪观察者' },
        rarity: 'common'
      },
      {
        id: 'fifty_records',
        name: '五十次记录',
        description: '累计记录50次情绪',
        icon: '../../assets/icons/star.png',
        type: 'milestone',
        category: 'record',
        condition: { type: 'recordCount', value: 50 },
        reward: { exp: 100, title: '情绪记录师' },
        rarity: 'uncommon'
      },
      {
        id: 'hundred_records',
        name: '百次记录',
        description: '累计记录100次情绪',
        icon: '../../assets/icons/diamond.png',
        type: 'milestone',
        category: 'record',
        condition: { type: 'recordCount', value: 100 },
        reward: { exp: 250, title: '情绪大师' },
        rarity: 'rare'
      },
      
      // 连续记录成就
      {
        id: 'three_day_streak',
        name: '连续三天',
        description: '连续记录3天',
        icon: '../../assets/icons/fire.png',
        type: 'streak',
        category: 'consistency',
        condition: { type: 'streak', value: 3 },
        reward: { exp: 30, badge: '坚持者' },
        rarity: 'common'
      },
      {
        id: 'week_streak',
        name: '坚持一周',
        description: '连续记录7天',
        icon: '../../assets/icons/trophy.png',
        type: 'streak',
        category: 'consistency',
        condition: { type: 'streak', value: 7 },
        reward: { exp: 75, badge: '周冠军' },
        rarity: 'uncommon'
      },
      {
        id: 'month_streak',
        name: '坚持一月',
        description: '连续记录30天',
        icon: '../../assets/icons/crown.png',
        type: 'streak',
        category: 'consistency',
        condition: { type: 'streak', value: 30 },
        reward: { exp: 300, badge: '月度王者' },
        rarity: 'epic'
      },
      {
        id: 'hundred_day_streak',
        name: '百日坚持',
        description: '连续记录100天',
        icon: '../../assets/icons/sparkle.png',
        type: 'streak',
        category: 'consistency',
        condition: { type: 'streak', value: 100 },
        reward: { exp: 1000, badge: '传奇坚持者' },
        rarity: 'legendary'
      },
      
      // 情绪多样性成就
      {
        id: 'emotion_explorer',
        name: '情绪探索家',
        description: '记录5种不同情绪',
        icon: '../../assets/icons/palette.png',
        type: 'variety',
        category: 'diversity',
        condition: { type: 'emotionTypes', value: 5 },
        reward: { exp: 50, badge: '多彩心情' },
        rarity: 'uncommon'
      },
      {
        id: 'emotion_master',
        name: '情绪大师',
        description: '记录所有8种情绪',
        icon: '../../assets/icons/mask.png',
        type: 'variety',
        category: 'diversity',
        condition: { type: 'emotionTypes', value: 8 },
        reward: { exp: 150, badge: '情绪全才' },
        rarity: 'rare'
      },
      
      // 积极情绪成就
      {
        id: 'positive_week',
        name: '积极一周',
        description: '一周内80%记录为积极情绪',
        icon: '../../assets/icons/sun.png',
        type: 'mood',
        category: 'positive',
        condition: { type: 'positiveRatio', value: 0.8, period: 7 },
        reward: { exp: 100, badge: '阳光使者' },
        rarity: 'rare'
      },
      {
        id: 'happiness_streak',
        name: '快乐连击',
        description: '连续3天记录开心情绪',
        icon: '../../assets/icons/smile.png',
        type: 'mood',
        category: 'positive',
        condition: { type: 'emotionStreak', emotion: '开心', value: 3 },
        reward: { exp: 60, badge: '快乐达人' },
        rarity: 'uncommon'
      },
      
      // 社区互动成就
      {
        id: 'first_post',
        name: '首次分享',
        description: '发布第一条动态',
        icon: '../../assets/icons/note.png',
        type: 'social',
        category: 'community',
        condition: { type: 'postCount', value: 1 },
        reward: { exp: 20, badge: '分享者' },
        rarity: 'common'
      },
      {
        id: 'popular_post',
        name: '人气达人',
        description: '单条动态获得10个赞',
        icon: '../../assets/icons/heart.png',
        type: 'social',
        category: 'community',
        condition: { type: 'postLikes', value: 10 },
        reward: { exp: 80, badge: '人气王' },
        rarity: 'uncommon'
      },
      {
        id: 'helpful_commenter',
        name: '热心评论家',
        description: '发表20条评论',
        icon: '../../assets/icons/chat.png',
        type: 'social',
        category: 'community',
        condition: { type: 'commentCount', value: 20 },
        reward: { exp: 120, badge: '交流达人' },
        rarity: 'rare'
      },
      
      // 特殊成就
      {
        id: 'night_owl',
        name: '夜猫子',
        description: '在午夜后记录情绪10次',
        icon: '../../assets/icons/moon.png',
        type: 'special',
        category: 'time',
        condition: { type: 'timePattern', time: 'night', value: 10 },
        reward: { exp: 50, badge: '夜行者' },
        rarity: 'uncommon'
      },
      {
        id: 'early_bird',
        name: '早起鸟',
        description: '在早晨6点前记录情绪15次',
        icon: '../../assets/icons/sunrise.png',
        type: 'special',
        category: 'time',
        condition: { type: 'timePattern', time: 'morning', value: 15 },
        reward: { exp: 60, badge: '晨光使者' },
        rarity: 'uncommon'
      },
      {
        id: 'seasonal_recorder',
        name: '四季记录者',
        description: '在四个季节都有记录',
        icon: '../../assets/icons/leaf.png',
        type: 'special',
        category: 'time',
        condition: { type: 'seasonalRecord', value: 4 },
        reward: { exp: 200, badge: '时光见证者' },
        rarity: 'epic'
      }
    ]
    
    this.levels = [
      { level: 1, name: '新手', minExp: 0, maxExp: 100, badge: '🌱' },
      { level: 2, name: '探索者', minExp: 100, maxExp: 250, badge: '🔍' },
      { level: 3, name: '观察者', minExp: 250, maxExp: 500, badge: '👁️' },
      { level: 4, name: '记录师', minExp: 500, maxExp: 1000, badge: '📝' },
      { level: 5, name: '分析师', minExp: 1000, maxExp: 2000, badge: '📊' },
      { level: 6, name: '大师', minExp: 2000, maxExp: 4000, badge: '🎓' },
      { level: 7, name: '专家', minExp: 4000, maxExp: 8000, badge: '⭐' },
      { level: 8, name: '导师', minExp: 8000, maxExp: 16000, badge: '🏆' },
      { level: 9, name: '宗师', minExp: 16000, maxExp: 32000, badge: '💎' },
      { level: 10, name: '传奇', minExp: 32000, maxExp: 999999, badge: '👑' }
    ]
  }

  /**
   * 检查并解锁成就
   * @param {object} userStats 用户统计数据
   * @param {array} userRecords 用户记录
   * @param {array} userAchievements 已解锁成就
   */
  checkAchievements(userStats, userRecords = [], userAchievements = []) {
    const newAchievements = []
    const unlockedIds = userAchievements.map(a => a.id)
    
    for (const achievement of this.achievements) {
      if (unlockedIds.includes(achievement.id)) continue
      
      if (this.checkCondition(achievement.condition, userStats, userRecords)) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date().toISOString(),
          isNew: true
        })
      }
    }
    
    return newAchievements
  }

  /**
   * 检查成就条件
   */
  checkCondition(condition, userStats, userRecords) {
    switch (condition.type) {
      case 'recordCount':
        return userStats.totalRecords >= condition.value
        
      case 'streak':
        return userStats.currentStreak >= condition.value
        
      case 'emotionTypes':
        const uniqueEmotions = new Set(userRecords.map(r => r.emotion))
        return uniqueEmotions.size >= condition.value
        
      case 'positiveRatio':
        const positiveEmotions = ['开心', '兴奋', '感激', '平静']
        const recentRecords = this.getRecentRecords(userRecords, condition.period)
        const positiveCount = recentRecords.filter(r => positiveEmotions.includes(r.emotion)).length
        return (positiveCount / recentRecords.length) >= condition.value
        
      case 'emotionStreak':
        return this.checkEmotionStreak(userRecords, condition.emotion, condition.value)
        
      case 'postCount':
        return (userStats.postCount || 0) >= condition.value
        
      case 'postLikes':
        return (userStats.maxPostLikes || 0) >= condition.value
        
      case 'commentCount':
        return (userStats.commentCount || 0) >= condition.value
        
      case 'timePattern':
        return this.checkTimePattern(userRecords, condition.time, condition.value)
        
      case 'seasonalRecord':
        return this.checkSeasonalRecord(userRecords, condition.value)
        
      default:
        return false
    }
  }

  /**
   * 获取最近N天的记录
   */
  getRecentRecords(records, days) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return records.filter(r => new Date(r.timestamp) >= cutoffDate)
  }

  /**
   * 检查情绪连击
   */
  checkEmotionStreak(records, emotion, targetStreak) {
    const sortedRecords = records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    const dates = [...new Set(sortedRecords.map(r => new Date(r.timestamp).toDateString()))]
    
    let streak = 0
    for (const date of dates) {
      const dayRecords = sortedRecords.filter(r => new Date(r.timestamp).toDateString() === date)
      const hasEmotion = dayRecords.some(r => r.emotion === emotion)
      
      if (hasEmotion) {
        streak++
        if (streak >= targetStreak) return true
      } else {
        streak = 0
      }
    }
    
    return false
  }

  /**
   * 检查时间模式
   */
  checkTimePattern(records, timePattern, targetCount) {
    let count = 0
    
    for (const record of records) {
      const hour = new Date(record.timestamp).getHours()
      let match = false
      
      switch (timePattern) {
        case 'night':
          match = hour >= 23 || hour < 6
          break
        case 'morning':
          match = hour >= 5 && hour < 8
          break
        case 'afternoon':
          match = hour >= 12 && hour < 18
          break
        case 'evening':
          match = hour >= 18 && hour < 22
          break
      }
      
      if (match) count++
    }
    
    return count >= targetCount
  }

  /**
   * 检查季节记录
   */
  checkSeasonalRecord(records, targetSeasons) {
    const seasons = new Set()
    
    for (const record of records) {
      const month = new Date(record.timestamp).getMonth() + 1
      let season = ''
      
      if (month >= 3 && month <= 5) season = 'spring'
      else if (month >= 6 && month <= 8) season = 'summer'
      else if (month >= 9 && month <= 11) season = 'autumn'
      else season = 'winter'
      
      seasons.add(season)
    }
    
    return seasons.size >= targetSeasons
  }

  /**
   * 计算用户等级
   */
  calculateLevel(totalExp) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i]
      if (totalExp >= level.minExp) {
        const progress = Math.min(100, ((totalExp - level.minExp) / (level.maxExp - level.minExp)) * 100)
        return {
          ...level,
          progress: Math.round(progress),
          nextLevelExp: level.maxExp,
          expToNext: level.maxExp - totalExp
        }
      }
    }
    
    return this.levels[0]
  }

  /**
   * 获取成就分类统计
   */
  getAchievementStats(userAchievements) {
    const stats = {
      total: this.achievements.length,
      unlocked: userAchievements.length,
      categories: {}
    }
    
    // 按分类统计
    for (const achievement of this.achievements) {
      const category = achievement.category
      if (!stats.categories[category]) {
        stats.categories[category] = { total: 0, unlocked: 0 }
      }
      stats.categories[category].total++
    }
    
    for (const userAchievement of userAchievements) {
      const category = userAchievement.category
      if (stats.categories[category]) {
        stats.categories[category].unlocked++
      }
    }
    
    // 计算进度百分比
    stats.progress = Math.round((stats.unlocked / stats.total) * 100)
    
    return stats
  }

  /**
   * 获取推荐成就（接近完成的）
   */
  getRecommendedAchievements(userStats, userRecords, userAchievements) {
    const unlockedIds = userAchievements.map(a => a.id)
    const recommendations = []
    
    for (const achievement of this.achievements) {
      if (unlockedIds.includes(achievement.id)) continue
      
      const progress = this.getAchievementProgress(achievement, userStats, userRecords)
      if (progress >= 50) { // 进度超过50%的成就
        recommendations.push({
          ...achievement,
          progress,
          remaining: this.getRemainingRequirement(achievement, userStats, userRecords)
        })
      }
    }
    
    return recommendations.sort((a, b) => b.progress - a.progress).slice(0, 3)
  }

  /**
   * 获取成就进度
   */
  getAchievementProgress(achievement, userStats, userRecords) {
    const condition = achievement.condition
    let current = 0
    let target = condition.value
    
    switch (condition.type) {
      case 'recordCount':
        current = userStats.totalRecords
        break
      case 'streak':
        current = userStats.currentStreak
        break
      case 'emotionTypes':
        current = new Set(userRecords.map(r => r.emotion)).size
        break
      case 'postCount':
        current = userStats.postCount || 0
        break
      case 'commentCount':
        current = userStats.commentCount || 0
        break
      default:
        return 0
    }
    
    return Math.min(100, Math.round((current / target) * 100))
  }

  /**
   * 获取剩余要求
   */
  getRemainingRequirement(achievement, userStats, userRecords) {
    const condition = achievement.condition
    let current = 0
    let target = condition.value
    
    switch (condition.type) {
      case 'recordCount':
        current = userStats.totalRecords
        return `还需记录 ${target - current} 次`
      case 'streak':
        current = userStats.currentStreak
        return `还需连续 ${target - current} 天`
      case 'emotionTypes':
        current = new Set(userRecords.map(r => r.emotion)).size
        return `还需记录 ${target - current} 种情绪`
      case 'postCount':
        current = userStats.postCount || 0
        return `还需发布 ${target - current} 条动态`
      case 'commentCount':
        current = userStats.commentCount || 0
        return `还需评论 ${target - current} 次`
      default:
        return '继续加油！'
    }
  }

  /**
   * 获取成就奖励
   */
  getAchievementReward(achievementId) {
    const achievement = this.achievements.find(a => a.id === achievementId)
    return achievement ? achievement.reward : null
  }

  /**
   * 计算总经验值
   */
  calculateTotalExp(userAchievements) {
    return userAchievements.reduce((total, achievement) => {
      return total + (achievement.reward?.exp || 0)
    }, 0)
  }
}

// 创建单例实例
const achievementSystem = new AchievementSystem()

module.exports = {
  achievementSystem
}