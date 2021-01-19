export interface FreqMagPair {
  frequency: number;
  magnitude: number;
}

export interface SpectrumData {
  maxPair: FreqMagPair;
  freqMagPairs: FreqMagPair[];
  maxImportantIndex: number;
}

export interface SpectrogramPoint {
  point: FreqMagPair;
  time: number;
}

export interface SpectrogramData {
  maxMag: number;
  windowSpectrums: FreqMagPair[][];
  maxFreq: number;
}

export interface HashPair {
  first: SpectrogramPoint;
  second: SpectrogramPoint;
}

export interface HashToken {
  offset: number;
  hash: string;
}
