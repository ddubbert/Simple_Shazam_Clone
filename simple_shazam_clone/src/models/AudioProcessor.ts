import {FreqMagPair, HashPair, HashToken, SpectrogramData, SpectrogramPoint, SpectrumData} from '@/@types/Signal';
const fft = require('fft-js').fft,
  fftUtil = require('fft-js').util;

export interface AudioProcessor {
  getTimeDomainData(decoded: AudioBuffer): number[];
  calculateSpectrum(amplitudes: number[]): SpectrumData;
  calculateSpectrogram(amplitudes: number[]): SpectrogramData;
  getConstellationPoints(spectrogram: SpectrogramData): SpectrogramPoint[][];
  calculateHashes(constellationPoints: SpectrogramPoint[][]): HashToken[];
}

export function createAudioProcessor(
  sampleRate: number,
  stftWindowSize: number,
  stftHopSize: number,
  fanOutFactor: number,
  constellationYGroupAmount: number,
  constellationXGroupSize: number,
  ): AudioProcessor {
  function getTimeDomainData(decoded: AudioBuffer): number[] {
    const channels = [];

    for(let i = 0; i < decoded.numberOfChannels; i++) {
      channels.push(decoded.getChannelData(i));
    }

    let timeDomain: number[] = [];
    for(let i = 0; i < channels.length; i++) {
      if (i === 0) timeDomain = Array.prototype.slice.call(channels[i]);
      for(let j = 0; j < channels.length; j++) {
        timeDomain[j] = timeDomain[j] + channels[i][j];
      }
    }

    return timeDomain;
  }

  function getMaxAmountForFFT(length: number): number {
    let max = 1;
    while(max < length) {
      max *= 2;
    }
    return max;
  }

  function zeroPadIfNeeded(amplitudes: number[]): number[] {
    const max = getMaxAmountForFFT(amplitudes.length);
    const difference = max - amplitudes.length;
    const zeroPadded: number[] = Array.prototype.slice.call(amplitudes);

    if (difference > 0) {
      for(let i = 0; i < difference; i++) { zeroPadded.push(0) }
    } else {
      zeroPadded.splice(zeroPadded.length - Math.abs(difference));
    }

    return zeroPadded;
  }

  function calculateSpectrum(amplitudes: number[]): SpectrumData {
    const zeroPadded = zeroPadIfNeeded(amplitudes);
    const phasors = fft(zeroPadded);

    const frequencies = fftUtil.fftFreq(phasors, sampleRate),
      magnitudes = fftUtil.fftMag(phasors);

    let maxPair = { frequency: 0, magnitude: 0 };
    let maxImportantIndex = 0;

    const freqMagPairs: FreqMagPair[] = [];
    for(let i = 0; i < frequencies.length; i++) {
      const pair = { frequency: frequencies[i], magnitude: Math.max(magnitudes[i], 0) };
      if (magnitudes[i] > maxPair.magnitude) maxPair = pair;
      if (magnitudes[i] > 5) maxImportantIndex = i;
      freqMagPairs.push(pair);
    }

    return { maxPair, freqMagPairs, maxImportantIndex };
  }

  function calculateSpectrogram(amplitudes: number[]): SpectrogramData {
    const amountSamples = amplitudes.length;
    const amountSpectrums = Math.floor(amountSamples / stftHopSize) - 1;
    const longSpectrums: FreqMagPair[][] = [];
    let maxMag = 0;
    let maxImportantIndex = 0;

    for(let i = 0; i < amountSpectrums; i++) {
      const start = i * stftHopSize;
      const end = start + Math.min(amountSamples - start, stftWindowSize);
      const windowSpectrum = calculateSpectrum(amplitudes.slice(start, end));
      if (maxMag < windowSpectrum.maxPair.magnitude) maxMag = windowSpectrum.maxPair.magnitude;
      if (windowSpectrum.maxImportantIndex > maxImportantIndex) maxImportantIndex = windowSpectrum.maxImportantIndex;

      longSpectrums.push(windowSpectrum.freqMagPairs);
    }

    const windowSpectrums = [];
    for(let i = 0; i < longSpectrums.length; i++) {
      windowSpectrums.push(longSpectrums[i].slice(0, maxImportantIndex + 1));
    }

    return { maxMag, windowSpectrums, maxFreq: windowSpectrums[0][maxImportantIndex].frequency };
  }

  function getMaxInGroup(points: SpectrogramPoint[]): SpectrogramPoint {
    let max = points[0] || { point: { frequency: 0, magnitude: 0 }, time: 0 };

    for (let i = 0; i < points.length; i++) {
      if(points[i].point.magnitude > max.point.magnitude) max = points[i];
    }

    return max;
  }

  function getConstellationPoints(spectrogram: SpectrogramData): SpectrogramPoint[][]  {
    const stepTime = stftHopSize * 1000 / sampleRate;
    const yGroupSize = Math.round(spectrogram.windowSpectrums[0].length / constellationYGroupAmount);
    const xGroupAmount = Math.round(spectrogram.windowSpectrums.length / constellationXGroupSize);
    const constellationPoints: SpectrogramPoint[][] = [];

    for(let i = 0; i < xGroupAmount; i++) {
      constellationPoints.push([]);
      for(let j = 0; j < constellationYGroupAmount; j++) {
        const xMin = i * constellationXGroupSize;
        const xMax = Math.min((i + 1) * constellationXGroupSize, spectrogram.windowSpectrums.length);
        const yMin = j * yGroupSize;
        const yMax = Math.min((j + 1) * yGroupSize, spectrogram.windowSpectrums[0].length);

        const pointsInGroup: SpectrogramPoint[] = [];
        for(let x = xMin; x < xMax; x++) {
          for(let y = yMin; y < yMax; y++) {
            pointsInGroup.push({
              point: spectrogram.windowSpectrums[x][y],
              time: stepTime * x,
            });
          }
        }

        constellationPoints[i].push(getMaxInGroup(pointsInGroup));
      }
    }

    return constellationPoints;
  }

  function createHashCode(s: string): number {
    let hash = 0, i, chr;
    for (i = 0; i < s.length; i++) {
      chr   = s.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return hash;
  }

  function createHashToken(pair: HashPair): HashToken {
    const deltaT = pair.second.time - pair.first.time;

    return {
      offset: pair.first.time,
      hash: `${createHashCode(`${pair.first.point.frequency}${pair.second.point.frequency}${deltaT}`)}`,
    }
  }

  function calculateHashes(constellationPoints: SpectrogramPoint[][]): HashToken[] {
    const amountPointArrays = constellationPoints.length;
    const hashes: HashToken[] = [];

    for(let i = 0; i < amountPointArrays; i++) {
      const pointArray = constellationPoints[i];
      const arraysAfterCurrent = (amountPointArrays - i) - 1;
      const amountConnections = (arraysAfterCurrent < fanOutFactor)
        ? arraysAfterCurrent
        : fanOutFactor;

      for(let j = 0; j < pointArray.length; j++) {
        for(let k = 1; k <= amountConnections; k++) {
          const hashPair = {
            first: pointArray[j],
            second: constellationPoints[i + k][j],
          }

          hashes.push(createHashToken(hashPair));
        }
      }
    }

    return hashes;
  }

  return {
    getTimeDomainData,
    calculateSpectrum,
    calculateSpectrogram,
    getConstellationPoints,
    calculateHashes,
  } as AudioProcessor;
}
