@echo off
echo ========================================
echo  ML-Based Disk I/O Performance Analyzer
echo ========================================
echo.
echo Installing root dependencies...
call npm install
echo.
echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo.
echo Starting all services...
echo  - Backend API    : http://localhost:5000
echo  - ML Service     : http://localhost:5001
echo  - Frontend       : http://localhost:3000
echo.
call npm start
