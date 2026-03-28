@echo off
chcp 65001 > nul
title AR アセット自動デプロイ
cd /d "%~dp0"

echo.
echo  依存パッケージを確認中...
call npm install --silent 2>nul
if errorlevel 1 (
    echo  npm install に失敗しました。Node.js が入っているか確認してください。
    pause
    exit /b 1
)

echo  監視を開始します...
node watch.js
pause
