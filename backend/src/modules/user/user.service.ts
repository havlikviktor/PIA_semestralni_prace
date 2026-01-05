import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, Role } from './entities/user.entity';
import { Language } from './entities/translator-language.entity';
import { LanguageService } from './language.service';
import { EncryptionService } from '../encryption/encryption.service';
import { UserDomain } from '../../domain-entites/user.domain';
import { UserMapper } from './user.mapper';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserInfoDto } from './dto/user-info.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly languageService: LanguageService,
    private readonly encryptionService: EncryptionService,
    private readonly userMapper: UserMapper,
  ) {}

  async create(userDomain: UserDomain): Promise<UserDomain> {
    const existingUser = await this.userRepository.findOne({
      where: { email: userDomain.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this Email already exists');
    }

    if (userDomain.password) {
      await userDomain.setPassword(userDomain.password, this.encryptionService);
    }

    const entity = this.userMapper.toEntity(userDomain);
    const savedUserEntity = await this.userRepository.save(entity);
    let newUserDomain = this.userMapper.toDomain(savedUserEntity);
    newUserDomain.isNewUser = true;
    return newUserDomain;
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
      return this.userMapper.toDomain(user);
    }

    const newUser = this.userRepository.create({
      googleId: id,
      email,
      name: displayName,
      role: Role.CUSTOMER,
      password: null,
    });

    const createdUser = await this.userRepository.save(newUser);
    let domainUser = this.userMapper.toDomain(createdUser);

    domainUser.isNewUser = true;
    return domainUser;
  }

  async findOne(id: number): Promise<UserDomain | null> {
    const user = await this.userRepository.findOneBy({ id });
    return user ? this.userMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserDomain | null> {
    const user = await this.userRepository.findOneBy({ email });
    return user ? this.userMapper.toDomain(user) : null;
  }

  async findCapableTranslator(
    languageCode: Language,
  ): Promise<UserDomain | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.languages', 'language')
      .leftJoin(
        'project',
        'project',
        'project.translatorId = user.id AND project.state = :state',
        { state: 'assigned' },
      )
      .where('user.role = :role', { role: Role.TRANSLATOR })
      .andWhere('language.languageCode = :languageCode', { languageCode })
      .groupBy('user.id')
      .addGroupBy('language.translatorId')
      .addGroupBy('language.languageCode')
      .orderBy('COUNT(project.ProjectId)', 'ASC')
      .getOne();

    return user ? this.userMapper.toDomain(user) : null;
  }

  async updateRole(
    id: number,
    updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<UserInfoDto> {
    let userDomain = new UserDomain({ id: id, ...updateUserRoleDto });

    if (userDomain.isTranslator()) {
      await this.languageService.updateTranslatorLanguages(userDomain);
    }

    await this.userRepository.update(id, { role: userDomain.role });

    const updatedUser = await this.findOne(id);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return this.userMapper.toDto(updatedUser);
  }
}
