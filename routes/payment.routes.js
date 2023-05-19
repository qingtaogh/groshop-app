const express = require('express')
var router = express.Router();

var Publishable_Key = 'pk_test_51N5q9IA6c6T1aIgQAXR2waaFyQ5msOTxy9LREPrL6L2mU2rPst6NGmgeMw7pzdF8uFuebdqrKLzTEtJDCtuosbZW00t3pcflOp'
var Secret_Key = 'sk_test_51N5q9IA6c6T1aIgQONx66eSlmbbOWjIcvPPBHfGIwajy9dfvPbWLUGaDdhMlFLGlhzKpjxjGQYyDTKXYse7GQtTC009ybmfCu4'

const stripe = require('stripe')(Secret_Key)

router.post('/', async function(req, res) {
  console.log("in POST /home/checkout")
  console.log(req.body)
  const checkoutTotal = req.body.checkoutTotal
  // check if user has yet to enter shipping address in user profile.
  const urlForAddress = `http://localhost:4001/${req.user.id}/getaddressbyuserId`
  await fetch(urlForAddress)
  .then((response) => response.json())
  .then((data) =>{
    console.log("address=======> \n",data);
    if (data.address[0] === undefined || data.address[0] === null) {
      req.flash('error', 'Please enter shipping address in user profile before proceeding to checkout')
      return res.redirect('/home/cart/mycart')
    } else {
      res.render('./user/checkout', {
        key: Publishable_Key,
        checkoutTotal: checkoutTotal
      })
    }
  })

})

router.get('/', function(req, res){
	res.render('./user/checkout', {
	  key: Publishable_Key
	})
})

router.post('/submit', async (req, res) => {
  var stripeToken = req.body.stripeToken;
  console.log("in POST /home/checkout/submit")
  var charge = stripe.charges.create({
    amount: Math.round(req.body.checkoutTotal),
    currency: "sgd", //comment out to trigger StripeInvalidRequestError
    card: stripeToken
  }, async (err, charge) => {
    if (err) {
      console.log(err)
      req.flash('error', 'Payment Unsuccessful. Please try again.')
      return res.redirect('/home/cart/mycart')
    }
    else {
      req.flash('success', 'Payment Successful.')
      const userId = req.user.id
      console.log("userId=======> ",userId);

      //getting cartId
      const cartUrl = `http://localhost:4000/${userId}/getcart`
      var cartId = null
      await fetch(cartUrl)
      .then(response => response.json())
      .then(data => {
        cartId = data[0].cartId
      })
      console.log("cartId=======> ",cartId);

      //update cart status
      const cartStatusUrl = `http://localhost:4000/updatecartstatus`
      const cartStatusData = {
        userId: userId
      };
      let fetchCartStatusData = {
        method: 'POST',
        body: JSON.stringify(cartStatusData),
        headers: new Headers({
          'Content-Type': 'application/json; charset=UTF-8'
        })
      }
      await fetch(cartStatusUrl, fetchCartStatusData)
      .then((response) => response.json())
      .then((data) =>{
        console.log("data=======> \n",data);
        req.flash('success', 'Order Status updated successfully.')
      })

      //creating order
      const url = `http://localhost:4004/createorder`
      const paymentAmount = charge.amount / 100;
      const data = {
          userId: userId,
          cartId: cartId,
          amount: paymentAmount
        };
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
        req.flash('success', 'Order Created successfully.')
        res.redirect(`/home/orders/myorders`)
      })
    }
  })
})

module.exports = router;