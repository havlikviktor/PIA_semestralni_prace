import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty()
    readonly name: string;
    @IsNotEmpty()
    readonly password: string;
    @IsEmail()
    readonly email: string;
}
