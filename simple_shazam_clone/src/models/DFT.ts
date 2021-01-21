import {FreqMagPair, SpectrumData} from '@/@types/Signal'

export interface Complex { x: number; y: number }
export interface DFTStep { complexValues: Complex[]; center: Complex; freqMag: FreqMagPair }

function calcComplexWithK(power: number, n: number, N: number, fs: number, k: number): Complex {
  const fundamentalFreq = (2 * Math.PI) / N;
  const circleFrequency = fundamentalFreq * fs;
  const omegaK = circleFrequency * k;
  const tn = n * (1 / fs);
  const x = power * Math.cos(-omegaK * tn);
  const y = power * Math.sin(-omegaK * tn);
  return { x, y };
}

function calcComplexWithFrequency(power: number, n: number, N: number, fs: number, fa: number): Complex {
  const k = fa / fs * N; // (fa = (k * fs) / N)
  return calcComplexWithK(power, n, N, fs, k);
}

export function dftStepWithFrequency(timeDomain: number[], fs: number, fa: number): DFTStep {
  const N = timeDomain.length;
  const step = {
    complexValues: [],
    center: { x: 0, y: 0 },
    freqMag: {
      frequency: fa,
      magnitude: 0,
    },
  } as DFTStep;

  for(let n = 0; n < N; n++) {
    const complex = calcComplexWithFrequency(timeDomain[n], n, N, fs, fa);
    step.complexValues.push(complex);
    step.center.x += complex.x;
    step.center.y += complex.y;
  }

  step.freqMag.magnitude = Math.sqrt(Math.pow(step.center.x, 2) + Math.pow(step.center.y, 2))

  return step;
}

export function dftStepWithK(timeDomain: number[], fs: number, k: number): DFTStep{
  const N = timeDomain.length;
  const step = {
    complexValues: [],
    center: { x: 0, y: 0 },
    freqMag: {
      frequency: (k * fs) / N,
      magnitude: 0,
    },
  } as DFTStep;

  for(let n = 0; n < N; n++) {
    const complex = calcComplexWithK(timeDomain[n], n, N, fs, k);
    step.complexValues.push(complex);
    step.center.x += complex.x;
    step.center.y += complex.y;
  }

  step.freqMag.magnitude = Math.sqrt(Math.pow(step.center.x, 2) + Math.pow(step.center.y, 2))

  return step;
}

export function dft(timeDomain: number[], fs: number): SpectrumData {
  const N = timeDomain.length;
  const freqMagPairs: FreqMagPair[] = [];
  let maxPair: FreqMagPair = { frequency: 0, magnitude: 0 };
  const maxImportantIndex = N;

  for(let k = 0; k < N; k++) {
    const freqMag = dftStepWithK(timeDomain, fs, k).freqMag;
    freqMagPairs.push(freqMag);
    if(freqMag.magnitude > maxPair.magnitude) maxPair = freqMag;
  }

  return { maxPair, maxImportantIndex, freqMagPairs };
}
