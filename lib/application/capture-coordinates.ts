import { err, ok, Result } from '@/lib/core/result';
import {
  CoordinateValue,
  CoordinatesValidationError,
  createCoordinates
} from '@/lib/domain/coordinates';
import { canCaptureCoordinates, PreviewSession } from '@/lib/domain/preview-session';

export type CaptureCoordinatesInput = {
  sessionId: string;
  coordinates: CoordinateValue;
  capturedAt?: Date;
};

export type CaptureCoordinatesOutput = {
  sessionId: string;
  latitude: number;
  longitude: number;
  capturedAt: string;
};

// Implement this contract in adapters under lib/infrastructure/persistence/.
export type PreviewSessionRepository = {
  getById(sessionId: string): Promise<PreviewSession | null>;
  saveCoordinates(params: {
    sessionId: string;
    latitude: number;
    longitude: number;
    capturedAt: Date;
  }): Promise<void>;
};

export async function captureCoordinates(
  input: CaptureCoordinatesInput,
  repository: PreviewSessionRepository
): Promise<Result<CaptureCoordinatesOutput>> {
  let normalized;
  try {
    normalized = createCoordinates(input.coordinates);
  } catch (error) {
    if (error instanceof CoordinatesValidationError) {
      return err({
        code: 'VALIDATION_ERROR',
        message: error.message,
        status: 422,
        retryable: false,
        context: error.context
      });
    }

    return err({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to validate coordinates',
      status: 500,
      retryable: false
    });
  }

  const session = await repository.getById(input.sessionId);
  if (!session) {
    return err({
      code: 'NOT_FOUND',
      message: 'Preview session was not found',
      status: 404,
      retryable: false,
      context: { sessionId: input.sessionId }
    });
  }

  const capturedAt = input.capturedAt ?? new Date();
  if (!canCaptureCoordinates(session, capturedAt)) {
    return err({
      code: 'FORBIDDEN',
      message: 'Preview session is not available for coordinate capture',
      status: 403,
      retryable: false,
      context: { sessionId: input.sessionId, status: session.status }
    });
  }

  await repository.saveCoordinates({
    sessionId: input.sessionId,
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    capturedAt
  });

  return ok({
    sessionId: input.sessionId,
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    capturedAt: capturedAt.toISOString()
  });
}
