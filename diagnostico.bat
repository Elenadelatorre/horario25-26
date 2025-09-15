@echo off
echo ========================================
echo    DIAGNOSTICO DEL SISTEMA DE HORARIO
echo ========================================
echo.

echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado o no está en el PATH
    echo Instala Node.js desde: https://nodejs.org/
    goto :end
)

echo.
echo Verificando dependencias del backend...
cd backend
if not exist node_modules (
    echo ❌ Las dependencias no están instaladas
    echo Ejecuta: npm install
    goto :end
)

echo.
echo Verificando archivo .env...
if not exist .env (
    echo ❌ No existe archivo .env
    echo Copia env.example como .env y configura MONGO_URI
    goto :end
) else (
    echo ✅ Archivo .env encontrado
    echo Contenido (ocultando contraseña):
    type .env | findstr /v "password" | findstr /v "Password"
)

echo.
echo Verificando puerto 4000...
netstat -an | findstr :4000
if %errorlevel% equ 0 (
    echo ⚠️ El puerto 4000 está en uso
    echo Cierra otras aplicaciones que usen este puerto
) else (
    echo ✅ Puerto 4000 disponible
)

echo.
echo ========================================
echo DIAGNOSTICO COMPLETADO
echo ========================================
echo.
echo Para iniciar el sistema:
echo 1. Verifica que MongoDB esté funcionando
echo 2. Ejecuta: npm start
echo 3. Abre index.html en tu navegador
echo.
echo Si hay problemas:
echo - Verifica la consola del navegador (F12)
echo - Verifica la consola del servidor
echo - Usa el boton "Probar conexion" en la web
echo.

:end
pause




