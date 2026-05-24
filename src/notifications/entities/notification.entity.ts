import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../task/entities/task.entity';

@Table({ tableName: 'Notifications', timestamps: true })
export class Notification extends Model<Notification> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Task)
  @Column
  taskId: number;

  @Column
  title: string;

  @Column(DataType.TEXT)
  content: string;

  @Column
  type: string; // 'OVERDUE', 'DUE_SOON', 'COMPLETED', 'TASK_CREATED'

  @Column({ defaultValue: false })
  isRead: boolean;

  @Column
  readAt: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Task)
  task: Task;

  @Column
  createdAt: Date;

  @Column
  updatedAt: Date;
}