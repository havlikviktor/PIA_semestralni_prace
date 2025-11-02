import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslatorLanguage } from './entities/translatorLanguage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TranslatorLanguage])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
