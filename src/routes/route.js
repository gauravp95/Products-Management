const express = require('express');
const router = express.Router();
const {auth} = require('../middlewares/auth');
const { newProduct, getProducts, getProdById ,updateProduct, deleteProduct} = require('../controllers/productController');
const {userCreation,userLogin, getUser, updateProfile} = require('../controllers/userController');
const { createCart, updateCart, getCart ,deleteCart} = require('../controllers/cartController');
const { createOrder, updateOrder } = require('../controllers/orderController');

//User 
router.post('/register', userCreation); //1
router.post('/login', userLogin); //2
router.get('/user/:userId/profile',auth, getUser);  //3
router.put('/user/:userId/profile',auth, updateProfile); //4

//Product
router.post('/products', newProduct) //5
router.get('/products', getProducts) //6
router.get('/products/:productId', getProdById) //7
router.put('/products/:productId', updateCart) //8
router.delete('/products/:productId', deleteProduct) //9

//cart
router.post('/users/:userId/cart', auth, createCart) //10
router.put('/users/:userId/cart', auth, updateCart) //11
router.get('/users/:userId/cart', auth, getCart) //12
router.delete('/users/:userId/cart', auth, deleteCart) //13

//order
router.post('/users/:userId/orders',auth, createOrder) //14
router.put('/users/:userId/orders',auth, updateOrder) //15

module.exports = router;