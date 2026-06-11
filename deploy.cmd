@echo off
echo === 原基科技 - 部署到 Gitee Pages ===
echo.

:: Build
echo [1/3] 构建站点...
call npm run build
if %errorlevel% neq 0 (echo 构建失败！&& exit /b 1)

:: Create temp dir and copy _site
echo [2/3] 准备部署文件...
set DEPLOY_DIR=%~dp0_deploy_temp
if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"
xcopy /e /y "%~dp0_site\*" "%DEPLOY_DIR%\"

:: Init git in temp dir and push to pages branch
echo [3/3] 推送到 Gitee Pages 分支...
cd /d "%DEPLOY_DIR%"
git init
git checkout -b pages
git add -A
git commit -m "Deploy to Gitee Pages"
git remote add origin https://gitee.com/ruan-biao/easybase.git
git push -f origin pages

:: Cleanup
cd /d "%~dp0"
rmdir /s /q "%DEPLOY_DIR%"
echo.
echo === 部署完成！ ===
echo 去 https://gitee.com/ruan-biao/easybase/pages 启用 Pages 服务
pause
