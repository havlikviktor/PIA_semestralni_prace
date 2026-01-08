import { BadRequestException } from '@nestjs/common';
import { MultipartValidationPipe } from '../../../src/pipes/multipart-validation.pipe';

describe('MultipartValidationPipe', () => {
  let pipe: MultipartValidationPipe;

  beforeEach(() => {
    pipe = new MultipartValidationPipe();
  });

  it('returns value unchanged when metatype is missing', async () => {
    const res = await pipe.transform({ a: 1 }, { metatype: undefined } as any);
    expect(res).toEqual({ a: 1 });
  });

  it('returns value unchanged for primitive metatype', async () => {
    const res = await pipe.transform('x', { metatype: String } as any);
    expect(res).toBe('x');
  });

  it('throws BadRequestException when validation fails', async () => {
    class Dto {
      // no decorators; class-validator should allow by default, so we force fail by passing metatype and bad shape
    }

    // class-validator on an empty class returns [], so easiest is to just assert that it DOES NOT throw.
    // Instead, we validate behavior by using a DTO with required decorators would require changing app DTOs.
    // We'll simulate by passing a metatype and then spying on validate to return errors.

    const cv = await import('class-validator');
    const spy = jest
      .spyOn(cv, 'validate' as any)
      .mockResolvedValueOnce([{}] as any);

    await expect(
      pipe.transform({ a: 1 }, { metatype: Dto } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    spy.mockRestore();
  });

  it('returns class instance when valid', async () => {
    class Dto {
      a!: number;
    }

    const cv = await import('class-validator');
    const spy = jest
      .spyOn(cv, 'validate' as any)
      .mockResolvedValueOnce([] as any);

    const res = await pipe.transform({ a: 1 }, { metatype: Dto } as any);

    expect(res).toBeInstanceOf(Dto);
    expect((res as any).a).toBe(1);

    spy.mockRestore();
  });
});
