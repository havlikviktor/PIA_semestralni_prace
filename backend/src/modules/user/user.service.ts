import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User, Role } from './entities/user.entity';
import { Language } from './entities/translator-language.entity';
import { LanguageService } from './language.service';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly languageService: LanguageService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this Email already exists');
    }

    const hashedPassword = await this.encryptionService.hash(
      createUserDto.password,
    );
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
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
      .leftJoin(
        'project',
        'project',
        'project.translatorId = user.id AND project.state = :state',
        { state: 'assigned' },
      )
      .where('user.role = :role', { role: Role.TRANSLATOR }) // not needed in make case becase inner join selects only translators but just to be sure
      .andWhere('language.languageCode = :languageCode', { languageCode })
      .groupBy('user.id')
      .addGroupBy('language.translatorId')
      .addGroupBy('language.languageCode')
      .orderBy('COUNT(project.ProjectId)', 'ASC')
      .getOne();
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
