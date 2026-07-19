const router = require("express").Router();
const { body, query, param } = require("express-validator");
const { getProducts, getProductById, getProductsByCategory,
        createProduct, updateProduct, deleteProduct } = require("../controllers/productController");
const { authenticate, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const sellerOnly  = [authenticate, requireRole("seller")];
const productBody = [
  body("name").trim().isLength({ min: 2, max: 255 }).withMessage("Product name must be 2-255 characters."),
  body("categoryId").isInt({ min: 1 }).withMessage("Enter a valid category ID."),
  body("price").isFloat({ min: 0 }).withMessage("Enter a valid price."),
  body("discount").optional().isInt({ min: 0, max: 100 }),
  body("stock").isInt({ min: 0 }).withMessage("Enter a valid stock value."),
];

// Public
router.get("/",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  validate, getProducts
);
router.get("/category/:slug", getProductsByCategory);
router.get("/:id(\\d+)", getProductById);

// Seller only
router.post("/",              ...sellerOnly, productBody, validate, createProduct);
router.put("/:id(\\d+)",   ...sellerOnly, param("id").isInt({ min: 1 }), productBody, validate, updateProduct);
router.delete("/:id(\\d+)",...sellerOnly, param("id").isInt({ min: 1 }), validate, deleteProduct);

module.exports = router;
