// 生产环境配置检查脚本
// 在微信开发者工具控制台中运行

console.log('🔍 生产环境配置检查');
console.log('====================');

// 检查结果存储
const checkResults = {
  passed: [],
  failed: [],
  warnings: []
};

// 检查函数
function checkItem(name, condition, description, isWarning = false) {
  if (condition) {
    checkResults.passed.push({ name, description });
    console.log(`✅ ${name}: ${description}`);
  } else {
    if (isWarning) {
      checkResults.warnings.push({ name, description });
      console.log(`⚠️  ${name}: ${description}`);
    } else {
      checkResults.failed.push({ name, description });
      console.log(`❌ ${name}: ${description}`);
    }
  }
}

// 1. 基础配置检查
function checkBasicConfig() {
  console.log('\n📱 基础配置检查');
  console.log('================');
  
  // 检查App配置
  const app = getApp();
  checkItem(
    'App实例', 
    app !== null && app !== undefined,
    'App实例正常获取'
  );
  
  checkItem(
    'GlobalData配置',
    app && app.globalData && app.globalData.cloudEnv,
    `云环境ID: ${app?.globalData?.cloudEnv || '未配置'}`
  );
  
  checkItem(
    '小程序版本',
    app && app.globalData && app.globalData.version,
    `版本: ${app?.globalData?.version || '未设置'}`
  );
  
  // 检查云开发初始化
  checkItem(
    '云开发可用性',
    typeof wx.cloud !== 'undefined',
    '云开发SDK可用'
  );
}

// 2. 存储检查
function checkStorage() {
  console.log('\n💾 本地存储检查');
  console.log('================');
  
  try {
    // 检查关键存储项
    const emotionRecords = wx.getStorageSync('emotionRecords');
    checkItem(
      '情绪记录存储',
      Array.isArray(emotionRecords),
      `存储${emotionRecords ? emotionRecords.length : 0}条记录`
    );
    
    const userInfo = wx.getStorageSync('userInfo');
    checkItem(
      '用户信息存储',
      userInfo !== '',
      userInfo ? '用户信息已存储' : '用户信息未存储',
      true
    );
    
    const appSettings = wx.getStorageSync('appSettings');
    checkItem(
      '应用设置存储',
      typeof appSettings === 'object',
      appSettings ? '应用设置已配置' : '使用默认设置',
      true
    );
    
    // 检查存储空间
    wx.getStorageInfo({
      success: (res) => {
        const usedSpace = res.currentSize;
        const maxSpace = res.limitSize;
        const usagePercent = (usedSpace / maxSpace * 100).toFixed(2);
        
        checkItem(
          '存储空间',
          usagePercent < 80,
          `已使用${usagePercent}% (${usedSpace}KB/${maxSpace}KB)`
        );
      }
    });
    
  } catch (error) {
    checkItem('存储访问', false, `存储访问错误: ${error.message}`);
  }
}

// 3. 网络检查
function checkNetwork() {
  console.log('\n🌐 网络连接检查');
  console.log('================');
  
  wx.getNetworkType({
    success: (res) => {
      const networkType = res.networkType;
      checkItem(
        '网络连接',
        networkType !== 'none',
        `网络类型: ${networkType}`
      );
      
      checkItem(
        '网络质量',
        networkType === 'wifi' || networkType === '4g' || networkType === '5g',
        networkType === 'wifi' ? 'WiFi连接，网络良好' : 
        networkType === '4g' || networkType === '5g' ? '移动网络连接' : '网络连接较慢',
        networkType !== 'wifi' && networkType !== '4g' && networkType !== '5g'
      );
    },
    fail: () => {
      checkItem('网络检查', false, '无法获取网络状态');
    }
  });
}

// 4. 云函数检查
async function checkCloudFunctions() {
  console.log('\n☁️  云函数检查');
  console.log('==============');
  
  const functions = ['user-data', 'community', 'emotion-analysis'];
  
  for (const funcName of functions) {
    try {
      const startTime = Date.now();
      const result = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: funcName,
          data: { action: 'healthCheck' },
          timeout: 10000,
          success: resolve,
          fail: reject
        });
      });
      
      const duration = Date.now() - startTime;
      checkItem(
        `云函数-${funcName}`,
        true,
        `响应时间: ${duration}ms`
      );
      
      checkItem(
        `${funcName}响应时间`,
        duration < 3000,
        duration < 1000 ? '响应很快' : duration < 3000 ? '响应正常' : '响应较慢',
        duration >= 3000
      );
      
    } catch (error) {
      checkItem(
        `云函数-${funcName}`,
        false,
        `调用失败: ${error.errMsg || error.message}`
      );
    }
  }
}

// 5. 系统信息检查
function checkSystemInfo() {
  console.log('\n📱 系统信息检查');
  console.log('================');
  
  wx.getSystemInfo({
    success: (res) => {
      checkItem(
        '微信版本',
        res.version >= '7.0.0',
        `微信版本: ${res.version}`
      );
      
      checkItem(
        '基础库版本',
        res.SDKVersion >= '2.10.0',
        `基础库版本: ${res.SDKVersion}`
      );
      
      checkItem(
        '操作系统',
        true,
        `${res.system} (${res.platform})`
      );
      
      checkItem(
        '屏幕分辨率',
        res.windowWidth > 0 && res.windowHeight > 0,
        `${res.windowWidth}x${res.windowHeight}px`
      );
      
      checkItem(
        '设备性能',
        res.benchmarkLevel >= 0,
        `性能等级: ${res.benchmarkLevel >= 50 ? '高' : res.benchmarkLevel >= 20 ? '中' : '低'} (${res.benchmarkLevel})`,
        res.benchmarkLevel < 20
      );
    },
    fail: () => {
      checkItem('系统信息', false, '无法获取系统信息');
    }
  });
}

// 6. 权限检查
function checkPermissions() {
  console.log('\n🔐 权限检查');
  console.log('============');
  
  // 检查基础权限
  wx.getSetting({
    success: (res) => {
      const authSettings = res.authSetting;
      
      checkItem(
        '用户信息权限',
        authSettings['scope.userInfo'] !== false,
        authSettings['scope.userInfo'] === true ? '已授权' : '未授权',
        authSettings['scope.userInfo'] !== true
      );
      
      checkItem(
        '位置信息权限',
        authSettings['scope.userLocation'] !== false,
        authSettings['scope.userLocation'] === true ? '已授权' : '未授权',
        true
      );
      
      // 检查云开发权限
      try {
        wx.cloud.database().collection('test').get({
          success: () => {
            checkItem('数据库访问权限', true, '数据库访问正常');
          },
          fail: (err) => {
            checkItem('数据库访问权限', false, `数据库访问失败: ${err.errMsg}`);
          }
        });
      } catch (error) {
        checkItem('数据库访问权限', false, `数据库访问错误: ${error.message}`);
      }
    },
    fail: () => {
      checkItem('权限检查', false, '无法获取权限设置');
    }
  });
}

// 7. 性能检查
function checkPerformance() {
  console.log('\n⚡ 性能检查');
  console.log('==========');
  
  // 内存使用检查
  const performance = wx.getPerformance();
  if (performance) {
    const memory = performance.memory;
    if (memory) {
      const usedMemory = memory.usedHeapSize / 1024 / 1024; // MB
      const totalMemory = memory.totalHeapSize / 1024 / 1024; // MB
      
      checkItem(
        '内存使用',
        usedMemory < totalMemory * 0.8,
        `已使用 ${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`
      );
    }
  }
  
  // 页面数量检查
  const pages = getCurrentPages();
  checkItem(
    '页面栈',
    pages.length <= 10,
    `当前页面栈深度: ${pages.length}/10`
  );
}

// 执行所有检查
async function runAllChecks() {
  console.log('🚀 开始执行生产环境配置检查...\n');
  
  checkBasicConfig();
  checkStorage();
  checkNetwork();
  checkSystemInfo();
  checkPermissions();
  checkPerformance();
  
  // 云函数检查需要异步执行
  await checkCloudFunctions();
  
  // 输出总结报告
  setTimeout(() => {
    console.log('\n📊 检查结果总结');
    console.log('================');
    console.log(`✅ 通过检查: ${checkResults.passed.length} 项`);
    console.log(`❌ 失败检查: ${checkResults.failed.length} 项`);
    console.log(`⚠️  警告提醒: ${checkResults.warnings.length} 项`);
    
    if (checkResults.failed.length === 0) {
      console.log('\n🎉 恭喜！所有核心配置检查通过，可以进行生产部署！');
    } else {
      console.log('\n⚠️  发现问题，建议修复后再进行生产部署：');
      checkResults.failed.forEach(item => {
        console.log(`   • ${item.name}: ${item.description}`);
      });
    }
    
    if (checkResults.warnings.length > 0) {
      console.log('\n💡 建议优化项目：');
      checkResults.warnings.forEach(item => {
        console.log(`   • ${item.name}: ${item.description}`);
      });
    }
  }, 3000);
}

// 执行检查
runAllChecks();

// 使用说明
console.log(`
💡 使用说明：
1. 在微信开发者工具中打开小程序项目
2. 打开调试器 → Console 面板
3. 复制粘贴此脚本并执行
4. 等待检查完成，查看结果总结
5. 根据检查结果修复问题或优化配置
`);