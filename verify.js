const jwt = require('jsonwebtoken'); 
const secret = process.env.JWT_SECRET

 function verifyJWTMiddleware(req,res,next){
    
    if(!req.headers.authorization){
        res.status(403).json({ok:false, status:'Token Not Found'})
        return 
    }

    const token = req.headers.authorization.split(' ')[1]; 

    
    jwt.verify(token,secret,(err,decode) =>{
        if(err){
           console.log(err)
            res.status(401).json({ok:false,status:'Token Invalid'})
            return
        } else{
            next()
        }
    })
    
}

module.exports = verifyJWTMiddleware