import { UserEntity } from './user.entity';
import { JoinColumn, ManyToOne, Entity, PrimaryColumn } from 'typeorm';

export enum Language {
  ENGLISH = 'en',
  SPANISH = 'es',
  FRENCH = 'fr',
  GERMAN = 'de',
  ITALIAN = 'it',
  CHINESE = 'zh',
  JAPANESE = 'ja',
  RUSSIAN = 'ru',
  PORTUGUESE = 'pt',
  ARABIC = 'ar',
  HINDI = 'hi',
  BENGALI = 'bn',
  KOREAN = 'ko',
  TURKISH = 'tr',
  DUTCH = 'nl',
  SWEDISH = 'sv',
  POLISH = 'pl',
  DANISH = 'da',
  FINNISH = 'fi',
  NORWEGIAN = 'no',
  GREEK = 'el',
  CZECH = 'cs',
  HUNGARIAN = 'hu',
  ROMANIAN = 'ro',
  THAI = 'th',
  VIETNAMESE = 'vi',
  INDONESIAN = 'id',
  HEBREW = 'he',
  UKRAINIAN = 'uk',
  MALAY = 'ms',
  FILIPINO = 'tl',
  SWAHILI = 'sw',
}

@Entity()
export class TranslatorLanguage {
  @PrimaryColumn()
  translatorId: number;

  @ManyToOne(() => UserEntity, (user) => user.languages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'translatorId' })
  translator: UserEntity;

  @PrimaryColumn()
  languageCode: Language;

  constructor(translatorLanguage: Partial<TranslatorLanguage>) {
    Object.assign(this, translatorLanguage);
  }
}
