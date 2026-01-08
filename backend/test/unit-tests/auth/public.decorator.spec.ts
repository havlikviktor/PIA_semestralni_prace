import 'reflect-metadata';
import {
  IS_PUBLIC_KEY,
  Public,
} from '../../../src/modules/auth/public.decorator';

describe('Public decorator', () => {
  it('sets IS_PUBLIC_KEY metadata to true', () => {
    class TestController {
      @Public()
      handler() {
        return 'ok';
      }
    }

    const meta = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      TestController.prototype.handler,
    );
    expect(meta).toBe(true);
  });
});
