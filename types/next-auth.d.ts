import { DefaultSession } from 'next-auth';
import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      phone: string;
      enable_2fa: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone: string;
    enable_2fa: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    phone: string;
    enable_2fa: boolean;
  }
}
