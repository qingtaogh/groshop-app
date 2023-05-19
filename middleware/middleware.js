// Include Express Validator Functions
const { check, body, validationResult } = require('express-validator');

exports.isLoggedIn = (req, res, next) => {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

exports.isAdmin = (req, res, next) => {
    // if user is authenticated in the session, carry on
    console.log("checking if is admin: ", req.user)
    if (req.isAuthenticated() && req.user.role === 'ADMIN')
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}

exports.validateRegister = 
[
    // Check email
    check('email', 'Email Must Be an Email Address').isEmail(),
    // Check Password
    check('password').isLength({ min: 8 }).withMessage('Password Must Be at Least 8 Characters').matches('[0-9]').withMessage('Password Must Contain a Number').matches('[A-Z]').withMessage('Password Must Contain an Uppercase Letter').trim().escape()
];

exports.validatePasswordChange = [
    check('password').isLength({ min: 8 }).withMessage('New Password Must Be at Least 8 Characters').matches('[0-9]').withMessage('New Password Must Contain a Number').matches('[A-Z]').withMessage('New Password Must Contain an Uppercase Letter')
    .custom((value,{req, loc, path}) => {
      if (value !== req.body.confirmPassword) {
          // trow error if passwords do not match
          throw new Error("New Password and Confirm New Password don't match");
      } else {
          return value;
      }
    })
    .trim().escape()
  ]


exports.validateAddress = [
    // body('name').isEmpty().withMessage('Please enter a valid Street name / Apartment building etc'),
    body('postalCode').isInt().withMessage('Please enter a valid Postal Code')
]