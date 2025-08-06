// 数据库初始化脚本
// 在云开发控制台的数据库页面运行此脚本

console.log('=== 开始初始化数据库 ===')

// 创建数据库集合
async function initDatabase() {
  const db = wx.cloud.database()
  
  try {
    // 1. 创建情绪记录集合
    console.log('创建 emotion_records 集合...')
    
    // 插入示例数据
    await db.collection('emotion_records').add({
      data: {
        emotion: {
          name: '开心',
          emoji: '😊',
          type: 'happy'
        },
        intensity: 8,
        description: '今天天气很好，心情不错',
        tags: ['天气', '心情'],
        timestamp: Date.now(),
        location: '',
        source: 'manual'
      }
    })
    console.log('✅ emotion_records 集合创建成功')
    
    // 2. 创建社区帖子集合
    console.log('创建 community_posts 集合...')
    
    await db.collection('community_posts').add({
      data: {
        content: '今天是美好的一天！',
        mood: '开心',
        topic: 'daily',
        privacy: 'public',
        likes: 0,
        comments: 0,
        timestamp: Date.now(),
        anonymous: false
      }
    })
    console.log('✅ community_posts 集合创建成功')
    
    // 3. 创建用户资料集合
    console.log('创建 user_profiles 集合...')
    
    await db.collection('user_profiles').add({
      data: {
        nickName: '测试用户',
        avatarUrl: '',
        level: 1,
        exp: 0,
        achievements: [],
        settings: {
          notification: true,
          privacy: 1,
          theme: 'light'
        },
        stats: {
          totalRecords: 0,
          streakDays: 0,
          activeDays: 0
        },
        lastActive: Date.now()
      }
    })
    console.log('✅ user_profiles 集合创建成功')
    
    // 4. 创建评论集合
    console.log('创建 post_comments 集合...')
    
    await db.collection('post_comments').add({
      data: {
        postId: 'example_post_id',
        content: '很棒的分享！',
        timestamp: Date.now(),
        likes: 0,
        anonymous: false
      }
    })
    console.log('✅ post_comments 集合创建成功')
    
    // 5. 创建用户成就集合
    console.log('创建 user_achievements 集合...')
    
    await db.collection('user_achievements').add({
      data: {
        achievementId: 'first_record',
        unlockedAt: Date.now(),
        progress: 100,
        claimed: true
      }
    })
    console.log('✅ user_achievements 集合创建成功')
    
    console.log('🎉 数据库初始化完成！')
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
  }
}

// 设置数据库权限函数
function getDatabasePermissions() {
  return {
    emotion_records: {
      read: "auth.openid == doc._openid", // 只能读取自己的记录
      write: "auth.openid == doc._openid" // 只能写入自己的记录
    },
    community_posts: {
      read: true, // 所有人可读
      write: "auth.openid == doc._openid" // 只能写入自己的帖子
    },
    user_profiles: {
      read: "auth.openid == doc._openid", // 只能读取自己的资料
      write: "auth.openid == doc._openid" // 只能写入自己的资料
    },
    post_comments: {
      read: true, // 所有人可读评论
      write: "auth.openid == doc._openid" // 只能写入自己的评论
    },
    user_achievements: {
      read: "auth.openid == doc._openid", // 只能读取自己的成就
      write: "auth.openid == doc._openid" // 只能写入自己的成就
    }
  }
}

// 执行初始化
console.log('权限配置信息:')
console.log(JSON.stringify(getDatabasePermissions(), null, 2))
console.log('')
console.log('开始执行数据库初始化...')
initDatabase()

// 使用说明：
// 1. 在微信开发者工具中打开云开发控制台
// 2. 进入数据库页面
// 3. 在数据库控制台中运行此脚本
// 4. 根据输出的权限配置信息手动设置各集合权限