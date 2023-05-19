const express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
const middleware = require("../middleware/middleware.js")
// Include Express Validator Functions
const { check, validationResult } = require('express-validator');

//middleware to read req.body.<params>

// all routes for user: /home/profile/...

// route: /home/profile (GET - view profile page)
router.get('/', middleware.isLoggedIn, async (req, res) => {
    const url = `http://localhost:4001/${req.user.id}/getuserprofile`
    var user = null
    var address = null
    await fetch(url)
    .then(response => response.json())
    .then(data => {
        user = data["user"]
        address = data["address"]
        console.log('user: ', user)
        console.log('address: ', address)
        if (user != null) {
            res.render('user/profile', {
                user: user,
                address: (address != null && address != undefined )? address : null
            })
        } else {
            req.flash('error', `Error in retrieving user profile`)
            res.render('user/profile', {
                user: null,
                address: null
            })
        }
    })
    .catch(err => {
        req.flash('error', `Error in accessing user service: ${err}`)
        res.render('user/profile', {
            user: null,
            address: null
        })
    })
    
});

// route: /home/profile/:id/update (GET - update profile page)
router.get("/:id/update", middleware.isLoggedIn, async (req, res) => {
    const url = `http://localhost:4001/${req.user.id}/getuserprofile`
    await fetch(url)
    .then(response => response.json())
    .then(data => {
        user = data["user"]
        address = data["address"]
        res.render('user/maintainProfile', {
            // userId: req.user.id
            mode: 'UE',
            user: user
        })
    }).catch(err => {
        req.flash('error', `Error in retrieving user profile details to update: ${err}`)
        res.render('user/maintainProfile', {
            // userId: req.user.id
            mode: 'UE',
            user: null
        })
    })
})

// route: /home/profile/:id/update (POST - update profile )
router.post("/:id/update", middleware.isLoggedIn, async (req, res) => {
    const url = `http://localhost:4001/${req.user.id}/updateuser`
    let data = {
        username: req.body.username
    }
    let fetchData = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-Type': 'application/json; charset=UTF-8'
        })
    }
    await fetch(url, fetchData)
    .then((response) => response.json())
    .then((data) =>{
        console.log("data=======> \n",data);
        req.flash('success', 'User details updated successfully.')
        res.redirect('/home/profile')
    })
    .catch(err => {
        req.flash('error', `Error in updating profile details: ${err}`)
        res.redirect(`/home/profile/${req.user.id}/update`)
    })
});

// route: /home/profile/:id/changePassword (GET - change password )
router.get("/:id/changePassword", middleware.isLoggedIn, (req, res) => {
    res.render('user/maintainProfile', {
        mode: 'PW',
        user: req.user
    })
})

// route: /home/profile/:id/changePassword (POST - change password )
router.post("/:id/changePassword", 
    middleware.isLoggedIn, 
    middleware.validatePasswordChange,
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            errors.array().forEach(err => req.flash('error', err.msg));
            return res.redirect(`/home/profile/${req.user.id}/changePassword`);
        }
        next()
    },
    async (req, res) => {
        // Validate Request
        if (!req.body) {
            res.status(400).send({
            message: "Content can not be empty!"
            });
        }

        // validating if password and password confirmation matches
        const oldPassword = req.body.oldPassword;
        const newPassword = req.body.password;
        const newPasswordConfirmation = req.body.confirmPassword;
      
        if (newPasswordConfirmation !== newPassword) {
          req.flash('error', 'The 2 passwords do not match!')
          return res.redirect(`/home/profile/${req.user.id}/changePassword`) 
        }

        // getting user details from user microservice
        const profileUrl = `http://localhost:4001/${req.user.id}/getuserprofile`
        var user = null
        await fetch(profileUrl)
        .then(response => response.json())
        .then(data => {
            user = data["user"]
        }).catch(err => {
            req.flash('error', `Error in accessing user service: ${err}`)
            return res.redirect(`/home/profile/${id}/changePassword`)
        })

        // if user exists and old password input is correct, update password for user
        if (user && await bcrypt.compare(oldPassword, user.password)) {
            const url = `http://localhost:4001/${req.user.id}/updateuser`
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            let data = {
                password: hashedPassword
            }
            let fetchData = {
                method: 'POST',
                body: JSON.stringify(data),
                headers: new Headers({
                    'Content-Type': 'application/json; charset=UTF-8'
                })
            }
            await fetch(url, fetchData)
            .then((response) => response.json())
            .then((data) =>{
                console.log("data=======> \n",data);
                req.flash('success', 'Password updated successfully.')
                return res.redirect('/home/profile')
            });

        } else if (user == null) {
            req.flash('error', 'Error in retrieving user profile!')
            return res.redirect(`/home/profile/${req.user.id}/changePassword`)
        } else {
            req.flash('error', 'Old password is incorrect!')
            return res.redirect(`/home/profile/${req.user.id}/changePassword`)
        }
    }
);

module.exports = router;