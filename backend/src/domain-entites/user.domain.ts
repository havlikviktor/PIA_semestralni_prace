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

  constructor(init?: Partial<UserDomain>) {
    Object.assign(this, init);
  }

  async setPassword(plain: string, encryptionService: EncryptionService) {
    if (plain) {
      this.password = await encryptionService.hash(plain);
    }
  }

  checkHasPassword() {
    if (!this.password) {
      throw new UnauthorizedException(
        'User registered via Google, no password set',
      );
    }
  }

  validateLanguages() {
    if (this.isTranslator()) {
      if (!this.languages || this.languages.length === 0) {
        throw new ConflictException(
          `Languages must be provided for role ${Role.TRANSLATOR}`,
        );
      }
    }
    return true;
  }

  isTranslator(): boolean {
    return this.role === Role.TRANSLATOR;
  }
}
