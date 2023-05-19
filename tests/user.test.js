//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

//Require the dev-dependencies
const request = require('supertest');

// IMPORTANT: SERVER NEEDS TO BE RUNNING IN ORDER TO TEST THE APIs
// 1. Run `npm ci` to install jest and supertest
// 2. Run insert_user_data.sql in userservice database BEFORE TEST
// 3. Run `npm start` on user microservice
// 4. Run `npm run test` to test

const baseurl = `http://localhost:4001`;

const register_data = 
{
    username: 'CustomerUser12345',
    password: '$2b$10$Y52KBvbd3eNB9JNw9nIkDusQY9wDuk6Q8RrlbG8Vrl7T4mFXVlEBG',
    email: 'CustomerUser12345@example.com'
};


const login_data = 
{
    username: 'Employee1',
    password: 'Employee1', 
    email: 'Employee1@example.com' 
};

// const failed_login_data = 
// {
//     username: 'Employee1',
//     password: 'Employee123', 
//     email: 'Employee1@example.com' 
// };


const update_data = 
{
    username: 'Customer123',
    password: 'Customer1',
    email: 'Customer1@example.com'
};

describe('/POST user', () => {
    it('it should register user if user does not exist', (done) => {
        request(baseurl)
        .post('/register')
        .send(JSON.stringify(register_data))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .end(function(err, res) {
            if (res.body.error) {
                expect(res.statusCode).toEqual(400)
                expect(res.body.error).toEqual('User already exists!')
            }
            if (res.body.message) {
                expect(res.statusCode).toEqual(200)
                expect(res.body.message).toEqual('User registered!')
                expect(res.body.insertId).not.toBeNull()
            }
            console.log(res.body)
            done();
        });
    })
    it('it should login user', (done) => {
        request(baseurl)
        .post('/login')
        .send(JSON.stringify(login_data))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .end(function(err, res) {
            /*
            {
                id: 1,
                username: 'Employee1',
                email: 'Employee1@example.com',
                role: 'ADMIN'
            }
            */
            expect(res.statusCode).toEqual(200)
            expect(res.body.message).toEqual('User logged in!')
            expect(res.body.user.username).toEqual('Employee1')
            expect(res.body.user.email).toEqual('Employee1@example.com')
            console.log(res.body)
            done();
        });
    })
    it('it should update user', (done) => {
        request(baseurl)
        .post('/4/updateuser')
        .send(JSON.stringify(login_data))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .end(function(err, res) {
            /*
            {
                id: 4,
                username: 'Customer123',
                email: 'Customer1@example.com',
                role: 'CUSTOMER'
            }
            */
            expect(res.statusCode).toEqual(200)
            console.log(res.body)
            done();
        });
    })
})

describe('/GET user', () => {
    it('it should get the user profile', (done) => {
        request(baseurl)
        .get('/1/getuserdetailsbyid')
        .set("accept", "application/json")
        .end((err, res) => {
            /*
            {
                id: 1,
                username: 'Employee1',
                email: 'Employee1@example.com',
                role: 'ADMIN'
            }
            */
            expect(res.body["user"]["0"]["id"]).toEqual(1)
            expect(res.body["user"]["0"]["username"]).toEqual("Employee1")
            expect(res.body["user"]["0"]["email"]).toEqual("Employee1@example.com")
			console.log(res.body)
            done();
            
        })
    })
})
