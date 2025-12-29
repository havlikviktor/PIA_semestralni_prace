import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';


@Module({
  imports: [
    ConfigModule.forRoot({isGlobal : true, envFilePath: '../.env'}),
    DatabaseModule,
    UserModule,
    ProjectModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
