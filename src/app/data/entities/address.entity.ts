import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Country } from './external/location/country.entity';
import { Lga } from './external/location/lga.entity';

@Entity()
export class Address {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Country, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    country: Country;

    @ManyToOne(() => Lga, {
        nullable: true,
        createForeignKeyConstraints: false,
    })
    lga: Lga;

    @Column({ nullable: false })
    city: string;

    @Column({ nullable: true })
    postalCode: string;

    @Column({ nullable: true })
    streetAddress: string;

    @Column({ nullable: true })
    landmark: string;
}
