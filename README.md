# 📅 Sistema de Horario Personal

Un sistema web para gestionar horarios semanales con clases fijas, nuevas clases personalizadas y anotaciones que se guardan en base de datos MongoDB.

## 🚀 Características

- **Horario fijo**: Clases predefinidas (Pádel, Sala Cardio, Funcional Training)
- **Clases personalizadas**: Agregar nuevas clases haciendo clic en celdas vacías
- **Anotaciones**: Notas editables para cada clase
- **Navegación semanal**: Cambiar entre semanas anteriores y siguientes
- **Persistencia**: Todos los datos se guardan en MongoDB
- **Sincronización automática**: Cambios se guardan automáticamente

## 🛠️ Requisitos

- Node.js (versión 14 o superior)
- MongoDB (local o Atlas)
- Navegador web moderno

## 📦 Instalación

### 1. Clonar el proyecto
```bash
git clone <url-del-repositorio>
cd HORARIO-25-26
```

### 2. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 3. Configurar MongoDB

#### Opción A: MongoDB Local
1. Instalar MongoDB en tu sistema
2. Iniciar el servicio de MongoDB
3. El proyecto se conectará automáticamente a `mongodb://localhost:27017/horarioDB`

#### Opción B: MongoDB Atlas
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear un cluster gratuito
3. Obtener la URI de conexión
4. Crear archivo `.env` en la carpeta `backend`:
```env
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/horarioDB
PORT=4000
```

## 🚀 Ejecución

### 1. Iniciar el backend
```bash
cd backend
npm start
```
El servidor estará disponible en `http://localhost:4000`

**⚠️ IMPORTANTE**: Si ves errores de conexión a MongoDB, verifica:
- Que tu archivo `.env` tenga la URI correcta
- Que MongoDB Atlas esté funcionando
- Que tu IP esté permitida en MongoDB Atlas

### 2. Abrir el frontend
Abrir `index.html` en tu navegador web

### 3. Verificar conexión
Usa el botón "🔍 Probar conexión" para verificar que todo esté funcionando

## 📊 Estructura de Datos

### Base de Datos: `horarioDB`
- **Colección**: `horarios`
- **Documento por usuario**:
```json
{
  "usuario": "elena",
  "semanas": {
    "0": {
      "Pádel": "Nota personalizada",
      "Sala Cardio": "Recordatorio importante"
    }
  },
  "nuevasClases": {
    "0": [
      {
        "dia": "Lunes",
        "inicio": "09:00",
        "titulo": "Clase de Yoga"
      }
    ]
  }
}
```

## 🔧 Uso

### Navegación
- **Semana anterior**: Botón "⬅ Semana anterior"
- **Semana siguiente**: Botón "Semana siguiente ➡"
- **Semana actual**: Se muestra automáticamente

### Agregar Clases
1. Hacer clic en una celda vacía del horario
2. Escribir el título de la nueva clase
3. Presionar Enter o hacer clic fuera del campo
4. La clase se guardará automáticamente

### Editar Anotaciones
1. Hacer clic en el área de anotación (texto gris)
2. Escribir o modificar la nota
3. Los cambios se guardan automáticamente

### Eliminar Clases Personalizadas
- Hacer clic en el botón ❌ que aparece junto a la clase

## 🎨 Personalización

### Colores de Clases
- **Pádel**: Naranja (#ffe0b2)
- **Sala Cardio**: Azul (#bbdefb)
- **Funcional Training**: Verde (#c8e6c9)
- **Descanso**: Gris (#e0e0e0)
- **Clases personalizadas**: Azul claro (#f3f8ff)

### Horario Base
- **Inicio**: 08:30
- **Fin**: 21:30
- **Intervalo**: 30 minutos

## 🔧 Solución de Problemas

### ❌ Los datos no se cargan al refrescar

**Paso 1: Verificar el backend**
```bash
cd backend
npm start
```
Deberías ver: "✅ Conectado a MongoDB" y "🚀 Servidor escuchando en http://localhost:4000"

**Paso 2: Verificar MongoDB Atlas**
- Ve a [MongoDB Atlas](https://cloud.mongodb.com)
- Verifica que tu cluster esté activo (punto verde)
- En "Network Access", asegúrate de que tu IP esté permitida (o usa 0.0.0.0/0)

**Paso 3: Verificar archivo .env**
Tu archivo `.env` debe contener:
```env
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/horarioDB
PORT=4000
```

**Paso 4: Usar el diagnóstico**
Ejecuta `diagnostico.bat` para verificar la configuración

**Paso 5: Verificar consola del navegador**
- Presiona F12 en tu navegador
- Ve a la pestaña "Console"
- Busca mensajes de error o confirmación

### 🐛 Errores Comunes

**"Failed to fetch"**
- El backend no está ejecutándose
- Ejecuta `npm start` en la carpeta backend

**"Base de datos no disponible"**
- Problema con MongoDB Atlas
- Verifica tu URI y credenciales

**"Puerto 4000 en uso"**
- Otra aplicación usa el puerto
- Cambia el puerto en `.env` o cierra otras aplicaciones

## 📝 Configuración Detallada de MongoDB Atlas

### 1. Crear cuenta en MongoDB Atlas
- Ve a [MongoDB Atlas](https://www.mongodb.com/atlas)
- Crea una cuenta gratuita

### 2. Crear cluster
- Haz clic en "Build a Database"
- Selecciona "FREE" (M0)
- Elige tu región preferida
- Haz clic en "Create"

### 3. Configurar acceso a la base de datos
- En "Database Access", haz clic en "Add New Database User"
- Username: `elena` (o el que prefieras)
- Password: crea una contraseña segura
- Database User Privileges: "Read and write to any database"
- Haz clic en "Add User"

### 4. Configurar acceso de red
- En "Network Access", haz clic en "Add IP Address"
- Para desarrollo: haz clic en "Allow Access from Anywhere" (0.0.0.0/0)
- Para producción: agrega solo tu IP específica

### 5. Obtener URI de conexión
- En "Clusters", haz clic en "Connect"
- Selecciona "Connect your application"
- Copia la URI
- Reemplaza `<password>` con tu contraseña real

### 6. Crear archivo .env
En la carpeta `backend`, crea un archivo llamado `.env`:
```env
MONGO_URI=mongodb+srv://elena:tuPassword123@cluster0.abc123.mongodb.net/horarioDB
PORT=4000
```

**⚠️ IMPORTANTE**: 
- El archivo debe llamarse exactamente `.env` (con el punto)
- No debe tener espacios alrededor del `=`
- La contraseña debe ser la real, no `<password>`

## 📝 Notas Técnicas

- **Frontend**: HTML, CSS, JavaScript vanilla
- **Backend**: Node.js, Express, MongoDB
- **API**: RESTful con endpoints GET y POST
- **Persistencia**: MongoDB con estructura de documentos anidados
- **Sincronización**: Guardado automático en tiempo real

## 🤝 Contribuciones

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
