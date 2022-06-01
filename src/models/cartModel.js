const mongoose =require('mongoose');
const ObjectId = mongoose.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId: {
        type:ObjectId, 
        require: true,
        unique: true,
        ref: 'User'
    },
    items: [{
        productId : {
            type: ObjectId,
            require: true,
            ref: 'Product'
        },
        quantity: {
            type: Number,
            require: true,
            min: 1
        }
    }],
    totalPrice:{
        type: Number,
        require: true,
    },
    totalItems: {
        type:Number,
        require: true
    }
},{timestamps: true});

module.exports = mongoose.model('Cart', cartSchema);