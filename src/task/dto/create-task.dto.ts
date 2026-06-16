import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsArray, IsNumber } from 'class-validator';

export enum Priority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum Status {
  Todo = 'Todo',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Pending = 'Pending',
  Cancelled = 'Cancelled',
  Expired = 'Expired'
}

export class CreateTaskDto {
  @ApiProperty({
    example: 'title',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;
  
  @ApiProperty({
    example: 'content',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  content: string;
  
  @ApiProperty({ example: 'High', enum: Priority })
  @IsEnum(Priority)
  priority: Priority;
  
  @ApiProperty({
    example: 'color',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    example: 'Todo',
    enum: Status,
    required: false,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: Date;

  @ApiProperty({
    type: [Number],
    required: false,
    description: 'IDs des utilisateurs à assigner à cette tâche'
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  assignedUserIds?: number[];
}