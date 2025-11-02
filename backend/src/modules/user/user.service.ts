import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EntityManager } from 'typeorm';
import { User, Role } from './entities/user.entity';
import { TranslatorLanguage } from './entities/translatorLanguage.entity';
@Injectable()
export class UserService {
  constructor(
    private readonly entityManager: EntityManager) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.entityManager.create(User, createUserDto);
    await this.entityManager.save(User ,user);

    // if (createUserDto.languages?.length) {
    //   const languages = createUserDto.languages.map(langDto =>
    //     this.entityManager.create(TranslatorLanguage, {
    //       languageCode: langDto.languageCode,
    //       translatorId: savedUser.id,
    //       translator: savedUser,
    //     }),
    //   );
    //   await this.entityManager.save(languages);
    //   savedUser.languages = languages;
    // }
  }

async findByRole(role?: Role) {
  if (role) {
    if (role == Role.TRANSLATOR) {
    return this.entityManager.find(User ,{ where: { role }, relations: ['languages'] });
    }
    return this.entityManager.find(User ,{ where: { role } });
  }
    return this.entityManager.find(User);
  }

  findOne(id: number) {
    return this.entityManager.findOneBy(User ,{id});
  }

async update(id: number, updateUserDto: UpdateUserDto) {
    const { languages, ...userFields } = updateUserDto;
    if(Object.keys(userFields).length > 0) {
      await this.entityManager.update(User, id, userFields);
    }

    if (languages && languages.length) {
      await this.entityManager.delete(TranslatorLanguage, { translator: { id } });

      const newLanguages = languages.map(lang =>
        this.entityManager.create(TranslatorLanguage, {
          translator: { id },
          languageCode: lang.languageCode,
        }),
      );
    await this.entityManager.save(newLanguages);
    }
}

remove(id: number) {
    return this.entityManager.delete(User, id);
  }
}
