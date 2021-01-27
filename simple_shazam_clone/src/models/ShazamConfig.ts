const sampleRate = 44100;
const bufferSize = 4096;
const stftWindowSize = 2048;
const stftHopSize = stftWindowSize / 2;
const fanOutFactor = 10;
const constellationYGroupAmount = 20;
const constellationXGroupSize = 1;
const fanOutStepFactor = 2;
const targetZoneHeight = 5;
const magnitudeThreshhold = stftWindowSize / 50;

export interface ShazamConfig {
  /** Sets the sample rate for the microphone sampling.*/
  sampleRate: number;
  /** The buffer size for the microphone sampling*/
  bufferSize: number;
  /** The window size for a STFT defines, how detailed frequency bins will be.*/
  stftWindowSize: number;
  /** The hop size for a STFT, defining the amount of overlapping samples between windows (windowSize - hopSize).*/
  stftHopSize: number;
  /** The fan out factor defines the amount of points in a target zone.*/
  fanOutFactor: number;
  /** Defines how many vertical windows will be considered when selecting constellation points.*/
  constellationYGroupAmount: number;
  /** Defines how many "hops" will be count as one x step when selecting constellation points.*/
  constellationXGroupSize: number;
  /** Defines the amount of x steps, that have to be between each point that is connected to the anchor. Together with
   * constellationXGroupSize, this is needed to calculate the target zone width.*/
  fanOutStepFactor: number;
  /** Defines how many frequency bins have to be considered in a target zone (the target zone height). Half of these
   * are vertically below the anchor point, half above (if possible).*/
  targetZoneHeight: number;
  /** The magnitude threshhold for frequencies points to be shown in the constellation map and used for hashing.*/
  magnitudeThreshhold: number;
}

export const shazamConfig = {
  sampleRate,
  bufferSize,
  stftWindowSize,
  stftHopSize,
  fanOutFactor,
  constellationYGroupAmount,
  constellationXGroupSize,
  fanOutStepFactor,
  targetZoneHeight,
  magnitudeThreshhold,
} as ShazamConfig;
