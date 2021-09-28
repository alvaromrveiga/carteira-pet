import { Router } from "express";

import { CreateUserController } from "../../../../modules/users/useCases/createUser/CreateUserController";
import { DeleteUserController } from "../../../../modules/users/useCases/deleteUser/DeleteUserController";
import { LoginUserController } from "../../../../modules/users/useCases/loginUser/LoginUserController";
import { UserController } from "../../../../modules/users/useCases/UserController";
import { ensureAuthenticated } from "../middleware/ensureAuthenticated";
import { petsRoutes } from "./pets.routes";

const router = Router();
const userController = new UserController();

router.post("/signup", new CreateUserController().handle);
router.post("/login", new LoginUserController().handle);
router.post("/users/logout", ensureAuthenticated, userController.logOut);
router.post("/users/logout-all", ensureAuthenticated, userController.logOutAll);
router.get("/users/profile", ensureAuthenticated, userController.showSelf);
router.get("/users/:id", ensureAuthenticated, userController.show);
router.put("/users/profile", ensureAuthenticated, userController.update);

router.delete(
  "/users/profile",
  ensureAuthenticated,
  new DeleteUserController().handle
);

router.use(petsRoutes);

export { router };
