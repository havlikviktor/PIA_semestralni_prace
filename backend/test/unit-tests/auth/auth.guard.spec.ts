import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../../src/modules/auth/auth.guard';

// We mock AuthGuard('jwt') from @nestjs/passport so we can control super.canActivate
jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    class MockAuthGuard {
      canActivate() {
        return 'super-result';
      }
    }
    return MockAuthGuard;
  },
}));

describe('JwtAuthGuard', () => {
  const makeContext = () =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  it('returns true when route is public', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true as any);

    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(makeContext())).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });

  it('delegates to super.canActivate when not public', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false as any);

    const guard = new JwtAuthGuard(reflector);

    const res = guard.canActivate(makeContext());

    expect(res).toBe('super-result');
    expect(reflector.getAllAndOverride).toHaveBeenCalled();
  });
});
