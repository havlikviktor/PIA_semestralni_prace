import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '../modules/user/entities/user.entity';
import { Language } from '../modules/user/entities/translator-language.entity';
import { EncryptionService } from '../modules/encryption/encryption.service';

export class UserDomain {
  id: number;
  name: string;
  email: string;
  password?: string | null;
  googleId?: string | null;
  role: Role;
  languages?: Language[];
  isNewUser?: boolean;

  /**
   * Creates a user domain object.
   *
   * @param init Optional partial initialization.
   */
  constructor(init?: Partial<UserDomain>) {
    Object.assign(this, init);
  }

  /**
   * Hashes and stores a password (when provided).
   */
  async setPassword(
    plain: string,
    encryptionService: EncryptionService,
  ): Promise<void> {
    if (plain) {
      this.password = await encryptionService.hash(plain);
    }
  }

  /**
   * Ensures this user has a password (i.e., not Google-only).
   *
   * @throws UnauthorizedException When the user has no password.
   */
  checkHasPassword(): void {
    if (!this.password) {
      throw new UnauthorizedException(
        'User registered via Google, no password set',
      );
    }
  }

  /**
   * Validates translator language requirements.
   *
   * @returns True when valid.
   * @throws ConflictException When translator has no languages.
   */
  validateLanguages(): boolean {
    if (this.isTranslator()) {
      if (!this.languages || this.languages.length === 0) {
        throw new ConflictException(
          `Languages must be provided for role ${Role.TRANSLATOR}`,
        );
      }
    }
    return true;
  }

  /**
   * @returns Whether this user is a translator.
   */
  isTranslator(): boolean {
    return this.role === Role.TRANSLATOR;
  }
}
