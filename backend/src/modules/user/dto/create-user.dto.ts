import { IsEmail, IsEnum, IsNotEmpty,IsOptional, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../entities/user.entity';
import { TranslatorLanguageDto } from './translatorLanguage.dto';

export class CreateUserDto {
    @IsNotEmpty()
    readonly name: string;
    @IsNotEmpty()
    readonly password: string;
    @IsEmail()
    readonly email: string;
    @IsEnum(Role)
    role: Role;

    @IsOptional()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => TranslatorLanguageDto)
    languages?: TranslatorLanguageDto[];
}
