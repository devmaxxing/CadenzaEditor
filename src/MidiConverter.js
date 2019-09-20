//import { Midi } from "@tonejs/midi";
const { Midi } = require("@tonejs/midi");

const PITCH_VALUES = Object.freeze({
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11
});

const DIFFICULTY_SETTINGS = Object.freeze({
  easy: {
    noteSize: 2,
    maxIndex: 6,
    timeThreshold: 0.25 //smallest time in seconds between two consecutive notes
  },
  normal: {
    noteSize: 1,
    maxIndex: 7,
    timeThreshold: 0.16
  },
  hard: {
    noteSize: 1,
    maxIndex: 7,
    timeThreshold: 0.1
  }
});

function noteToInt(note) {
  return 12 * note.octave + PITCH_VALUES[note.pitch];
}

function isOnBeat(note, bpm) {
  const secondsPerBeat = 60 / bpm;
  return (
    Math.abs(
      note.time - Math.round(note.time / secondsPerBeat) * secondsPerBeat
    ) < 0.01
  );
}

function convert(
  midiFile,
  trackRightHand,
  trackLeftHand,
  difficulty = "normal"
) {
  const midi = new Midi(midiFile);
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const numKeys = settings.maxIndex + 1;

  const beatmap = {
    song: midi.name,
    sections: [
      {
        bpm: midi.header.tempos[0].bpm,
        duration: midi.duration,
        notes: []
      }
    ]
  };

  const trackR = midi.tracks.find(e => e.name === trackRightHand);
  const trackL = midi.tracks.find(e => e.name === trackLeftHand);
  const tracks = [trackR];
  const currentNoteIndices = [0];
  const numNotes = [trackR.notes.length];
  if (trackL) {
    tracks.push(trackL);
    currentNoteIndices.push(0);
    numNotes.push(trackL.notes.length);
  }

  const noteMappings = [];
  // keep track of which of the previous notes we can tweak
  const adjustSections = [
    {
      startIndex: 0, // start index of section
      adjustMin: 0, // minimum value the section notes can be shifted by
      adjustMax: settings.maxIndex // maximum value the section notes can be shifted by
    }
  ];
  while (true) {
    // check if we've went through all the notes
    if (
      numNotes
        .map((total, i) => total - currentNoteIndices[i])
        .reduce((acc, cur) => acc + cur) === 0
    ) {
      break;
    }

    // find the next notes to process
    let notesToProcess = [];
    const counterIncrements = []; // keep track of which pointers need to be incremented and by how much
    let noteTime = Number.MAX_VALUE;

    for (let i = 0; i < tracks.length; i++) {
      notesToProcess.push([]);
      counterIncrements.push(0);
      const notes = tracks[i].notes;
      let noteIndex = currentNoteIndices[i];

      // clear notes and counters if we have found an earlier note
      if (notes[noteIndex].time < noteTime) {
        for (let j = 0; j < i; j++) {
          notesToProcess[j] = [];
        }
        counterIncrements.fill(0);
        noteTime = notes[noteIndex].time;
      }

      // add all notes from the track that begin at the same time
      while (
        notes[noteIndex] != undefined &&
        notes[noteIndex].time == noteTime
      ) {
        notesToProcess[i].push({
          note: noteToInt(notes[noteIndex]),
          time: noteTime
        });
        noteIndex += 1;
        counterIncrements[i] += 1;
      }
    }

    //update pointers
    for (let i = 0; i < counterIncrements.length; i++) {
      currentNoteIndices[i] += counterIncrements[i];
    }

    // reduce to one or two notes
    // take highest value of right hand
    if (notesToProcess[0].length > 0) {
      notesToProcess[0] = notesToProcess[0].reduce((acc, cur) => {
        if (acc.note < cur.note) {
          return cur;
        } else {
          return acc;
        }
      });
    }

    // take average value of left hand
    for (let i = 1; i < notesToProcess.length; i++) {
      const numNotes = notesToProcess[i].length;
      if (numNotes > 0) {
        notesToProcess[i] = notesToProcess[i].reduce((acc, cur) => {
          acc.note += cur.note;
          return acc;
        });
        notesToProcess[i].note = Math.round(notesToProcess[i].note / numNotes);
      }
    }

    // map musical note to beatmap note
    notesToProcess = notesToProcess.filter(val => val.note != undefined);
    for (let note of notesToProcess) {
      if (noteMappings.length > 0) {
        let lastElem = noteMappings[noteMappings.length - 1];

        const timeDiff = note.time - lastElem.time;
        if (timeDiff > 0 && timeDiff < settings.timeThreshold) {
          if (isOnBeat(lastElem, beatmap.sections[0].bpm)) {
            break;
          } else {
            while (
              noteMappings[noteMappings.length - 1].time === lastElem.time
            ) {
              noteMappings.pop();
            }
            lastElem = noteMappings[noteMappings.length - 1];
          }
        }

        let diff = note.note - lastElem.note;

        let sameNoteStart = noteMappings.length;
        if (diff === 0) {
          sameNoteStart = lastElem.sameNoteStart;
        }

        let freeNote = false;

        let noteMapping = lastElem.mapping + diff;
        if (noteMapping < 0 || noteMapping > settings.maxIndex) {
          // attempt to shift notes
          let shiftAmount = -noteMapping; //shift up if negative
          if (noteMapping > settings.maxIndex) {
            //otherwise shift down
            shiftAmount = settings.maxIndex - noteMapping;
          }

          const lastSection = adjustSections[adjustSections.length - 1];

          if (
            shiftAmount >= lastSection.adjustMin &&
            shiftAmount <= lastSection.adjustMax
          ) {
            // shift the notes
            for (let i = lastSection.startIndex; i < noteMappings.length; i++) {
              noteMappings[i].mapping += shiftAmount;
            }
            noteMapping += shiftAmount;
            lastSection.adjustMax -= shiftAmount;
            lastSection.adjustMin -= shiftAmount;
          } else {
            // can't shift section notes without changing diffs, do a modulo instead of shifting
            noteMapping = ((noteMapping % numKeys) + numKeys) % numKeys;
            freeNote = true;
          }
        } else {
          // no shifting required
        }

        // avoid duplicate/overlapping notes
        if (
          note.time != lastElem.time ||
          Math.abs(noteMapping - lastElem.mapping) >= settings.noteWidth
        ) {
          //update adjust indices
          if (!freeNote) {
            if (lastElem.diff != null && diff * lastElem.diff < 0) {
              // local min or max: update adjust section
              adjustSections[0].startIndex = lastElem.sameNoteStart;
              if (diff > 0) {
                //local min
                adjustSections[0].adjustMax = 0;
                adjustSections[0].adjustMin = -lastElem.mapping;
              } else {
                //local max
                adjustSections[0].adjustMin = 0;
                adjustSections[0].adjustMax =
                  settings.maxIndex - lastElem.mapping;
              }
            }

            adjustSections[0].adjustMax = Math.min(
              adjustSections[0].adjustMax,
              settings.maxIndex - noteMapping
            );

            adjustSections[0].adjustMin = Math.max(
              adjustSections[0].adjustMin,
              -noteMapping
            );
          } else {
            // free note: update adjust section
            adjustSections[0].startIndex = sameNoteStart;
            adjustSections[0].adjustMax = settings.maxIndex - noteMapping;
            adjustSections[0].adjustMin = -noteMapping;
          }

          noteMappings.push({
            note: note.note,
            time: note.time,
            mapping: noteMapping,
            diff: diff,
            sameNoteStart: sameNoteStart
          });
        }
      } else {
        //first note
        noteMappings.push({
          note: note.note,
          time: note.time,
          mapping: 0,
          diff: null,
          sameNoteStart: 0
        });
      }
    }
  }

  for (let note of noteMappings) {
    beatmap.sections[0].notes.push([
      0,
      note.mapping,
      note.time * 1000,
      settings.noteSize
    ]);
  }
  return beatmap;
}

exports.convert = convert;
