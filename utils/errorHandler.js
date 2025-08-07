// 全局错误处理工具
class ErrorHandler {
  
  /**
   * 安全方法调用 - 防止 "method is not a function" 错误
   * @param {Object} context - 调用上下文 (this)
   * @param {string} methodName - 方法名
   * @param {Array} args - 参数数组
   * @param {Function} fallback - 降级处理函数
   */
  static safeMethodCall(context, methodName, args = [], fallback = null) {
    try {
      if (context && typeof context[methodName] === 'function') {
        return context[methodName].apply(context, args)
      } else {
        console.warn(`方法 ${methodName} 不存在，执行降级处理`)
        if (typeof fallback === 'function') {
          return fallback.apply(context, args)
        }
        return null
      }
    } catch (error) {
      console.error(`方法 ${methodName} 执行错误:`, error)
      if (typeof fallback === 'function') {
        return fallback.apply(context, args)
      }
      return null
    }
  }

  /**
   * 安全图片加载 - 处理图片资源错误
   * @param {string} src - 图片路径
   * @param {string} fallbackSrc - 备用图片路径
   */
  static safeImageSrc(src, fallbackSrc = null) {
    // 检查是否是emoji（Unicode字符）
    if (src && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(src)) {
      console.warn(`图片路径包含emoji，使用备用路径: ${src}`)
      return fallbackSrc || '../../assets/icons/default.png'
    }
    
    // 检查路径是否包含特殊字符编码
    if (src && /%[0-9A-F]{2}/i.test(src)) {
      console.warn(`图片路径包含URL编码，使用备用路径: ${src}`)
      return fallbackSrc || '../../assets/icons/default.png'
    }
    
    return src
  }

  /**
   * 页面生命周期安全包装
   * @param {Function} lifecycle - 生命周期函数
   * @param {string} lifecycleName - 生命周期名称
   */
  static safeLifecycle(lifecycle, lifecycleName = 'lifecycle') {
    return function(...args) {
      try {
        if (typeof lifecycle === 'function') {
          return lifecycle.apply(this, args)
        }
      } catch (error) {
        console.error(`页面 ${lifecycleName} 执行错误:`, error)
        
        // 特殊处理 _getData 错误
        if (error.message && error.message.includes('_getData is not a function')) {
          wx.showModal({
            title: '页面加载异常',
            content: '检测到页面功能异常，是否重新加载？',
            success: (res) => {
              if (res.confirm) {
                // 重新加载当前页面
                const currentPage = getCurrentPages().pop()
                if (currentPage) {
                  currentPage.onLoad(currentPage.options || {})
                }
              }
            }
          })
        }
      }
    }
  }
}

module.exports = { ErrorHandler }