import { Language } from '../entities/translator-language.entity';
import { IsEnum, IsOptional, ArrayNotEmpty } from 'class-validator';
import { Role } from '../entities/user.entity';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  readonly role: Role;

  @IsOptional()
  @ArrayNotEmpty()
  @IsEnum(Language, { each: true, message: (args) => `Language code ${args.value} is not valid.` })
  readonly languages?: Language[];
}