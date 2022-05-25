const userModel = require('../models/userModel');
const  {isValid, isValidObjectId, isValidRequestBody, validString} = require('../utils/validators');
const jwt = require('jsonwebtoken');
const config  = require('../utils/awsconfig');
const bcrypt = require('bcrypt');
const saltRounds = 10;

//1st api
const userCreation = async function (req,res) {
    try {
        let files = req.files;
        let requestBody = req.body;
        let {fname, lname, email, profileImage, phone, password, address} = requestBody;

        //validation
        if(!isValidRequestBody(requestBody)) {
            return res.status(400).send({status:false, message:'Please provide valid request'})
        }
        if(!isValid(fname)) {
            return res.status(400).send({status:false, message:'Please provide valid fname'})
        }
        if(!isValid(lname)) {
            return res.status(400).send({status:false, message:'Please provide valid lname'})
        }
        if(!isValid(email)) {
            return res.status(400).send({status:false, message:'Please provide valid email'})
        }

        const isEmailReg = await userModel.findOne({email})
        if (isEmailReg) {
            return res.status(400).send({status: false, message: 'You have already registered with this email'})
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, message: "Invalid Email id" })
        }

        if (!isValidRequestBody(files)) {
            return res.status(400).send({ status: false, message: "Profile Image is required" })
        }
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone number is required" })
        }

        const isPhoneReg = await userModel.findOne({ phone })
        if (isPhoneReg) {
            return res.status(400).send({status: false, message: 'Phone number is already registered'})
        }

        if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone))) {
            return res.status(400).send({ status: false, message: "Phone number must be a valid Indian number" })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "password is required" })
        }
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "Password must be of 8-15 letters." })
        }
        if (!isValid(address)) {
            return res.status(400).send({ status: false, message: "Address is required" })
        }
        //shipping address validation
        if (address.shipping) {
            if (address.shipping.street) {
                if (!isValidRequestBody(address.shipping.street)) {
                    return res.status(400).send({status: false, message: "Shipping address's Street Required"})}
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping address's street cannot be empty" })
            }

            if (address.shipping.city) {
                if (!isValidRequestBody(address.shipping.city)) {
                    return res.status(400).send({status: false,message: "Shipping address city Required"})}
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Shipping address's city cannot be empty" })
            }

            if (address.shipping.pincode) {
                if (!isValidRequestBody(address.shipping.pincode)) {
                    return res.status(400).send({status: false,message: "Shipping address's pincode Required"})}
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Shipping address's pincode cannot be empty" })
            }
        } else {
            return res.status(400).send({ status: false, message: "Shipping address cannot be empty" })
        }

        // Billing Address validation
        if (address.billing) {
            if (address.billing.street) {
                if (!isValidRequestBody(address.billing.street)) {
                    return res.status(400).send({status: false,message: "Billing address's Street Required"})}
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Billing address's street cannot be empty" })
            }

            if (address.billing.city) {
                if (!isValidRequestBody(address.billing.city)) {
                    return res.status(400).send({status: false,message: "Billing address's city Required"})}
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Billing address's city cannot be empty" })
            }
            if (address.billing.pincode) {
                if (!isValidRequestBody(address.billing.pincode)) {
                    return res.status(400).send({status: false,message: "Billing address's pincode Required "})
                }
            } else {
                return res.status(400).send({ status: false, message: "Invalid request parameters. Billing address's pincode cannot be empty" })
            }
        } else {
            return res.status(400).send({ status: false, message: "Billing address cannot be empty." })
        }

        profileImage = await config.uploadFile(files[0]);
        const encryptedPassword = await bcrypt.hash(password, saltRounds);

        let userData = { fname, lname, email, profileImage, phone, password:encryptedPassword, address};
        const newUserData = await userModel.create(userData);
        return res.status(201).send({status:true, message:'User created Successfully', data:newUserData});
    } catch (err) {
        return res.status(500).send({status:false, message:err.message})
    }
};

//2nd api
const userLogin = async function (req,res) {
    try {
        const requestBody = req.body;
        const {email, password} = requestBody;
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide login details' })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: 'Email Id is required' })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }
        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(400).send({status:false,message:'No such User! Login failed email is incorrect'})
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
};

//3rd api
const getUser = async function (req,res) {
    try {
        let userId = req.params.userId;
        let tokenUserId = req.userId;


        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        
        let userDetails =  await userModel.findOne({_id:userId}).select({__v:0,createdAt:0,updatedAt:0});
        if(!userDetails) {
            return res.status(400).send({status:false, message:'No such User exists'});
        }
        console.log(userDetails._id);
        console.log(tokenUserId);
        
        if(userDetails._id != tokenUserId) {
            return res.status(401).send({status:false, message:'Unauthorised Access'})//....Authorisation
        }

        return res.status(200).send({status:true,message:'User found Successfully', data:userDetails})
    } catch (err) {
        return res.status(500).send({status:false, message:err.message})
    }
}

//4th api
const updateProfile = async function (req,res) {
    try {
        let files = req.files;
        let requestBody = req.body;
        let userId = req.params.userId;
        let tokenUserId = req.userId;

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status:false, message:'UserId is not a valid ObjectId' })
        }

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({status: false,message: "Invalid request parameters. Please provide user's details to update."})
        }

        const userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) {
            return res.status(400).send({status:false,message:'No such user exists'})
        }

        if (userDetails._id != tokenUserId) {
            return res.status(401).send({ status:false, message:'Unauthorised Access'});//...Authorisation
        }
        
        let { fname, lname, email, phone, password, address, profileImage } = requestBody;

        if (!validString(fname)) {
            return res.status(400).send({ status: false, message: 'fname is Required' })
        }
        if (fname) {
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide fname" })
            }
        }
        if (!validString(lname)) {
            return res.status(400).send({ status: false, message: 'lname is Required' })
        }
        if (lname) {
            if (!isValid(lname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide lname" })
            }
        }

        if (!validString(email)) {
            return res.status(400).send({ status: false, message: 'email is Required' })
        }
        if (email) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
            }
            if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, message: 'Email should be a valid email address' });
            }
            let isEmailReg = await userModel.findOne({ email: email })
            if (isEmailReg) {
                return res.status(400).send({ status: false, message: `Unable to update email. ${email} is already registered.` });
            }
        }

        if (!validString(phone)) {
            return res.status(400).send({ status: false, message: 'phone number is Required' })
        }
        if (phone) {
            if (!isValid(phone)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Phone number." })
            }
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
                return res.status(400).send({ status: false, message: 'Please enter a valid Indian phone number'});
            }
            let isPhoneReg = await userModel.findOne({ phone: phone })
            if (isPhoneReg) {
                return res.status(400).send({ status: false, message: `Unable to update phone. ${phone} is already registered.` });
            }
        }

        if (!validString(password)) {
            return res.status(400).send({ status: false, message: 'password is Required' })
        }
        if (password) {
            if (!isValid(password)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide password" })
            }
            if (!(password.length >= 8 && password.length <= 15)) {
                return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
            }
            var encryptedPassword = await bcrypt.hash(password, saltRounds)
        }

        if (address) {
            //converting shipping address to string then parsing it.
            let shipAddString = JSON.stringify(address)
            let parsedShipAdd = JSON.parse(shipAddString)

            if (isValidRequestBody(parsedShipAdd)) {
                if (parsedShipAdd.hasOwnProperty('shipping')) {
                    if (parsedShipAdd.shipping.hasOwnProperty('street')) {
                        if (!isValid(parsedShipAdd.shipping.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's Street" });
                        }
                    }
                    if (parsedShipAdd.shipping.hasOwnProperty('city')) {
                        if (!isValid(parsedShipAdd.shipping.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's City" });
                        }
                    }
                    if (parsedShipAdd.shipping.hasOwnProperty('pincode')) {
                        if (!isValid(parsedShipAdd.shipping.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide shipping address's pincode" });
                        }
                    }

                    //using var to use these variables outside this If block.
                    var shippingStreet = address.shipping.street
                    var shippingCity = address.shipping.city
                    var shippingPincode = address.shipping.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping address cannot be empty" });
            }
        }
        if (address) {
            //converting billing address to string them parsing it.
            let billAddString = JSON.stringify(address)
            let parsedBillAdd = JSON.parse(billAddString)

            if (isValidRequestBody(parsedBillAdd)) {
                if (parsedBillAdd.hasOwnProperty('billing')) {
                    if (parsedBillAdd.billing.hasOwnProperty('street')) {
                        if (!isValid(parsedBillAdd.billing.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's Street" });
                        }
                    }
                    if (parsedBillAdd.billing.hasOwnProperty('city')) {
                        if (!isValid(parsedBillAdd.billing.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's City" });
                        }
                    }
                    if (parsedBillAdd.billing.hasOwnProperty('pincode')) {
                        if (!isValid(parsedBillAdd.billing.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide billing address's pincode" });
                        }
                    }

                    //using var to use these variables outside this If block.
                    var billingStreet = address.billing.street
                    var billingCity = address.billing.city
                    var billingPincode = address.billing.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Billing address cannot be empty" });
            }
        }

        if (files) {
            if (isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Invalid request parameter, please provide profile image" })
                }
                var updateProfileImg = await config.uploadFile(files[0])
            }
        }

        let changeProfileDetails = await userModel.findOneAndUpdate({ _id: userId }, {
            $set: {
                fname: fname,
                lname: lname,
                email: email,
                profileImage: updateProfileImg,
                phone: phone,
                password: encryptedPassword,
                'address.shipping.street': shippingStreet,
                'address.shipping.city': shippingCity,
                'address.shipping.pincode': shippingPincode,
                'address.billing.street': billingStreet,
                'address.billing.city': billingCity,
                'address.billing.pincode': billingPincode
            }
        }, { new: true })
        return res.status(200).send({ status: true, data: changeProfileDetails })
      
    } catch (err) {
        console.log(err);
        return res.status(500).send({status:false,message:err.message})
        
    }
}

module.exports = {userCreation,userLogin, getUser,updateProfile};