import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User, Role } from './entities/user.entity';
import { Language } from './entities/translator-language.entity';
import { LanguageService } from './language.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly languageService: LanguageService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this Email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findOrCreateGoogleUser(profile: any) {
    const { id, emails, displayName } = profile;
    const email = emails[0].value;

    let user = await this.userRepository.findOne({
      where: [{ googleId: id }, { email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = id;
        await this.userRepository.save(user);
      }
      return user;
    }

    user = this.userRepository.create({
      googleId: id,
      email,
      name: displayName,
      role: Role.CUSTOMER,
      password: null,
    });

    const createdUser = await this.userRepository.save(user);
    return {
      ...createdUser,
      newUser: true,
    };
  }

  async findByRole(role?: Role) {
    if (role) {
      if (role == Role.TRANSLATOR) {
        return this.userRepository.find({
          where: { role },
          relations: ['languages'],
        });
      }
      return this.userRepository.find({ where: { role } });
    }
    return this.userRepository.find();
  }

  findOne(id: number) {
    return this.userRepository.findOneBy({ id });
  }

  findByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  async findTranslator(id: number) {
    return this.userRepository.findOne({
      where: { id, role: Role.TRANSLATOR },
      relations: ['languages'],
    });
  }

  async findCapableTranslator(languageCode: Language) {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.languages', 'language')
      .where('user.role = :role', { role: Role.TRANSLATOR })
      .andWhere('language.languageCode = :languageCode', { languageCode })
      .getMany();
  }

  async updateRole(id: number, updateUserRoleDto: UpdateUserRoleDto) {
    const { role, languages } = updateUserRoleDto;

    if (role) {
      await this.userRepository.update(id, { role });
    }

    if (role === Role.TRANSLATOR) {
      if (!languages) {
        throw new ConflictException(
          'Languages must be provided when setting role to TRANSLATOR',
        );
      }
      await this.languageService.updateTranslatorLanguages(id, languages);
    }
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }
}
