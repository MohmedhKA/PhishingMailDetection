@echo off
curl -k -X POST "https://192.168.1.4:5000/predict" ^
     -H "Content-Type: application/json" ^
     -d "@HarPhiExample.json"
pause
