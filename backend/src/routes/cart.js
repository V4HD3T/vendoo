const router = require("express").Router();
const { body, param } = require("express-validator");
const { getCart, addToCart, updateCartItem, removeCartItem, clearCart } = require("../controllers/cartController");
const { authenticate } = require("../middleware/auth");
const { validate }     = require("../middleware/validate");

router.use(authenticate);

router.get("/", getCart);
router.post("/",
  body("productId").isInt({ min: 1 }).withMessage("Enter a valid product ID."),
  body("quantity").optional().isInt({ min: 1, max: 99 }),
  validate, addToCart
);
router.put("/item/:itemId",
  param("itemId").isInt({ min: 1 }),
  body("quantity").isInt({ min: 1, max: 99 }),
  validate, updateCartItem
);
router.delete("/item/:itemId",
  param("itemId").isInt({ min: 1 }), validate, removeCartItem
);
router.delete("/", clearCart);

module.exports = router;
