// pages/community/community.js
const app = getApp()
const { Validator } = require('../../utils/validator')

Page({
  data: {
    // 导航标签
    tabs: [
      { id: 'square', name: '广场' },
      { id: 'following', name: '关注' },
      { id: 'mine', name: '我的' }
    ],
    currentTab: 'square',
    
    // 筛选器
    filters: [
      { id: 'latest', name: '最新' },
      { id: 'hot', name: '热门' },
      { id: 'nearby', name: '附近' }
    ],
    currentFilter: 'latest',
    
    // 热门话题
    hotTopics: [
      { id: 1, name: '今日心情', postCount: 1234 },
      { id: 2, name: '工作压力', postCount: 856 },
      { id: 3, name: '感恩生活', postCount: 642 },
      { id: 4, name: '情绪管理', postCount: 523 }
    ],
    
    // 动态列表
    posts: [],
    followingPosts: [],
    myPosts: [],
    
    // 我的统计
    myStats: {
      postCount: 0,
      likeCount: 0,
      commentCount: 0
    },
    
    // 分页
    currentPage: 1,
    hasMore: true,
    loading: false,
    
    // 发布动态
    showWriteModal: false,
    selectedMood: { id: 1, name: '开心', emoji: '😊' },
    postContent: '',
    currentTopic: '',
    selectedPrivacy: { id: 1, name: '公开', icon: '../../assets/icons/public.png' },
    publishing: false,
    
    // 情绪选项
    moodOptions: [
      { id: 1, name: '开心', emoji: '😊' },
      { id: 2, name: '难过', emoji: '😢' },
      { id: 3, name: '焦虑', emoji: '😰' },
      { id: 4, name: '愤怒', emoji: '😠' },
      { id: 5, name: '平静', emoji: '😌' },
      { id: 6, name: '兴奋', emoji: '🤩' },
      { id: 7, name: '困惑', emoji: '😕' },
      { id: 8, name: '感激', emoji: '🥰' }
    ],
    
    // 热门话题
    popularTopics: [
      { id: 1, name: '今日心情' },
      { id: 2, name: '工作生活' },
      { id: 3, name: '感恩日记' }
    ],
    
    // 隐私选项
    privacyOptions: [
      { id: 1, name: '公开', icon: '../../assets/icons/public.png', desc: '所有人可见' },
      { id: 2, name: '关注者', icon: '../../assets/icons/followers.png', desc: '仅关注者可见' },
      { id: 3, name: '匿名', icon: '../../assets/icons/anonymous.png', desc: '匿名发布' }
    ],
    
    // 评论相关
    showCommentsModal: false,
    currentPost: null,
    comments: [],
    commentContent: '',
    
    // 计算属性
    canPublish: false
  },

  onLoad() {
    console.log('社区页面加载')
    this.initCommunity()
  },

  onShow() {
    console.log('社区页面显示')
    this.refreshData()
  },

  // 初始化社区
  initCommunity() {
    this.loadPosts()
    this.loadMyStats()
    this.checkCanPublish()
  },

  // 刷新数据
  refreshData() {
    this.loadPosts()
    this.loadMyStats()
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    
    if (tab === 'following') {
      this.loadFollowingPosts()
    } else if (tab === 'mine') {
      this.loadMyPosts()
    } else {
      this.loadPosts()
    }
  },

  // 切换筛选器
  switchFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ 
      currentFilter: filter,
      currentPage: 1,
      posts: []
    })
    this.loadPosts()
  },

  // 加载广场动态
  loadPosts() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    // 模拟API调用
    setTimeout(() => {
      const mockPosts = this.generateMockPosts(10)
      
      this.setData({
        posts: this.data.currentPage === 1 ? mockPosts : [...this.data.posts, ...mockPosts],
        loading: false,
        hasMore: this.data.currentPage < 5
      })
    }, 1000)
  },

  // 加载关注动态
  loadFollowingPosts() {
    const mockFollowingPosts = [
      {
        id: 'f1',
        author: {
          name: '阳光小伙',
          avatar: '../../assets/avatars/user1.png'
        },
        content: '今天和朋友一起去爬山，看到了很美的日出，心情特别好！',
        timeAgo: '2小时前',
        likeCount: 12,
        commentCount: 3,
        isLiked: false
      },
      {
        id: 'f2',
        author: {
          name: '温柔姐姐',
          avatar: '../../assets/avatars/user2.png'
        },
        content: '最近在学习冥想，感觉内心平静了很多，推荐给大家试试。',
        timeAgo: '6小时前',
        likeCount: 8,
        commentCount: 5,
        isLiked: true
      }
    ]
    
    this.setData({ followingPosts: mockFollowingPosts })
  },

  // 加载我的动态
  loadMyPosts() {
    const myPosts = wx.getStorageSync('myPosts') || []
    this.setData({ myPosts })
  },

  // 加载我的统计
  loadMyStats() {
    const myPosts = wx.getStorageSync('myPosts') || []
    const stats = {
      postCount: myPosts.length,
      likeCount: myPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0),
      commentCount: myPosts.reduce((sum, post) => sum + (post.commentCount || 0), 0)
    }
    
    this.setData({ myStats: stats })
  },

  // 生成模拟动态数据
  generateMockPosts(count) {
    const posts = []
    const authors = [
      { name: '匿名用户', avatar: '../../assets/avatars/anonymous.png' },
      { name: '阳光小伙', avatar: '../../assets/avatars/user1.png' },
      { name: '温柔姐姐', avatar: '../../assets/avatars/user2.png' },
      { name: '奋斗青年', avatar: '../../assets/avatars/user3.png' }
    ]
    
    const contents = [
      '今天终于完成了一个重要项目，压力释放了很多，但也有点空虚的感觉。',
      '和朋友聊天时突然意识到，我们都在各自的人生路上努力着。',
      '下雨天总是让人想起很多往事，有些美好，有些遗憾。',
      '最近在练习感恩日记，发现生活中其实有很多值得珍惜的小美好。',
      '工作压力有点大，但看到同事们都在坚持，我也要继续加油。',
      '今天做了最爱吃的菜，一个人的晚餐也可以很温馨。'
    ]
    
    const moods = this.data.moodOptions
    const timeOptions = ['刚刚', '5分钟前', '1小时前', '3小时前', '今天', '昨天']
    
    for (let i = 0; i < count; i++) {
      posts.push({
        id: `post_${Date.now()}_${i}`,
        author: authors[Math.floor(Math.random() * authors.length)],
        content: contents[Math.floor(Math.random() * contents.length)],
        mood: moods[Math.floor(Math.random() * moods.length)],
        timeAgo: timeOptions[Math.floor(Math.random() * timeOptions.length)],
        likeCount: Math.floor(Math.random() * 50),
        commentCount: Math.floor(Math.random() * 20),
        isLiked: Math.random() > 0.7,
        tags: Math.random() > 0.5 ? ['今日心情', '生活感悟'] : []
      })
    }
    
    return posts
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ currentPage: this.data.currentPage + 1 })
      this.loadPosts()
    }
  },

  // 查看动态详情
  viewPost(e) {
    const post = e.currentTarget.dataset.post
    console.log('查看动态:', post)
    // 这里可以跳转到动态详情页
  },

  // 点赞/取消点赞
  toggleLike(e) {
    const postId = e.currentTarget.dataset.postId
    const posts = this.data.posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
        }
      }
      return post
    })
    
    this.setData({ posts })
    
    wx.showToast({
      title: posts.find(p => p.id === postId).isLiked ? '已点赞' : '已取消',
      icon: 'success',
      duration: 1000
    })
  },

  // 显示评论
  showComments(e) {
    const postId = e.currentTarget.dataset.postId
    const post = this.data.posts.find(p => p.id === postId)
    
    if (post) {
      this.setData({
        currentPost: post,
        showCommentsModal: true
      })
      this.loadComments(postId)
    }
  },

  // 加载评论
  loadComments(postId) {
    // 模拟评论数据
    const mockComments = [
      {
        id: 'c1',
        author: {
          name: '热心网友',
          avatar: '../../assets/avatars/user1.png'
        },
        content: '很有共鸣，我也有过类似的感受',
        timeAgo: '1小时前',
        likeCount: 3,
        isLiked: false
      },
      {
        id: 'c2',
        author: {
          name: '暖心姐姐',
          avatar: '../../assets/avatars/user2.png'
        },
        content: '抱抱，一切都会好起来的',
        timeAgo: '30分钟前',
        likeCount: 5,
        isLiked: true
      }
    ]
    
    this.setData({ comments: mockComments })
  },

  // 隐藏评论弹窗
  hideCommentsModal() {
    this.setData({
      showCommentsModal: false,
      currentPost: null,
      comments: [],
      commentContent: ''
    })
  },

  // 评论输入
  onCommentInput(e) {
    const content = e.detail.value
    // 实时验证评论内容
    if (content.length > 0) {
      const validation = Validator.validateCommentContent(content)
      if (!validation.valid) {
        wx.showToast({
          title: validation.message,
          icon: 'none',
          duration: 2000
        })
      }
    }
    this.setData({ commentContent: content })
  },

  // 发送评论
  sendComment() {
    const content = this.data.commentContent.trim()
    if (!content) return
    
    // 验证评论内容
    const validation = Validator.validateCommentContent(content)
    if (!validation.valid) {
      wx.showToast({
        title: validation.message,
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    const newComment = {
      id: `c_${Date.now()}`,
      author: {
        name: '我',
        avatar: app.globalData.userInfo?.avatarUrl || '../../assets/icons/user-placeholder.png'
      },
      content: validation.sanitized,
      timeAgo: '刚刚',
      likeCount: 0,
      isLiked: false
    }
    
    this.setData({
      comments: [newComment, ...this.data.comments],
      commentContent: ''
    })
    
    // 更新动态的评论数
    const posts = this.data.posts.map(post => {
      if (post.id === this.data.currentPost.id) {
        return { ...post, commentCount: post.commentCount + 1 }
      }
      return post
    })
    
    this.setData({ posts })
    
    wx.showToast({
      title: '评论成功',
      icon: 'success'
    })
  },

  // 评论点赞
  toggleCommentLike(e) {
    const commentId = e.currentTarget.dataset.commentId
    const comments = this.data.comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likeCount: comment.isLiked ? comment.likeCount - 1 : comment.likeCount + 1
        }
      }
      return comment
    })
    
    this.setData({ comments })
  },

  // 分享动态
  sharePost(e) {
    const post = e.currentTarget.dataset.post
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 选择话题
  selectTopic(e) {
    const topic = e.currentTarget.dataset.topic
    console.log('选择话题:', topic)
    // 可以跳转到话题页面或筛选相关动态
  },

  // 显示写动态弹窗
  showWriteModal() {
    this.setData({ showWriteModal: true })
  },

  // 隐藏写动态弹窗
  hideWriteModal() {
    this.setData({
      showWriteModal: false,
      selectedMood: { id: 1, name: '开心', emoji: '😊' },
      postContent: '',
      currentTopic: '',
      selectedPrivacy: { id: 1, name: '公开', icon: '../../assets/icons/public.png' }
    })
    this.checkCanPublish()
  },

  // 选择情绪
  selectMood(e) {
    const mood = e.currentTarget.dataset.mood
    this.setData({ selectedMood: mood })
    this.checkCanPublish()
  },

  // 内容输入
  onContentInput(e) {
    const content = e.detail.value
    // 实时验证输入内容
    const validation = Validator.validatePostContent(content)
    if (!validation.valid && content.length > 0) {
      wx.showToast({
        title: validation.message,
        icon: 'none',
        duration: 2000
      })
    }
    this.setData({ postContent: content })
    this.checkCanPublish()
  },

  // 话题输入
  onTopicInput(e) {
    const topic = e.detail.value
    // 验证话题输入
    if (topic.length > 0) {
      const validation = Validator.validateTopic(topic)
      if (!validation.valid) {
        wx.showToast({
          title: validation.message,
          icon: 'none',
          duration: 2000
        })
        return
      }
    }
    this.setData({ currentTopic: topic })
  },

  // 选择热门话题
  selectPopularTopic(e) {
    const topic = e.currentTarget.dataset.topic
    this.setData({ currentTopic: topic })
  },

  // 选择隐私设置
  selectPrivacy(e) {
    const privacy = e.currentTarget.dataset.privacy
    this.setData({ selectedPrivacy: privacy })
  },

  // 检查是否可以发布
  checkCanPublish() {
    const canPublish = this.data.postContent.trim().length > 0 && this.data.selectedMood.id
    this.setData({ canPublish })
  },

  // 发布动态
  publishPost() {
    if (!this.data.canPublish) return
    
    const content = this.data.postContent.trim()
    const topic = this.data.currentTopic.trim()
    
    // 验证发布内容
    const contentValidation = Validator.validatePostContent(content)
    if (!contentValidation.valid) {
      wx.showToast({
        title: contentValidation.message,
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 验证话题（如果有）
    if (topic) {
      const topicValidation = Validator.validateTopic(topic)
      if (!topicValidation.valid) {
        wx.showToast({
          title: topicValidation.message,
          icon: 'none',
          duration: 2000
        })
        return
      }
    }
    
    this.setData({ publishing: true })
    
    const newPost = {
      id: `my_${Date.now()}`,
      author: {
        name: app.globalData.userInfo?.nickName || '我',
        avatar: app.globalData.userInfo?.avatarUrl || '../../assets/icons/user-placeholder.png'
      },
      content: contentValidation.sanitized,
      mood: this.data.selectedMood,
      timeAgo: '刚刚',
      likeCount: 0,
      commentCount: 0,
      isLiked: false,
      tags: topic ? [topic] : [],
      privacy: this.data.selectedPrivacy
    }
    
    // 模拟发布延迟
    setTimeout(() => {
      // 保存到本地
      const myPosts = wx.getStorageSync('myPosts') || []
      myPosts.unshift(newPost)
      wx.setStorageSync('myPosts', myPosts)
      
      // 如果是公开动态，添加到广场
      if (this.data.selectedPrivacy.id === 1) {
        this.setData({
          posts: [newPost, ...this.data.posts]
        })
      }
      
      // 更新我的动态
      this.setData({
        myPosts: myPosts,
        publishing: false,
        showWriteModal: false,
        postContent: '',
        currentTopic: '',
        selectedMood: { id: 1, name: '开心', emoji: '😊' },
        selectedPrivacy: { id: 1, name: '公开', icon: '../../assets/icons/public.png' }
      })
      
      this.loadMyStats()
      this.checkCanPublish()
      
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      })
    }, 1500)
  },

  // 编辑动态
  editPost(e) {
    const post = e.currentTarget.dataset.post
    console.log('编辑动态:', post)
    // 这里可以打开编辑弹窗
  },

  // 删除动态
  deletePost(e) {
    const postId = e.currentTarget.dataset.postId
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条动态吗？',
      success: (res) => {
        if (res.confirm) {
          // 从我的动态中删除
          const myPosts = this.data.myPosts.filter(post => post.id !== postId)
          wx.setStorageSync('myPosts', myPosts)
          
          // 从广场动态中删除
          const posts = this.data.posts.filter(post => post.id !== postId)
          
          this.setData({
            myPosts,
            posts
          })
          
          this.loadMyStats()
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      currentPage: 1,
      posts: [],
      followingPosts: [],
      myPosts: []
    })
    
    this.refreshData()
    wx.stopPullDownRefresh()
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.currentTab === 'square') {
      this.loadMore()
    }
  },

  // 分享页面
  onShareAppMessage() {
    return {
      title: '情绪小助手社区 - 分享情绪，连接心灵',
      path: '/pages/community/community',
      imageUrl: '../../assets/share/community-share.png'
    }
  }
})