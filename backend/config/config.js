module.exports = {
    db: {
        host: 'localhost',
        user: 'root', // Usuario por defecto en XAMPP
        password: 'Certi123', // Contraseña por defecto en XAMPP es vacía
        database: 'cosmifactura_db'
    },
    jwt: {
        secret: 'tu_secreto_super_secreto_para_jwt'
    },
    tienda: {
        nombre: "Dani Makeup Shop",
        direccion: "Calle 65 Sur 77M-04",
        Whatsapp: "+3245413275",
        nit: "900.123.456-7",
        logo: "public/logo.png" // Coloca tu logo en esta ruta
    }
};