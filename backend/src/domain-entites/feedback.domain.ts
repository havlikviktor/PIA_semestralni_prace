import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectState } from '../modules/project/entities/project.entity';
import { Role } from '../modules/user/entities/user.entity';
import { ProjectDomain } from './project.domain';

export class FeedbackDomain {
  projectId: number;
  text: string;
  createdAt: Date;

  constructor(init?: Partial<FeedbackDomain>) {
    Object.assign(this, init);
  }

  checkCreateAccess(project: ProjectDomain, userId: number, role: Role) {
    if (role === Role.ADMINISTRATOR) {
      return;
    }

    project.checkAccess(userId, role);

    if (role === Role.CUSTOMER) {
      if (
        project.state !== ProjectState.APPROVED &&
        project.state !== ProjectState.REJECTED
      ) {
        throw new BadRequestException(
          `Project state must be in state APPROVED or REJECTED to create feedback`,
        );
      }
    } else {
      throw new ForbiddenException(
        `Only administrators and customers can update project feedback`,
      );
    }
  }
}
