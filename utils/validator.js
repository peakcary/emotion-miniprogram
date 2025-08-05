// 输入验证和安全工具类
class Validator {
  /**
   * HTML转义，防止XSS攻击
   */
  static escapeHTML(str) {
    if (typeof str !== 'string') return str
    
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
    
    return str.replace(/[&<>"'/]/g, (match) => escapeMap[match])
  }

  /**
   * 验证文本内容
   */
  static validateText(text, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = 1000,
      allowHTML = false
    } = options

    // 必填验证
    if (required && (!text || text.trim().length === 0)) {
      return { valid: false, message: '内容不能为空' }
    }

    // 长度验证
    const trimmedText = text?.trim() || ''
    if (trimmedText.length < minLength) {
      return { valid: false, message: `内容长度不能少于${minLength}个字符` }
    }
    if (trimmedText.length > maxLength) {
      return { valid: false, message: `内容长度不能超过${maxLength}个字符` }
    }

    // HTML标签验证
    if (!allowHTML && /<[^>]*>/g.test(trimmedText)) {
      return { valid: false, message: '内容不能包含HTML标签' }
    }

    // 敏感词过滤
    const sensitiveWords = ['色情', '暴力', '恐怖', '政治', '广告', '垃圾']
    const foundSensitive = sensitiveWords.find(word => trimmedText.includes(word))
    if (foundSensitive) {
      return { valid: false, message: '内容包含敏感词汇，请修改后重试' }
    }

    return { 
      valid: true, 
      sanitized: allowHTML ? trimmedText : this.escapeHTML(trimmedText)
    }
  }

  /**
   * 验证情绪描述
   */
  static validateEmotionDescription(description) {
    return this.validateText(description, {
      required: false,
      maxLength: 500,
      allowHTML: false
    })
  }

  /**
   * 验证社区动态内容
   */
  static validatePostContent(content) {
    return this.validateText(content, {
      required: true,
      minLength: 1,
      maxLength: 200,
      allowHTML: false
    })
  }

  /**
   * 验证评论内容
   */
  static validateCommentContent(content) {
    return this.validateText(content, {
      required: true,
      minLength: 1,
      maxLength: 100,
      allowHTML: false
    })
  }

  /**
   * 验证用户昵称
   */
  static validateNickname(nickname) {
    if (!nickname || nickname.trim().length === 0) {
      return { valid: false, message: '昵称不能为空' }
    }

    const trimmed = nickname.trim()
    if (trimmed.length < 1 || trimmed.length > 20) {
      return { valid: false, message: '昵称长度应在1-20个字符之间' }
    }

    // 检查特殊字符
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(trimmed)) {
      return { valid: false, message: '昵称只能包含中文、英文、数字、下划线和短横线' }
    }

    // 检查敏感词
    const result = this.validateText(trimmed, { allowHTML: false })
    if (!result.valid) {
      return result
    }

    return { valid: true, sanitized: result.sanitized }
  }

  /**
   * 验证话题标签
   */
  static validateTopic(topic) {
    if (!topic || topic.trim().length === 0) {
      return { valid: false, message: '话题不能为空' }
    }

    const trimmed = topic.trim().replace(/^#/, '') // 移除可能的#前缀
    if (trimmed.length < 1 || trimmed.length > 20) {
      return { valid: false, message: '话题长度应在1-20个字符之间' }
    }

    // 检查特殊字符
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(trimmed)) {
      return { valid: false, message: '话题只能包含中文、英文和数字' }
    }

    return { valid: true, sanitized: trimmed }
  }

  /**
   * 验证情绪强度
   */
  static validateIntensity(intensity) {
    const num = parseInt(intensity)
    if (isNaN(num) || num < 1 || num > 10) {
      return { valid: false, message: '情绪强度必须是1-10之间的数字' }
    }
    return { valid: true, sanitized: num }
  }

  /**
   * 批量验证对象字段
   */
  static validateObject(obj, rules) {
    const errors = {}
    const sanitized = {}

    for (const [field, rule] of Object.entries(rules)) {
      const value = obj[field]
      let result

      switch (rule.type) {
        case 'text':
          result = this.validateText(value, rule.options)
          break
        case 'nickname':
          result = this.validateNickname(value)
          break
        case 'topic':
          result = this.validateTopic(value)
          break
        case 'intensity':
          result = this.validateIntensity(value)
          break
        case 'postContent':
          result = this.validatePostContent(value)
          break
        case 'commentContent':
          result = this.validateCommentContent(value)
          break
        case 'emotionDescription':
          result = this.validateEmotionDescription(value)
          break
        default:
          result = { valid: true, sanitized: value }
      }

      if (!result.valid) {
        errors[field] = result.message
      } else {
        sanitized[field] = result.sanitized !== undefined ? result.sanitized : value
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitized
    }
  }

  /**
   * 防止SQL注入的字符串清理
   */
  static sanitizeForDB(str) {
    if (typeof str !== 'string') return str
    
    // 移除潜在的SQL注入字符
    return str.replace(/['";\\]/g, '')
  }

  /**
   * 验证文件名安全性
   */
  static validateFileName(filename) {
    if (!filename || typeof filename !== 'string') {
      return { valid: false, message: '文件名无效' }
    }

    // 检查危险字符
    if (/[<>:"/\\|?*\x00-\x1f]/.test(filename)) {
      return { valid: false, message: '文件名包含非法字符' }
    }

    // 检查长度
    if (filename.length > 255) {
      return { valid: false, message: '文件名过长' }
    }

    return { valid: true, sanitized: filename.trim() }
  }

  /**
   * 验证URL安全性
   */
  static validateURL(url) {
    if (!url || typeof url !== 'string') {
      return { valid: false, message: 'URL无效' }
    }

    try {
      const urlObj = new URL(url)
      
      // 只允许http和https协议
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, message: '只支持HTTP和HTTPS协议' }
      }

      return { valid: true, sanitized: url }
    } catch (error) {
      return { valid: false, message: 'URL格式错误' }
    }
  }

  /**
   * 通用数据清理
   */
  static sanitizeData(data) {
    if (typeof data === 'string') {
      return this.escapeHTML(data)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item))
    }
    
    if (data && typeof data === 'object') {
      const sanitized = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value)
      }
      return sanitized
    }
    
    return data
  }
}

module.exports = {
  Validator
}