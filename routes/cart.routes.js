var router = require("express").Router();
const middleware = require("../middleware/middleware.js")
const { check, validationResult } = require('express-validator')

// Cart Home Page
// Method 1: calling microservice api in cart.routes.js to fetch data 
// and then render the EJS page to be seen on browser
// See method 2 in mycart.ejs for another way to fetch data from microservice api 
/*router.get("/mycart", middleware.isLoggedIn, async (req, res) => {
    const id = 1 // some id
    const url = `http://localhost:4000/${id}/api`
    await fetch(url)
    .then(response => response.json())
    .then(data => {
        // TODO
        
        // page is in views/users/cart/mycart.ejs
        res.render('./user/cart/mycart', {
            user: req.user,
            items: data[items]
        })
    }).catch(err => {
        // display alert error message in mycart.ejs under alert.ejs
        req.flash("error", `Error in retrieving cart: ${err}`)

        // page is in views/users/cart/mycart.ejs
        res.render('./user/cart/mycart', {
            user: req.user,
            items: null
        })
    })



})*/

router.post("/:userid/addToCart", middleware.isLoggedIn,  async (req, res) =>{
    const userId = req.params.userid
    const recipeId = req.body.recipeId
    

    const url = `http://localhost:4003/${recipeId}/getallingredientsbynameamountuom` // will be changed to url that only retrieve 3 items
    var ingredients = null
    await fetch(url)
    .then(response => response.json())
    .then(data => {
      ingredients = data["ingredients"]
      console.log("data=======> ", ingredients)
    })

    for (let i = 0; i < ingredients.length; i++) {
      var ingredientName = ingredients[i].name
      var getProductUrl = `http://localhost:4005/${ingredientName}/getproductIdPriceByName`
      
      await fetch(getProductUrl)
      .then(response => response.json())
      .then(data => {
        console.log(data["product"])
        if (data["product"] !== undefined && data["product"] !== null) {
          productId = data["product"].id
          price = data["product"].price
  
          ingredients[i]["productId"] = productId
          ingredients[i]["price"] = `${price}`
        } else {
          ingredients[i]["productId"] = null
          ingredients[i]["price"] = `0`
        }
      })
    }
    console.log("ingredients: ", ingredients)

    //create cart (to pass in userId)
    const createCarturl = `http://localhost:4000/${userId}/addtocart` //createCartURL
    console.log("userId=======> ",userId);
    const data = {
        userId: userId,
        ingredients: ingredients
      };
      let fetchData = {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
          'Content-Type': 'application/json; charset=UTF-8'
        })
      }
    await fetch(createCarturl, fetchData)
    .then((response) => response.json())
    .then((data) =>{
      console.log("data=======> \n",data);
      req.flash('success', 'Cart Created successfully.')
      res.redirect(`/home/cart/mycart`)
    })  
  }
)


router.get("/mycart", middleware.isLoggedIn, async (req, res) => {
    const id = req.user.id; // some id
    const url = `http://localhost:4000/${id}/getCart`
    const urlPrice = `http://localhost:4005/${id}/getCart`
    var cartJSON = null
    var total = 0
    await fetch(url)
    .then((response) => response.json())
    .then((data) =>{
      console.log("data=======> \n",data);
      cartJSON = data
    })

    // compute total
    for(var i = 0; i < cartJSON.length; i++) {
      if (cartJSON[i].price != undefined &&  cartJSON[i].price != null) {
        var price = (Math.round(cartJSON[i].price*100)/100);
        total += price
      }
    }

    /*
    for(var i = 0; i < cartJSON.length; i++){
      // console.log("itemName=======> \n",cartJSON[i].name);
      const name = cartJSON[i].name
      const urlPrice = `http://localhost:4005/${name}/getproductpriceByName`
      await fetch(urlPrice)
      .then((response) => response.json())
      .then((data) =>{
          // console.log("price data=======> \n",data);
          if (data.price[0] == null ||data.price[0]== undefined)
          {
            cartJSON[i].price = 0
            total += 0
          }
          else
          {
            cartJSON[i].price = (Math.round(data.price[0].price*100)/100);
            total += cartJSON[i].price;
          }
          
        // console.log("data after adding address=======> \n",cartJSON);
        
        console.log ("total=======>",total.toFixed(2))
      })
    }
    */


    res.render('./user/cart/mycart', {
      cartItems: cartJSON,
      totalPrice: total.toFixed(2)
  })
    //Cart will required userId (req.user.id) to retrieve Cart Id to be used
//     const CartDetails = {

//         userId: req.user.id,
//         cartID:"testing" // PK autoincrement.
        
//         }
//         console.log(CartDetails.userId)
//         //cartItem will require cartId to retrieve the items below
//     const cartItemJSON = [
//         {
//            id:"1", // PK autoincrement.
//            productName: "salt",
//            quantity: 1
//         },
//         {
//             id:"2",
//             productName: "Chicken Breasts",
//             quantity: 2
//          },
//          {
//             id:"3",
//             productName: "A Bottle of Vegetable Oil",
//             quantity: 1
//          },
//          {
//             id:"4",
//             productName: "Shallot",
//             quantity: 1
//          }           
//     ]
//    // var cartItems = data[cartItemJSON]
//     res.render('./user/cart/mycart', {
//         cartItems: data
//     })

})

router.post("/item/:itemId/delete", 
  middleware.isLoggedIn,  
  async (req, res) => {
    const userid = req.user.id;
    const url = `http://localhost:4000/${userid}/removefromcart`
    const data = {

        itemId: req.params.itemId
        
        }

    let fetchData = {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json; charset=UTF-8'
      }),
      body: JSON.stringify(data)
    }
    await fetch(url, fetchData)
    .then((response) => response.json())
    .then((data) =>{
      console.log("data=======> \n",data);
      req.flash('success', 'Ingredient deleted from cart successfully.')
      res.redirect(`/home/cart/mycart`)
    })
    .catch(err => {
      console.log(err)
      req.flash('error', 'Error occurred in deleting ingredient from cart.')
      res.redirect(`/home/cart/mycart`)
    })
  }
)
module.exports = router


// var router = require("express").Router();
// const middleware = require("../middleware/middleware.js")
// const cartController = require("../controllers/cart.controller.js");
// const axios = require("axios");

// // Recipe Home Page
// router.get("/mycart", middleware.isLoggedIn, cartController.getMyCart)

// module.exports = router


// const CartList = () => {

//   const fetchCart = async () => {
//     const res = await axios.get("http://localhost:4000/1/api");

//     return res.data;
//   };

//   useEffect(() => {
//     fetchCart();
//   }, []);

//   const renderedCart = Object.values(cart).map((post) => {
//     return (
//       <div
//         className="card"
//         style={{ width: "30%", marginBottom: "20px" }}
//         key={post.id}
//       >
//         <div className="card-body">
//           <h3>{cart.productId}</h3>
//         </div>
//       </div>
//     );
//   });

//   return (
//     <div className="d-flex flex-row flex-wrap justify-content-between">
//       {renderedCart}
//     </div>
//   );
// };

// export default CartList;