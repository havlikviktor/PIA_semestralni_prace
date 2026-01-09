import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  UnprocessableEntityException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly MAX_FILE_SIZE: number;

  constructor(private configService: ConfigService) {
    this.MAX_FILE_SIZE = this.configService.get<number>(
      'MAX_FILE_SIZE',
      5 * 1024 * 1024, // Default 5MB
    );
  }

  transform(value: Express.Multer.File, _metadata: ArgumentMetadata) {
    void _metadata;
    if (!value) {
      throw new UnprocessableEntityException({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'File to translation is required',
      });
    }

    if (value.size === 0) {
      throw new BadRequestException('File cannot be empty');
    }

    if (value.size > this.MAX_FILE_SIZE) {
      throw new UnprocessableEntityException({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `File is too large. Max size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }

    return value;
  }
}
