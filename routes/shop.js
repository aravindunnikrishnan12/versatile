const express = require("express");
const router = express.Router();
const shopcontroller=require("../controller/shopcontroller")
const userController=require("../middleware/sessioncntrl")





const {
    filterproduct,
    getdisplay,
    sortProduct,
    searchmen,
    addToCart,
postwishlist,
wishlist,
removewishlist,
wishtoaddcart,
getbook,
} = require("../controller/shopcontroller");


router.get('/filterproducts',filterproduct)
router.get('/books', userController, getbook);
router.get('/display/:id',getdisplay);
router.get('/sortproduct/:sortBy',sortProduct)
router.get('/search',searchmen)
router.get('/wishlist',userController,wishlist);




router.post('/removeFromWishlist/:id',removewishlist)
router.post('/add-to-cart/:id',addToCart);
router.post('/wishlist-add',postwishlist);
router.post('/wish-addcart/:id',wishtoaddcart);

module.exports = router;