import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

type ClassConstructor = new (...args: unknown[]) => unknown;

// Pipe to transform multipart/form-data into DTO and validate according to decorators
// before being sent to the server when creating a new project
@Injectable()
export class MultipartValidationPipe implements PipeTransform {
  /**
   * Transforms multipart/form-data payload into a DTO instance and validates it.
   */
  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const metatype = metadata.metatype as ClassConstructor | undefined;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const instance = plainToInstance(
      metatype,
      value as Record<string, unknown>,
    );
    if (!instance || typeof instance !== 'object') {
      return value;
    }

    const errors = await validate(instance);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return instance;
  }

  private toValidate(metatype: ClassConstructor): boolean {
    const types = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ] as unknown as ClassConstructor[];
    return !types.includes(metatype);
  }
}
