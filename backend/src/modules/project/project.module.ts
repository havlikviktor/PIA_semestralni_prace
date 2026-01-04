import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectFeedback } from './entities/project-feedback.entity';
import { UserModule } from '../user/user.module';
import { FeedbackService } from './feedback.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectFeedback]),
    UserModule,
    EmailModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, FeedbackService],
})
export class ProjectModule {}
