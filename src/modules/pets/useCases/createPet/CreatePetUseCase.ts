import { inject, injectable } from "tsyringe";

import { ErrorWithStatus } from "../../../../utils/ErrorWithStatus";
import { getValidatedUser } from "../../../../utils/getValidatedUser";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { ICreatePetDTO } from "../../dtos/ICreatePetDTO";
import { Pet } from "../../infra/typeorm/entities/Pet";
import { IPetsRepository } from "../../repositories/IPetsRepository";

@injectable()
export class CreatePetUseCase {
  constructor(
    @inject("PetsRepository")
    private petsRepository: IPetsRepository,

    @inject("UsersRepository")
    private usersRepository: IUsersRepository
  ) {}

  async execute(data: ICreatePetDTO): Promise<Pet> {
    await this.validateCredentials(data);

    const pet = await this.petsRepository.createAndSave(data);

    return pet;
  }

  private async validateCredentials(data: ICreatePetDTO): Promise<void> {
    await getValidatedUser(data.user_id, this.usersRepository);

    await this.validatePetName(data.name);

    this.validateSpecies(data.species);
  }

  private async validatePetName(name: string): Promise<void> {
    if (!name) {
      throw new ErrorWithStatus(400, "Invalid pet name");
    }
  }

  private validateSpecies(species: string): void {
    if (!species) {
      throw new ErrorWithStatus(400, "Please choose your pet species!");
    }
  }
}
