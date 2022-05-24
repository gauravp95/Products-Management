const express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
const mongoose = require('mongoose');
const route = require('./routes/route.js');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any());

app.use('/', route);

mongoose.connect("mongodb+srv://gauravpatil:8V0I92pSNSdr7dOw@cluster0.ts2d3.mongodb.net/group11Database", { useNewUrlParser: true })
    .then(() => console.log('DB connected'))
    .catch(err => console.log(err))

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});