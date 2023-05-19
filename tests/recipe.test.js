//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const request = require('supertest');

// IMPORTANT: SERVER NEEDS TO BE RUNNING IN ORDER TO TEST THE APIs
// 1. Run `npm ci` to install jest and supertest
// 2. Run insert_recipe_data.sql in recipeservice database BEFORE TEST
// 3. Run `npm start` on recipe microservice
// 4. Run `npm run test` to test

const baseurl = `http://localhost:4003`;

const create_recipe_data = {
    "name": "Margherita pizza",
    "description": "",
    "cuisine": "Italian",
    "prepTime": "50",
    "prepTimeUom": "minute",
    "difficulty": "2",
    "servingSize": "4"
}

describe('/POST recipe APIs', () => {
    it('it should create recipe', (done) => {
        request(baseurl)
        .post('/createrecipe')
        .send(JSON.stringify(create_recipe_data))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .end(function(err, res) {
            if (res.body) {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toHaveProperty("recipe")
                expect(res.body).toHaveProperty("recipe.insertId")
                expect(res.body.recipe.affectedRows).toEqual(1)
            }
            console.log(res.body)
            done();
        });
    })
})

describe('/GET recipe APIs', () => {

    it('it should get 6 recipes in 1 page', (done) => {
        request(baseurl)
        .get('/getallrecipes/6/0') // /getallrecipes/:limit/:offset
        .end(function(err, res) {
            if (res.body) {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toHaveProperty("recipes")
                expect(res.body.recipes).toHaveLength(6)
                // expect(res.body.recipe.affectedRows).toEqual(1)
            }
            console.log(res.body)
            done();
        });
    })

    it('it should get recipe details', (done) => {
        request(baseurl)
        .get('/1/getrecipedetails')
        .end(function(err, res) {
            if (res.body) {
                expect(res.statusCode).toEqual(200)
                expect(res.body).toHaveProperty("recipe")
                expect(res.body.recipe).not.toBeNull()
                expect(res.body.image).not.toBeNull()
                expect(res.body.ingredients).not.toBeNull()
                expect(res.body.steps).not.toBeNull()
                // expect(res.body.recipe.affectedRows).toEqual(1)
            }
            console.log(res.body)
            done();
        });
    })

})