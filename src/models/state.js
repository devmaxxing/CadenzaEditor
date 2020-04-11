import { Point } from "pixi.js";
import { NOTE_TYPES } from "../constants/note-types";

export const State = () => ({
  snapEnabled: true,
  snapInterval: 1,
  currentNoteWidth: 1,
  currentNoteType: NOTE_TYPES.HIT,
  notePlacementEnabled: true,
  sections: [
    {
      bpm: null,
      duration: null,
      notes: [{}, {}, {}, {}, {}, {}, {}, {}]
    }
  ],
  selectedNotes: new Set(),
  noteIndex: {}, //TODO merge this with section notes.
  placementPoint: new Point(),

  addNote(note) {
    if (note.isValid()) {
      for (let i = 0; i < note.width; i++) {
        this.sections[0].notes[note.y + i][note.x] = note;
        if (note.type == NOTE_TYPES.HOLD && note.duration > 0) {
          this.sections[0].notes[note.y + i][note.x + note.duration] = note;
        }
      }
    }
  },

  hasNote(note) {
    return (
      note.isValid() && this.sections[0].notes[note.y].hasOwnProperty(note.x)
    );
  },

  updateNoteWidth(note, width) {
    if (this.hasNote(note) && note.width != width) {
      if (note.width > width) {
        for (let i = 1; i < note.width; i++) {
          delete this.sections[0].notes[note.y + i][note.x + note.duration];
        }
      } else {
        if (note.y + width > 8) {
          // too wide don't change the width
          return;
        }
        for (let i = note.width; i < width; i++) {
          this.sections[0].notes[note.y + i][note.x] = note;
          if (note.type == NOTE_TYPES.HOLD && note.duration > 0) {
            this.sections[0].notes[note.y + i][note.x + note.duration] = note;
          }
        }
      }
      note.width = width;
    }
  },

  updateNoteType(note, noteType) {
    if (this.hasNote(note) && note.type != noteType) {
      if (note.type == NOTE_TYPES.HOLD && note.duration > 0) {
        for (let i = 0; i < note.width; i++) {
          delete this.sections[0].notes[note.y + i][note.x + note.duration];
        }
        note.duration = 0;
      }

      note.type = noteType;
    }
  },

  updateNoteDuration(note, newDuration) {
    if (this.hasNote(note) && note.type == NOTE_TYPES.HOLD) {
      for (let i = 0; i < note.width; i++) {
        if (note.duration > 0) {
          delete this.sections[0].notes[note.y + i][note.x + note.duration];
        }
        this.sections[0].notes[note.y + i][note.x + newDuration] = note;
      }
      note.duration = newDuration;
    }
  },

  deleteNote(note) {
    for (let i = 0; i < note.width; i++) {
      delete this.sections[0].notes[note.y + i][note.x];
      if (note.type == NOTE_TYPES.HOLD) {
        delete this.sections[0].notes[note.y + i][note.x + note.duration];
      }
    }
  },

  getNote(noteCoord) {
    const coordinates = noteCoord.split(",");
    const y = Number(coordinates[1]);
    const x = coordinates[0];
    if (Number.isInteger(y) && y < 8 && y > -1) {
      return this.sections[0].notes[y][x];
    }
    return null;
  },

  getSortedNoteArray(sectionNumber) {
    const processedNotes = new Set([]);
    for (let noteMap of this.sections[sectionNumber].notes) {
      for (let note of Object.values(noteMap)) {
        processedNotes.add(note);
      }
    }

    return Array.from(processedNotes).sort(function(a, b) {
      if (a.x == b.x) {
        return a.y > b.y;
      }
      return a.x > b.x;
    });
  }
});
