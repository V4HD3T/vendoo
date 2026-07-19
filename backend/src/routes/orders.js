const router = require("express").Router();
const { body, param } = require("express-validator");
const { authenticate, requireRole } = require("../middleware/auth");
const { validate }     = require("../middleware/validate");
const {
  createOrder, listMyOrders, getMyOrder, listSellerOrderItems, updateOrderItemStatus,
} = require("../controllers/orderController");

router.use(authenticate);

router.post("/",
  body("shippingAddress").trim().notEmpty().withMessage("Shipping address is required."),
  validate, createOrder
);

router.get("/", listMyOrders);

// Placed before "/:id" so it isn't swallowed by the :id param route.
router.get("/seller/items", requireRole("seller"), listSellerOrderItems);

router.get("/:id", param("id").isInt({ min: 1 }), validate, getMyOrder);

router.put("/items/:itemId/status",
  requireRole("seller"),
  param("itemId").isInt({ min: 1 }),
  body("status").isIn(["pending","processing","shipped","delivered","cancelled"]),
  validate, updateOrderItemStatus
);

module.exports = router;
