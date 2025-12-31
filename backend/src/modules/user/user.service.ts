import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EntityManager } from 'typeorm';
import { User, Role } from './entities/user.entity';
import {
  Language,
  TranslatorLanguage,
} from './entities/translator-language.entity';

@Injectable()
export class UserService {
  constructor(private readonly entityManager: EntityManager) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.entityManager.findOne(User, {
      where: { email: createUserDto.email },
    });

    if (existingUser) {
    throw new ConflictException('User with this Email already exists');
    }

    const user = this.entityManager.create(User, createUserDto);
    return this.entityManager.save(User, user);
  }

  async findOrCreateGoogleUser(profile: any) {
    const { id, emails, displayName } = profile;
    const email = emails[0].value;

    let user = await this.entityManager.findOne(User, {
      where: [{ googleId: id }, { email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = id;
        await this.entityManager.save(User, user);
      }
      return user;
    }

    user = this.entityManager.create(User, {
      googleId: id,
      email,
      name: displayName,
      role: Role.CUSTOMER,
      password: null,
    });

    const createdUser = await this.entityManager.save(User, user);
    return {
    ...createdUser,
    newUser: true,
    };
  }

  async findByRole(role?: Role) {
    if (role) {
      if (role == Role.TRANSLATOR) {
        return this.entityManager.find(User, {
          where: { role },
          relations: ['languages'],
        });
      }
      return this.entityManager.find(User, { where: { role } });
    }
    return this.entityManager.find(User);
  }

  findOne(id: number) {
    return this.entityManager.findOneBy(User, { id });
  }

  findByEmail(email: string) {
    return this.entityManager.findOneBy(User, { email });
  }

  async findTranslator(id: number) {
    return this.entityManager.findOne(User, {
      where: { id, role: Role.TRANSLATOR },
      relations: ['languages'],
    });
  }

  async findCapableTranslator(languageCode: Language) {
    return this.entityManager
      .createQueryBuilder(User, 'user')
      .innerJoinAndSelect('user.languages', 'language')
      .where('user.role = :role', { role: Role.TRANSLATOR })
      .andWhere('language.languageCode = :languageCode', { languageCode });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { languages, ...userFields } = updateUserDto;
    if (Object.keys(userFields).length > 0) {
      await this.entityManager.update(User, id, userFields);
    }

    if (languages && languages.length) {
      await this.entityManager.delete(TranslatorLanguage, {
        translator: { id },
      });

      const newLanguages = languages.map((lang) =>
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
