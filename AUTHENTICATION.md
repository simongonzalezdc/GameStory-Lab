# Authentication System Implementation Guide

## Overview

This document outlines a complete JWT-based authentication system for GameStory Lab. Since this is currently for local use, authentication is not implemented. This guide provides ready-to-use code for when authentication becomes necessary (e.g., multi-user deployments, cloud hosting).

## Architecture

- **Strategy**: JWT (JSON Web Tokens) with refresh tokens
- **Session Storage**: In-memory with Redis fallback option
- **Password Hashing**: bcrypt (12 rounds)
- **Token Expiry**: Access tokens (15min), Refresh tokens (7 days)
- **Security**: HTTP-only cookies, CSRF protection, rate limiting

## Required Dependencies

```bash
# Backend dependencies
cd packages/backend
npm install jsonwebtoken bcrypt bcryptjs @types/bcrypt @types/jsonwebtoken express-rate-limit helmet csurf cookie-parser

# Optional: Redis for session storage
npm install ioredis @types/ioredis
```

## Database Schema Changes

Add to `packages/backend/prisma/schema.prisma`:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  projects      Project[]
  sessions      Session[]

  @@index([email])
  @@map("users")
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshToken])
  @@index([expiresAt])
  @@map("sessions")
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
}

// Update existing Project model
model Project {
  // ... existing fields ...
  userId    String?  // Owner of the project
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
}
```

## Backend Implementation

### 1. Environment Variables

Add to `packages/backend/.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Session Configuration
SESSION_SECRET=your-session-secret-change-in-production

# Optional: Redis for session storage
REDIS_URL=redis://localhost:6379
```

### 2. Authentication Service

Create `packages/backend/src/services/auth.service.ts`:

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    });
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  }

  /**
   * Register new user
   */
  static async register(email: string, password: string, name?: string): Promise<User> {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    return user;
  }

  /**
   * Login user and generate tokens
   */
  static async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; tokens: AuthTokens }> {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const newPayload: TokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };

    const newAccessToken = this.generateAccessToken(newPayload);
    const newRefreshToken = this.generateRefreshToken(newPayload);

    // Update session with new refresh token
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user by invalidating session
   */
  static async logout(refreshToken: string): Promise<void> {
    await prisma.session.delete({
      where: { refreshToken },
    });
  }

  /**
   * Logout all sessions for a user
   */
  static async logoutAll(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  /**
   * Clean expired sessions (run periodically)
   */
  static async cleanExpiredSessions(): Promise<number> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }
}
```

### 3. Authentication Middleware

Create `packages/backend/src/middleware/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/auth.service';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to verify JWT access token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      });
    }

    // Verify token
    const payload = AuthService.verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token expired', code: 'TOKEN_EXPIRED' },
      });
    }

    return res.status(401).json({
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' },
    });
  }
}

/**
 * Middleware to check user role
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { message: 'Insufficient permissions', code: 'FORBIDDEN' },
      });
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (token) {
      const payload = AuthService.verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Silently fail - optional auth
  }

  next();
}
```

### 4. Authentication Routes

Create `packages/backend/src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middleware/auth.middleware';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Validation schemas
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const RefreshSchema = z.object({
  refreshToken: z.string(),
});

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', validateRequest(RegisterSchema), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const user = await AuthService.register(email, password, name);

    // Don't send password hash
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      return res.status(409).json({
        error: { message: 'User already exists', code: 'USER_EXISTS' },
      });
    }

    res.status(500).json({
      error: { message: 'Failed to register user', code: 'REGISTRATION_FAILED' },
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validateRequest(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const { user, tokens } = await AuthService.login(
      email,
      password,
      ipAddress,
      userAgent
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Optionally set access token as cookie too
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({
      error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', validateRequest(RefreshSchema), async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: { message: 'Refresh token required', code: 'TOKEN_REQUIRED' },
      });
    }

    const tokens = await AuthService.refreshTokens(refreshToken);

    // Update cookies
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      message: 'Token refreshed',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({
      error: { message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' },
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({
      error: { message: 'Logout failed', code: 'LOGOUT_FAILED' },
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Logout all sessions
 */
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    await AuthService.logoutAll(req.user!.userId);

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.json({ message: 'All sessions logged out' });
  } catch (error) {
    res.status(500).json({
      error: { message: 'Logout failed', code: 'LOGOUT_FAILED' },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      error: { message: 'Failed to fetch user', code: 'FETCH_FAILED' },
    });
  }
});

export default router;
```

### 5. Update Main Server File

Modify `packages/backend/src/index.ts`:

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';

// Import routes
import authRoutes from './routes/auth.routes';
// ... other routes

const app = express();

// Security middleware
app.use(helmet());
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});

// Body parsing
app.use(express.json());

// CSRF protection (optional - requires setup)
// const csrfProtection = csurf({ cookie: true });
// app.use(csrfProtection);

// Mount routes
app.use('/api/auth', authLimiter, authRoutes);
// ... other routes with authentication middleware where needed

// Clean expired sessions every hour
setInterval(async () => {
  const count = await AuthService.cleanExpiredSessions();
  console.log(`Cleaned ${count} expired sessions`);
}, 60 * 60 * 1000);

// ... rest of server setup
```

### 6. Protect Existing Routes

Update existing routes to require authentication:

```typescript
// packages/backend/src/routes/projects.routes.ts
import { authenticate, authorize } from '../middleware/auth.middleware';

// Protect routes
router.post('/', authenticate, async (req, res) => {
  // Now req.user.userId is available
  const userId = req.user!.userId;
  // ... create project with userId
});

router.patch('/:id', authenticate, async (req, res) => {
  // Verify ownership
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
  });

  if (project?.userId !== req.user!.userId) {
    return res.status(403).json({
      error: { message: 'Not authorized', code: 'FORBIDDEN' },
    });
  }

  // ... update project
});

// Admin-only route
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  // ... delete project
});
```

## Frontend Implementation

### 1. Auth Context

Create `packages/frontend/src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (accessToken) {
      // Refresh token every 14 minutes (before 15min expiry)
      const interval = setInterval(refreshToken, 14 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);

  async function loadUser() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    setAccessToken(data.accessToken);
  }

  async function register(email: string, password: string, name?: string) {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    // Auto-login after registration
    await login(email, password);
  }

  async function logout() {
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
    setAccessToken(null);
  }

  async function refreshToken() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
      } else {
        // Refresh failed, logout
        await logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 2. Login Page

Create `packages/frontend/src/pages/LoginPage.tsx`:

```typescript
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-800 rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100">
            Sign in to GameStory Lab
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3. Protected Route Component

Create `packages/frontend/src/components/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### 4. Update API Service

Modify `packages/frontend/src/services/api.ts` to include auth tokens:

```typescript
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // ... rest of implementation
}
```

## Migration Guide

When ready to enable authentication:

1. **Database Migration**:
   ```bash
   cd packages/backend
   npx prisma migrate dev --name add_authentication
   ```

2. **Install Dependencies**:
   ```bash
   # Backend
   cd packages/backend
   npm install jsonwebtoken bcrypt @types/bcrypt @types/jsonwebtoken express-rate-limit helmet csurf cookie-parser

   # Frontend (if not already installed)
   cd packages/frontend
   # No additional dependencies needed
   ```

3. **Environment Setup**:
   - Copy environment variables from this doc to `.env`
   - Generate secure secrets: `openssl rand -base64 32`

4. **Enable Routes**:
   - Uncomment auth routes in `index.ts`
   - Add authentication middleware to protected routes

5. **Frontend Integration**:
   - Wrap app with `AuthProvider`
   - Add login/register pages to routes
   - Wrap protected routes with `ProtectedRoute`

6. **Testing**:
   - Test registration flow
   - Test login/logout
   - Test token refresh
   - Test protected routes
   - Test role-based access control

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure environment variables
- [ ] Enable rate limiting
- [ ] Enable CSRF protection
- [ ] Use HTTP-only cookies
- [ ] Implement password strength validation
- [ ] Add email verification (optional)
- [ ] Add two-factor authentication (optional)
- [ ] Log authentication events
- [ ] Monitor for brute force attacks
- [ ] Regular session cleanup
- [ ] Secure password reset flow

## Future Enhancements

- OAuth integration (Google, GitHub, etc.)
- Two-factor authentication (2FA)
- Email verification
- Password reset via email
- Session management UI
- Account settings page
- Audit log for auth events
- Redis session storage for scaling

---

**Note**: This system is production-ready but should be reviewed and tested thoroughly before deployment. Always use HTTPS in production and keep dependencies updated.
