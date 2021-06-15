import request from "supertest";
import { Connection } from "typeorm";
import { app } from "../src/app";
import { UsersRepository } from "../src/controllers/repositories/UsersRepository";
import { resetDatabase, saveUser, userOne, connect } from "./fixtures/users";
import UUID_RegExp from "./fixtures/UUID_Regex";
import { User } from "../src/models/User";

let connection: Connection;
let usersRepository: UsersRepository;

beforeAll(async () => {
  ({ connection, usersRepository } = await connect());
});

afterAll(async () => {
  await connection.close();
  expect(connection.isConnected).toBe(false);
});

describe("Connection", () => {
  it("Should connect to Database", () => {
    expect(connection.isConnected).toBe(true);
  });
});

describe("Users", () => {
  beforeEach(async () => {
    await resetDatabase();
    await saveUser(userOne);
  });

  describe("Create", () => {
    it("Should create new user", async () => {
      await request(app)
        .post("/users")
        .send({
          name: "notEqualUserOne",
          email: "notEqualUserOne@test.com",
          password: "tester-pass",
        })
        .expect(201);

      const user =
        (await usersRepository.findOne({
          email: "notEqualUserOne@test.com",
        })) || new User();

      expect(user.id).toMatch(UUID_RegExp.UUID_RegExp);

      expect(user).toMatchObject({
        name: "notEqualUserOne",
        email: "notEqualUserOne@test.com",
      });
      expect(user.password).not.toEqual("tester-pass");
      expect(user).toHaveProperty("created_at");

      const allUsers = await usersRepository.find();
      expect(allUsers.length).toEqual(2);
    });

    it("Should not create user with email already in use", async () => {
      await request(app)
        .post("/users")
        .send({
          email: userOne.email,
          password: "DoesNotMatter",
        })
        .expect(400);

      const usersWithEmail = await usersRepository.find({
        email: userOne.email,
      });

      expect(usersWithEmail.length).toEqual(1);
    });

    it("Should not create user with invalid password", async () => {
      await request(app)
        .post("/users")
        .send({
          email: "notUserOneEmail@test.com",
          password: "123",
        })
        .expect(400);
    });

    it("Should not save password as plain text", async () => {
      await request(app)
        .post("/users")
        .send({
          email: "noUser@test.com",
          password: "shouldNotBePlainText",
        })
        .expect(201);

      const user = await usersRepository.findOne({
        email: "noUser@test.com",
      });

      expect(user?.password).not.toEqual("shouldNotBePlainText");
    });

    it("Should not response user password", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          name: "Tester",
          email: "test@test.com",
          password: "StroNg_@Pa$$woRd:)",
        })
        .expect(201);

      expect(Object.keys(response.body)).not.toContain("password");
    });
  });

  describe("Show", () => {
    it("Should show public user information", async () => {
      const response = await request(app)
        .get(`/users/${userOne.id}`)
        .set("Authorization", `Bearer ${userOne.tokens[0]}`)
        .send()
        .expect(200);

      expect(Object.keys(response.body)).not.toContain("password");
      expect(Object.keys(response.body)).not.toContain("id");
      expect(Object.keys(response.body)).not.toContain("email");
      expect(Object.keys(response.body)).not.toContain("tokens");
    });

    it("Should not show public user information if not authenticated", async () => {
      await request(app).get(`/users/${userOne.id}`).send().expect(401);
    });
  });
});
