@echo off
set BUILD_ID=dontKillMe
set JENKINS_NODE_COOKIE=do_not_kill
cd /d "C:/Users/MIGUEL/Documents/Proyectos-Cursor/biblioteca-xonler-main"
start "" cmd /c "set HOST=127.0.0.1&& set PORT=3000&& npm start > server.log 2>&1"
