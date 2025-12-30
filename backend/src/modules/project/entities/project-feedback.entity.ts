import {
  Entity,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class ProjectFeedback {
  @PrimaryColumn()
  projectId: number;

  @Column()
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Project, (project) => project.feedback, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
