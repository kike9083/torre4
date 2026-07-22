@echo off
title Torre 4 - Sistema de Gestión
echo ========================================
echo   Iniciando Torre 4 - Sistema de Gestión
echo ========================================
echo.

cd /d "G:\Documents\app\bratpit\torre4"

echo Iniciando servidor y cliente...
echo.

start "" cmd /c "npm run dev"

echo Esperando a que el servidor esté listo...
timeout /t 8 /nobreak >nul

echo Abriendo navegador...
start http://localhost:3000

echo.
echo ========================================
echo   Aplicación iniciada correctamente
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:3001
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul

taskkill /f /im node.exe 2>nul
echo Servidor detenido.
