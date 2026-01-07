import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ProjectState,
  FileType,
} from '../modules/project/entities/project.entity';
import { UserDomain } from './user.domain';
import { Language } from '../modules/user/entities/translator-language.entity';
import { Role } from '../modules/user/entities/user.entity';

import { FeedbackDomain } from './feedback.domain';

export class ProjectDomain {
  ProjectId: number;
  customer: UserDomain;
  translator?: UserDomain;
  languageCode: Language;
  fileName: string;
  originalFile: Buffer;
  translatedFile?: Buffer;
  fileSuffix: string;
  state: ProjectState;
  createdAt: Date;
  feedback?: FeedbackDomain;
  hasTranslatedFile?: boolean;

  constructor(init?: Partial<ProjectDomain>) {
    Object.assign(this, init);
  }

  addOriginalFile(file: Express.Multer.File) {
    if (file) {
      this.originalFile = file.buffer;
      const originalName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      this.fileName = originalName;
      this.fileSuffix = originalName.substring(originalName.lastIndexOf('.'));
    }
  }

  addCustomer(customer: UserDomain) {
    if (!customer) {
      throw new BadRequestException('Customer not provided');
    }
    if (customer.role !== Role.CUSTOMER) {
      throw new BadRequestException(
        `User with ID ${customer.id} is not a customer`,
      );
    }
    if (this.customer) {
      throw new BadRequestException(
        'Customer is already assigned to this project',
      );
    }

    this.customer = customer;
  }

  checkAccess(userId: number, role: Role) {
    if (role === Role.ADMINISTRATOR) {
      return;
    }
    if (role === Role.CUSTOMER && this.customer.id !== userId) {
      throw new ForbiddenException(
        `You do not have access to this project as a customer`,
      );
    }
    if (role === Role.TRANSLATOR && this.translator?.id !== userId) {
      throw new ForbiddenException(
        `You do not have access to this project as a translator`,
      );
    }
  }

  checkStateEditAccess(userId: number, role: Role, newState: ProjectState) {
    if (role === Role.ADMINISTRATOR) {
      return;
    }

    this.checkAccess(userId, role);

    if (role === Role.TRANSLATOR) {
      this.checkTranslatorStateEdit(newState);
    } else if (role === Role.CUSTOMER) {
      this.checkCustomerStateEdit(newState);
    }

    if (
      newState !== ProjectState.CREATED &&
      newState !== ProjectState.ASSIGNED
    ) {
      if (!this.hasTranslatedFile && !this.translatedFile) {
        throw new BadRequestException(
          `Cannot update project into new state ${newState} without translated file`,
        );
      }
    }
  }

  private checkTranslatorStateEdit(newState: ProjectState) {
    if (this.state !== ProjectState.ASSIGNED) {
      throw new BadRequestException(
        `Project state must be in state ASSIGNED to update`,
      );
    } else if (newState !== ProjectState.COMPLETED) {
      throw new BadRequestException(
        `Translator can only update project state to COMPLETED`,
      );
    }
  }

  private checkCustomerStateEdit(newState: ProjectState) {
    if (this.state !== ProjectState.COMPLETED) {
      throw new BadRequestException(
        `Project state must be in state COMPLETED to update`,
      );
    } else if (
      newState !== ProjectState.REJECTED &&
      newState !== ProjectState.APPROVED
    ) {
      throw new BadRequestException(
        `Customer can only update project state to REJECTED or APPROVED`,
      );
    }
  }

  getFile(fileType: FileType) {
    let buffer: Buffer | undefined;

    if (fileType === FileType.TRANSLATED) {
      if (!this.translatedFile) {
        throw new NotFoundException(
          `File for project with ID ${this.ProjectId} is not translated yet`,
        );
      }
      buffer = this.translatedFile;
    } else if (fileType === FileType.ORIGINAL) {
      buffer = this.originalFile;
    } else {
      throw new BadRequestException(`Invalid file type requested: ${fileType}`);
    }

    return {
      buffer,
      filename:
        fileType === FileType.TRANSLATED
          ? `translated_${this.fileName}`
          : this.fileName,
      mimeType: 'application/octet-stream',
    };
  }

  canUploadTranslatedFile(userId: number, role: Role) {
    this.checkAccess(userId, role);

    if (role !== Role.TRANSLATOR) {
      throw new ForbiddenException(
        'Only translators can upload translated files',
      );
    }

    if (this.state !== ProjectState.ASSIGNED) {
      throw new BadRequestException(
        'Project must be in ASSIGNED state to upload translated file',
      );
    }
  }
}
