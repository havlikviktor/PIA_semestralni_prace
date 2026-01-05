import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { LanguageService } from './language.service';
import { UserController } from './user.controller';
import { UserEntity } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslatorLanguage } from './entities/translator-language.entity';
import { AuthModule } from '../auth/auth.module';
import { UserMapper } from './user.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TranslatorLanguage]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, LanguageService, UserMapper],
  exports: [UserService, UserMapper],
})
export class UserModule {}
