import {model, property, repository} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  HttpErrors,
  post,
  requestBody,
  response,
  SchemaObject,
} from '@loopback/rest';
import {User} from '../models';
import {UserRepository} from '../repositories';
import {
  PasswordHasherBindings,
  RefreshTokenServiceBindings,
  TokenServiceBindings,
  UserServiceBindings,
} from '../keys';
import {
  authenticate,
  TokenService,
  UserService,
} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {Credentials, PasswordHasher} from '../services';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {RefreshTokenService, TokenObject} from '@loopback/authentication-jwt';

// Describes the schema of grant object
const RefreshGrantSchema: SchemaObject = {
  type: 'object',
  required: ['refreshToken'],
  properties: {
    refreshToken: {
      type: 'string',
    },
  },
};

// Describes the type of grant object taken in by method "refresh"
type RefreshGrant = {
  refreshToken: string;
};

// Describes the request body of grant object
const RefreshGrantRequestBody = {
  description: 'Reissuing Access Token',
  required: true,
  content: {
    'application/json': {schema: RefreshGrantSchema},
  },
};

// Describe the schema of user credentials
const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
  },
};

@model()
export class NewUserRequest extends User {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 8, // At least 8 characters
      pattern:
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', // At least one uppercase, one lowercase, one number, and one special character
    },
  })
  password: string;
}

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export class UserController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: UserService<User, Credentials>,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser: UserProfile,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject(RefreshTokenServiceBindings.REFRESH_TOKEN_SERVICE)
    public refreshService: RefreshTokenService,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
  ) {}

  @post('/users/signup')
  @response(200, {
    description: 'New User',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {
          title: 'New User',
          exclude: ['id'],
        }),
      },
    },
  })
  async signUp(
    @requestBody({
      content: {
        'application/json': {
          schema: CredentialsSchema,
        },
      },
    })
    newUserRequest: NewUserRequest,
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: {email: newUserRequest.email},
    });

    if (existingUser) {
      throw new HttpErrors.Conflict('Email value is already taken');
    }

    newUserRequest.role = 'USER';

    const password = await this.passwordHasher.hashPassword(
      newUserRequest.password,
    );
    delete (newUserRequest as Partial<NewUserRequest>).password;
    const savedUser = await this.userRepository.create(newUserRequest);

    await this.userRepository.userCredentials(savedUser.id).create({password});

    return savedUser;
  }

  @post('/users/login')
  @response(200, {
    description: 'Token',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
            },
            refreshToken: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<TokenObject> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // generate access token based on the user profile
    const accessToken = await this.jwtService.generateToken(userProfile);
    return this.refreshService.generateToken(userProfile, accessToken);
  }

  @authenticate('jwt')
  @get('/users/me')
  @response(200, {
    description: 'The current user profile',
    schema: {
      type: 'string',
    },
  })
  async getCurrentUser(): Promise<string> {
    return this.currentUser[securityId];
  }

  @post('/users/refresh')
  @response(200, {
    description: 'Token',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
            },
          },
        },
      },
    },
  })
  async refresh(
    @requestBody(RefreshGrantRequestBody) refreshGrant: RefreshGrant,
  ): Promise<TokenObject> {
    return this.refreshService.refreshToken(refreshGrant.refreshToken);
  }
}
