@echo off
chcp 65001 >nul
title LicitIA - Servidor local

echo.
echo ========================================
echo   LicitIA - Iniciando servidor local
echo ========================================
echo.

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado.
    echo.
    echo Descárgalo desde: https://nodejs.org
    echo Instala la versión LTS y vuelve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado: 
node -v
echo.

:: Ir a la carpeta del proyecto
cd /d "%~dp0"

:: Instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias (primera vez, puede tardar 1-2 minutos)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Falló la instalación.
        pause
        exit /b 1
    )
    echo.
)

echo Iniciando servidor en http://localhost:3000
echo.
echo Configura la extensión Chrome con: http://localhost:3000
echo Presiona Ctrl+C para detener el servidor.
echo.

call npm run dev

pause
