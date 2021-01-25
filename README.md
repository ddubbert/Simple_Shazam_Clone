# Simple Shazam Clone
This project is a prototype of recreating the music recognition algorithm used in the Shazam-application. The goal was to test the theoretical knowledge about the algorithm described by Wang (Papers: "An industrial strength audio search algorithm, 2003" and "The Shazam music recognition service, 2006"), and to allow for a somewhat robust and accurate recognition of songs, which have been captured by a computer microphone. It is also meant to visualize every step needed for music recognition, so that users may have better insights into the algorithm itself. The project was a by-product of a paper I had to write for the course "Spezielle Gebiete der Mathematik" in the degree course "Medieninformatik Master" at TH-Köln, which involved describing the Shazam algorithm, possible improvements and other use cases. In the following sections the prototype and its usage will be explained, followed by an installation guide. Because the algorithm used by Shazam wont be described further, it is highly recommended to have a look at the previously mentioned papers, before using this software.

## Usage
The prototype is a website consisting of three pages.
![pages](./images/pages.png?raw=true "Page Tabs")

### Database
On the "Database" page, a user can start to fill the database with songs, that are later used for recognizing recorded samples. On this page there are two options to choose from.
![database page](./images/database.png?raw=true "Database Page")
The first option is to upload new song files. The uploaded songs will be decoded by the prototype to generate fingerprints (robust hashes used for song recognition) for it, that will be stored in a local object (as a database). Depending on the length of a song and the processing power of the pc, this process might take multiple minutes (like 2 to 4 Minutes). Because decoded songs are only saved in a local object, all processed data will be lost on a page reload or server restart. That is why a .json file will be downloaded after all processing is done, which contains the processed data for a song (its name, length and all fingerprints / hashes). On a restart / reload, only these .json files need to be provided by using the second button, removing the need for processing a song again and again. These .json-files contain all information needed for song recognition and are uploaded in an instant (only milliseconds per song-file). If songs or their corresponding .json files were uploaded, this page will show a list of currently present songs, that can be recognized by the prototype. Remember that the name of uploaded files will be used as the song name.
![song upload](./images/songs.png?raw=true "Song List")

### Record Sample
When songs have been uploaded, a song recognition can be done. The second page "Record Sample" provides all functionality needed to record a sample.
![sample page](./images/sample.png?raw=true "Sample Page")
First of all a user is allowed to choose the microphone that will be used for recording a sample, by using the dropdown menu. Next he can start a recording of his surrounding sounds, by clicking on the "Start recording" button. A 3 second countdown will start, before the recording itself begins, to allow for last adjustments. The recording itself lasts for 15 seconds and cant be canceled once started. The button itself will show the remaining time while the recording is active. After 15 seconds, the decoding of the recorded sample will start. The decoding itself takes a couple of seconds, depending on the processing power available. The text below the button will show the current process / step. When processing is done, a list of up to three possible matches will be displayed. For each song, the song name, its length, its maximum matching score and the time offset of the sample compared to the original song will be displayed.
![found songs](./images/foundSongs.png?raw=true "Found Songs")
Next all the steps used by the Shazam-Algorithm are visualy displayed. Drawing all of these will take some time, because a lot of data has to be visualized and only simple canvas implementations were used. Simply wait until all of the graphs are updated.
The first canvas that is visible will display the time domain of the recorded sample. The x-axis is representing the time, the y-axis the power of the audio-signal at each corresponding time (amplitude).
![time domain](./images/timeDomain.png?raw=true "Time Domain")
The next step / canvas presents the corresponding frequency domain / spectrum of the signal, showing all frequencies present in the recorded signal (x-axis), together with their magnitudes (y-axis). For calculating this spectrum, a FFT has been used (see function "calculateSpectrum" in the file "src/models/AudioProcessor.ts").

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
