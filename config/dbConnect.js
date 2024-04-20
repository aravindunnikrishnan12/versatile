const mongoose =  require('mongoose')



mongoose.connect("mongodb+srv://aravindunnisree:TYOBObJIWXqCrq10@cluster0.fg50poe.mongodb.net/versatile?retryWrites=true&w=majority")


.then(()=>{
    console.log("database connected Succesfully");
})
.catch(()=>{
    console.log("databas connection failed");
})




module.exports =mongoose;