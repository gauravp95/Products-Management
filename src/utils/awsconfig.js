const aws = require('aws-sdk');

aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J", // id
    secretAccessKey: "7gq2ENIfbMVs0jYmFFsoJnh/hhQstqPBNmaX9Io1", // your secret password
    region: "ap-south-1" // Mumbai region
});

let uploadFile = async(file) => {
    return new Promise(function(resolve, reject) {
        // Create S3 service object
        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = {
            ACL: "public-read", // this file is publically readable
            Bucket: "classroom-training-bucket",
            Key: "group3/products_management/" + new Date() + file.originalname,
            Body: file.buffer,
        };
        // Callback - function provided as the second parameter ( most oftenly)
        s3.upload(uploadParams, function(err, data) {
            if (err) {
                return reject({ "error": err });
            }
            console.log(data)
            console.log(`File uploaded successfully. ${data.Location}`);
            return resolve(data.Location);
        });
    });
};

module.exports = {uploadFile};