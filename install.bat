@echo off
echo ========================================
echo    INSTALADOR DEL SISTEMA DE HORARIO
echo ========================================
echo.

echo Instalando dependencias del backend...
cd backend
npm install
echo.

echo ========================================
echo INSTALACION COMPLETADA
echo ========================================
echo.
echo Para iniciar el sistema:
echo 1. Inicia MongoDB (local o Atlas)
echo 2. Ejecuta: cd backend && npm start
echo 3. Abre index.html en tu navegador
echo.
echo Para configurar MongoDB Atlas:
echo 1. Copia config.example.js como config.js
echo 2. Actualiza MONGO_URI con tus credenciales
echo.
pause

