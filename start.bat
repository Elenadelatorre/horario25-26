@echo off
echo ========================================
echo    INICIANDO SISTEMA DE HORARIO
echo ========================================
echo.

echo Iniciando el servidor backend...
cd backend
start "Backend Horario" npm start

echo.
echo Esperando 3 segundos para que el servidor inicie...
timeout /t 3 /nobreak > nul

echo.
echo Abriendo el frontend en el navegador...
start index.html

echo.
echo ========================================
echo SISTEMA INICIADO
echo ========================================
echo.
echo El backend esta ejecutandose en: http://localhost:4000
echo El frontend se abrio en tu navegador
echo.
echo Para detener el servidor, cierra la ventana del backend
echo.
pause

