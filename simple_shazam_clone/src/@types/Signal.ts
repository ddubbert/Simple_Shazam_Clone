export interface FreqMagPair {
  frequency: number;
  magnitude: number;
}

export interface SpectrumData {
  maxPair: FreqMagPair;
  freqMagPairs: FreqMagPair[];
}

export interface SpectrogramPoint {
  point: FreqMagPair;
  time: number;
}

export interface SpectrogramData {
  maxPairs: SpectrogramPoint[];
  maxMag: number;
  windowSpectrums: FreqMagPair[][];
}

export interface HashPair {
  first: SpectrogramPoint;
  second: SpectrogramPoint;
}

export interface HashToken {
  offset: number;
  hash: string;
}
