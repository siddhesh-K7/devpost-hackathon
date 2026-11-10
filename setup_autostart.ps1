$action = New-ScheduledTaskAction -Execute "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" -Argument '--config "C:\data\paypilot-mongodb\mongod.cfg"'
$trigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "PayPilot_MongoDB_27018" -Action $action -Trigger $trigger -Description "Automated background PayPilot MongoDB on Port 27018" -Force
Write-Host "Auto-start task PayPilot_MongoDB_27018 successfully registered!"

