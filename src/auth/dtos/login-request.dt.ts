import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginRequest {
  @ApiProperty({
    example: 'username',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  username: string;
  
  @ApiProperty({
    example: 'password',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}