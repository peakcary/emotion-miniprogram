// 代码质量分析工具
class CodeAnalyzer {
  constructor() {
    this.issues = []
    this.warnings = []
    this.suggestions = []
  }

  /**
   * 分析代码质量
   */
  analyzeCode(code, filename) {
    this.issues = []
    this.warnings = []
    this.suggestions = []

    // 基础语法检查
    this.checkBasicSyntax(code, filename)
    
    // 安全检查
    this.checkSecurity(code, filename)
    
    // 性能检查
    this.checkPerformance(code, filename)
    
    // 最佳实践检查
    this.checkBestPractices(code, filename)

    return {
      issues: this.issues,
      warnings: this.warnings,
      suggestions: this.suggestions,
      score: this.calculateScore()
    }
  }

  /**
   * 基础语法检查
   */
  checkBasicSyntax(code, filename) {
    // 检查未使用的变量
    const unusedVars = code.match(/const\s+(\w+)\s*=/g)
    if (unusedVars) {
      unusedVars.forEach(match => {
        const varName = match.match(/const\s+(\w+)/)[1]
        if (!code.includes(`${varName}.`) && !code.includes(`${varName}[`) && 
            !code.includes(`${varName}(`) && !code.includes(`(${varName})`)) {
          this.warnings.push({
            type: 'unused-variable',
            message: `可能未使用的变量: ${varName}`,
            file: filename
          })
        }
      })
    }

    // 检查console.log语句
    const consoleLogs = code.match(/console\.log\([^)]*\)/g)
    if (consoleLogs && consoleLogs.length > 5) {
      this.warnings.push({
        type: 'too-many-console',
        message: `文件包含${consoleLogs.length}个console.log语句，建议在生产环境中移除`,
        file: filename
      })
    }

    // 检查魔法数字
    const magicNumbers = code.match(/\b(?!0|1|2|24|60|100|1000)\d{3,}\b/g)
    if (magicNumbers) {
      this.suggestions.push({
        type: 'magic-numbers',
        message: `发现魔法数字: ${[...new Set(magicNumbers)].join(', ')}，建议定义为常量`,
        file: filename
      })
    }
  }

  /**
   * 安全检查
   */
  checkSecurity(code, filename) {
    // 检查SQL注入风险
    if (code.includes('wx.request') && code.includes('+') && code.includes('data:')) {
      this.issues.push({
        type: 'sql-injection-risk',
        message: '可能存在SQL注入风险，请使用参数化查询',
        file: filename,
        severity: 'high'
      })
    }

    // 检查XSS风险
    if (code.includes('innerHTML') || code.includes('outerHTML')) {
      this.issues.push({
        type: 'xss-risk',
        message: '使用innerHTML可能导致XSS攻击，请使用安全的DOM操作',
        file: filename,
        severity: 'high'
      })
    }

    // 检查硬编码敏感信息
    const sensitivePatterns = [
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /key\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i
    ]

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(code)) {
        this.issues.push({
          type: 'hardcoded-credentials',
          message: '检测到硬编码的敏感信息，请使用环境变量或配置文件',
          file: filename,
          severity: 'critical'
        })
      }
    })

    // 检查输入验证
    if (code.includes('e.detail.value') && !code.includes('Validator')) {
      this.warnings.push({
        type: 'missing-input-validation',
        message: '用户输入未进行验证，建议使用Validator类进行输入验证',
        file: filename
      })
    }
  }

  /**
   * 性能检查
   */
  checkPerformance(code, filename) {
    // 检查深层嵌套循环
    const nestedLoops = code.match(/for\s*\([^}]+for\s*\(/g)
    if (nestedLoops && nestedLoops.length > 0) {
      this.warnings.push({
        type: 'nested-loops',
        message: '检测到嵌套循环，可能影响性能',
        file: filename
      })
    }

    // 检查大数组操作
    if (code.includes('.map(') && code.includes('.filter(') && code.includes('.reduce(')) {
      this.suggestions.push({
        type: 'array-chain',
        message: '多个数组操作链式调用，考虑优化为单次遍历',
        file: filename
      })
    }

    // 检查频繁的DOM操作
    const setDataCalls = code.match(/this\.setData\s*\(/g)
    if (setDataCalls && setDataCalls.length > 10) {
      this.warnings.push({
        type: 'frequent-setdata',
        message: `文件包含${setDataCalls.length}个setData调用，考虑批量更新以提升性能`,
        file: filename
      })
    }

    // 检查内存泄露风险
    if (code.includes('setInterval') && !code.includes('clearInterval')) {
      this.warnings.push({
        type: 'memory-leak-risk',
        message: '使用了setInterval但未检测到clearInterval，可能导致内存泄露',
        file: filename
      })
    }

    if (code.includes('setTimeout') && code.includes('this.setData') && 
        !code.includes('onUnload') && !code.includes('onHide')) {
      this.warnings.push({
        type: 'timeout-cleanup',
        message: '在setTimeout中使用setData，建议在页面卸载时清理定时器',
        file: filename
      })
    }
  }

  /**
   * 最佳实践检查
   */
  checkBestPractices(code, filename) {
    // 检查错误处理
    if (code.includes('wx.request') && !code.includes('fail:')) {
      this.warnings.push({
        type: 'missing-error-handling',
        message: 'wx.request缺少错误处理，建议添加fail回调',
        file: filename
      })
    }

    // 检查loading状态
    if (code.includes('wx.request') && !code.includes('loading')) {
      this.suggestions.push({
        type: 'missing-loading',
        message: '网络请求建议添加loading状态提升用户体验',
        file: filename
      })
    }

    // 检查函数长度
    const functions = code.match(/\w+\s*\([^)]*\)\s*\{[^}]*\}/g)
    if (functions) {
      functions.forEach(func => {
        const lines = func.split('\n').length
        if (lines > 50) {
          this.suggestions.push({
            type: 'long-function',
            message: `函数过长(${lines}行)，建议拆分为更小的函数`,
            file: filename
          })
        }
      })
    }

    // 检查注释覆盖率
    const codeLines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length
    const commentLines = code.split('\n').filter(line => line.trim().startsWith('//')).length
    const commentRatio = commentLines / codeLines

    if (commentRatio < 0.1) {
      this.suggestions.push({
        type: 'low-comment-ratio',
        message: `注释覆盖率较低(${(commentRatio * 100).toFixed(1)}%)，建议增加注释`,
        file: filename
      })
    }

    // 检查命名规范
    const badVariableNames = code.match(/\b(data|temp|tmp|test|aaa|bbb)\b/g)
    if (badVariableNames) {
      this.suggestions.push({
        type: 'poor-naming',
        message: `发现不规范的变量名: ${[...new Set(badVariableNames)].join(', ')}`,
        file: filename
      })
    }
  }

  /**
   * 计算代码质量分数
   */
  calculateScore() {
    let score = 100
    
    // 扣分规则
    score -= this.issues.filter(i => i.severity === 'critical').length * 20
    score -= this.issues.filter(i => i.severity === 'high').length * 15
    score -= this.issues.filter(i => i.severity === 'medium').length * 10
    score -= this.warnings.length * 5
    score -= this.suggestions.length * 2

    return Math.max(0, score)
  }

  /**
   * 生成报告
   */
  generateReport() {
    const totalIssues = this.issues.length + this.warnings.length + this.suggestions.length
    const score = this.calculateScore()
    
    let level = 'A'
    if (score < 90) level = 'B'
    if (score < 75) level = 'C'
    if (score < 60) level = 'D'
    if (score < 40) level = 'F'

    return {
      score,
      level,
      totalIssues,
      breakdown: {
        critical: this.issues.filter(i => i.severity === 'critical').length,
        high: this.issues.filter(i => i.severity === 'high').length,
        medium: this.issues.filter(i => i.severity === 'medium').length,
        warnings: this.warnings.length,
        suggestions: this.suggestions.length
      },
      issues: this.issues,
      warnings: this.warnings,
      suggestions: this.suggestions
    }
  }
}

module.exports = { CodeAnalyzer }