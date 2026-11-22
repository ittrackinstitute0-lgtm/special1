@echo off
echo ====================================================
echo Pushing SPECIAL Luxury Brand Website to GitHub...
echo Target Repo: https://github.com/ittrackinstitute0-lgtm/special1
echo ====================================================
cd /d "%~dp0"
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ====================================================
    echo [SUCCESS] Website files successfully uploaded to GitHub!
    echo ====================================================
    echo.
    echo To publish your website live:
    echo 1. Open: https://github.com/ittrackinstitute0-lgtm/special1/settings/pages
    echo 2. Under 'Branch', select 'main' and click 'Save'.
    echo 3. In 1-2 minutes, your live site will be ready at:
    echo    https://ittrackinstitute0-lgtm.github.io/special1/
    echo ====================================================
) else (
    echo ====================================================
    echo [NOTE] If prompted, please click 'Sign in with your browser' to authorize GitHub.
    echo ====================================================
)
pause
