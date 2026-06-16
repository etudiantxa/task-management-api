import { ApiProperty } from '@nestjs/swagger';
import { Column, Table, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Task } from './task.entity';
import { User } from '../../users/entities/user.entity';

@Table({ tableName: 'task_assignments' })
export class TaskAssignment extends Model {
  @ApiProperty({
    type: Number,
    required: false,
  })
  id?: number;

  @ApiProperty({
    type: Number,
    required: true,
  })
  @ForeignKey(() => Task)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  taskId: number;

  @ApiProperty({
    type: Number,
    required: true,
  })
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  assignedAt: Date;

  @ApiProperty({
    type: String,
    required: false,
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  role?: string; // Pour indiquer le rôle de l'utilisateur assigné (par exemple: 'assigned', 'reviewer', 'collaborator')
}