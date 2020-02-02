import { State } from "../models/state";
import { Note } from "../models/note";
import { NOTE_TYPES } from "../constants/note-types";
import findNote from "../utils/binary-search";

export const StateManager = (graphics, app) => ({
  state: State(),
  graphics,
  app,

  pasteSelection(x, y) {
    if (this.state.selectedNotes.size > 0) {
      // copy selected notes and find upper leftmost note
      const newNotes = [];
      let upperLeftNote = null;
      for (let noteCoord of this.state.selectedNotes) {
        let noteCopy = this.copyNote(noteCoord);
        if (
          upperLeftNote === null ||
          noteCopy.x < upperLeftNote.x ||
          (noteCopy.x === upperLeftNote.x && noteCopy.y < upperLeftNote.y)
        ) {
          upperLeftNote = noteCopy;
        }
        newNotes.push(noteCopy);
      }
      // translate the copied notes such that upper leftmost note is in correct position
      // and add the notes
      const transX = x - upperLeftNote.x;
      const transY = y - upperLeftNote.y;
      for (let note of newNotes) {
        note.x += transX;
        note.y += transY;
        this.addNote(note);
      }
    }
  },

  copyNote(noteCoord) {
    const original = this.state.sections[0].notes[noteCoord];
    return Note(original.type, original.x, original.y, original.width);
  },

  deselectNote(noteCoord) {
    this.graphics.deselectNote(noteCoord);
    this.state.selectedNotes.delete(noteCoord);
  },

  deselectAllNotes() {
    for (let noteCoord of this.state.selectedNotes) {
      this.deselectNote(noteCoord);
    }
  },

  selectNote(x, y) {
    const noteCoord = x + "," + y;
    this.graphics.selectNote(noteCoord);
    this.state.selectedNotes.add(noteCoord);
  },

  addNote(note) {
    this.state.addNote(note);
    this.graphics.createNote(note);
  },

  // TODO support different note types
  addNewNote(x, y) {
    const newNote = Note(NOTE_TYPES.HIT, x, y, this.state.currentNoteWidth);
    this.state.addNote(newNote);
    this.graphics.createNote(newNote);
  },

  removeNote(noteCoord) {
    this.state.deleteNote(noteCoord);
    this.graphics.destroyNote(noteCoord);
  },

  removeSelectedNotes() {
    for (let noteCoord of this.state.selectedNotes) {
      this.deselectNote(noteCoord);
      this.removeNote(noteCoord);
    }
  },

  removeAllNotes() {
    for (let noteCoord of Object.keys(this.state.sections[0].notes)) {
      this.removeNote(noteCoord);
    }
  },

  setCurrentNoteWidth(noteWidth) {
    this.state.currentNoteWidth = noteWidth;
    // TODO update placement note graphic
  },

  setBpm(bpm) {
    this.state.sections[0].bpm = bpm;
    this.refreshGridLines();
  },

  setDuration(duration) {
    this.state.sections[0].duration = duration;
    this.refreshGridLines();
  },

  setSnapInterval(snapInterval) {
    this.state.snapInterval = snapInterval;
    this.refreshGridLines();
  },

  getNoteUnderCursor() {
    const targetPosition = this.graphics.viewport.toWorld(
      this.state.placementPoint.x,
      this.state.placementPoint.y
    );
    targetPosition.x = Number(targetPosition.x.toFixed(4));
    targetPosition.y = Number(targetPosition.y.toFixed(4));
    return findNote(targetPosition.x, targetPosition.y, this.state.noteIndex);
  },

  refreshGridLines() {
    const state = this.state;
    this.graphics.renderGridLines(
      state.sections[0].bpm,
      state.sections[0].duration,
      state.beatWidth,
      state.snapInterval
    );
  },

  moveNoteCursor(moveData) {
    const worldPoint = this.graphics.viewport.toWorld(
      moveData.getLocalPosition(this.app.stage)
    );
    //find closest snap point
    const snapX = this.state.beatWidth / this.state.snapInterval;
    const snapY = this.graphics.getNoteLaneHeight();
    let targetWorldX = Math.round(worldPoint.x / snapX) * snapX;
    let targetWorldY =
      Math.round(worldPoint.y / snapY) * snapY -
      this.graphics.viewportOffsetY / 2;

    this.state.placementPoint = this.graphics.viewport.toScreen(
      targetWorldX,
      targetWorldY
    );
    this.graphics.drawNoteCursor(this.state.placementPoint);
  },

  zoomX(zoomAmount) {
    this.graphics.zoomX(zoomAmount);
    this.refreshGridLines();
  }
});
