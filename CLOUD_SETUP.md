# 云开发部署详细指南

## ✅ 当前配置状态
- **AppID**: `wxf2a1defe4093ab24`
- **云环境ID**: `cloud1-8g0nzxjxe1f94684`
- **状态**: 配置完成，可直接部署

## 🚀 云函数部署步骤

### 1. emotion-analysis 云函数部署

**功能**: AI情绪分析和模式识别

**部署步骤**:
1. 在微信开发者工具中，右键点击 `cloudfunctions/emotion-analysis` 文件夹
2. 选择 "上传并部署：云端安装依赖"
3. 等待部署完成（约1-2分钟）
4. 在云开发控制台确认函数状态为"正常"

**测试验证**:
```javascript
// 在小程序中测试调用
wx.cloud.callFunction({
  name: 'emotion-analysis',
  data: {
    records: [/* 测试数据 */]
  }
})
```

### 2. community 云函数部署

**功能**: 社区动态管理和内容审核

**部署步骤**:
1. 右键点击 `cloudfunctions/community` 文件夹
2. 选择 "上传并部署：云端安装依赖"
3. 等待部署完成
4. 确认部署状态

**测试验证**:
```javascript
// 测试社区功能
wx.cloud.callFunction({
  name: 'community',
  data: {
    action: 'getPosts',
    filter: 'latest'
  }
})
```

### 3. user-data 云函数部署

**功能**: 用户数据管理和同步

**部署步骤**:
1. 右键点击 `cloudfunctions/user-data` 文件夹
2. 选择 "上传并部署：云端安装依赖"
3. 等待部署完成
4. 确认部署状态

**测试验证**:
```javascript
// 测试用户数据功能
wx.cloud.callFunction({
  name: 'user-data',
  data: {
    action: 'syncData',
    userData: {/* 用户数据 */}
  }
})
```

## 📊 数据库初始化

### 创建数据库集合

在云开发控制台的数据库页面，创建以下集合：

#### 1. emotion_records (情绪记录)
```json
{
  "_id": "记录ID",
  "_openid": "用户OpenID",
  "emotion": "情绪类型",
  "intensity": "强度(1-10)",
  "description": "描述",
  "triggers": ["触发因素"],
  "timestamp": "时间戳",
  "mood": "心情详情",
  "tags": ["标签"]
}
```

#### 2. user_profiles (用户资料)
```json
{
  "_id": "用户ID", 
  "_openid": "用户OpenID",
  "nickName": "昵称",
  "avatarUrl": "头像URL",
  "signature": "个人签名",
  "privacy": "隐私设置",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

#### 3. community_posts (社区动态)
```json
{
  "_id": "动态ID",
  "_openid": "发布者OpenID", 
  "content": "动态内容",
  "mood": "情绪信息",
  "tags": ["话题标签"],
  "privacy": "隐私级别",
  "likeCount": "点赞数",
  "commentCount": "评论数",
  "createdAt": "发布时间"
}
```

#### 4. community_comments (社区评论)
```json
{
  "_id": "评论ID",
  "_openid": "评论者OpenID",
  "postId": "动态ID", 
  "content": "评论内容",
  "likeCount": "点赞数",
  "createdAt": "评论时间"
}
```

#### 5. user_achievements (用户成就)
```json
{
  "_id": "成就记录ID",
  "_openid": "用户OpenID",
  "achievementId": "成就ID",
  "unlockedAt": "解锁时间",
  "progress": "完成进度",
  "reward": "奖励信息"
}
```

### 数据库权限设置

为每个集合设置权限规则：

#### emotion_records 权限
```json
{
  "read": "auth.uid == resource.data._openid",
  "write": "auth.uid == resource.data._openid"
}
```

#### user_profiles 权限
```json
{
  "read": true,
  "write": "auth.uid == resource.data._openid"
}
```

#### community_posts 权限
```json
{
  "read": "resource.data.privacy != 'private' || auth.uid == resource.data._openid",
  "write": "auth.uid == resource.data._openid"
}
```

#### community_comments 权限
```json
{
  "read": true,
  "write": "auth.uid == resource.data._openid"
}
```

#### user_achievements 权限
```json
{
  "read": "auth.uid == resource.data._openid",
  "write": "auth.uid == resource.data._openid"
}
```

## 🔍 数据库索引优化

为提升查询性能，创建以下索引：

### emotion_records 索引
- `_openid` + `timestamp` (复合索引)
- `timestamp` (单字段索引，降序)

### community_posts 索引
- `createdAt` (单字段索引，降序)
- `tags` (单字段索引)
- `_openid` + `createdAt` (复合索引)

### community_comments 索引
- `postId` + `createdAt` (复合索引)

### user_achievements 索引
- `_openid` + `unlockedAt` (复合索引)

## ⚡ 云函数环境变量配置

在云开发控制台为云函数配置环境变量：

### emotion-analysis 环境变量
```bash
AI_API_KEY=your_ai_api_key
MODEL_VERSION=v1.0
MAX_ANALYSIS_RECORDS=1000
```

### community 环境变量
```bash
CONTENT_SECURITY_KEY=your_security_key
MAX_POST_LENGTH=200
MAX_COMMENT_LENGTH=100
SENSITIVE_WORDS_API=your_api_endpoint
```

### user-data 环境变量
```bash
BACKUP_INTERVAL=86400
MAX_USER_RECORDS=10000
SYNC_BATCH_SIZE=100
```

## 🧪 部署后测试清单

### 云函数测试
- [ ] emotion-analysis 函数调用成功
- [ ] community 函数调用成功  
- [ ] user-data 函数调用成功
- [ ] 所有函数返回正确响应

### 数据库测试
- [ ] 所有集合创建成功
- [ ] 权限规则生效
- [ ] 索引创建完成
- [ ] 数据读写正常

### 小程序功能测试
- [ ] 用户登录获取OpenID成功
- [ ] 情绪记录保存到数据库
- [ ] 数据分析功能正常
- [ ] 社区发布评论功能正常
- [ ] 成就系统工作正常

## 🚨 常见部署问题

### 云函数部署失败
**问题**: 上传失败或依赖安装失败
**解决方案**:
1. 检查网络连接
2. 重试部署操作
3. 查看云开发控制台错误日志
4. 检查函数代码语法

### 数据库权限错误
**问题**: 数据读写权限不足
**解决方案**:
1. 检查权限规则配置
2. 确认用户已正确登录
3. 验证OpenID获取正常
4. 重新设置集合权限

### 云函数调用超时
**问题**: 函数执行时间过长
**解决方案**:
1. 检查函数逻辑复杂度
2. 优化数据库查询
3. 增加函数超时时间
4. 使用异步处理

### 环境变量配置错误
**问题**: 云函数无法读取环境变量
**解决方案**:
1. 在云开发控制台重新配置
2. 确认变量名称正确
3. 重新部署云函数
4. 检查函数代码中的引用

## ✅ 部署完成验证

当所有配置完成后，您应该能够：

1. **正常启动小程序** - 无报错，界面显示正常
2. **用户登录成功** - 获取到真实OpenID
3. **情绪记录功能** - 数据保存到云数据库
4. **AI分析功能** - 云函数调用成功，返回分析结果
5. **社区功能** - 能够发布动态和评论
6. **成就系统** - 能够解锁和显示成就
7. **数据同步** - 本地和云端数据保持一致

## 📞 获取帮助

如果在部署过程中遇到问题：

1. **查看开发者工具控制台** - 获取详细错误信息
2. **检查云开发控制台** - 查看云函数和数据库状态
3. **参考错误日志** - 定位具体问题原因
4. **使用CONTEXT_HANDOVER.md** - 重启对话获取技术支持

---

**预计部署时间**: 20-30分钟
**技术支持**: 完整文档和代码支持
**项目状态**: 配置完成，立即可部署