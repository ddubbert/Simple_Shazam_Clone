export interface FreqMagPair {
  frequency: number;
  magnitude: number;
}

export interface SpectrumData {
  maxPair: FreqMagPair;
  freqMagPairs: FreqMagPair[];
}

export interface SpectrogramData {
  maxPairs: FreqMagPair[];
  maxMag: number;
  windowSpectrums: FreqMagPair[][];
}

export interface HashPair {
  first: {
    point: FreqMagPair;
    time: number;
  };
  second: {
    point: FreqMagPair;
    time: number;
  };
}

export interface HashToken {
  offset: number;
  hash: string;
}
