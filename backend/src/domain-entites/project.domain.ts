import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ProjectState,
  ProjectStateOrder,
  FileType,
} from '../modules/project/entities/project.entity';
import { UserDomain } from './user.domain';
import { Language } from '../modules/user/entities/translator-language.entity';
import { Role } from '../modules/user/entities/user.entity';

import { FeedbackDomain } from './feedback.domain';

export type ProjectFileData = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

export class ProjectDomain {
  ProjectId: number;
  customer: UserDomain;
  translator?: UserDomain | null;
  languageCode: Language;
  fileName: string;
  originalFile: Buffer;
  translatedFile?: Buffer | null;
  state: ProjectState;
  createdAt: Date;
  feedback?: FeedbackDomain | null;
  hasTranslatedFile?: boolean;

  /**
   * Creates a project domain object.
   *
   * @param init Optional partial initialization.
   */
  constructor(init?: Partial<ProjectDomain>) {
    Object.assign(this, init);
  }

  /**
   * Adds the original file (binary + decoded filename) to this project.
   */
  addOriginalFile(file: Express.Multer.File): void {
    if (file) {
      this.originalFile = file.buffer;
      const originalName = Buffer.from(file.originalname, 'latin1').toString(
        'utf8',
      );
      this.fileName = originalName;
    }
  }

  /**
   * Assigns a customer to the project.
   *
   * @throws BadRequestException When customer is missing/invalid or already assigned.
   */
  addCustomer(customer: UserDomain): void {
    if (!customer) {
      throw new BadRequestException('Customer not provided');
    }
    if (
      customer.role !== Role.CUSTOMER &&
      customer.role !== Role.ADMINISTRATOR
    ) {
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

  /**
   * Ensures the given user can access this project.
   *
   * @throws ForbiddenException When the user does not have access.
   */
  checkAccess(userId: number, role: Role): void {
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

  /**
   * Ensures the given user can move the project to the provided state.
   *
   * @throws ForbiddenException When the user is not allowed.
   * @throws BadRequestException When the transition is invalid.
   */
  checkStateEditAccess(
    userId: number,
    role: Role,
    newState: ProjectState,
  ): void {
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

  planStateUpdate(newState: ProjectState): {
    deleteFeedback: boolean;
    deleteTranslatedFile: boolean;
    findNewTranslator: boolean;
  } {
    if (ProjectStateOrder[newState] > ProjectStateOrder[this.state]) {
      return {
        deleteFeedback: false,
        deleteTranslatedFile: false,
        findNewTranslator: this.translator == null,
      };
    }

    return {
      deleteFeedback:
        ProjectStateOrder[newState] <=
        ProjectStateOrder[ProjectState.COMPLETED],
      deleteTranslatedFile:
        ProjectStateOrder[newState] <= ProjectStateOrder[ProjectState.ASSIGNED],
      findNewTranslator:
        newState === ProjectState.CREATED || this.translator == null,
    };
  }

  /**
   * Validates translator-driven state changes.
   */
  private checkTranslatorStateEdit(newState: ProjectState): void {
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

  /**
   * Validates customer-driven state changes.
   */
  private checkCustomerStateEdit(newState: ProjectState): void {
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

  /**
   * Returns a file payload (buffer + metadata) for download.
   *
   * @throws NotFoundException When translated file is requested but missing.
   * @throws BadRequestException When file type is invalid.
   */
  getFile(fileType: FileType): ProjectFileData {
    let buffer: Buffer;

    if (fileType === FileType.TRANSLATED) {
      if (!this.translatedFile) {
        throw new NotFoundException(
          'File for project with ID ' +
            this.ProjectId +
            ' is not translated yet',
        );
      }
      buffer = this.translatedFile;
    } else if (fileType === FileType.ORIGINAL) {
      buffer = this.originalFile;
    } else {
      throw new BadRequestException('Invalid file type requested');
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

  /**
   * Ensures the given user may upload a translated file for this project.
   *
   * @throws ForbiddenException When not a translator.
   * @throws BadRequestException When project is not in ASSIGNED state.
   */
  canUploadTranslatedFile(userId: number, role: Role): void {
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
