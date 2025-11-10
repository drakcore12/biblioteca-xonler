@echo off
set BUILD_ID=dontKillMe
set JENKINS_NODE_COOKIE=do_not_kill
cd /d "%USERPROFILE%"
start "" "%USERPROFILE%\cloudflared.exe" tunnel --config NUL --url http://127.0.0.1:3000 > "%USERPROFILE%\cloudflared.log" 2>&1
