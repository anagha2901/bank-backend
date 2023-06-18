// define application specific middleware

const appMiddleware = (req,res,next)=>{
    console.log("application  specific middleware ");
    next()
}

module.exports={
    appMiddleware
}