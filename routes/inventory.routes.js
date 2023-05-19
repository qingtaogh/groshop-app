var router = require("express").Router();
const middleware = require("../middleware/middleware.js")
const upload = require("../middleware/image.middleware.js");

const getPagination = (page, size, itemsPerPage) => {
    if (page < 0) page = 0
    const limit = size ? +size : itemsPerPage; // set limit of items per page
    const offset = page ? page * limit : 0;
  
    return { limit, offset };
};

const getPagingData = (count, items, page, limit) => {
    page = page ? page : 1
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(count / limit);
    const prevPage = (currentPage - 1) >= 0 ? (currentPage - 1) : null;
    const nextPage = (currentPage + 1) <= totalPages ? (currentPage + 1) : null;
    console.log(`page: ${currentPage}`)
    return { count, items, totalPages, currentPage, prevPage, nextPage };
};

const PRODUCTS_PER_PAGE = 6

//////////////////////////////////////////////////////////////////////
// Product Home Page
//////////////////////////////////////////////////////////////////////
router.get("/", 
  middleware.isLoggedIn, middleware.isAdmin, 
  async (req, res) => {
    const { page, size } = req.query;
    const { limit, offset } = getPagination(+page - 1, size, PRODUCTS_PER_PAGE);

    var products = null
    
    // const url = `http://localhost:4003/getallproducts`
    const url = `http://localhost:4005/getallproducts/${limit}/${offset}`
    
    await fetch(url)
    .then(response => response.json())
    .then(data => {
      const response = getPagingData(data["count"], data["products"], page, limit);
      console.log(`response: ${JSON.stringify(response)}`)
      products = data["products"]
      if (products != null && products != undefined && products.length > 0) {
        res.render('./admin/inventory/inventory', {
          products: products,
          user: req.user,
          pageObj: {
            currentPage: response.currentPage,
            totalPages: response.totalPages,
            nextPage: response.nextPage,
            prevPage: response.prevPage
          }
        })
      } else {
        req.flash("info", "Error in retrieving products.")
        res.render('./admin/inventory/inventory', {
          user: req.user,
          products: null,
          pageObj: null
        })
      }
    })
  }
)

//////////////////////////////////////////////////////////////////////
// Create Product -> Enter Product Details
//////////////////////////////////////////////////////////////////////
router.get("/create", middleware.isLoggedIn, middleware.isAdmin,  (req, res) => {
  res.render('admin/inventory/inventoryForm', {
    user: req.user,
    mode: "CREATE"
  })
});

router.post("/create", 
  middleware.isLoggedIn, middleware.isAdmin, 
  async (req, res) => {
    const url = `http://localhost:4005/createproduct`
    const data = {
      name: req.body.name,
      description: req.body.description ? req.body.description : null,
      quantity: req.body.quantity,
      price: req.body.price
    }
    let fetchData = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json; charset=UTF-8'
      })
    }
    var createdProductId = null
    await fetch(url, fetchData)
    .then((response) => response.json())
    .then((data) =>{
      console.log("data=======> \n",data);
      createdProductId = data["product"]["insertId"]
    })
    .catch(err => {
      req.flash('error', `Error in creating product: ${err}`)
      res.redirect(`/admin/inventory`)
    })

    if ( createdProductId != null ) {
      const getProductUrl = `http://localhost:4005/${createdProductId}/getproduct`
      await fetch(getProductUrl)
      .then(response => response.json())
      .then(data => {
        var product = data["product"]
        if (product != null && product != undefined) {
          req.flash('success', 'Product created successfully.')
          res.redirect(`/admin/inventory/${product.id}/uploadPhoto`)
        }
      }).catch(err => {
        req.flash('error', `Error in accessing newly created product: ${err}`)
        res.redirect(`/admin/inventory`)
      })
    } else {
      req.flash('error', `Error in creating product`)
      res.redirect(`/admin/inventory`)
    }
})

//////////////////////////////////////////////////////////////////////
// Create Product -> Upload Product of Dish
//////////////////////////////////////////////////////////////////////
// GET UPLOADED PHOTO
router.get("/:id/uploadPhoto", 
  middleware.isLoggedIn, middleware.isAdmin,  
  async (req, res) => {
    const productId = req.params.id
    const url = `http://localhost:4005/${productId}/getphotobyproduct`
    var image = null
    await fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log("data: ", data)
      image = data["image"][0]
      console.log(`image: ${image}`)
      if (image == null || image == undefined || image == "") {
        image = null
        req.flash('info', 'Please add photo.')
      } 
      res.render('./admin/inventory/productImageForm', {
        productId: req.params.id,
        image: image ? image : null
      })
    }).catch(err => {
      req.flash('error', 'Error occurred in accessing product photo service.')
      res.redirect(`/admin/inventory`)
    })
  }
)

// UPLOAD AND CREATE PRODUCT IMAGE RECORD
router.post("/:id/uploadPhoto", 
  middleware.isLoggedIn, middleware.isAdmin,  upload.single('image'), 
  async (req, res) => {
    console.log(req.file)
    const productId = req.params.id

    if (req.file == undefined) {
      req.flash('error', 'You must select a file.')
      return res.redirect(`/admin/products/${productId}/uploadPhoto`)
    }

    // UPLOAD PHOTO
    const url = `http://localhost:4005/${productId}/uploadphoto`
    const data = {
      type: req.file.mimetype,
      name: req.file.originalname,
      srcPath: "/images/uploads/" + req.file.filename
    }
    let fetchData = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json; charset=UTF-8'
      })
    }

    // GET THE NEWLY UPLOADED PHOTO
    var createdImageId = null
    await fetch(url, fetchData)
    .then((response) => response.json())
    .then((data) =>{
      console.log("data=======> \n",data);
      createdImageId = data["image"]["insertId"]
    })
    .catch(err => {
      req.flash('error', `Error occurred in creating product image: ${err}`)
      res.redirect(`/admin/inventory/${productId}/uploadPhoto`)
    })

    if ( createdImageId != null ) {
      const photourl = `http://localhost:4005/${createdImageId}/getphotobyid`
      var image = null
      await fetch(photourl)
      .then(response => response.json())
      .then(data => {
        image = data["image"][0]
        console.log(image)
        if (image == null || image == undefined) {
          req.flash('info', 'Please add photo.')
        } else {
          req.flash('success', `Photo uploaded successfully!`)
        }
        res.render('./admin/inventory/productImageForm', {
          productId: req.params.id,
          image: image ? image : null
        })
      }).catch(err => {
        req.flash('error', 'Error occurred in accessing product photo service.')
        res.redirect(`/admin/inventory`)
      })
    } else {
      req.flash('error', `No image uploaded: ${err}`)
      res.redirect(`/admin/inventory/${productId}/uploadPhoto`)
    }
  }
)

// SAVE PHOTO TO PRODUCT
router.post("/:id/savePhoto", 
  middleware.isLoggedIn, middleware.isAdmin,  
  async (req, res) => {
    const productId = req.params.id
    const url = `http://localhost:4005/${productId}/savephototoproduct`
    const data = {
      imageId: req.body.imageId
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
      req.flash('success', 'Photo added to product successfully.')
      res.redirect(`/admin/inventory`)
    })
    .catch(err => {
      console.log(err)
      req.flash('error', 'Error occurred in adding photo to product.')
      res.redirect(`/admin/inventory/${productId}/uploadPhoto`)
    })
  }
)

//////////////////////////////////////////////////////////////////////
// Update Product
//////////////////////////////////////////////////////////////////////
router.get("/:id/update", 
  middleware.isLoggedIn, middleware.isAdmin,  
  async (req, res) => {
    const productId = req.params.id
    const url = `http://localhost:4005/${productId}/getproduct`
    await fetch(url)
    .then(response => response.json())
    .then(data => {
      var product = data["product"]
      if (product != null || product != undefined) {
        return res.render('./admin/inventory/inventoryForm', {
          product: product,
          mode: "UPDATE"
        })
      } else {
        req.flash('error', 'Error occurred in retrieving product from product service')
        res.redirect(`/admin/inventory`)
      }
    }).catch(err => {
      req.flash('error', `Error occurred in retrieving product for update: ${err}`)
      res.redirect(`/admin/inventory`)
    })
  }
)
router.post("/:id/update", 
  middleware.isLoggedIn, middleware.isAdmin,  
  async (req, res) => {
    const productId = req.params.id
    const url = `http://localhost:4005/${productId}/updateproduct`

    const data = {
      name: req.body.name,
      description: req.body.description ? req.body.description : null,
      quantity: req.body.quantity,
      price: req.body.price
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
      req.flash('success', 'Product details updated successfully.')
      res.redirect(`/admin/inventory/${productId}/uploadPhoto`)
    })
    .catch(err => {
      console.log(err)
      req.flash('error', 'Error occurred in updating product details.')
      res.redirect(`/admin/inventory`)
    })
  }
)

//////////////////////////////////////////////////////////////////////
// Delete Product
//////////////////////////////////////////////////////////////////////
router.post("/:id/delete", 
  middleware.isLoggedIn, middleware.isAdmin,  
  async (req, res) => {
    const productId = req.params.id
    const url = `http://localhost:4005/${productId}/deleteproduct`

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
      req.flash('success', 'Product deleted successfully.')
      res.redirect(`/admin/inventory`)
    })
    .catch(err => {
      console.log(err)
      req.flash('error', 'Error occurred in deleting product.')
      res.redirect(`/admin/inventory`)
    })
  }
)

//////////////////////////////////////////////////////////////////////
// Search Product
//////////////////////////////////////////////////////////////////////
router.get("/search", async (req, res) => {
  const { page, size, name, price } = req.query;
  const { limit, offset } = getPagination(+page - 1, size, PRODUCTS_PER_PAGE);

  let queryStr = `?limit=${limit}&offset=${offset}`
  if (name != null) queryStr += `&name=${name}`
  if (price != null) queryStr += `&price=${price}`

  const url = `http://localhost:4005/searchproducts${queryStr}`
  await fetch(url)
  .then(response => response.json())
  .then(data => {
      const response = getPagingData(data["count"], data["products"], page, limit);
      console.log(`response: ${JSON.stringify(response)}`)
      console.log('current page: ', response.currentPage)
      products = data["products"]
      if (products != null && products != undefined && products.length > 0) {
      res.render('./admin/inventory/inventory', {
          user: (req.user !=undefined && req.user != null) ? req.user : null,
          products: products,
          pageObj: {
              currentPage: response.currentPage,
              totalPages: response.totalPages,
              nextPage: response.nextPage,
              prevPage: response.prevPage
          }
      })
      } else {
      req.flash("warning", "No search results found.")
      res.render('./admin/inventory/inventory', {
          user: (req.user !=undefined && req.user != null) ? req.user : null,
          products: null,
          pageObj: null
      })
      }
  })

})

module.exports = router