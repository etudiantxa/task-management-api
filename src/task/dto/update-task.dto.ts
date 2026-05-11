import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto, Priority, Status } from './create-task.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({
    example: 'title',
    required: false,
  })
  title?: string;
  @ApiProperty({
    example: 'content',
    required: false,
  })
  content?: string;
  @ApiProperty({ example: 'High', required: false, enum: Priority })
  priority?: Priority;
  @ApiProperty({
    example: 'color',
    required: false,
  })
  color?: string;
  @ApiProperty({ example: 'Todo', required: false, enum: Status })
  status?: Status;
  @ApiProperty({
    type: Date,
    required: false,
  })
  dueDate: Date;
  @ApiProperty({
    type: Number,
    required: false,
  })
  userId: number;
}