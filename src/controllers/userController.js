const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const config  = require('../utils/awsconfig');
const bcrypt = require('bcrypt');
const saltRounds = 10;


const userCreation = async function (req,res) {
    try {
        let files = req.files;
        let requestBody = req.body;
        let {fname, lname, email, profileImage, phone, password, address} = requestBody;

        profileImage = await config.uploadFile(files[0]);
        const encryptedPassword = await bcrypt.hash(password, saltRounds);

        let userData = { fname, lname, email, profileImage, phone, password:encryptedPassword, address};
        const newUserData = await userModel.create(userData);
        return res.status(201).send({status:true, message:'User created Successfully', data:newUserData});
    } catch (err) {
        return res.status(500).send({status:false, message:err.message})
    }
};

const userLogin = async function (req,res) {
    try {
        const requestBody = req.body;
        const {email, password} = requestBody;

        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(400).send({status:false,message:'No such User! Login failed'})
        }
        let hashedPassword = user.password;
        const encryptedPassword = await bcrypt.compare(password,hashedPassword);
        console.log(encryptedPassword);

        if(!encryptedPassword) {
            return res.status(400).send({status:false,message:'Login failed! Passwoed is incorrect'})
        };

        const token = await jwt.sign({
            userId:user._id,
            iat: Math.floor(Date.now()/1000),
            exp: Math.floor(Date.now()/1000 + 3600*24*7)
        }, 'Product-Management');

        return res.status(201).send({status:true,message:'Token created Successfully',data:token});
        
    } catch (err) {
        return res.status(500).send({status:false,message:err.message})
    }
}

module.exports = {userCreation,userLogin};