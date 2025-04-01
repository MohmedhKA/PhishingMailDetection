@echo off
curl -X POST http://192.168.1.4:5000/predict ^
     -H "Content-Type: application/json" ^
     -d "@email_data.json"
pause
