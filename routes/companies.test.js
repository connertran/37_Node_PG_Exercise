process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

// create database for the test
// seed the data.sql

let dbInfo;
beforeEach(async function () {
  // const deleteData = await db.query(`DELETE FROM companies`);
  const addData = await db.query(
    `INSERT INTO companies
        VALUES ('test', 'test company', 'Ignore me')
        RETURNING code, name, description`
  );
  dbInfo = addData.rows[0];
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
    expect(resp.body.companies).toHaveLength(1);
  });

  test("Get companies code valid", async function () {
    const resp = await request(app).get(`/companies/test`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body.company.code).toEqual("test");
  });
  test("Get companies code invalid", async function () {
    const resp = await request(app).get(`/companies/testblabla`);
    expect(resp.statusCode).toBe(404);
  });
});

describe("POST /companies", function () {
  test("add a new company", async function () {
    const resp = await request(app).post(`/companies`).send({
      code: "test2",
      name: "test2 company",
      description: "no info",
    });
    expect(resp.statusCode).toBe(201);
    expect(resp.body.company.code).toEqual("test2");
    expect(resp.body.company.name).toEqual("test2 company");
  });
});

describe("PUT /companies", function () {
  test("change info of a company", async function () {
    const resp = await request(app).put(`/companies/test`).send({
      name: "real company",
      description: "the best company",
    });
    expect(resp.statusCode).toBe(200);
    expect(resp.body.company.name).toEqual("real company");
    expect(resp.body.company.description).toEqual("the best company");
  });
});

describe("DELETE /companies", function () {
  test("delete a company", async function () {
    const resp = await request(app).delete(`/companies/test`);
    expect(resp.statusCode).toBe(200);

    expect(resp.body).toEqual({ status: "deleted" });
  });
});
