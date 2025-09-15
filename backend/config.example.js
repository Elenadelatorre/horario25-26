// Archivo de configuración de ejemplo para MongoDB Atlas
// Copia este archivo como config.js y actualiza con tus credenciales

export const config = {
    // Para MongoDB Atlas, usa una URI como esta:
    // MONGO_URI: 'mongodb+srv://usuario:password@cluster.mongodb.net/horarioDB'

    // Para MongoDB local:
    MONGO_URI: 'mongodb://localhost:27017/horarioDB',

    PORT: 4000
};

// Pasos para configurar MongoDB Atlas:
// 1. Ve a https://www.mongodb.com/atlas
// 2. Crea una cuenta gratuita
// 3. Crea un nuevo cluster
// 4. En "Database Access", crea un usuario y contraseña
// 5. En "Network Access", permite acceso desde cualquier IP (0.0.0.0/0)
// 6. En "Clusters", haz clic en "Connect"
// 7. Selecciona "Connect your application"
// 8. Copia la URI y reemplaza <password> con tu contraseña
// 9. Actualiza MONGO_URI en este archivo

