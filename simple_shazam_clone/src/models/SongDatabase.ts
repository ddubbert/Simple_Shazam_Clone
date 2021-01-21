import {HashToken} from '@/@types/Signal';
import BigNumber from 'bignumber.js'

interface SongHashToken {
  offset: string;
  songName: string;
  hash: string;
}

export interface Song {
  duration: number;
  name: string;
}

interface SongFileData {
  song: Song;
  hashes: SongHashToken[];
}

interface SongHashMap {
  [details: string]: SongHashToken[];
}

interface SongMap {
  [details: string]: Song;
}

export interface MatchingPoint {
  songOffset: string;
  sampleOffset: string;
}

interface PointMap {
  [details: string]: MatchingPoint[];
}

interface NumberHashMap {
  [details: string]: number;
}

export interface Histogram {
  maxCount: number;
  maxValue: string;
  valueAmounts: NumberHashMap;
}

export interface MatchingSong {
  song: Song;
  matchingPoints: MatchingPoint[];
  histogram: Histogram;
}

export interface SongDatabase {
  getSongs(): Song[];
  uploadHashes(data: SongFileData): void;
  addSong(name: string, duration: number, hashes: HashToken[]): void;
  getSongFor(sampleTokens: HashToken[]): MatchingSong[];
}

export function createSongDatabase(): SongDatabase {
  const songs: SongMap = {};
  const tokenDatabase: SongHashMap = {};

  function getSongs(): Song[] {
    return Object.keys(songs).map((name) => songs[name]);
  }

  function addHash(token: SongHashToken) {
    if (tokenDatabase[token.hash]) tokenDatabase[token.hash].push(token);
    else tokenDatabase[token.hash] = [token];
  }

  function uploadHashes(data: SongFileData): void {
    if (songs[data.song.name]) return;
    songs[data.song.name] = data.song;

    for(let i = 0; i < data.hashes.length; i++) {
      addHash(data.hashes[i]);
    }
  }

  function addSong(name: string, duration: number, hashes: HashToken[]): void {
    if (songs[name]) return;
    const song = { name, duration };
    songs[name] = song;

    const songHashes: SongHashToken[] = [];

    for(let i = 0; i < hashes.length; i++) {
      const hash = hashes[i];
      const token = { songName: name, offset: hash.offset, hash: hash.hash };
      songHashes.push(token);
      addHash(token);
    }

    const data = JSON.stringify({
      song,
      hashes: songHashes,
    } as SongFileData)

    const blob = new Blob([data], {type: 'text/plain'})
    const e = document.createEvent('MouseEvents'),
      a = document.createElement('a');
    a.download = `${name}.json`;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initEvent('click', true, false);
    a.dispatchEvent(e);
  }

  function getHistogram(arr: string[]): Histogram {
    const valueAmounts = {} as NumberHashMap;
    let maxCount = 0, maxValue = '0', m;
    for (let i=0, iLen=arr.length; i<iLen; i++) {
      m = arr[i];

      if (!valueAmounts[m.toString()]) {
        valueAmounts[m.toString()] = 0;
      }
      ++valueAmounts[m.toString()];

      if (valueAmounts[m.toString()] > maxCount) {
        maxCount = valueAmounts[m.toString()];
        maxValue = m;
      }
    }

    return { maxCount, maxValue, valueAmounts };
  }

  function getBestMatch(matchingSongs: PointMap): MatchingSong[] {
    if(Object.keys(matchingSongs).length === 0) throw Error('No Song found');
    if(Object.keys(matchingSongs).length === 1) {
      const songName = Object.keys(matchingSongs)[0];
      const offsets = matchingSongs[songName]
        .map(({songOffset, sampleOffset}) => new BigNumber(songOffset).minus(sampleOffset).toString());

      return [{
        song: songs[songName],
        matchingPoints: matchingSongs[songName],
        histogram: getHistogram(offsets),
      }];
    } else {
      let bestMatches: MatchingSong[] = [];

      Object.keys(matchingSongs).forEach((songName) => {
        const points = matchingSongs[songName];
        const offsets = points
          .map(({songOffset, sampleOffset}) => new BigNumber(songOffset).minus(sampleOffset).toString());
        const histogram = getHistogram(offsets);

        const match = {
          song: songs[songName],
          matchingPoints: matchingSongs[songName],
          histogram,
        };

        bestMatches.push(match);
        bestMatches.sort((a, b) => b.histogram.maxCount - a.histogram.maxCount);
        bestMatches = bestMatches.slice(0,3);
      })

      return bestMatches;
    }
  }

  function getSongFor(sampleTokens: HashToken[]): MatchingSong[] {
    const matchingSongs: PointMap = {};
    if(Object.keys(songs).length === 0) throw Error('No Song Found.');

    for(let i = 0; i < sampleTokens.length; i++) {
      const token = sampleTokens[i];
      const matchingSongTokens = tokenDatabase[token.hash];

      if (matchingSongTokens) {
        for(let j = 0; j < matchingSongTokens.length; j++) {
          const current = matchingSongTokens[j];
          const matchingPoint = {
            songOffset: current.offset,
            sampleOffset: token.offset,
          };

          if(matchingSongs[current.songName]) matchingSongs[current.songName].push(matchingPoint);
          else matchingSongs[current.songName] = [matchingPoint];
        }
      }
    }

    try {
      return getBestMatch(matchingSongs);
    } catch(e) {
      throw Error('No Song Found.')
    }
  }

  return {
    getSongs,
    uploadHashes,
    addSong,
    getSongFor,
  } as SongDatabase;
}


