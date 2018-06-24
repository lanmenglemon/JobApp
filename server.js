var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    ObjectId = require('mongoose').Types.ObjectId;

mongoose.Promise = require('q').Promise;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
    
mongoose.connect('mongodb://localhost/jobApp');
var db = mongoose.connection;
    
db.on('error', function() {
    console.log('Error happened!');
});
    
db.on('open', function() {
    console.log('Mongoose Connected!');
});

var Schema = mongoose.Schema;
var user_schema = new Schema({
    username: String,
    password: String,
    email: String,
    location: String,
    phone: String,
    type: String,
    isLoggedIn: {
        type: Boolean,
        default: false
    }
});

var usersModel = mongoose.model('users', user_schema);


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/checkUserStatus', function(req, res) {
    db.collection('users').find({"isLoggedIn" : true}).toArray(function(err, docs) {
        res.send(docs);
    });
});

app.post('/userSignup', function(req, res) {
    db.collection('users').insert(req.body, function (err) {
        if(!err) {
            res.send({
                flg: true
            });
        }
    });
});

app.get('/userLogin/:username/:password', function(req, res) {
    db.collection('users').update({"isLoggedIn" : true}, {$set: {"isLoggedIn": false}});
    db.collection('users').find({"username": req.params.username, "password": req.params.password}).toArray(function(err, docs) {
        if (docs.length !== 0) {
            db.collection('users').update({"username": req.params.username, "password": req.params.password}, {$set: {"isLoggedIn": true}}, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    db.collection('users').find({"username": req.params.username, "password": req.params.password}).toArray(function (err, documents) {
                        res.send(documents);
                    })
                };
            });            
        } else {
            res.send(docs);
        }
        
    });
});

app.get('/userLogout', function(req, res) {
    db.collection('users').update({"isLoggedIn" : true}, {$set: {"isLoggedIn": false}});
    res.send({
        flg: true
    });
});

app.post('/postnewjob', function(req, res) {
    db.collection('jobs').insert(req.body, function (err) {
        if(!err) {
            res.send({
                flg: true
            });
        }
    });
});

app.get('/getjobs', function(req, res) {
    db.collection('jobs').find().toArray(function (err, documents) {
        res.send(documents);
    })
});

app.listen(3000, function() {
    console.log('server running at 3000');
});