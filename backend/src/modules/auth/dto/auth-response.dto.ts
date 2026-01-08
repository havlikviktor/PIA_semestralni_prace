import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from '../../user/dto/user-info.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTcwNDc4NzIwMCwiZXhwIjoxNzA0NzkxODAwfQ.2n5l8qJH5jG1VZk9y0sYpKq8b0mKcX3m2s1rJg3KxYQ',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user info',
    type: UserInfoDto,
  })
  user: UserInfoDto;
}
