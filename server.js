const express = require('express')
const bodyParser = require("body-parser");
const {v4 : uuidv4} = require ("uuid");
const https = require ('https')
const fs = require ('fs')
const port = 443;
const app = express();
const {createClient} = require('redis');
const md5 = require('md5');
const redisClient = createClient(
    {
    Url:'10.128.0.3',
    }
);

app.use(bodyParser.json());

https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
    ca: fs.readFileSync('chain.pem'),
    // passphrase: 'P@ssw0rd'
}, app).listen(port, async() => {
    console.log('Listening...')
});

// app.listen(port, async ()=>{
//     await redisClient.connect();
//     console.log('listening on port '+port);
// });

app.get('/',(req,res)=>{
    res.send('Hello World!')
});

app.post('/user', (req,res)=>{
    const newUserRequestObject = req.body;
    const loginPassword = req.body.password;
    const hash = md5(loginPassword);
    console.log(hash);
    newUserRequestObject.password=hash;
    newUserRequestObject.verifyPassword = hash
    console.log('New User:',JSON.stringify(newUserRequestObject));
    redisClient.hSet('users',req.body.email,JSON.stringify(newUserRequestObject));

    res.send('New User'+newUserRequestObject.email+' added');

})

app.post("/login", async (req,res)=>{
    const loginEmail = req.body.userName;
    console.log(JSON.stringify(req.body));
    console.log("loginEmail", loginEmail);
    const loginPassword = md5(req.body.password);
    console.log("loginPassword", loginPassword);

    const userString=await redisClient.hGet('users',loginEmail);
    const userObject=JSON.parse(userString)
    if(userString=='' || userString==null){
        res.status(404);
        res.send('User not found');
    }


    else if (loginEmail == userObject.userName && loginPassword == userObject.password){
            const token = uuidv4();
            res.send(token);
    } else{
            res.status(401);//unauthorized
            res.send("Invalid user or password");
        }
})