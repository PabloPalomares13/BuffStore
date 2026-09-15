const express = require('express');
const router = express.Router();
const rawgController = require('../Controllers/rawgController');
const { protect, isAdmin } = require('../middleware/authMiddleware');
 
// Solo administradores: evita gastar tu cuota de RAWG.io innecesariamente
// y evita que cualquier visitante dispare llamadas a una API externa.
router.get('/search', protect, isAdmin, rawgController.searchGames);
router.get('/details/:rawgId', protect, isAdmin, rawgController.getGameDetails);
 
module.exports = router;