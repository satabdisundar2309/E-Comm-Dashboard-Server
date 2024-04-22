const express = require('express')
const app = express()

require('dotenv').config()
const port = process.env.PORT || 5000

require('./config/dbConnect')

const userModel = require('./models/userModel')
const productModel = require('./models/productModel')

app.use(express.json())

const cors = require('cors') // npm i cors
// const corsOptions ={
//     origin: "*",
//     methods: "GET, PUT, POST, UPDATE, PATCH, HEAD",
//     credentials: true
//  }
app.use(cors()); //for resolving the cors error


const jwt = require('jsonwebtoken')
const jwtKey = process.env.JWT_KEY


// creating a middleware for verifying the jwt token recieved in the header
const verifyToken = (req, res, next)=>{
    let token = req.header("Authorization")
    console.log(token)
    if(token){
        token = token.split(" ")[1]; //to differentiate from "bearer"
       let decoded = jwt.verify(token, jwtKey)
       if(decoded){ 
        next()
       }
       else{
        res.status(403).send({result: "Token didnot match"})
       }
    }
    else{
        res.status(403).send({result: "Please add token with header"})
    }
}
// user registration api
app.post("/register", async (req, res)=>{
    const user = new userModel(req.body);
    let response = await user.save();

    // for not sending the password in response 
    response= response.toObject();
    delete response.password;
    jwt.sign({response}, jwtKey, {expiresIn: "2h"}, (err, token)=>{
        if(err){
            res.send({result: "Something went wrong..."})  
        }
        else{
            res.send({response, auth: token})
        }
    })
})

// user login api
app.post('/login', async (req, res)=>{
    if(req.body.email && req.body.password){
        const user = await userModel.findOne(req.body).select("-password") //it will exclude password field, we can use select() only with find methods not with other methods like save, create, update or delete
        if(user){

            jwt.sign({user}, jwtKey, {expiresIn: "2h"}, (err, token)=>{
                if(err){
                    res.send({result: "Something went wrong..."})  
                }
                else{
                    res.send({user, auth: token})
                }
            })
            
        }
        else{
            res.send({result: "No such user found"})
        }
    }
    else{
        res.send({result: "Enter login details first"})
    }
   
})

// product lists api
app.get('/products', verifyToken, async (req, res)=>{
    const products = await productModel.find({});
    if(products.length > 0){
        res.send(products)
    }
    else{
        res.send({result: "No products found"})
    }
})

// add product api
app.post('/add-product', verifyToken, async (req, res)=>{
    const product = new productModel(req.body);
    const response = await product.save()

    res.send(response)
})

// delete product api
app.delete('/delete-product/:id',verifyToken, async (req, res)=>{
    const id = req.params.id;
    const deletedProduct = await productModel.findByIdAndDelete({_id: id});
    res.send(deletedProduct);

})

// get single data by id
app.get('/getSingleProduct/:id',verifyToken, async (req, res)=>{
    const id = req.params.id;
    const singleProduct = await productModel.findById({_id: id});
    if(singleProduct){
        res.send(singleProduct);
    }
    else{
        res.send({result: "No records found"})
    }
})

// update product data api
app.put('/update-product/:id',verifyToken, async (req, res)=>{
    const id = req.params.id;
    const updatedProduct = await productModel.findByIdAndUpdate({_id: id},{$set: req.body}, {new : true})
    res.send(updatedProduct);
})

// search product api
app.get("/search/:key",verifyToken, async (req, res)=>{
    const key = req.params.key
    const product = await productModel.find({
        $or: [
            {name:{$regex: key}},
            {company:{$regex: key}},
            {category:{$regex: key}},
        ]
    });
    res.send(product);
})


// default route
app.get('/',(req, res)=>{
    res.send("Hello Satabdi") 
})

app.listen(port, ()=>{
    console.log(`App is listening at port number ${port}`);
})