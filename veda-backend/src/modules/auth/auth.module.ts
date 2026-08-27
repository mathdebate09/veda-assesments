import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserSchema } from '../../schemas/user.schema';
import { Institute, InstituteSchema } from '../../schemas/institute.schema';
import { UsersRepository } from './repositories/users.repository';
import { InstitutesRepository } from './repositories/institutes.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Institute.name, schema: InstituteSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('jwt.secret') ||
          'default-secret-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') ||
            '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository, InstitutesRepository, JwtStrategy],
  exports: [
    AuthService,
    UsersRepository,
    InstitutesRepository,
    JwtStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
