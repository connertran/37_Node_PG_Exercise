process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

// create database for the test
// seed the data.sql

let dbInfo;
beforeEach(async function () {
  const deleteData = await db.query(`DELETE FROM companies`);
  const addData = await db.query(
    `INSERT INTO companies
        VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
        RETURNING code, name, description`
  );
  let dbInfo = addData.rows[0];
});
afterEach(async function () {
  await db.query(`DELETE FROM companies`);
});
afterAll(async () => {
  await db.end();
});

describe("GET /companies", function () {
  test("Get a list of companies", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.statusCode).toBe(200);
  });
});
