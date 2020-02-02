import { Point } from "pixi.js";
import findNote from "../utils/binary-search";

export const State = () => ({
  snapInterval: 1,
  beatWidth: 120,
  currentNoteWidth: 1,
  notePlacementEnabled: true,
  sections: [
    {
      bpm: null,
      duration: null,
      notes: {}
    }
  ],
  selectedNotes: new Set(),
  noteIndex: [], //TODO merge this with section notes.
  placementPoint: new Point(),

  addNote(note) {
    this.sections[0].notes[note.x + "," + note.y] = note;
    this.indexNote(note);
  },

  deleteNote(noteCoord) {
    this.removeNoteFromIndex(this.sections[0].notes[noteCoord]);
    delete this.sections[0].notes[noteCoord];
  },

  removeNoteFromIndex(note) {
    const index = findNote(note.x, note.y, this.noteIndex).index;
    const noteData = this.noteIndex[index];
    if (noteData[1].length > 1) {
      noteData[1].splice(noteData[1].indexOf(note.y), 1);
    } else {
      // remove the entry
      this.noteIndex.splice(index, 1);
    }
  },

  indexNote(note) {
    const noteIndex = this.noteIndex;
    if (noteIndex.length == 0) {
      noteIndex.push([note.x, [note.y]]);
    } else {
      // assuming we only index non duplicate notes
      let index = findNote(note.x, note.y, noteIndex).index;
      let noteData = noteIndex[index];
      if (noteData && noteData[0] == note.x) {
        // existing note at same x position
        noteData[1].push(note.y);
      } else {
        noteIndex.splice(index, 0, [note.x, [note.y]]);
      }
    }
    //console.log("New index: " + noteIndex);
  }
});
