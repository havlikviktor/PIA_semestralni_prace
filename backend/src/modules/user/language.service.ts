import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranslatorLanguage } from './entities/translator-language.entity';
import { TranslatorLanguageDto } from './dto/translator-language.dto';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(TranslatorLanguage)
    private readonly languageRepository: Repository<TranslatorLanguage>,
  ) {}

  async updateTranslatorLanguages(
    translatorId: number,
    languages: TranslatorLanguageDto[],
  ) {
    await this.languageRepository.delete({
      translator: { id: translatorId },
    });

    if (languages.length > 0) {
      const newLanguages = languages.map((lang) =>
        this.languageRepository.create({
          translator: { id: translatorId },
          languageCode: lang.languageCode,
        }),
      );
      await this.languageRepository.save(newLanguages);
    }
  }
}
