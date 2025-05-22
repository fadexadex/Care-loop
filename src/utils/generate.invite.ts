import { v4 as uuidv4 } from 'uuid';
export function generateInviteToken(): string {
    return uuidv4();
}
