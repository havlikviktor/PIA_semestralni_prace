import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ description: 'The ID of the user', example: 1 })
  readonly id: number;

  @ApiProperty({ description: 'The name of the user', example: 'John Doe' })
  readonly name: string;

  @ApiProperty({ description: 'The role of the user', example: 'customer' })
  readonly role: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  readonly email: string;

  @ApiProperty({
    description: 'Flag indicating if the user is new',
    example: false,
  })
  readonly isNewUser: boolean;
}
