const express = require('express');
const router = express.Router();

const {userCreation,userLogin} = require('../controllers/userController');

router.post('/register', userCreation);
router.post('/login', userLogin);
router.get('/user/:userId/profile', userLogin);


module.exports = router;