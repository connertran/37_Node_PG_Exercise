const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

// list all the companies
router.get("/", async function (req, res) {
  const results = await db.query(`
  SELECT code, name 
  FROM companies 
  ORDER BY name`);
  return res.json({ companies: results.rows });
});

module.exports = router;
