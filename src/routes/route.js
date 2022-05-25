const express = require('express');
const router = express.Router();

const {userCreation,userLogin, getUser, updateProfile} = require('../controllers/userController');
const {auth} = require('../middlewares/auth');


router.post('/register', userCreation);
router.post('/login', userLogin);
router.get('/user/:userId/profile',auth, getUser);
router.put('/user/:userId/profile',auth, updateProfile);


module.exports = router;