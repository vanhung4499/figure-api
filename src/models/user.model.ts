import {Entity, hasMany, hasOne, model, property} from '@loopback/repository';
import {UserCredentials} from './user-credentials.model';
import {Figure} from './figure.model';

@model({settings: {strict: false}})
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  id: string;

  @property({
    type: 'string',
    index: {
      unique: true,
    },
  })
  username: string;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
    jsonSchema: {
      minLength: 5,
      maxLength: 255,
      format: 'email',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', // Regex for email validation
      transform: ['toLowerCase'],
    },
  })
  email: string;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 2, // At least 2 characters
      maxLength: 50, // Up to 50 characters
    },
  })
  firstName?: string;

  @property({
    type: 'string',
    jsonSchema: {
      minLength: 2, // At least 2 characters
      maxLength: 50, // Up to 50 characters
    },
  })
  lastName?: string;

  @property({
    type: 'string',
  })
  role: string;

  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;

  @hasMany(() => Figure)
  figures: Figure[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
