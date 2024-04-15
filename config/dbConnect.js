const mongoose =  require('mongoose')



mongoose.connect("mongodb://127.0.0.1:27017/versatile")


.then(()=>{
    console.log("database connected Succesfully");
})
.catch(()=>{
    console.log("databas connection failed");
})




module.exports =mongoose;