import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PostgresErrorCode } from '../../database/postgres-error-codes.enum';

@Injectable()
export class EmailExistsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error?.code === PostgresErrorCode.UniqueViolation) {
          throw new ConflictException('Email already exists');
        }
        throw error;
      }),
    );
  }
}
