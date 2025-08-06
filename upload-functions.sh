#!/bin/bash

# 情绪小程序云函数上传脚本
echo "=== 情绪小程序云函数上传脚本 ==="

# 检查当前目录
if [ ! -d "cloudfunctions" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo "✅ 检测到cloudfunctions目录"

# 云函数列表
functions=("user-data" "community" "emotion-analysis")

echo ""
echo "📦 准备上传以下云函数:"
for func in "${functions[@]}"; do
    if [ -d "cloudfunctions/$func" ]; then
        echo "  ✓ $func"
    else
        echo "  ❌ $func (目录不存在)"
    fi
done

echo ""
echo "⚠️  注意事项:"
echo "   1. 确保微信开发者工具已打开此项目"
echo "   2. 确保已登录微信开发者账号"
echo "   3. 确保云环境 cloud1-8g0nzxjxe1f94684 可访问"
echo ""

read -p "是否继续？(y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "取消上传"
    exit 0
fi

echo ""
echo "🚀 开始创建部署包..."

# 创建临时目录
mkdir -p temp_deploy

# 为每个云函数创建zip包
for func in "${functions[@]}"; do
    if [ -d "cloudfunctions/$func" ]; then
        echo "📦 打包 $func..."
        cd "cloudfunctions/$func"
        zip -r "../../temp_deploy/${func}.zip" . -x "node_modules/*" "*.log"
        cd "../.."
        echo "  ✅ 已创建 ${func}.zip"
    fi
done

echo ""
echo "📂 部署包已创建在 temp_deploy/ 目录中:"
ls -la temp_deploy/

echo ""
echo "📋 下一步操作指南:"
echo ""
echo "方法1 - 通过微信开发者工具上传（推荐）:"
echo "  1. 打开微信开发者工具"
echo "  2. 确保项目正确加载"
echo "  3. 依次右键点击以下文件夹并选择'上传并部署：云端安装依赖':"
for func in "${functions[@]}"; do
    echo "     - cloudfunctions/$func"
done

echo ""
echo "方法2 - 通过云开发控制台上传:"
echo "  1. 访问 https://console.cloud.tencent.com/tcb"
echo "  2. 选择环境: cloud1-8g0nzxjxe1f94684"
echo "  3. 进入云函数页面"
echo "  4. 上传 temp_deploy/ 中的zip文件"

echo ""
echo "🔍 验证上传成功:"
echo "  1. 在云开发控制台查看函数状态为'正常'"
echo "  2. 在小程序中测试调用云函数"
echo "  3. 查看云函数日志确认无错误"

echo ""
echo "📖 详细说明请查看: 云函数上传指南.md"

# 提示清理临时文件
echo ""
read -p "上传完成后是否删除临时文件？(y/N): " cleanup
if [[ $cleanup == [yY] ]]; then
    rm -rf temp_deploy
    echo "✅ 临时文件已清理"
else
    echo "💾 临时文件保留在 temp_deploy/ 目录"
fi

echo ""
echo "🎉 脚本执行完成！"