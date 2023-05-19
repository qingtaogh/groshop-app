var router = require("express").Router();
const middleware = require("../middleware/middleware.js")

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
    console.log(`page: ${page}`)
    return { count, items, totalPages, currentPage, prevPage, nextPage };
};

const RECIPES_PER_PAGE = 6 // will change to 12

//////////////////////////////////////////////////////////////////////
// Recipe Home Page
// - /home/recipes
//////////////////////////////////////////////////////////////////////
router.get("/", 
    // middleware.isLoggedIn, 
    async (req, res) => {
        const { page, size } = req.query;
        const { limit, offset } = getPagination(+page - 1, size, RECIPES_PER_PAGE);
        let queryStr = `?limit=${limit}&offset=${offset}`
        var recipes = null

        // const url = `http://localhost:4003/getallrecipes`
        const url = `http://localhost:4003/getallrecipes${queryStr}`
        await fetch(url)
        .then(response => response.json())
        .then(data => {
          const response = getPagingData(data["count"], data["recipes"], page, limit);
          console.log(`response: ${JSON.stringify(response)}`)
          console.log('current page: ', response.currentPage)
          recipes = data["recipes"]
          if (recipes != null && recipes != undefined && recipes.length > 0) {
            res.render('./user/recipe/recipeHomePage', {
                user: (req.user !=undefined && req.user != null) ? req.user : null,
                recipes: recipes,
                pageObj: {
                    currentPage: response.currentPage,
                    totalPages: response.totalPages,
                    nextPage: response.nextPage,
                    prevPage: response.prevPage
                }
            })
          } else {
            req.flash("info", "No recipes found.")
            res.render('./user/recipe/recipeHomePage', {
                user: (req.user !=undefined && req.user != null) ? req.user : null,
                recipes: null,
                pageObj: null
            })
          }
        })
        .catch(err => {
            req.flash("error", "Error accessing recipe service.")
            res.render('./user/recipe/recipeHomePage', {
                user: (req.user !=undefined && req.user != null) ? req.user : null,
                recipes: null,
                pageObj: null
            })
        })
    }
)

router.get("/search", async (req, res) => {
    const { page, size, name, cuisine, difficulty, servingSize } = req.query;
    const { limit, offset } = getPagination(+page - 1, size, RECIPES_PER_PAGE);

    let queryStr = `?limit=${limit}&offset=${offset}`
    if (name != null) queryStr += `&name=${name}`
    if (cuisine != null) queryStr += `&cuisine=${cuisine}`
    if (difficulty != null) queryStr += `&difficulty=${difficulty}`
    if (servingSize != null) queryStr += `&servingSize=${servingSize}`

    const url = `http://localhost:4003/searchrecipes${queryStr}`
    await fetch(url)
    .then(response => response.json())
    .then(data => {
        const response = getPagingData(data["count"], data["recipes"], page, limit);
        console.log(`response: ${JSON.stringify(response)}`)
        console.log('current page: ', response.currentPage)
        recipes = data["recipes"]
        if (recipes != null && recipes != undefined && recipes.length > 0) {
        res.render('./user/recipe/recipeHomePage', {
            user: (req.user !=undefined && req.user != null) ? req.user : null,
            recipes: recipes,
            pageObj: {
                currentPage: response.currentPage,
                totalPages: response.totalPages,
                nextPage: response.nextPage,
                prevPage: response.prevPage
            }
        })
        } else {
        req.flash("warning", "No search results found.")
        res.render('./user/recipe/recipeHomePage', {
            user: (req.user !=undefined && req.user != null) ? req.user : null,
            recipes: null,
            pageObj: null
        })
        }
    })
    
})

//////////////////////////////////////////////////////////////////////
// Favourite Recipes Page
// - /home/recipes/favourites
//////////////////////////////////////////////////////////////////////
router.get("/favourites", 
    middleware.isLoggedIn, 
    async (req, res) => {
        const { page, size } = req.query;
        const { limit, offset } = getPagination(+page - 1, size, RECIPES_PER_PAGE);

        const userId = req.user.id
        const url = `http://localhost:4003/${userId}/getfavouriterecipes/${limit}/${offset}`
        var recipes = null
        await fetch(url)
        .then(response => response.json())
        .then(data => {
          const response = getPagingData(data["count"], data["recipes"], page, limit);
          console.log(`response: ${JSON.stringify(response)}`)
          recipes = data["recipes"]
          if (recipes != null && recipes != undefined && recipes.length > 0) {
            res.render('./user/recipe/favourites', {
              recipes: recipes,
              user: req.user,
              pageObj: {
                currentPage: response.currentPage,
                totalPages: response.totalPages,
                nextPage: response.nextPage,
                prevPage: response.prevPage
              }
            })
          } else {
            // req.flash("info", "No favourite")
            res.render('./user/recipe/favourites', {
              user: req.user,
              recipes: null,
              pageObj: null
            })
          }
        })
    }
)

//////////////////////////////////////////////////////////////////////
// View Recipe
// - /home/recipes/:id
//////////////////////////////////////////////////////////////////////
router.get("/:id", 
    // middleware.isLoggedIn, 
    async (req, res) => {
        var recipe = null
        var image = null
        var ingredients = null
        var steps = null
        var favourite = null
        // var comments = null
    
        const recipeId = req.params.id
        const userId = req.user ? req.user.id : null
        const url = `http://localhost:4003/${userId}/getrecipedetailsforuser/${recipeId}`
        await fetch(url)
        .then ((response) => response.json())
        .then((data => {
            recipe = data["recipe"]
            image = data["image"]
            ingredients = data["ingredients"]
            steps = data["steps"]
            favourite = data["favourite"]
            // comments = data["comments"]
            console.log(`view recipe by user: `, typeof recipe)
            if (recipe == null || typeof recipe == 'undefined' || recipe.length <= 0) {
                req.flash('error', 'No recipe found')
                recipe = null
                image = null
                ingredients = null
                steps = null
                favourite = null
                // comments = null
            }
            res.render('./user/recipe/recipeViewPage', {
                user: (req.user !=undefined && req.user != null) ? req.user : null,
                recipe: recipe,
                image: image,
                ingredients: ingredients,
                steps: steps,
                favourite: favourite,
                // comments: comments
            })
        }))
        .catch(err => {
          console.log(err)
          req.flash('error', `Error occurred in retrieving recipe: ${err}`)
          res.redirect(`/home/recipes`)
        })
      }
)

//////////////////////////////////////////////////////////////////////
// Favourite/Unfavourite Recipe
// - /home/recipes/:id/favourite
// - /home/recipes/:id/unfavourite
//////////////////////////////////////////////////////////////////////
router.post("/:id/favourite", 
    middleware.isLoggedIn, 
    async (req, res) => {
        userId = req.user.id
        recipeId = req.params.id
        const url = `http://localhost:4003/${userId}/favouriterecipe/${recipeId}`
        let fetchData = {
            method: 'POST',
            headers: new Headers({
              'Content-Type': 'application/json; charset=UTF-8'
            })
        }
        await fetch(url, fetchData)
        .then(response => response.json())
        .then((data) =>{
            console.log("data=======> \n",data);
            req.flash('success', 'Recipe added to favourites!')
            res.redirect(`/home/recipes/${recipeId}`)
        })
        .catch(err => {
            console.log(err)
            req.flash('error', `Error in favouriting recipe: ${err}`)
            res.redirect(`/home/recipes/${recipeId}`)
        })
    }
)

router.post("/:id/unfavourite", 
    middleware.isLoggedIn, 
    async (req, res) => {
        userId = req.user.id
        recipeId = req.params.id
        const url = `http://localhost:4003/${userId}/unfavouriterecipe/${recipeId}`
        let fetchData = {
            method: 'POST',
            headers: new Headers({
              'Content-Type': 'application/json; charset=UTF-8'
            })
        }
        await fetch(url, fetchData)
        .then(response => response.json())
        .then((data) =>{
            console.log("data=======> \n",data);
            req.flash('success', 'Recipe removed from favourites!')
            res.redirect(`/home/recipes/${recipeId}`)
        })
        .catch(err => {
            console.log(err)
            req.flash('error', `Error in unfavouriting recipe: ${err}`)
            res.redirect(`/home/recipes/${recipeId}`)
        })
    }
)

//////////////////////////////////////////////////////////////////////
// Comment on Recipe
// - /home/recipes/:id/comment (POST)
// - get comments is on the EJS to allow for loading of comments
//////////////////////////////////////////////////////////////////////
router.post("/:id/comment", 
    middleware.isLoggedIn, 
    async (req, res) => {
        userId = req.user.id
        recipeId = req.params.id
        const url = `http://localhost:4003/${recipeId}/postcomment`
        
        const data = {
            content: req.body.content,
            author: req.user.username
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
        .then((data) =>{
            console.log("data=======> \n",data);
            req.flash('success', 'Comment posted!')
            res.redirect(`/home/recipes/${recipeId}`)
        })
        .catch(err => {
            console.log(err)
            req.flash('error', 'Error in posting comment.')
            res.redirect(`/home/recipes/${recipeId}`)
        })
    }
)




module.exports = router