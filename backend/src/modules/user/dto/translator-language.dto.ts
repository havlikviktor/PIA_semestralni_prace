import { IsEnum } from 'class-validator';
import { Language } from '../entities/translator-language.entity';

export class TranslatorLanguageDto {
  @IsEnum(Language, {
    message: (args) => `Language code ${args.value} is not valid.`,
  })
  readonly languageCode: Language;
}
