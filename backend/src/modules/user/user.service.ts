import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { EntityManager } from 'typeorm';
import { User, Role } from './entities/user.entity';
import {
  Language,
  TranslatorLanguage,
} from './entities/translator-language.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.entityManager.create(User, createUserDto);
    return this.entityManager.save(User, user);

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

  async signup(createUserDto: CreateUserDto) {
    const user = await this.create(createUserDto);
    const token = this.authService.signToken(user);
    return {
      user: {
        id: user.name,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.findByEmail(loginDto.email);
    if (!user || user.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.authService.signToken(user);
    return {
      user: {
        id: user.name,
        role: user.role,
      },
      accessToken: token,
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
      .andWhere('language.languageCode = :languageCode', { languageCode })
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
