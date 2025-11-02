import { IsEnum } from "class-validator";
import { language } from "../entities/translatorLanguage.entity";

export class TranslatorLanguageDto {
    @IsEnum(language,  { message: (args) => `Language code ${args.value} is not valid.` })
    readonly languageCode: language; 
};