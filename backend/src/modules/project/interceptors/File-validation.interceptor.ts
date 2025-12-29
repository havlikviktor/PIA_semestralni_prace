import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  private readonly MAX_FILE_SIZE: number;

  constructor(private configService: ConfigService) {
    this.MAX_FILE_SIZE = this.configService.get<number>(
      'MAX_FILE_SIZE',
      5 * 1024 * 1024,  // Default 5MB
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file: Express.Multer.File | undefined = request.file;

    if (!file) {
      throw new UnprocessableEntityException({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'File to translation is required',
      });
    }

    if (file.size === 0) {
      throw new BadRequestException('File cannot be empty');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new UnprocessableEntityException({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `File is too large. Max size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      });
    }

    return next.handle();
  }
}
