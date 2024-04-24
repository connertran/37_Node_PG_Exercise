const express = require("express");
const router = express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res) {
  const results = await db.query(`
    SELECT id, comp_code FROM invoices ORDER BY id`);
  return res.json({ companies: results.rows });
});

router.get("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;

    const result = await db.query(
      `SELECT i.id, 
                  i.comp_code, 
                  i.amt, 
                  i.paid, 
                  i.add_date, 
                  i.paid_date, 
                  c.name, 
                  c.description 
           FROM invoices AS i
             INNER JOIN companies AS c ON (i.comp_code = c.code)  
           WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    const data = result.rows[0];

    const invoice = {
      id: data.id,
      amt: data.amt,
      paid: data.paid,
      add_date: data.add_date,
      paid_date: data.paid_date,
      company: {
        code: data.comp_code,
        name: data.name,
        description: data.description,
      },
    };

    return res.json({ invoice: invoice });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      `
        INSERT INTO invoices (comp_code, amt)
        VALUES ($1,$2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date
        `,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async function (req, res, next) {
  try {
    let { amt, paid } = req.body;
    let id = req.params.id;
    let paidDate = null;

    const currResult = await db.query(
      `SELECT paid
           FROM invoices
           WHERE id = $1`,
      [id]
    );

    if (currResult.rows.length === 0) {
      throw new ExpressError(`No such invoice: ${id}`, 404);
    }

    const currPaidDate = currResult.rows[0].paid_date;

    if (!currPaidDate && paid) {
      paidDate = new Date();
    } else if (!paid) {
      paidDate = null;
    } else {
      paidDate = currPaidDate;
    }

    const result = await db.query(
      `UPDATE invoices
           SET amt=$1, paid=$2, paid_date=$3
           WHERE id=$4
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    const invoiceID = req.params.id;
    const invoice = await db.query(
      `
          SELECT * FROM invoices WHERE id = $1`,
      [invoiceID]
    );
    if (invoice.rows.length === 0) {
      throw new ExpressError("Invoice not found", 404);
    }
    const deleteInvoice = await db.query(
      `
    DELETE FROM invoices WHERE id = $1`,
      [invoiceID]
    );
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

// find a company with its invoices
// the full url would be http://127.0.0.1:3000/invoices/companies/[code]
router.get("/companies/:code", async function (req, res, next) {
  try {
    const comp_code = req.params.code;
    const resultTest = await db.query(
      `
    SELECT code, name, description
    FROM companies
    WHERE code = $1
    `,
      [comp_code]
    );
    if (resultTest.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    const result = await db.query(
      `SELECT c.code,
                c.name,
                c.description,
                i.id,
                i.comp_code,
                i.amt,
                i.paid,
                i.add_date,
                i.paid_date
            FROM companies as c
            INNER JOIN invoices AS i ON (c.code = i.comp_code)
            WHERE code = $1`,
      [comp_code]
    );
    const data = result.rows[0];
    const response = {
      code: data.code,
      name: data.name,
      description: data.description,
      invoices: [
        data.id,
        data.comp_code,
        data.amt,
        data.paid,
        data.add_date,
        data.paid_date,
      ],
    };
    return res.json({ company: response });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
