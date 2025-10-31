import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
    @Column({ unique: true })
    email: string;
    @Column({type: 'enum',
            enum: Role,
            default: Role.CUSTOMER
            })
    role: Role;
}
