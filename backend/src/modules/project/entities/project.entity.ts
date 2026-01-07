import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Entity,
  OneToOne,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { Language } from '../../user/entities/translator-language.entity';
import { ProjectFeedbackEntity } from './project-feedback.entity';

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
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  ProjectId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'customerId' })
  customer: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true, cascade: false })
  @JoinColumn({ name: 'translatorId' })
  translator?: UserEntity;

  @Column()
  languageCode: Language;

  @Column()
  fileName: string;

  @Column({ type: 'bytea' })
  originalFile: Buffer;

  @Column({ type: 'bytea', nullable: true })
  translatedFile?: Buffer;

  @Column({ default: ProjectState.CREATED })
  state: ProjectState;

  @OneToOne(() => ProjectFeedbackEntity, (feedback) => feedback.project)
  feedback: ProjectFeedbackEntity;

  @CreateDateColumn()
  createdAt: Date;
}
