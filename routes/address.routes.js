const express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator')
const middleware = require("../middleware/middleware.js")

// all routes for user's shipping address: /home/address/...

// route: /home/address/create (GET - create address page)
router.get("/create", 
    middleware.isLoggedIn,
    (req, res) => {
        res.render('user/addressForm', {
            user: req.user,
            mode: "CREATE"
        })
    })

// route: /home/address/create (POST - create address page)
router.post("/create", 
    middleware.isLoggedIn,
    middleware.validateAddress,
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            errors.array().forEach(err => req.flash('error', err.msg));
            return res.redirect('/home/address/create');
        }
        next()
    },
    async (req, res) => {
        const url = `http://localhost:4001/${req.user.id}/createaddress`
        const data = {
            name: req.body.name,
            floorNo: req.body.floorNo ? req.body.floorNo : null,
            unitNo: req.body.unitNo ? req.body.unitNo : null,
            postalCode: req.body.postalCode,
            country: req.body.country,
            userId: req.user.id
        };
        let fetchData = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers({
              'Content-Type': 'application/json; charset=UTF-8'
            })
        }
        await fetch(url, fetchData)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            if (data["address"] == null || data["address"] == undefined) {
                req.flash('error', 'Error occurred in saving address details.')
                res.redirect('/home/address/create')
            } else {
                req.flash('success', 'Address created successfully.')
                res.redirect('/home/profile')
            }
        })
        .catch(err => {
            console.log(err)
            req.flash('error', `Error occurred in accessing user service to add address: ${err}.`)
            res.redirect('/home/profile')
        })
    }
)
// route: /home/address/:id (GET - get address)
router.get("/:id", 
    middleware.isLoggedIn,
    async (req, res) => {
        const addressId = req.params.id
        const url = `http://localhost:4001/${addressId}/getaddressbyid`
        var address = null
        await fetch(url)
        .then(response => response.json())
        .then(data => {
            address = data["address"]
            console.log("data=======> ", address)
            if (address == null || address == undefined) {
                req.flash('error', 'Error occurred in retrieving address details.')
            }
            res.redirect('/home/profile')
        })
        .catch(err => {
            req.flash('error', `Error occurred in acessing user service to retrieve address: ${err}`)
            res.redirect('/home/profile')
        })
    }
)

// route: /home/address/:id/update (GET - update address page)
router.get("/:id/update",
    middleware.isLoggedIn,
    async (req, res) => {
        console.log("getting address to update")
        const addressId = req.params.id
        const url = `http://localhost:4001/${addressId}/getaddressbyid`
        var address = null
        await fetch(url)
        .then(response => response.json())
        .then(data => {
            address = data["address"]
            console.log("data=======> ", address.id)
            if (address == null || address == undefined) {
                req.flash('error', 'Error occurred in retrieving address details for update.')
            }
            res.render('user/addressForm', {
                user: req.user,
                mode: "UPDATE",
                address: address
            })
        })
        .catch(err => {
            req.flash('error', `Error occurred in acessing user service to retrieve address for update: ${err}`)
            res.redirect('/home/profile')
        })
    }
)
// route: /home/address/:id/update (POST - update address page)
router.post("/:id/update",
    middleware.isLoggedIn,
    middleware.validateAddress,
    (req, res, next) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            errors.array().forEach(err => req.flash('error', err.msg));
            return res.redirect(`/home/address/${req.params.id}/update`);
        }
        next()
    },
    async (req, res) => {
        const addressId = req.params.id
        const url = `http://localhost:4001/${addressId}/updateaddress`
        const data = {
            name: req.body.name,
            floorNo: req.body.floorNo ? req.body.floorNo : null,
            unitNo: req.body.unitNo ? req.body.unitNo : null,
            postalCode: req.body.postalCode,
            country: req.body.country
        };
        let fetchData = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: new Headers({
              'Content-Type': 'application/json; charset=UTF-8'
            })
        }
        await fetch(url, fetchData)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            if (data["address"] == null || data["address"] == undefined) {
                req.flash('success', 'Address updated successfully.')
                res.redirect('/home/profile')
            } else {
                req.flash('error', 'Error occurred in saving address details.')
                res.redirect(`/home/address/${addressId}/update`)
            }
        })
        .catch(err => {
            console.log(err)
            req.flash('error', `Error occurred in accessing user service to save address: ${err}.`)
            res.redirect('/home/profile')
        })
    }
)
// route: /home/address/:id/delete (POST - delete address)
router.post("/:id/delete",
    middleware.isLoggedIn,
    async (req, res) => {
        const addressId = req.params.id
        const url = `http://localhost:4001/${addressId}/deleteaddress`

        let fetchData = {
            method: 'POST',
            headers: new Headers({
              'Content-Type': 'application/json; charset=UTF-8'
            })
        }
        await fetch(url, fetchData)
        .then((response) => response.json())
        .then((data) =>{
          console.log("data=======> \n",data);
          req.flash('success', 'Address deleted successfully.')
          res.redirect('/home/profile')
        })
        .catch(err => {
          console.log(err)
          req.flash('error', 'Error occurred in deleting address.')
          res.redirect('/home/profile')
        })
    }
)

module.exports = router;