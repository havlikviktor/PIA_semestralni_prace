import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '../../user/entities/translator-language.entity';

export class CreateProjectDto {
  @Type(() => Number)
  @IsNumber()
  customerId: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  translatorId?: number;
  @IsEnum(Language)
  languageCode: Language;
}
