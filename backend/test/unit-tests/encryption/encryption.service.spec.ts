import * as bcrypt from 'bcrypt';
import { EncryptionService } from '../../../src/modules/encryption/encryption.service';

jest.mock('bcrypt');

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EncryptionService();
  });

  it('hash delegates to bcrypt.hash with salt rounds', async () => {
    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed');

    const res = await service.hash('plain');

    expect(res).toBe('hashed');
    expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
  });

  it('compare delegates to bcrypt.compare', async () => {
    (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(true);

    const res = await service.compare('plain', 'enc');

    expect(res).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'enc');
  });
});
