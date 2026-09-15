const express = require("express");
const { sendContactMessage } = require("../Controllers/contactController");
 
const router = express.Router();
 
router.post("/contact", sendContactMessage);
 
module.exports = router;