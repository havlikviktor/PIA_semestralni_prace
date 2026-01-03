import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Entity,
  OneToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Language } from '../../user/entities/translator-language.entity';
import { ProjectFeedback } from './project-feedback.entity';

export enum ProjectState {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

export enum FileType {
  ORIGINAL = 'original',
  TRANSLATED = 'translated',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  ProjectId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => User, { nullable: true, cascade: false })
  @JoinColumn({ name: 'translatorId' })
  translator?: User;

  @Column()
  languageCode: Language;

  @Column()
  fileName: string;

  @Column({ type: 'bytea' })
  originalFile: Buffer;

  @Column({ type: 'bytea', nullable: true })
  translatedFile?: Buffer;

  @Column()
  fileSuffix: string;

  @Column({ default: ProjectState.CREATED })
  state: ProjectState;

  @OneToOne(() => ProjectFeedback, (feedback) => feedback.project)
  feedback: ProjectFeedback;

  @CreateDateColumn()
  createdAt: Date;
}
