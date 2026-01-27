@echo off
chcp 65001 >nul
title Host Template Server
echo ================================
echo    Запуск Host Template
echo ================================
echo.
echo Очистка кэша npm...
call npm cache clean --force
echo.
echo Установка зависимостей с исправлением конфликтов...
call npm install --legacy-peer-deps
echo.
echo Запуск сервера разработки...
echo Откройте браузер: http://localhost:3000
echo.
echo Для остановки нажмите Ctrl+C
echo ================================
call npm run dev
pause