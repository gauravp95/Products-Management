const {isValidRequestBody,isValid, validInstallment,isValidObjectId} = require('../utils/validators');
const productModel = require('../models/productModel');
const config = require('../utils/awsconfig');
const currSymbl = require('currency-symbol-map');

const newProduct = async function (req,res) {
    try {
        let files = req.files;
        let requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" })
        }

        let {title,description,price,currencyId,currencyFormat,isFreeShipping,style,availableSizes,installments} = requestBody;

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Title is required" })
        }
        const titleDup = await productModel.findOne({ title })
        if (titleDup) {
            return res.status(400).send({status: false,message: 'Title is Already used'})
        }
        if (files) {
            if (isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Please provide product image" })
                }
                productImage = await config.uploadFile(files[0])
            }
        }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Description is required" })
        }

        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "Price is required" })
        }

        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, message: "currencyId should be INR" })
        }
        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is required" })
        }

        currencyFormat = currSymbl('INR');

        if(style) {
            if(!isValid(style)) {
                return res.status(400).send({status:true, message:'style required'});
            }
        }

        if(installments) {
            if(!isValid(installments)) {
                return res.status(400).send({status:false, message:'installments required'})

            }
        }

        if (installments) {
            if (!validInstallment(installments)) {
                return res.status(400).send({status:false, message: "Installments can't be decimal number"})
            }
        }

        
        if (isFreeShipping) {
            if (!(isFreeShipping != Boolean)) {
                return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })
            }
        }

        productImage = await config.uploadFile(files[0]);

        const newProductData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat: currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage: productImage
        }

        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())
            
            for (let i = 0; i < sizesArray.length; i++) {
                if (!(['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'].includes(sizesArray[i]))) {
                    return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
                }
            }

            if (Array.isArray(sizesArray)) {
                newProductData['availableSizes'] = [...new Set(sizesArray)]
            }
            
        }

        const createProduct = await productModel.create(newProductData)
        return res.status(201).send({status:true, message: 'Successfully created product', data: createProduct})

    } catch (err) {
        return res.status(500).send({status:false,message:err.message})
        
    }
}


const getProducts = async function (req,res) {
    try {
        const filterQuery = { isDeleted: false } 
        const queryParams = req.query;

        if (isValidRequestBody(queryParams)) {
            const {size, name, priceGreaterThan, priceLessThan, priceSort} = queryParams;

            if (isValid(size)) {
                filterQuery['availableSizes'] = size
            }

            if (isValid(name)) {
                filterQuery['title'] = {} 
                filterQuery['title']['$regex'] = name 
                filterQuery['title']['$options'] = 'i'
            }

            if (isValid(priceGreaterThan)) {

                if (!(!isNaN(Number(priceGreaterThan)))) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (priceGreaterThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (!Object.prototype.hasOwnProperty.call(filterQuery, 'price'))
               
                    filterQuery['price'] = {}
                filterQuery['price']['$gte'] = Number(priceGreaterThan)
                    //console.log(typeof Number(priceGreaterThan))
            }

            //setting price for ranging the product's price to fetch them.
            if (isValid(priceLessThan)) {

                if (!(!isNaN(Number(priceLessThan)))) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (priceLessThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
               if (!filterQuery.hasOwnProperty('price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$lte'] = Number(priceLessThan)
                    //console.log(typeof Number(priceLessThan))
            }
            if (isValid(priceSort)) {

                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
                }

                const products = await productModel.find(filterQuery).sort({ price: priceSort })
                 console.log(products)
                if (Array.isArray(products) && products.length === 0) {
                    return res.status(404).send({ productStatus: false, message: 'No Product found' })
                }

                return res.status(200).send({ status: true, message: 'Product list', data: products })
            }
        }
        const products = await productModel.find(filterQuery)

        //verifying is it an array and having some data in that array.
        if (Array.isArray(products) && products.length === 0) {
            return res.status(404).send({ productStatus: false, message: 'No Product found' })
        }

        return res.status(200).send({ status: true, message: 'Product list', data: products })
        
    } catch (err) {
        return res.status(500).send({status:false,message:err.message})
    }
}

const getProdById = async function(req, res) {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!product) {
            return res.status(404).send({ status: false, message: 'product does not exists' })
        }

        return res.status(200).send({ status: true, message: 'Product found successfully', data: product })
    } catch (err) {
        return res.status(500).send({status: false,message:err.message})
    }
}


module.exports = {newProduct,getProducts,getProdById}
