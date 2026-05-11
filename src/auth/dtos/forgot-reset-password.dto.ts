import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@email.com', required: true })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'token', required: true })
  token: string;

  @ApiProperty({ example: 'newPassword', required: true })
  newPassword: string;
}
