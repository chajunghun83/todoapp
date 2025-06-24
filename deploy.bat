@echo off
echo =====================================
echo Todo 앱 GitHub Pages 배포 스크립트
echo =====================================

echo.
echo 1. Git 상태 확인 중...
git status

echo.
set /p commit_message="커밋 메시지를 입력하세요 (예: 버그 수정, 기능 추가 등): "

if "%commit_message%"=="" (
    set commit_message=업데이트
)

echo.
echo 2. 변경사항 추가 중...
git add .

echo.
echo 3. 커밋 생성 중...
git commit -m "%commit_message%"

echo.
echo 4. GitHub에 업로드 중...
git push origin main

echo.
echo =====================================
echo 배포 완료! 
echo 1-5분 후 다음 URL에서 확인하세요:
echo https://chajunghun83.github.io/todoapp/
echo =====================================

pause 