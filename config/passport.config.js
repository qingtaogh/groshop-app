const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt');
const { response } = require('express');
const {body, validationResult} = require('express-validator')

function initialize(passport) {
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // serialize user for session
    passport.serializeUser((user, done) => done(null, { id: user.id }))

    //deserialize user
    passport.deserializeUser(async (login, done) => {
        console.log("deserialize [login]: ", login)
        try {
            const url = `http://localhost:4001/${login.id}/getuserdetailsbyid`
            let user = null;
            await fetch(url)
            .then(response => response.json())
            .then(data => {
                user = data["user"][0]
                if (user !== null) {
                    return done(null, user)
                } else {
                    done(null, null);
                }  
            }).catch(err => {
                done(err, null)
            })
        } catch (err) {
            console.log(err)
            done(err, null)
        }
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    const register = async (req, email, password, done) => {
        console.log('registering user')

            // password validation
            if (password !== req.body.passwordConfirmation) {
                return done(null, false, { message: 'Passwords do not match!'})
            }

            // registering user
            const hashedPassword = await bcrypt.hash(password, 10)
            const url = 'http://localhost:4001/register';
            let data = {
                username: req.body.username,
                password: hashedPassword,
                email: email
            }
            let fetchData = {
              method: 'POST',
              body: JSON.stringify(data),
              headers: new Headers({
                'Content-Type': 'application/json; charset=UTF-8'
              })
            }
            var insertedId = null
            var user = null
            var error = null
            await fetch(url, fetchData)
            .then((response) => response.json())
            .then((data) =>{
                console.log("data=======> \n",data);
                if (typeof data["output"] != 'undefined') {
                    insertedId = data["output"]["insertId"]
                } else {
                    error = data["error"]
                }
            });

            if (insertedId != null) {
                const profileUrl = `http://localhost:4001/${insertedId}/getuserdetailsbyid`
                await fetch(profileUrl)
                .then(response => response.json())
                .then(data => {
                    user = data["user"][0]        
                    if (user == null) {
                        return done(null, false, { message: 'Failed to create user'})
                    } else {
                        return done(null, user)
                    } 
                }).catch(err => {
                    done(err, null)
                })
            } else {
                return done(null, false, { message: error})
            }
    }
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, register))

    // =========================================================================
    // LOGIN ============================================================
    // =========================================================================
    const login = async (req, email, password, done) => {
        console.log(req.body)
        const url = 'http://localhost:4001/login';
        let data = {
            email: email,
            password: password
        }
        let fetchData = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers({
            'Content-Type': 'application/json; charset=UTF-8'
            })
        }
        var user = null
        await fetch(url, fetchData)
            .then((response) => response.json() )
            .then((data) =>{
            console.log("data=======> \n",data);
            user = data["user"]
            //the data here will return json output. 
            // {
            //     message: "eg message",
            //     user: {
            //         user object here for passport to use
            //     }
            // }
            });
        console.log("logging in ========> \n", user)
        if (user == null) {
            return done(null, false, { message: 'Email/password incorrect.'})
        } else {
            return done(null, user)
        }
    } 
    passport.use(new LocalStrategy({usernameField: 'email', passReqToCallback: true}, login))
}

module.exports = initialize