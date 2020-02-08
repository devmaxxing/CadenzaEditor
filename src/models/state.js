import { Point } from "pixi.js";
import { NOTE_TYPES } from "../constants/note-types";

export const State = () => ({
  snapEnabled: false,
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
        if (note.type == NOTE_TYPES.HOLD) {
          this.sections[0].notes[note.y + i][note.x + note.duration] = note;
        }
      }
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
  }
});
