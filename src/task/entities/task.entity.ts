import { ApiProperty } from '@nestjs/swagger';
import { Column, Table, Model, DataType } from 'sequelize-typescript';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
}

@Table({ tableName: 'tasks' })
export class Task extends Model {
  @ApiProperty({
    type: Number,
    required: false,
  })
  id?: number;

  @ApiProperty({
    type: String,
    required: false,
  })
  @Column
  title: string;
  @ApiProperty({
    type: String,
    required: false,
  })
  @Column
  content: string;
  @ApiProperty({
    type: String,
    required: false,
  })
  @Column
  priority: string;
  @ApiProperty({
    type: String,
    required: false,
  })
  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    defaultValue: TaskStatus.TODO,
  })
  status: string;
  @ApiProperty({
    type: String,
    required: false,
  })
  @Column
  color: string;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  dueDate: Date;
  @ApiProperty({
    type: Number,
    required: false,
  })
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 1,
  })
  userId?: number;
}