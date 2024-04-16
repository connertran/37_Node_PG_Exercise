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

// find a company
router.get("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
      `
  SELECT code, name, description
  FROM companies
  WHERE code = $1
  `,
      [req.params.code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// add a new company
router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;
    const result = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING code, name, description`,
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// edit a company
router.put("/:code", async function (req, res, next) {
  try {
    const { name, description } = req.body;
    const company = await db.query(
      `
    SELECT * FROM companies WHERE code = $1`,
      [req.params.code]
    );
    if (company.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    const edit = await db.query(
      `
    UPDATE companies SET name = $2, description= $3 WHERE code = $1 RETURNING code, name, description`,
      [req.params.code, name, description]
    );
    return res.json({ company: edit.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// delete a company
router.delete("/:code", async function (req, res, next) {
  try {
    const companyCode = req.params.code;
    const company = await db.query(
      `
    SELECT * FROM companies WHERE code = $1`,
      [companyCode]
    );
    if (company.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    const deleteCompany = await db.query(
      `DELETE FROM companies WHERE code = $1`,
      [companyCode]
    );
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
