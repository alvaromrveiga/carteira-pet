import { Connection } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import createConnection from "../../src/connection";
import { UsersRepository } from "../../src/controllers/repositories/UsersRepository";
import { generateAuthToken } from "../../src/middleware/authentication";
import { User } from "../../src/models/User";

let connection: Connection;
let usersRepository: UsersRepository;

const connect = async () => {
  if (!connection) {
    connection = await createConnection();
    await connection.runMigrations();

    usersRepository = UsersRepository.instance;
    createUsers();
  }

  return { connection, usersRepository };
};

const resetDatabase = async () => {
  const allUsers = await usersRepository.find();
  await usersRepository.remove(allUsers);
};

const saveUser = async (user: User) => {
  await usersRepository.save(user);
};

let userOne: User;
let userTwo: User;

const createUsers = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("No JWT_SECRET defined on .env");
  }

  const userOneId = uuidv4();
  userOne = usersRepository.create({
    id: userOneId,
    name: "userOne",
    email: "userOne@test.com",
    password: "userOne-password",
  });
  generateAuthToken(userOne);

  const userTwoId = uuidv4();
  userTwo = usersRepository.create({
    id: userTwoId,
    name: "userTwo",
    email: "userTwo@test.com",
    password: "userTwo-password",
  });
  generateAuthToken(userTwo);
};

export { resetDatabase, saveUser, userOne, userTwo, connect };
