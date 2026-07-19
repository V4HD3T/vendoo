const router = require("express").Router();
const { body } = require("express-validator");
const { register, login, getMe } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate }     = require("../middleware/validate");

const pwdRules = body("password")
  .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
  .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter.")
  .matches(/[0-9]/).withMessage("Must contain at least one digit.");

router.post("/register",
  body("email").isEmail().normalizeEmail().withMessage("Enter a valid email."),
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters."),
  body("role").optional().isIn(["customer","seller"]).withMessage("Role must be 'customer' or 'seller'."),
  pwdRules, validate, register
);

router.post("/login",
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
  validate, login
);

router.get("/me", authenticate, getMe);

module.exports = router;
