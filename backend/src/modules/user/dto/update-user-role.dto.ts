import { PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserRoleDto extends PickType(CreateUserDto, [
  'role',
  'languages',
] as const) {}
