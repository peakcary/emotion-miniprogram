// 社区功能云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 社区功能云函数入口
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { action, data } = event
    
    switch (action) {
      case 'test':
        return {
          success: true,
          message: '社区云函数连接正常',
          timestamp: new Date().getTime(),
          env: wxContext.ENV
        }
      case 'publishPost':
        return await publishPost(data, wxContext)
      case 'getPosts':
        return await getPosts(data, wxContext)
      case 'likePost':
        return await likePost(data, wxContext)
      case 'commentPost':
        return await commentPost(data, wxContext)
      case 'getComments':
        return await getComments(data, wxContext)
      case 'deletePost':
        return await deletePost(data, wxContext)
      case 'reportPost':
        return await reportPost(data, wxContext)
      case 'getHotTopics':
        return await getHotTopics(wxContext)
      case 'followUser':
        return await followUser(data, wxContext)
      case 'getUserPosts':
        return await getUserPosts(data, wxContext)
      default:
        throw new Error('未知的操作类型')
    }
  } catch (err) {
    console.error('社区功能云函数错误:', err)
    return {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 发布动态
 */
async function publishPost(postData, wxContext) {
  console.log('发布动态:', postData.content.substring(0, 50))
  
  try {
    // 内容审核（简化版）
    const auditResult = await auditContent(postData.content)
    if (!auditResult.pass) {
      throw new Error('内容包含不当信息，发布失败')
    }
    
    // 获取用户信息
    const userInfo = await getUserInfo(wxContext.OPENID)
    
    // 创建动态记录
    const { _id } = await db.collection('community_posts').add({
      data: {
        authorId: wxContext.OPENID,
        authorInfo: {
          nickName: userInfo.nickName || '匿名用户',
          avatarUrl: userInfo.avatarUrl || '../../assets/icons/user-placeholder.png'
        },
        content: postData.content,
        mood: postData.mood,
        tags: postData.tags || [],
        privacy: postData.privacy || 'public',
        location: postData.location || null,
        
        // 互动数据
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        viewCount: 0,
        
        // 状态数据
        status: 'published',
        isHot: false,
        isTop: false,
        
        // 时间戳
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    
    // 更新话题统计
    if (postData.tags && postData.tags.length > 0) {
      await updateTopicStats(postData.tags)
    }
    
    // 记录用户活动
    await recordUserActivity(wxContext.OPENID, 'publish_post', _id)
    
    return {
      success: true,
      message: '动态发布成功',
      postId: _id,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('发布动态失败:', err)
    throw err
  }
}

/**
 * 获取动态列表
 */
async function getPosts(queryData, wxContext) {
  console.log('获取动态列表:', queryData)
  
  try {
    const {
      type = 'square', // square, following, user
      filter = 'latest', // latest, hot, nearby
      page = 1,
      limit = 10,
      userId = null
    } = queryData
    
    let query = db.collection('community_posts')
    
    // 构建查询条件
    const conditions = {
      status: 'published'
    }
    
    // 根据类型筛选
    if (type === 'user' && userId) {
      conditions.authorId = userId
    } else if (type === 'following') {
      // 获取关注列表
      const followingList = await getFollowingList(wxContext.OPENID)
      if (followingList.length === 0) {
        return {
          success: true,
          data: {
            posts: [],
            hasMore: false,
            page,
            total: 0
          }
        }
      }
      conditions.authorId = _.in(followingList)
    }
    
    // 隐私过滤
    if (type !== 'user' || userId !== wxContext.OPENID) {
      conditions.privacy = _.in(['public', 'followers'])
    }
    
    query = query.where(conditions)
    
    // 排序
    if (filter === 'hot') {
      query = query.orderBy('likeCount', 'desc').orderBy('createTime', 'desc')
    } else {
      query = query.orderBy('createTime', 'desc')
    }
    
    // 分页
    const skip = (page - 1) * limit
    const { data: posts } = await query
      .skip(skip)
      .limit(limit)
      .get()
    
    // 处理返回数据
    const processedPosts = await processPosts(posts, wxContext.OPENID)
    
    // 获取总数（简化处理）
    const hasMore = posts.length === limit
    
    return {
      success: true,
      data: {
        posts: processedPosts,
        hasMore,
        page,
        total: posts.length
      }
    }
  } catch (err) {
    console.error('获取动态列表失败:', err)
    throw err
  }
}

/**
 * 点赞动态
 */
async function likePost(likeData, wxContext) {
  console.log('点赞动态:', likeData.postId)
  
  try {
    const { postId, isLike } = likeData
    
    // 检查是否已点赞
    const { data: existingLikes } = await db.collection('post_likes')
      .where({
        postId,
        userId: wxContext.OPENID
      })
      .get()
    
    const hasLiked = existingLikes.length > 0
    
    if (isLike && !hasLiked) {
      // 添加点赞
      await db.collection('post_likes').add({
        data: {
          postId,
          userId: wxContext.OPENID,
          createTime: db.serverDate()
        }
      })
      
      // 更新动态点赞数
      await db.collection('community_posts')
        .doc(postId)
        .update({
          data: {
            likeCount: _.inc(1),
            updateTime: db.serverDate()
          }
        })
      
      // 记录活动
      await recordUserActivity(wxContext.OPENID, 'like_post', postId)
      
    } else if (!isLike && hasLiked) {
      // 取消点赞
      await db.collection('post_likes')
        .where({
          postId,
          userId: wxContext.OPENID
        })
        .remove()
      
      // 更新动态点赞数
      await db.collection('community_posts')
        .doc(postId)
        .update({
          data: {
            likeCount: _.inc(-1),
            updateTime: db.serverDate()
          }
        })
    }
    
    return {
      success: true,
      message: isLike ? '点赞成功' : '取消点赞',
      hasLiked: isLike,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('点赞操作失败:', err)
    throw err
  }
}

/**
 * 评论动态
 */
async function commentPost(commentData, wxContext) {
  console.log('评论动态:', commentData.postId)
  
  try {
    const { postId, content, replyToCommentId = null } = commentData
    
    // 内容审核
    const auditResult = await auditContent(content)
    if (!auditResult.pass) {
      throw new Error('评论内容包含不当信息')
    }
    
    // 获取用户信息
    const userInfo = await getUserInfo(wxContext.OPENID)
    
    // 创建评论
    const { _id } = await db.collection('post_comments').add({
      data: {
        postId,
        authorId: wxContext.OPENID,
        authorInfo: {
          nickName: userInfo.nickName || '匿名用户',
          avatarUrl: userInfo.avatarUrl || '../../assets/icons/user-placeholder.png'
        },
        content,
        replyToCommentId,
        likeCount: 0,
        status: 'published',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
    
    // 更新动态评论数
    await db.collection('community_posts')
      .doc(postId)
      .update({
        data: {
          commentCount: _.inc(1),
          updateTime: db.serverDate()
        }
      })
    
    // 记录活动
    await recordUserActivity(wxContext.OPENID, 'comment_post', postId)
    
    return {
      success: true,
      message: '评论成功',
      commentId: _id,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('评论失败:', err)
    throw err
  }
}

/**
 * 获取评论列表
 */
async function getComments(queryData, wxContext) {
  console.log('获取评论列表:', queryData.postId)
  
  try {
    const { postId, page = 1, limit = 20 } = queryData
    
    const skip = (page - 1) * limit
    const { data: comments } = await db.collection('post_comments')
      .where({
        postId,
        status: 'published'
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    // 处理评论数据
    const processedComments = await processComments(comments, wxContext.OPENID)
    
    return {
      success: true,
      data: {
        comments: processedComments,
        hasMore: comments.length === limit,
        page,
        total: comments.length
      }
    }
  } catch (err) {
    console.error('获取评论失败:', err)
    throw err
  }
}

/**
 * 删除动态
 */
async function deletePost(deleteData, wxContext) {
  console.log('删除动态:', deleteData.postId)
  
  try {
    const { postId } = deleteData
    
    // 验证权限
    const { data: posts } = await db.collection('community_posts')
      .where({
        _id: postId,
        authorId: wxContext.OPENID
      })
      .get()
    
    if (posts.length === 0) {
      throw new Error('没有权限删除此动态')
    }
    
    // 软删除动态
    await db.collection('community_posts')
      .doc(postId)
      .update({
        data: {
          status: 'deleted',
          deleteTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    
    // 删除相关数据
    await Promise.all([
      // 删除点赞记录
      db.collection('post_likes').where({ postId }).remove(),
      // 删除评论记录
      db.collection('post_comments').where({ postId }).update({
        data: { status: 'deleted' }
      })
    ])
    
    return {
      success: true,
      message: '动态删除成功',
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('删除动态失败:', err)
    throw err
  }
}

/**
 * 举报动态
 */
async function reportPost(reportData, wxContext) {
  console.log('举报动态:', reportData.postId)
  
  try {
    const { postId, reason, description } = reportData
    
    // 创建举报记录
    await db.collection('post_reports').add({
      data: {
        postId,
        reporterId: wxContext.OPENID,
        reason,
        description,
        status: 'pending',
        createTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '举报提交成功，我们会尽快处理',
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('举报失败:', err)
    throw err
  }
}

/**
 * 获取热门话题
 */
async function getHotTopics(wxContext) {
  console.log('获取热门话题')
  
  try {
    // 从话题统计表获取热门话题
    const { data: topics } = await db.collection('topic_stats')
      .orderBy('postCount', 'desc')
      .limit(20)
      .get()
    
    // 如果没有统计数据，返回默认话题
    if (topics.length === 0) {
      return {
        success: true,
        data: {
          topics: [
            { name: '今日心情', postCount: 0 },
            { name: '工作生活', postCount: 0 },
            { name: '感恩日记', postCount: 0 },
            { name: '情绪管理', postCount: 0 }
          ]
        }
      }
    }
    
    return {
      success: true,
      data: {
        topics: topics.map(topic => ({
          name: topic.name,
          postCount: topic.postCount
        }))
      }
    }
  } catch (err) {
    console.error('获取热门话题失败:', err)
    throw err
  }
}

/**
 * 关注用户
 */
async function followUser(followData, wxContext) {
  console.log('关注用户:', followData.userId)
  
  try {
    const { userId, isFollow } = followData
    
    if (userId === wxContext.OPENID) {
      throw new Error('不能关注自己')
    }
    
    // 检查是否已关注
    const { data: existingFollows } = await db.collection('user_follows')
      .where({
        followerId: wxContext.OPENID,
        followeeId: userId
      })
      .get()
    
    const hasFollowed = existingFollows.length > 0
    
    if (isFollow && !hasFollowed) {
      // 添加关注
      await db.collection('user_follows').add({
        data: {
          followerId: wxContext.OPENID,
          followeeId: userId,
          createTime: db.serverDate()
        }
      })
    } else if (!isFollow && hasFollowed) {
      // 取消关注
      await db.collection('user_follows')
        .where({
          followerId: wxContext.OPENID,
          followeeId: userId
        })
        .remove()
    }
    
    return {
      success: true,
      message: isFollow ? '关注成功' : '取消关注',
      hasFollowed: isFollow,
      timestamp: new Date().toISOString()
    }
  } catch (err) {
    console.error('关注操作失败:', err)
    throw err
  }
}

/**
 * 获取用户动态
 */
async function getUserPosts(queryData, wxContext) {
  console.log('获取用户动态:', queryData.userId)
  
  try {
    const { userId, page = 1, limit = 10 } = queryData
    
    const skip = (page - 1) * limit
    const { data: posts } = await db.collection('community_posts')
      .where({
        authorId: userId,
        status: 'published'
      })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(limit)
      .get()
    
    const processedPosts = await processPosts(posts, wxContext.OPENID)
    
    return {
      success: true,
      data: {
        posts: processedPosts,
        hasMore: posts.length === limit,
        page,
        total: posts.length
      }
    }
  } catch (err) {
    console.error('获取用户动态失败:', err)
    throw err
  }
}

// 辅助函数

/**
 * 内容审核（简化版）
 */
async function auditContent(content) {
  // 这里可以接入真实的内容审核API
  const forbiddenWords = ['广告', '垃圾', '色情', '暴力']
  const hasForbiddenWord = forbiddenWords.some(word => content.includes(word))
  
  return {
    pass: !hasForbiddenWord,
    reason: hasForbiddenWord ? '内容包含违禁词汇' : null
  }
}

/**
 * 获取用户信息
 */
async function getUserInfo(openid) {
  try {
    const { data: userSettings } = await db.collection('user_settings')
      .where({ openid })
      .get()
    
    return userSettings[0] || {}
  } catch (err) {
    console.error('获取用户信息失败:', err)
    return {}
  }
}

/**
 * 更新话题统计
 */
async function updateTopicStats(tags) {
  try {
    for (const tag of tags) {
      // 检查话题是否存在
      const { data: existingTopics } = await db.collection('topic_stats')
        .where({ name: tag })
        .get()
      
      if (existingTopics.length > 0) {
        // 更新统计
        await db.collection('topic_stats')
          .where({ name: tag })
          .update({
            data: {
              postCount: _.inc(1),
              updateTime: db.serverDate()
            }
          })
      } else {
        // 创建新话题
        await db.collection('topic_stats').add({
          data: {
            name: tag,
            postCount: 1,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
      }
    }
  } catch (err) {
    console.error('更新话题统计失败:', err)
  }
}

/**
 * 记录用户活动
 */
async function recordUserActivity(openid, action, targetId) {
  try {
    await db.collection('user_activities').add({
      data: {
        openid,
        action,
        targetId,
        createTime: db.serverDate()
      }
    })
  } catch (err) {
    console.error('记录用户活动失败:', err)
  }
}

/**
 * 获取关注列表
 */
async function getFollowingList(openid) {
  try {
    const { data: follows } = await db.collection('user_follows')
      .where({
        followerId: openid
      })
      .get()
    
    return follows.map(follow => follow.followeeId)
  } catch (err) {
    console.error('获取关注列表失败:', err)
    return []
  }
}

/**
 * 处理动态数据
 */
async function processPosts(posts, currentUserId) {
  const processedPosts = []
  
  for (const post of posts) {
    // 检查是否已点赞
    const { data: likes } = await db.collection('post_likes')
      .where({
        postId: post._id,
        userId: currentUserId
      })
      .get()
    
    const isLiked = likes.length > 0
    
    // 计算时间差
    const timeAgo = getTimeAgo(post.createTime)
    
    processedPosts.push({
      id: post._id,
      author: post.authorInfo,
      content: post.content,
      mood: post.mood,
      tags: post.tags || [],
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      shareCount: post.shareCount || 0,
      isLiked,
      timeAgo,
      createTime: post.createTime
    })
  }
  
  return processedPosts
}

/**
 * 处理评论数据
 */
async function processComments(comments, currentUserId) {
  const processedComments = []
  
  for (const comment of comments) {
    // 检查是否已点赞
    const { data: likes } = await db.collection('comment_likes')
      .where({
        commentId: comment._id,
        userId: currentUserId
      })
      .get()
    
    const isLiked = likes.length > 0
    const timeAgo = getTimeAgo(comment.createTime)
    
    processedComments.push({
      id: comment._id,
      author: comment.authorInfo,
      content: comment.content,
      likeCount: comment.likeCount || 0,
      isLiked,
      timeAgo,
      createTime: comment.createTime
    })
  }
  
  return processedComments
}

/**
 * 计算时间差
 */
function getTimeAgo(createTime) {
  const now = new Date()
  const created = new Date(createTime)
  const diffMs = now - created
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return created.toLocaleDateString('zh-CN')
}