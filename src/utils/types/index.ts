import { Role } from "@prisma/client";

export interface TokenPayload {
  id?: string;
  email: string;
  role?: Role
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
