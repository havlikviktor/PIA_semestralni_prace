import { Language } from '../entities/translator-language.entity';
import { IsEnum, IsOptional, ArrayNotEmpty } from 'class-validator';
import { Role } from '../entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'The new role of the user',
    enum: Role,
    example: Role.TRANSLATOR,
  })
  @IsEnum(Role)
  readonly role: Role;

  @ApiPropertyOptional({
    description: 'List of languages for translator role',
    enum: Language,
    isArray: true,
    example: [Language.ENGLISH, Language.CZECH],
  })
  @IsOptional()
  @ArrayNotEmpty()
  @IsEnum(Language, {
    each: true,
    message: (args) => `Language code ${args.value} is not valid.`,
  })
  readonly languages?: Language[];
}
