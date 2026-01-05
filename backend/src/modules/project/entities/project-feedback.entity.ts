import {
  Entity,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity()
export class ProjectFeedbackEntity {
  @PrimaryColumn()
  projectId: number;

  @Column()
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => ProjectEntity, (project) => project.feedback, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: ProjectEntity;
}
