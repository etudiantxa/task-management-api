import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, MinLength } from 'class-validator';

export class UpdateUserRequestDto {
  @ApiProperty({
    example: 'username',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;
  
  @ApiProperty({
    example: 'nom',
    required: false,
  })
  @IsOptional()
  @IsString()
  nom?: string;
  
  @ApiProperty({
    example: 'prenom',
    required: false,
  })
  @IsOptional()
  @IsString()
  prenom?: string;
  
  @ApiProperty({
    example: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
  
  @ApiProperty({
    example: 'password',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
  
  @ApiProperty({
    example: 'photo',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;
}