import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranslatorLanguage } from './entities/translator-language.entity';
import { UserDomain } from 'src/domain-entites/user.domain';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(TranslatorLanguage)
    private readonly languageRepository: Repository<TranslatorLanguage>,
  ) {}

  async updateTranslatorLanguages(userDomain: UserDomain) {
    if (userDomain.isTranslator() && userDomain.validateLanguages()) {
      await this.languageRepository.delete({
        translator: { id: userDomain.id },
      });

      const newLanguages = userDomain.languages!.map((lang) =>
        this.languageRepository.create({
          translator: { id: userDomain.id },
          languageCode: lang,
        }),
      );
      await this.languageRepository.save(newLanguages);
    }
  }
}
