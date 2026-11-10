@echo off
REM PayPilot AI Dedicated MongoDB Instance Launcher
REM Isolated from Live Lab Project (Port 27017)
echo Starting dedicated PayPilot AI MongoDB on Port 27018...
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --config "C:\data\paypilot-mongodb\mongod.cfg"
pause

