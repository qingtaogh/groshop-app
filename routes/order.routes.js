var router = require("express").Router();
const middleware = require("../middleware/middleware.js")
const { check, validationResult } = require('express-validator')






router.get("/myorders", middleware.isLoggedIn, async (req, res) => {
//     const id = req.user.id; // some id
//     const dateObject = new Date();

//     let date = new Date().toUTCString().slice(5, 16);
//         const orderItemJSON = [
//         {
//            id:"1", // PK autoincrement.
//            timecreated: date,
//            totalcost: 1000
//         }           
//     ]

//     res.render('./user/orders/orders', {
//       orderItem: orderItemJSON
//   })

  const id = req.user.id; // some id
  const url = `http://localhost:4004/${id}/getorder`
  const urlForAddress = `http://localhost:4001/${id}/getaddressbyuserId`
  var orderItemJSON = null

  await fetch(url)
  .then((response) => response.json())
  .then((data) =>{
    orderItemJSON = data["order"]
    console.log("data from API=======> \n",orderItemJSON);
  })
  for(var i = 0; i < orderItemJSON.length; i++){
    await fetch(urlForAddress)
    .then((response) => response.json())
    .then((data) =>{
      console.log("address=======> \n",data);
      orderItemJSON[i].address = data.address[0].name
      console.log("data after adding address=======> \n",orderItemJSON);
    })
  }

  res.render('./user/orders/orders', {
      orderItem: orderItemJSON
  })
})


module.exports = router


