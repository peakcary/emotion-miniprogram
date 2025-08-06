#!/bin/bash

# 情绪小程序云函数自动部署脚本
set -e

echo "🚀 情绪小程序云函数自动部署脚本"
echo "================================"

# 配置变量
PROJECT_ROOT="/Users/peakom/Documents/work/emotion-miniprogram"
CLOUD_ENV="cloud1-8g0nzxjxe1f94684"
APPID="wxf2a1defe4093ab24"

# 云函数列表
FUNCTIONS=("user-data" "community" "emotion-analysis")

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查前置条件
check_prerequisites() {
    log_info "检查前置条件..."
    
    # 检查项目目录
    if [ ! -d "$PROJECT_ROOT" ]; then
        log_error "项目目录不存在: $PROJECT_ROOT"
        exit 1
    fi
    
    # 检查cloudfunctions目录
    if [ ! -d "$PROJECT_ROOT/cloudfunctions" ]; then
        log_error "cloudfunctions目录不存在"
        exit 1
    fi
    
    # 检查云函数
    for func in "${FUNCTIONS[@]}"; do
        if [ ! -d "$PROJECT_ROOT/cloudfunctions/$func" ]; then
            log_error "云函数目录不存在: $func"
            exit 1
        fi
        
        if [ ! -f "$PROJECT_ROOT/cloudfunctions/$func/index.js" ]; then
            log_error "云函数入口文件不存在: $func/index.js"
            exit 1
        fi
        
        if [ ! -f "$PROJECT_ROOT/cloudfunctions/$func/package.json" ]; then
            log_error "云函数配置文件不存在: $func/package.json"
            exit 1
        fi
    done
    
    log_info "前置条件检查通过 ✓"
}

# 创建部署包
create_deployment_packages() {
    log_info "创建部署包..."
    
    # 创建临时目录
    TEMP_DIR="$PROJECT_ROOT/temp_deploy_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$TEMP_DIR"
    
    for func in "${FUNCTIONS[@]}"; do
        log_info "打包 $func..."
        
        # 进入云函数目录
        cd "$PROJECT_ROOT/cloudfunctions/$func"
        
        # 创建zip包
        zip -r "$TEMP_DIR/${func}.zip" . \
            -x "node_modules/*" \
            -x "*.log" \
            -x ".DS_Store" \
            -x "*.tmp"
        
        # 检查zip文件
        if [ -f "$TEMP_DIR/${func}.zip" ]; then
            size=$(ls -lh "$TEMP_DIR/${func}.zip" | awk '{print $5}')
            log_info "✓ ${func}.zip 创建成功 (${size})"
        else
            log_error "✗ ${func}.zip 创建失败"
            exit 1
        fi
    done
    
    echo "TEMP_DIR=$TEMP_DIR" > "$PROJECT_ROOT/.deploy_temp"
    log_info "部署包创建完成，存储在: $TEMP_DIR"
}

# 验证部署包
validate_packages() {
    log_info "验证部署包..."
    
    # 读取临时目录路径
    if [ -f "$PROJECT_ROOT/.deploy_temp" ]; then
        source "$PROJECT_ROOT/.deploy_temp"
    else
        log_error "找不到部署临时目录信息"
        exit 1
    fi
    
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "$TEMP_DIR/${func}.zip" ]; then
            # 检查zip内容
            if unzip -t "$TEMP_DIR/${func}.zip" > /dev/null 2>&1; then
                log_info "✓ $func 部署包验证通过"
            else
                log_error "✗ $func 部署包损坏"
                exit 1
            fi
        else
            log_error "✗ $func 部署包不存在"
            exit 1
        fi
    done
}

# 生成部署报告
generate_deployment_report() {
    log_info "生成部署报告..."
    
    if [ -f "$PROJECT_ROOT/.deploy_temp" ]; then
        source "$PROJECT_ROOT/.deploy_temp"
    fi
    
    REPORT_FILE="$PROJECT_ROOT/deployment-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# 情绪小程序云函数部署报告

## 基本信息
- **部署时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **云环境ID**: $CLOUD_ENV
- **小程序AppID**: $APPID
- **部署包位置**: $TEMP_DIR

## 云函数列表
EOF
    
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "$TEMP_DIR/${func}.zip" ]; then
            size=$(ls -lh "$TEMP_DIR/${func}.zip" | awk '{print $5}')
            echo "- **$func**: $size" >> "$REPORT_FILE"
        fi
    done
    
    cat >> "$REPORT_FILE" << EOF

## 下一步操作

### 通过微信开发者工具部署
1. 打开微信开发者工具
2. 导入项目: $PROJECT_ROOT
3. 点击"云开发"按钮
4. 选择环境: $CLOUD_ENV
5. 依次上传云函数:
EOF
    
    for func in "${FUNCTIONS[@]}"; do
        echo "   - 右键 cloudfunctions/$func → 上传并部署：云端安装依赖" >> "$REPORT_FILE"
    done
    
    cat >> "$REPORT_FILE" << EOF

### 通过云开发控制台部署
1. 访问: https://console.cloud.tencent.com/tcb
2. 选择环境: $CLOUD_ENV
3. 进入云函数页面
4. 上传部署包:
EOF
    
    for func in "${FUNCTIONS[@]}"; do
        echo "   - 上传 $TEMP_DIR/${func}.zip" >> "$REPORT_FILE"
    done
    
    cat >> "$REPORT_FILE" << EOF

### 验证部署
\`\`\`javascript
// 在微信开发者工具控制台执行
wx.cloud.callFunction({
  name: 'user-data',
  data: { action: 'getUserData' },
  success: res => console.log('✓ user-data 正常'),
  fail: err => console.error('✗ user-data 失败:', err)
})
\`\`\`

## 数据库初始化
执行数据库初始化脚本: database-init.js

## 部署配置
参考配置文件: deploy-config.json
EOF
    
    log_info "部署报告已生成: $REPORT_FILE"
}

# 清理临时文件
cleanup() {
    if [ -f "$PROJECT_ROOT/.deploy_temp" ]; then
        source "$PROJECT_ROOT/.deploy_temp"
        
        echo ""
        read -p "是否删除临时部署文件？(y/N): " cleanup_confirm
        if [[ $cleanup_confirm == [yY] ]]; then
            rm -rf "$TEMP_DIR"
            rm -f "$PROJECT_ROOT/.deploy_temp"
            log_info "临时文件已清理"
        else
            log_info "临时文件保留在: $TEMP_DIR"
        fi
    fi
}

# 主函数
main() {
    echo ""
    log_info "开始执行部署准备..."
    
    check_prerequisites
    create_deployment_packages
    validate_packages
    generate_deployment_report
    
    echo ""
    log_info "🎉 部署准备完成！"
    echo ""
    echo "📋 接下来请按照以下步骤操作："
    echo "1. 查看部署报告了解详细信息"
    echo "2. 使用微信开发者工具或云开发控制台上传云函数"
    echo "3. 运行 database-init.js 初始化数据库"
    echo "4. 使用 云函数测试.js 验证部署结果"
    
    cleanup
}

# 捕获退出信号
trap cleanup EXIT

# 执行主函数
main