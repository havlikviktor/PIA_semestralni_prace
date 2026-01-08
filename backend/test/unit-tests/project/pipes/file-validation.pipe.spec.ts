import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileValidationPipe } from '../../../../src/modules/project/pipes/file-validation.pipe';

describe('FileValidationPipe', () => {
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws UnprocessableEntityException when file missing', () => {
    (configService.get as any).mockReturnValue(5 * 1024 * 1024);
    const pipe = new FileValidationPipe(configService);

    expect(() => pipe.transform(undefined as any, {} as any)).toThrow(
      UnprocessableEntityException,
    );
  });

  it('throws BadRequestException when file is empty', () => {
    (configService.get as any).mockReturnValue(5 * 1024 * 1024);
    const pipe = new FileValidationPipe(configService);

    expect(() => pipe.transform({ size: 0 } as any, {} as any)).toThrow(
      BadRequestException,
    );
  });

  it('throws UnprocessableEntityException when file too large', () => {
    (configService.get as any).mockReturnValue(10);
    const pipe = new FileValidationPipe(configService);

    expect(() => pipe.transform({ size: 11 } as any, {} as any)).toThrow(
      UnprocessableEntityException,
    );
  });

  it('returns file when valid', () => {
    (configService.get as any).mockReturnValue(10);
    const pipe = new FileValidationPipe(configService);

    const file = { size: 5 } as any;
    expect(pipe.transform(file, {} as any)).toBe(file);
  });
});
