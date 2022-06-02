const {isValidRequestBody,isValid, validInstallment,isValidObjectId} = require('../utils/validators');
const productModel = require('../models/productModel');
const config = require('../utils/awsconfig');
const currSymbl = require('currency-symbol-map');


//1st Api - Create Product
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

//2nd Api - get products by filtering

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

// 3rd Api - get product by productId

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

//4th Api - Update product 
const updateProduct = async function(req, res) {
    try {
        const requestBody = req.body
        const params = req.params
        const productId = params.productId

        // Validation stats
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }

        if (!(isValidRequestBody(requestBody) || req.files)) {
            return res.status(400).send({ status: false, message: 'No paramateres passed. product unmodified', data: product })
        }

        // Extract params
        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        //Declaring an empty object then using hasOwnProperty to match the keys and setting the appropriate values.
        const updatedProductDetails = {}

        if (isValid(title)) {

            const isTitleAlreadyUsed = await productModel.findOne({ title: title });

            if (isTitleAlreadyUsed) {
                return res.status(400).send({ status: false, message: `${title} title is already used` })
            }

            if (!updatedProductDetails.hasOwnProperty('title'))
                updatedProductDetails['title'] = title
        }

        if (isValid(description)) {
            if (!updatedProductDetails.hasOwnProperty('description'))
                updatedProductDetails['description'] = description
        }

        //verifying price is number & must be greater than 0.
        if (isValid(price)) {

            if (!(!isNaN(Number(price)))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }

            if (price <= 0) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }

            if (!updatedProductDetails.hasOwnProperty('price'))
                updatedProductDetails['price'] = price
        }
        //verifying currency Id must be INR.
        if (isValid(currencyId)) {

            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, message: 'currencyId should be a INR' })
            }

            if (!updatedProductDetails.hasOwnProperty('currencyId'))
                updatedProductDetails['currencyId'] = currencyId;
        }

        //shipping must be true/false.
        if (isValid(isFreeShipping)) {

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }

            if (!updatedProductDetails.hasOwnProperty('isFreeShipping'))
                updatedProductDetails['isFreeShipping'] = isFreeShipping
        }

        //uploading images to AWS.
        let productImage = req.files;
        if ((productImage && productImage.length > 0)) {

            let updatedproductImage = await config.uploadFile(productImage[0]);

            if (!updatedProductDetails.hasOwnProperty('productImage'))
                updatedProductDetails['productImage'] = updatedproductImage
        }

        if (isValid(style)) {

            if (!updatedProductDetails.hasOwnProperty('style'))
                updatedProductDetails['style'] = style
        }

        //validating sizes to take multiple sizes at a single attempt.
        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < sizesArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))) {
                    return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
                }
            }
            if (!updatedProductDetails.hasOwnProperty(updatedProductDetails, '$addToSet'))
                updatedProductDetails['$addToSet'] = {}
            updatedProductDetails['$addToSet']['availableSizes'] = { $each: sizesArray }
        }

        //verifying must be a valid no. & must be greater than 0.
        if (isValid(installments)) {

            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, message: `installments should be a valid number` })
            }

            if (!updatedProductDetails.hasOwnProperty('installments'))
                updatedProductDetails['installments'] = installments
        }

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updatedProductDetails, { new: true })

        return res.status(200).send({ status: true, message: 'Successfully updated product details.', data: updatedProduct });
    } catch (err) {
        return res.status(500).send({status: false,message: err.message})
    }
}

//5th Api - delete product

const deleteProduct = async function(req, res) {
    try {
        const params = req.params
        const productId = params.productId

        //validation starts
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `${productId} is not a valid product id`})
        }
        //vaidation ends.

        const product = await productModel.findOne({ _id: productId })

        if (!product) {
            return res.status(400).send({ status: false, message: `Product doesn't exists by ${productId}` })
        }
        if (product.isDeleted == false) {
            await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } })

            return res.status(200).send({ status: true, message: 'Product deleted successfully.' })
        }
        return res.status(400).send({ status: true, message: 'Product has been already deleted.' })


    } catch (err) {
        return res.status(500).send({status: false,message:err.message})
    }
}


module.exports = {newProduct,getProducts,getProdById, updateProduct,deleteProduct};
