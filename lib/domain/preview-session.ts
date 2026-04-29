import { Coordinates } from './coordinates';

export type PreviewSessionStatus = 'active' | 'submitted' | 'expired' | 'cancelled';

export type PreviewSessionIdentity = {
  id: string;
  shopDomain: string;
  storefrontToken: string;
};

export type PreviewSessionState = {
  status: PreviewSessionStatus;
  cartId?: string;
  coordinates?: Coordinates;
  capturedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PreviewSession = PreviewSessionIdentity & PreviewSessionState;

export function canCaptureCoordinates(session: PreviewSession, now: Date = new Date()): boolean {
  return session.status === 'active' && session.expiresAt.getTime() > now.getTime();
}
