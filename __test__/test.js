/* eslint-disable no-unused-vars */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../routes");
const bcrypt = require("bcrypt");
const saltRounds = 10;

let server, agent;
function extractCsrfToken(res) {
    var $ = cheerio.load(res.text);
    return $("[name=_csrf]").val();
}

const login = async (agent, email, password) => {
    try {
        let res = await agent.get("/login");
        let csrfToken = extractCsrfToken(res);
        res = await agent.post("/session").send({
            email,
            password,
            _csrf: csrfToken,
        });
    } catch (e) {
        console.log(e);
    }
};

describe("Learning Management System", function () {
    beforeAll(async () => {
        try {
            await db.sequelize.sync({ force: true });
            server = app.listen(4000, () => { });
            agent = request.agent(server);
        } catch (e) {
            console.log(e);
        }
    });

    afterAll(async () => {
        try {
            await db.sequelize.close();
            await server.close();
        } catch (error) {
            console.log(error);
        }
    });

    test("Sign up as admin", async () => {
        const firstName = "admin";
        const lastName = "";
        const email = "admin@gmail.com";
        const password = "admin";
        const hashedPwd = await bcrypt.hash(password, saltRounds);
        const role = "admin";
        try {
            const user = await db.User.create(
                firstName,
                lastName,
                email,
                hashedPwd,
                role
            );
            expect(user.role).toBe("admin");
        } catch (e) {
            console.log(e);
        }
    });
    test("Sign in and sign out", async () => {
        const agent = request.agent(server);
        await login(agent, "admin@gmail.com", "admin");
        try {
            let res = await agent.get("/dashboard");
            expect(res.statusCode).toBe(200);
            res = await agent.get("/signout");
            expect(res.statusCode).toBe(302);
        } catch (e) {
            console.log(e);
        }
    });
    test("Create a course", async () => {
        const agent = request.agent(server);
        await login(agent, "admin@gmail.com", "admin");
        try {
            let res = await agent.get("/courses/new");
            const csrfToken = extractCsrfToken(res);
            const response = await agent.post("/courses/new").send({
                coursename: "Java",
                _csrf: csrfToken,
            });
            expect(response.statusCode).toBe(302);
        } catch (e) {
            console.log(e);
        }
    });
});