const express = require('express');
const { newProduct, getProducts, getProdById } = require('../controllers/productController');
const router = express.Router();

const {userCreation,userLogin, getUser, updateProfile} = require('../controllers/userController');
const {auth} = require('../middlewares/auth');

//User 
router.post('/register', userCreation);
router.post('/login', userLogin);
router.get('/user/:userId/profile',auth, getUser);
router.put('/user/:userId/profile',auth, updateProfile);

//Product
router.post('/products', newProduct)
router.get('/products', getProducts)
router.get('/products/:productId', getProdById)

module.exports = router;