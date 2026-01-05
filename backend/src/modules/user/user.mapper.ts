import { Injectable } from '@nestjs/common';
import { UserDomain } from '../../domain-entites/user.domain';
import { Role, UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { TranslatorLanguage } from './entities/translator-language.entity';
import { UserInfoDto } from './dto/user-info.dto';

@Injectable()
export class UserMapper {
  toDomain(entity: UserEntity): UserDomain {
    const domain = new UserDomain({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      password: entity.password,
      googleId: entity.googleId,
      role: entity.role,
    });

    if (entity.languages) {
      domain.languages = entity.languages.map((l) => l.languageCode);
    }

    return domain;
  }

  toEntity(domain: UserDomain): UserEntity {
    const entity = new UserEntity({});
    entity.id = domain.id;
    entity.name = domain.name;
    entity.email = domain.email;
    entity.password = domain.password || null;
    entity.googleId = domain.googleId || null;
    entity.role = domain.role;

    if (domain.languages) {
      entity.languages = domain.languages.map((code) => {
        const lang = new TranslatorLanguage({});
        lang.languageCode = code;
        lang.translator = entity;
        return lang;
      });
    }

    return entity;
  }

  toDomainFromCreateDto(dto: CreateUserDto): UserDomain {
    const domain = new UserDomain({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: Role.CUSTOMER,
    });

    return domain;
  }

  toDto(domain: UserDomain): UserInfoDto {
    return {
      id: domain.id,
      name: domain.name,
      role: domain.role,
      email: domain.email,
      isNewUser: domain.isNewUser ?? false,
    };
  }
}
