import { Point } from "pixi.js";

export const State = () => ({
  snapEnabled: false,
  snapInterval: 1,
  beatWidth: 120,
  currentNoteWidth: 1,
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
      this.sections[0].notes[note.y][note.x] = note;
    }
  },

  deleteNote(note) {
    delete this.sections[0].notes[note.y][note.x];
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
