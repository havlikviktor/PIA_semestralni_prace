import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '../../user/entities/translator-language.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: 'The ID of the customer creating the project',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  customerId: number;

  @ApiProperty({
    description: 'The target language code',
    enum: Language,
    example: Language.ENGLISH,
  })
  @IsEnum(Language)
  languageCode: Language;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The original file to be translated',
  })
  originalFile: unknown;
}
