export const COORDINATE_PRECISION = 6;
export const MIN_LATITUDE = -90;
export const MAX_LATITUDE = 90;
export const MIN_LONGITUDE = -180;
export const MAX_LONGITUDE = 180;

export type CoordinateValue = {
  latitude: number;
  longitude: number;
};

export type Coordinates = CoordinateValue & {
  readonly __brand: 'Coordinates';
};

export type CoordinatesValidationErrorCode =
  | 'INVALID_LATITUDE'
  | 'INVALID_LONGITUDE'
  | 'INVALID_PRECISION'
  | 'INVALID_NUMBER';

export class CoordinatesValidationError extends Error {
  constructor(
    public readonly code: CoordinatesValidationErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CoordinatesValidationError';
  }
}

export function createCoordinates(input: CoordinateValue): Coordinates {
  assertFiniteNumber(input.latitude, 'latitude');
  assertFiniteNumber(input.longitude, 'longitude');

  const latitude = normalizeCoordinate(input.latitude);
  const longitude = normalizeCoordinate(input.longitude);

  assertCoordinatePrecision(latitude, 'latitude');
  assertCoordinatePrecision(longitude, 'longitude');
  assertLatitudeRange(latitude);
  assertLongitudeRange(longitude);

  return {
    latitude,
    longitude,
    __brand: 'Coordinates'
  };
}

export function normalizeCoordinate(value: number): number {
  return Number(value.toFixed(COORDINATE_PRECISION));
}

function assertFiniteNumber(value: number, field: 'latitude' | 'longitude'): void {
  if (!Number.isFinite(value)) {
    throw new CoordinatesValidationError('INVALID_NUMBER', `${field} must be a finite number`, { [field]: value });
  }
}

function assertCoordinatePrecision(value: number, field: 'latitude' | 'longitude'): void {
  const parts = value.toString().split('.');
  const decimals = parts[1]?.length ?? 0;

  if (decimals > COORDINATE_PRECISION) {
    throw new CoordinatesValidationError(
      'INVALID_PRECISION',
      `${field} precision exceeds ${COORDINATE_PRECISION} decimals`,
      { [field]: value, precision: decimals }
    );
  }
}

function assertLatitudeRange(latitude: number): void {
  if (latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
    throw new CoordinatesValidationError('INVALID_LATITUDE', 'latitude must be between -90 and 90', { latitude });
  }
}

function assertLongitudeRange(longitude: number): void {
  if (longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
    throw new CoordinatesValidationError('INVALID_LONGITUDE', 'longitude must be between -180 and 180', { longitude });
  }
}
