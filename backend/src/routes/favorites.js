const router = require("express").Router();
const { body, param } = require("express-validator");
const { getFavorites, addFavorite, removeFavorite, checkFavorite } = require("../controllers/favoriteController");
const { authenticate } = require("../middleware/auth");
const { validate }     = require("../middleware/validate");

router.use(authenticate);

router.get("/", getFavorites);
router.get("/check/:productId",
  param("productId").isInt({ min: 1 }), validate, checkFavorite
);
router.post("/",
  body("productId").isInt({ min: 1 }).withMessage("Enter a valid product ID."),
  validate, addFavorite
);
router.delete("/:productId",
  param("productId").isInt({ min: 1 }), validate, removeFavorite
);

module.exports = router;
