import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectState } from '../modules/project/entities/project.entity';
import { Role } from '../modules/user/entities/user.entity';
import { ProjectDomain } from './project.domain';

export class FeedbackDomain {
  projectId: number;
  text: string;
  createdAt: Date;

  /**
   * Creates a feedback domain object.
   *
   * @param init Optional partial initialization.
   */
  constructor(init?: Partial<FeedbackDomain>) {
    Object.assign(this, init);
  }

  /**
   * Ensures the given user is allowed to create feedback for the given project.
   *
   * Rules:
   * - Administrators can always create feedback.
   * - Customers can create feedback only when the project is APPROVED or REJECTED.
   * - Translators cannot create feedback.
   *
   * @throws BadRequestException When the project state does not allow feedback.
   * @throws ForbiddenException When the user role is not allowed.
   */
  checkCreateAccess(project: ProjectDomain, userId: number, role: Role): void {
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
