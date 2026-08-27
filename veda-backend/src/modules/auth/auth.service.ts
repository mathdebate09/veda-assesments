import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './repositories/users.repository';
import { InstitutesRepository } from './repositories/institutes.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly institutesRepository: InstitutesRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const institute = await this.institutesRepository.create({
      name: dto.instituteName,
      location: dto.instituteLocation,
      logoUrl: dto.instituteLogoUrl,
    });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: UserRole.TEACHER,
      institute: institute._id,
    });

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      instituteId: institute._id.toString(),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: {
          id: institute._id,
          name: institute.name,
          location: institute.location,
          logoUrl: institute.logoUrl || null,
        },
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const populatedUser = await this.usersRepository.findById(user._id);

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      instituteId: user.institute ? user.institute.toString() : undefined,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institute: populatedUser?.institute || user.institute,
      },
    };
  }
}
