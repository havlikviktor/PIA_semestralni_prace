import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { LanguageService } from './language.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslatorLanguage } from './entities/translator-language.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TranslatorLanguage]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, LanguageService],
  exports: [UserService],
})
export class UserModule {}
