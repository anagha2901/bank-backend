// import model in userController.js file
const users = require('../Models/userSchema')
// import jsonwebtoken
const jwt = require('jsonwebtoken')

// define and export logic to resolve different http client request

// register
exports.register = async (req,res)=>{
    //register logic
    console.log(req.body);
    //get data send by front end
    const { username,acno,password } = req.body
    if(!username || !acno || !password){
        res.status(403).json("all inputs are required!!")
     }
     //check user is an exist user
     try{
        const preuser = await users.findOne({acno})
        if(preuser){
          res.status(403).json("user already exists")
        }
        else{
           //add user ro db
           const newuser = new users({
               username,
               password,
               acno,
               balance:5000,
               transactions:[]
          })
          //to save newuser in mongodb
          await newuser.save()
          res.status(200).json(newuser)
        }
     }
     catch(error){
        res.status(401).json(error)
     }

}

// login
exports.login = async (req,res)=>{
   // get req body
   const { acno,password} = req.body
   // check acno and pswd is in db
   try{
      // check acno and pswd is in db
      const preuser = await users.findOne({acno,password})
      // check preuser or not
      if(preuser){
         // generate token using jwt
         const token = jwt.sign({
            loginAcno:acno
         },"supersecretkey12345")
         // send to client
         res.status(200).json({preuser,token})
      }
      else{
         res.status(404).json("invalid account no./ password")
      }
   }
   catch(error){
      res.status(401).json(error)
   }
}

// getbalance
exports.getbalance = async (req,res)=>{
   // get acno from path parameter
   let acno = req.params.acno

   // get data of given acno
   try{
      //  find acno from users collection
      const preuser = await users.findOne({acno})
      if(preuser){
         res.status(200).json(preuser.balance)
      }
      else{
         res.status(404).json("invalid account no.")
      }
   }
   catch(error){
      res.status(401).json(error)
   }

}

// transfer

exports.transfer = async (req,res)=>{
   console.log("inside transfer logic");
   // logic
   // 1.get body from req, creditacno, amt,pswd
   const {creditAcno,creditAmount,pswd} = req.body
   // convert creditAmount to number
   let amt = Number(creditAmount)
   const {debitAcno} = req
   console.log(debitAcno);
   try{
      // 2.check debit acno and pswd is available in mongodb
   const debitUserDetails = await users.findOne({acno:debitAcno,password:pswd})
   console.log(debitUserDetails);

   // 3. get credit acno details from mongo db
      const creditUserDetails = await users.findOne({acno:creditAcno})
      console.log(creditUserDetails);
      if(debitAcno!=creditAcno){
         if(debitUserDetails && creditUserDetails){
         // check sufficient balance available for debitUserDetails
         if(debitUserDetails.balance>=creditAmount){
            // perform transfer
   
            // debit creditAmount from debitUserDetails
            debitUserDetails.balance-=amt
            //  add debit transaction to debitUserDetails
            debitUserDetails.transactions.push({
               transaction_type:"DEBIT",amount:creditAmount,fromAcno:debitAcno,toAcno:creditAcno
            })
            //  save debitUserDetails in mongodb
            await debitUserDetails.save()
            // credit creditAmount to creditUserDetails
            creditUserDetails.balance+=amt
             //  add credit transaction to creditUserDetails
            creditUserDetails.transactions.push({
               transaction_type:"CREDIT",amount:creditAmount,fromAcno:debitAcno,toAcno:creditAcno
            })
            //  save creditUserDetails in mongodb
            await creditUserDetails.save()
            res.status(200).json("fund transfer successfully completed...")
         }
         else{
            // insufficient
            res.status(406).json("insufficient balance")
         }
   
         }
         else{
            res.status(406).json("invalid credit/ debit details")
         }
      }
      else{
         res.status(406).json("operation denied!!! self transaction are not allowed..")
      }
   }
   catch(error){
      res.status(401).json(error)
   }
   // res.send("transfer request received")

}

// getTransactions
exports.getTransactions = async (req,res)=>{
   // 1. get acno from req.debitAcno
   let acno = req.debitAcno
   try{
       // 2. check acno in mongodb
      const preuser = await users.findOne({acno})
      res.status(200).json(preuser.transactions)
   }
   catch(error){
      res.status(401).json("invalid account no.")
   }
}

// deleteMyAcno
exports.deleteMyAcno = async (req,res)=>{
   // 1.get acno from req
   let acno = req.debitAcno

   // remove acno from db
   try{
     await users.deleteOne({acno})
     res.status(200).json("Removed Successfully")
   }
   catch(error){
      res.status(401).json(error)
   }
}