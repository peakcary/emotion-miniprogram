# 情绪小助手小程序部署指南

## 部署前准备清单

### 1. 微信小程序账号设置
- [x] 注册微信小程序账号
- [x] AppID 已配置：`wxf2a1defe4093ab24`
- [ ] 完成小程序基本信息配置（名称、介绍、分类等）
- [ ] 上传小程序图标和截图

### 2. 云开发环境配置
- [ ] 在微信开发者工具中开通云开发
- [ ] 创建云开发环境（建议创建测试和生产两个环境）
- [ ] 更新 `app.js` 中的 `cloudEnv` 配置为实际环境ID (当前为示例ID，需要开通后替换)
- [ ] 配置云开发数据库权限

### 3. 云函数部署
- [ ] 部署 `emotion-analysis` 云函数（AI情绪分析）
- [ ] 部署 `community` 云函数（社区功能）
- [ ] 部署 `user-data` 云函数（用户数据管理）
- [ ] 配置云函数环境变量和权限

### 4. 数据库初始化
- [ ] 创建必要的数据库集合：
  - `emotion_records` - 情绪记录
  - `user_profiles` - 用户资料
  - `community_posts` - 社区动态
  - `community_comments` - 评论数据
  - `user_achievements` - 用户成就
- [ ] 配置数据库安全规则
- [ ] 导入初始数据（可选）

### 5. 安全配置
- [ ] 配置服务器域名白名单
- [ ] 设置业务域名（如需要）
- [ ] 配置云函数访问权限
- [ ] 启用内容安全API（文本审核）

## 环境配置说明

### 开发环境
```javascript
// app.js 开发环境配置
globalData: {
  cloudEnv: 'emotion-helper-dev-xxx', // 替换为实际开发环境ID
  isDev: true
}
```

### 生产环境
```javascript
// app.js 生产环境配置
globalData: {
  cloudEnv: 'emotion-helper-prod-xxx', // 替换为实际生产环境ID
  isDev: false
}
```

## 云函数配置

### emotion-analysis (AI分析)
```bash
# 进入云函数目录
cd cloudfunctions/emotion-analysis
# 安装依赖
npm install
# 配置环境变量（在云开发控制台设置）
# API_KEY: AI服务API密钥
# MODEL_VERSION: 模型版本
```

### community (社区功能)
```bash
cd cloudfunctions/community
npm install
# 配置环境变量：
# CONTENT_SECURITY_KEY: 内容安全API密钥
# MAX_POST_LENGTH: 最大动态长度（默认200）
```

### user-data (用户数据)
```bash
cd cloudfunctions/user-data
npm install
# 配置环境变量：
# BACKUP_INTERVAL: 数据备份间隔（默认24小时）
```

## 数据库安全规则

### emotion_records 集合
```json
{
  "read": "auth.uid == resource.data._openid",
  "write": "auth.uid == resource.data._openid"
}
```

### user_profiles 集合
```json
{
  "read": true,
  "write": "auth.uid == resource.data._openid"
}
```

### community_posts 集合
```json
{
  "read": "resource.data.privacy != 'private' || auth.uid == resource.data._openid",
  "write": "auth.uid == resource.data._openid"
}
```

## 域名配置

### request 合法域名
- `https://api.weixin.qq.com` （微信API）
- `https://your-api-domain.com` （如使用外部API）

### uploadFile 合法域名
- `https://cloud-base-xxx.tcb.qcloud.la` （云开发存储）

### downloadFile 合法域名
- `https://cloud-base-xxx.tcb.qcloud.la` （云开发存储）

## 性能优化建议

### 1. 代码分包
```json
// app.json 分包配置
{
  "subpackages": [
    {
      "root": "subpages",
      "pages": [
        "help/help",
        "feedback/feedback",
        "privacy/privacy"
      ]
    }
  ]
}
```

### 2. 资源优化
- [ ] 压缩图片资源
- [ ] 使用WebP格式图片
- [ ] 启用云存储CDN
- [ ] 配置缓存策略

### 3. 数据库优化
- [ ] 创建必要的索引
  - `emotion_records`: `_openid`, `timestamp`
  - `community_posts`: `timestamp`, `category`
  - `user_achievements`: `_openid`, `unlockedAt`
- [ ] 配置数据库连接池
- [ ] 设置数据过期策略

## 监控和日志

### 1. 错误监控
- [ ] 配置云函数错误报警
- [ ] 设置数据库异常监控
- [ ] 启用小程序错误日志收集

### 2. 性能监控
- [ ] 监控云函数执行时间
- [ ] 跟踪数据库查询性能
- [ ] 监控小程序启动时间

### 3. 业务监控
- [ ] 用户活跃度统计
- [ ] 功能使用情况分析
- [ ] 社区内容质量监控

## 部署步骤

### 1. 开发环境测试
```bash
# 使用微信开发者工具
1. 打开项目
2. 编译并预览
3. 真机调试测试
4. 云函数功能测试
```

### 2. 预发布验证
```bash
# 切换到预发布环境
1. 修改cloudEnv为预发布环境
2. 上传代码到微信后台
3. 提交预发布版本
4. 进行完整功能测试
```

### 3. 正式发布
```bash
# 生产环境发布
1. 修改cloudEnv为生产环境
2. 关闭调试模式（isDev: false）
3. 上传正式版本代码
4. 提交审核
5. 审核通过后发布
```

## 运维注意事项

### 1. 数据备份
- 定期备份用户数据
- 备份云函数代码
- 备份数据库结构和数据

### 2. 版本管理
- 保留历史版本以便回滚
- 记录每次发布的变更内容
- 建立灰度发布机制

### 3. 安全维护
- 定期更新依赖包
- 监控安全漏洞
- 及时处理用户举报内容

## 故障排查

### 常见问题
1. **云函数超时**
   - 检查函数执行时间
   - 优化数据库查询
   - 增加函数内存配置

2. **数据库连接失败**
   - 检查环境配置
   - 验证权限设置
   - 查看错误日志

3. **小程序白屏**
   - 检查网络请求
   - 验证云开发初始化
   - 查看控制台错误

### 应急处理
- 准备回滚方案
- 建立应急联系机制
- 制定故障响应流程

## 联系支持

如需技术支持，请联系：
- 邮箱：support@emotion-helper.com
- 电话：400-123-4567
- 技术文档：https://docs.emotion-helper.com