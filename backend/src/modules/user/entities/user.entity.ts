import { TranslatorLanguage } from './translator-language.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
  CUSTOMER = 'customer',
  TRANSLATOR = 'translator',
  ADMINISTRATOR = 'administrator',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: 'varchar', nullable: true })
  password: string | null;
  @Column({ unique: true })
  email: string;
  @Column({ type: 'varchar', nullable: true })
  googleId: string | null;
  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @OneToMany(() => TranslatorLanguage, (language) => language.translator, {
    cascade: true,
  })
  languages: TranslatorLanguage[];

  constructor(user: Partial<User>) {
    Object.assign(this, user);
  }
}
