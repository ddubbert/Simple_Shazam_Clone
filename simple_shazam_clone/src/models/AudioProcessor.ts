import {HashPair, HashToken, SpectrogramData, SpectrogramPoint, SpectrumData} from '@/@types/Signal';
const fft = require('fft-js').fft,
  fftUtil = require('fft-js').util;

export interface AudioProcessor {
  getTimeDomainData(decoded: AudioBuffer): number[];
  calculateSpectrum(amplitudes: number[]): SpectrumData;
  calculateSpectrogram(amplitudes: number[], recordingSeconds: number): SpectrogramData;
  calculateHashes(constellationPoints: SpectrogramPoint[]): HashToken[];
}

export function createAudioProcessor(
  sampleRate: number,
  stftWindowSize: number,
  stftHopSize: number,
  fanOutFactor: number,
  ): AudioProcessor {
  /*function getTimeDomainData(amplitudes: number[], recordingTime: number): number[] {
    const amountSamplesForRecordingTime = recordingTime * sampleRate;
    return amplitudes.slice(0, amountSamplesForRecordingTime);
  }*/

  function getTimeDomainData(decoded: AudioBuffer): number[] {
    const channels = [];

    console.log(decoded.numberOfChannels);
    for(let i = 0; i < decoded.numberOfChannels; i++) {
      channels.push(decoded.getChannelData(i));
    }

    return channels.reduce((acc, channel, i) => {
      if (i === 0) return Array.prototype.slice.call(channel);
      else {
        return acc.map((it, j) => it + channel[j]);
      }
    }, [] as number[]);
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

    const maxPair = { frequency: 0, magnitude: 0 };
    const freqMagPairs = frequencies.map(function (f: number, ix: number) {
      if (magnitudes[ix] > maxPair.magnitude) {
        maxPair.magnitude = magnitudes[ix];
        maxPair.frequency = f;
      }
      return { frequency: f, magnitude: Math.abs(magnitudes[ix]) };
    });

    return { maxPair, freqMagPairs }
  }

  function calculateSpectrogram(amplitudes: number[], recordingSeconds: number): SpectrogramData {
    const amountSamples = amplitudes.length;
    const amountSpectrums = Math.floor(amountSamples / stftHopSize) - 1;
    const stepTime = stftHopSize * 1000 / sampleRate;

    const windowSpectrums = [];
    let maxMag = 0;
    const maxPairs: SpectrogramPoint[] = [];
    for(let i = 0; i < amountSpectrums; i++) {
      const start = i * stftHopSize;
      const end = start + Math.min(amountSamples - start, stftWindowSize);
      const windowSpectrum = calculateSpectrum(amplitudes.slice(start, end));
      if (maxMag < windowSpectrum.maxPair.magnitude) maxMag = windowSpectrum.maxPair.magnitude;

      const specPoint = {
        point: windowSpectrum.maxPair,
        time: stepTime * i,
      };

      maxPairs.push(specPoint);
      windowSpectrums.push(windowSpectrum.freqMagPairs);
    }

    return { maxMag, maxPairs, windowSpectrums };
  }

  function createHashCode(s: string): number {
    let hash = 0, i, chr;
    for (i = 0; i < s.length; i++) {
      chr   = s.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
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

  function calculateHashes(constellationPoints: SpectrogramPoint[]): HashToken[] {
    const amountPoints = constellationPoints.length - 1;

    return constellationPoints.reduce((acc, specPoint, pointIndex) => {
      const newAcc = acc.slice(0);
      const cellsAfterCurrent = amountPoints - pointIndex;
      const amountConnections = (cellsAfterCurrent < fanOutFactor)
        ? cellsAfterCurrent
        : fanOutFactor;

      for (let i = 1; i <= amountConnections; i += 1) {
        const hashPair = {
          first: specPoint,
          second: constellationPoints[pointIndex + i],
        }

        newAcc.push(createHashToken(hashPair));
      }

      return newAcc;
    }, [] as HashToken[]);
  }

  return {
    getTimeDomainData,
    calculateSpectrum,
    calculateSpectrogram,
    calculateHashes,
  } as AudioProcessor;
}
