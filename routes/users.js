var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var bcrypt = require('bcryptjs');

var multer = require('multer');
var upload = multer({dest: './public/images/users'});

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

var mongo = require('mongodb');
var db = require('monk')('localhost/loginandblog');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
    res.render('register', { title: 'Register' });
});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Login' });
});

router.get('/contact', function(req, res, next) {
    res.render('contact', { title: 'Contact'});
});

router.post('/login', passport.authenticate('local', {failureRedirect:'/users/login', failureFlash: 'Invalid username or password'}), function(req, res) {
    req.flash('success', 'You are now logged in');
    res.redirect('/');
});

router.post('/contact/send', function(req, res) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'yzh19920918@gmail.com',
            pass: 'Yzh!9918nb'
        }
    });

    var mailOptions = {
        from: 'ZihaoYang <yzh19920918@gmail.com>',
        to: 'zihaoyangwork@gmail.com',
        subject: 'Website Submission',
        text: 'You have a submission with the following details... Name: '+req.body.name+'Email: '+req.body.email+'Message: '+req.body.message,
        html: '<p>You have a submission with the following details...</p><ul><li>Name: '+req.body.name+'</li><li>Email: '+req.body.email+'</li><li>Message: '+req.body.message+'</li></ul>'
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if(error) {
            console.log(error);
            res.redirect('/');
        }
        else {
            console.log('Message Sent: ' + info.response);
            req.flash('success', 'You contact has been successfully sent')
            res.redirect('/');
        }
    });
});

passport.use(new LocalStrategy(function(username, password, done) {
    User.getUserByUsername(username, function(err, user) {
        if(err) throw err;
        if(!user) {
            return done(null, false, {message: 'Unknown User'});
        }

        User.comparePassword(password, user.password, function(err, isMatch) {
            if(err) return done(err);
            if(isMatch) {
                return done(null, user);
            }
            else {
                return done(null, false, {message: 'Invalid Password'});
            }

        });
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

router.post('/register', upload.single('profileimage'), function(req, res, next) {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    if(req.file) {
        console.log('Uploading File...')
        var profileimage = req.file.filename;
    }
    else {
        console.log('No File Uploaded...');
        var profileimage = 'noimage.jpg';
    }

    // Form Validator
    req.checkBody('name', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Password do not match').equals(req.body.password);

    //Check Errors
    var errors = req.validationErrors();

    if(errors){
        res.render('register', {
            errors: errors
        });
    }
    else {
        var users = db.get('users');
        /*bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {
                password = hash;
                users.insert({
                    "name": name,
                    "email": email,
                    "username": username,
                    "password": password,
                    "profileimage": profileimage
                }, function(err, post) {
                    if(err) {
                        res.send(err);
                    }
                    else {
                        req.flash('success', 'You have successfully registered');
                        res.location('/');
                        res.redirect('/');
                    }
                });
            });
        });*/

        var newUser = ({
            name: name,
            email: email,
            username: username,
            password: password,
            profileimage: profileimage
        });

        User.createUser(newUser, function(err, user) {
            if(err) throw err;
            users.insert({
                "name": user.name,
                "email": user.email,
                "username": user.username,
                "password": user.password,
                "profileimage": user.profileimage
            });
        });

        req.flash('success', 'You are now registered and can login');

        res.location('/');
        res.redirect('/');
    }
});

router.get('/logout', function(req, res) {
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/users/login');
});

module.exports = router;
