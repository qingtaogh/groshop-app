// https://www.digitalocean.com/community/tutorials/easy-node-authentication-setup-and-local#displaying-user-and-secure-profile-page-views-profile-ejs
const middleware = require("../middleware/middleware.js")
const { check, validationResult } = require('express-validator')


module.exports = function(app, passport) {


    app.get("/home", 
        // middleware.isLoggedIn, 
        (req, res) => {
            console.log('redirecting to home')
            console.log(req.user)
            if (req.user == null || req.user == undefined) {
                console.log("viewing site as guest")
                res.redirect("/home/recipes")
            } else if (req.user.role === 'CUSTOMER') {
                res.redirect("/home/recipes")
            } else if (req.user.role === 'ADMIN') {
                res.redirect("/admin/recipes")
            }
        }
    );

    app.get("/admin", middleware.isLoggedIn, middleware.isAdmin, (req, res) => {
        console.log('redirecting to home')
        console.log(req.user)
        if (req.user == null || req.user == undefined) {
            console.log("viewing site as guest")
            res.redirect("/home/recipes")
        } else if (req.user.role === 'CUSTOMER') {
            res.redirect("/home/recipes")
        } else if (req.user.role === 'ADMIN') {
            res.redirect("/admin/recipes")
        }
    })

    app.get("/login", (req, res) => {
        var isAuthenticated;
        if (typeof req.user === 'undefined') {
            isAuthenticated = null
        } else {
            isAuthenticated = req.user
        }
        if (isAuthenticated === null) {
            res.render("login", {
                user: typeof req.user !== 'undefined'?req.user:null,
            });
        } else {
            res.redirect('/home')
        }
    });

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/register', (req, res) => {res.render("register", {
        user: typeof req.user !== 'undefined'?req.user:null
    })})

    app.post('/register', 
        middleware.validateRegister, 
        (req, res, next) => {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                errors.array().forEach(err => req.flash('error', err.msg));
                return res.redirect('/register');
            }
            console.log("here")
            next()
        },
        passport.authenticate('local-signup', {
            successRedirect: '/home',
            failureRedirect: '/register',
            failureFlash: true
        })
    )

    app.post('/logout', function(req, res, next) {
        req.logout(function(err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    });

}

// route middleware to make sure a user is logged in
