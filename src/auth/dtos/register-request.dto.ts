import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({
    example: 'nom',
    required: true,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nom: string;
  
  @ApiProperty({
    example: 'prenom',
    required: true,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  prenom: string;
  
  @ApiProperty({
    example: 'email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;
  
  @ApiProperty({
    example: 'password',
    required: true,
  })
  @IsString()
  @MinLength(6)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { 
    message: 'Password too weak' 
  })
  password: string;
  
  @ApiProperty({
    example: 'username',
    required: true,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;
  
  @ApiProperty({
    example: 'photo',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;
}