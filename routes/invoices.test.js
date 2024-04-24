process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let dbInfo;
let dbInfoInvoice;
beforeEach(async function () {
  const addData = await db.query(
    `INSERT INTO companies
        VALUES ('test', 'test company', 'Ignore me')
        RETURNING code, name, description`
  );
  dbInfo = addData.rows[0];

  const addDataInvoice = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ('test', '100')
        RETURNING id, comp_code, amt, paid, paid_date`
  );
  dbInfoInvoice = addDataInvoice.rows[0];
});
afterEach(async function () {
  await db.query(`DELETE FROM companies`);
  await db.query(`DELETE FROM invoices`);
});
afterAll(async () => {
  await db.end();
});

describe("GET /invoices", function () {
  test("Get a list of invoices", async function () {
    const resp = await request(app).get(`/invoices`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.companies).toHaveLength(1);
  });
  test("Get invoices code valid", async function () {
    const resp = await request(app).get(`/invoices/${dbInfoInvoice.id}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.invoice.company.code).toEqual("test");
  });
  test("Get invoices code invalid", async function () {
    const resp = await request(app).get(`/invoices/99999`);
    expect(resp.statusCode).toBe(404);
  });
});

describe("POST /invoices", function () {
  test("add a new invoice", async function () {
    const resp = await request(app).post(`/invoices`).send({
      comp_code: "test",
      amt: "500",
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.body.invoice.comp_code).toEqual("test");
    expect(resp.body.invoice.amt).toEqual(500);
  });
});

describe("PUT /invoices", function () {
  test("change info of an invoice", async function () {
    const resp = await request(app).put(`/invoices/${dbInfoInvoice.id}`).send({
      amt: "999",
      paid: "True",
    });
    expect(resp.statusCode).toBe(200);
    expect(resp.body.invoice.amt).toEqual(999);
  });
});

describe("DELETE /invoices", function () {
  test("delete an invoice", async function () {
    const resp = await request(app).delete(`/invoices/${dbInfoInvoice.id}`);
    expect(resp.statusCode).toBe(200);

    expect(resp.body).toEqual({ status: "deleted" });
  });
});
