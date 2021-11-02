import dayjs from "dayjs";
import { inject, injectable } from "tsyringe";
import { v4 as uuidv4 } from "uuid";

import { resetPasswordTokenExpiresInHours } from "../../../../config/auth";
import { IMailProvider } from "../../../../shared/container/providers/MailProvider/IMailProvider";
import { User } from "../../infra/typeorm/entities/User";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { IUsersTokensRepository } from "../../repositories/IUsersTokensRepository";
import { UserNotFoundError } from "../showPublicUser/errors/UserNotFoundError";
import { NoHostnameError } from "./errors/NoHostnameError";

@injectable()
export class ForgotPasswordEmailUseCase {
  constructor(
    @inject("UsersRepository")
    private usersRepository: IUsersRepository,

    @inject("UsersTokensRepository")
    private usersTokensRepository: IUsersTokensRepository,

    @inject("MailProvider")
    private mailProvider: IMailProvider
  ) {}

  async execute(email: string, hostname?: string): Promise<void> {
    const user = await this.getValidatedUser(email);

    const token = await this.getGeneratedToken(user.id);

    await this.sendEmail(user, token, hostname);
  }

  async getValidatedUser(email: string): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  async getGeneratedToken(userId: string): Promise<string> {
    const token = uuidv4();

    const expiration_date = dayjs()
      .add(resetPasswordTokenExpiresInHours, "hour")
      .toDate();

    await this.usersTokensRepository.createAndSave({
      user_id: userId,
      refresh_token: token,
      expiration_date,
    });

    return token;
  }

  async sendEmail(user: User, token: string, hostname?: string): Promise<void> {
    if (!hostname) {
      throw new NoHostnameError();
    }

    const resetPasswordLink = `${hostname}/password/reset?token=${token}`;

    await this.mailProvider.sendMail({
      to: user.email,
      subject: "Reset password",
      text: `Hello ${user.name}, here is the link to reset your password: ${resetPasswordLink}`,
      html: `<p>Hello ${user.name}, here is the link to reset your password: ${resetPasswordLink}</p>`,
    });
  }
}