@echo off
REM GitHub Receipt Generator - 快速启动脚本
REM 用法: receipt.bat <用户名> [风格]
REM 风格: classic, vintage, minimal, neon, terminal

if "%~1"=="" (
    echo 用法: receipt.bat ^<GitHub用户名^> [风格]
    echo.
    echo 可用风格:
    echo   classic   - 经典收据 (默认)
    echo   vintage   - 复古泛黄
    echo   minimal   - 极简黑白
    echo   neon      - 霓虹暗色
    echo   terminal  - 终端风格
    echo.
    echo 示例:
    echo   receipt.bat torvalds
    echo   receipt.bat torvalds neon
    exit /b 1
)

set USERNAME=%~1
set STYLE=%~2
if "%STYLE%"=="" set STYLE=classic

python "%~dp0github_receipt.py" %USERNAME% -s %STYLE%
pause
