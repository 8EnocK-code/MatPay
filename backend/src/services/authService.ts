import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prismaClient';
import { UserRole } from '@prisma/client';
import { JWTPayload } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || '';
const SALT_ROUNDS = 10;

export interface RegisterData {
  name: string;
  phoneNumber: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface LoginData {
  phoneNumber: string;
  password: string;
}

export async function registerUser(data: RegisterData) {
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: data.phoneNumber },
  });

  if (existingUser) {
    throw new Error('User with this phone number already exists');
  }

  if (data.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error('User with this email already exists');
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const token = generateToken({
    userId: user.id,
    role: user.role,
    phoneNumber: user.phoneNumber,
  });

  return {
    user,
    token,
  };
}

export async function loginUser(data: LoginData) {
  const user = await prisma.user.findUnique({
    where: { phoneNumber: data.phoneNumber },
  });

  if (!user) {
    throw new Error('Invalid phone number or password');
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    throw new Error('Invalid phone number or password');
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    phoneNumber: user.phoneNumber,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
    },
    token,
  };
}

function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

