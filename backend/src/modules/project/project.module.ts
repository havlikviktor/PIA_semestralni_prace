import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './entities/project.entity';
import { ProjectFeedbackEntity } from './entities/project-feedback.entity';
import { UserModule } from '../user/user.module';
import { FeedbackService } from './feedback.service';
import { EmailModule } from '../email/email.module';
import { ProjectMapper } from './project.mapper';
import { FeedbackMapper } from './feedback.mapper';
import { AuthModule } from '../auth/auth.module';
import { ProjectGateway } from './project.gateway';
import { ProjectRealtimeService } from './project-realtime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, ProjectFeedbackEntity]),
    UserModule,
    EmailModule,
    AuthModule,
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    FeedbackService,
    ProjectMapper,
    FeedbackMapper,
    ProjectGateway,
    ProjectRealtimeService,
  ],
  exports: [ProjectMapper],
})
export class ProjectModule {}
