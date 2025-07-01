const express = require('express');
const router = express.Router();

// La ruta DEBE ser un POST y la URL debe ser '/login'
router.post('/login', (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ message: 'Por favor, envía usuario y contraseña.' });
    }

    if (usuario === 'admin' && password === 'admin123') {
        console.log(`Intento de login exitoso para el usuario: ${usuario}`);
        res.status(200).json({ 
            message: 'Login exitoso',
            token: 'este_es_un_token_falso_por_ahora' 
        });
    } else {
        console.log(`Intento de login fallido para el usuario: ${usuario}`);
        res.status(401).json({ message: 'Credenciales incorrectas' });
    }
});

// Asegúrate de que estás exportando el router
module.exports = router;