// 云函数测试代码
// 复制到微信开发者工具的控制台中执行

console.log('=== 开始测试云函数 ===')

// 测试 user-data 云函数
function testUserData() {
  console.log('测试 user-data 云函数...')
  
  wx.cloud.callFunction({
    name: 'user-data',
    data: {
      action: 'getUserData'
    },
    success: res => {
      console.log('✅ user-data 云函数测试成功:', res)
    },
    fail: err => {
      console.error('❌ user-data 云函数测试失败:', err)
    }
  })
}

// 测试 community 云函数
function testCommunity() {
  console.log('测试 community 云函数...')
  
  wx.cloud.callFunction({
    name: 'community',
    data: {
      action: 'getPosts'
    },
    success: res => {
      console.log('✅ community 云函数测试成功:', res)
    },
    fail: err => {
      console.error('❌ community 云函数测试失败:', err)
    }
  })
}

// 测试 emotion-analysis 云函数
function testEmotionAnalysis() {
  console.log('测试 emotion-analysis 云函数...')
  
  wx.cloud.callFunction({
    name: 'emotion-analysis',
    data: {
      action: 'analyzeEmotion',
      data: {
        text: '今天心情很好',
        intensity: 8
      }
    },
    success: res => {
      console.log('✅ emotion-analysis 云函数测试成功:', res)
    },
    fail: err => {
      console.error('❌ emotion-analysis 云函数测试失败:', err)
    }
  })
}

// 执行测试
setTimeout(() => {
  testUserData()
}, 1000)

setTimeout(() => {
  testCommunity()
}, 2000)

setTimeout(() => {
  testEmotionAnalysis()
}, 3000)

console.log('=== 云函数测试已启动，请查看上方结果 ===')

// 使用方法：
// 1. 在微信开发者工具中打开项目
// 2. 打开调试器 -> Console 面板
// 3. 复制粘贴此代码并执行
// 4. 查看测试结果