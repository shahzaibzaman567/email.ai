export interface AuthContext {
  userId: string;
  sessionId?: string;
  email?: string;
  isOwner?: boolean;
}