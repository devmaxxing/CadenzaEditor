import { State } from "../models/state";
import { Note } from "../models/note";
import findNote from "../utils/search";
import { UI } from "./ui";
import { NOTE_TYPES } from "../constants/note-types";

export const StateManager = (graphics, app, ui) => ({
  state: State(),
  audioTime: 0,
  ui: ui,
  graphics,
  app,

  init() {
    ui.init(this);
    app.ticker.add(() => {
      if (!this.ui.audio.paused && this.state.sections[0].bpm) {
        this.audioTime += app.ticker.elapsedMS;
        this.graphics.setViewportMilliseconds(
          this.audioTime,
          this.state.sections[0].bpm
        );
      }
    });
  },

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
    const original = this.state.getNote(noteCoord);
    return Note(original.type, original.x, original.y, original.width);
  },

  deselectNote(note) {
    this.graphics.deselectNote(note);
    this.state.selectedNotes.delete(note.getCoordinates());
    if (this.state.selectedNotes.size == 1) {
      this.ui.setSelectedNote(note);
    } else {
      this.ui.setSelectedNotesDisabled(true);
    }
  },

  deselectAllNotes() {
    for (let noteCoord of this.state.selectedNotes) {
      this.deselectNote(this.state.getNote(noteCoord));
    }
    this.ui.setSelectedNotesDisabled(true);
  },

  selectNote(note) {
    this.graphics.selectNote(note);
    this.state.selectedNotes.add(note.getCoordinates());
    if (this.state.selectedNotes.size == 1) {
      this.ui.setSelectedNote(note);
    } else {
      this.ui.setSelectedNotesDisabled(true);
    }
  },

  setSelectedNoteType(type) {
    for (let noteCoord of this.state.selectedNotes) {
      const note = this.state.getNote(noteCoord);
      this.state.updateNoteType(note, type);
      this.graphics.updateNote(note, this.state.sections[0].bpm);
    }
  },

  setSelectedNoteDuration(duration) {
    for (let noteCoord of this.state.selectedNotes) {
      const note = this.state.getNote(noteCoord);
      if (note.type == NOTE_TYPES.HOLD) {
        this.state.updateNoteDuration(note, duration);
        this.graphics.updateNote(note, this.state.sections[0].bpm);
      }
    }
  },

  addNote(note) {
    this.state.addNote(note);
    this.graphics.createNote(note, this.state.sections[0].bpm);
  },

  // TODO support different note types
  addNewNote(x, y) {
    const newNote = Note(
      this.state.currentNoteType,
      x,
      y,
      this.state.currentNoteWidth
    );
    this.state.addNote(newNote);
    this.graphics.createNote(newNote, this.state.sections[0].bpm);
  },

  removeNote(note) {
    this.state.deleteNote(note);
    this.graphics.destroyNote(note);
  },

  removeSelectedNotes() {
    for (let noteCoord of this.state.selectedNotes) {
      const note = this.state.getNote(noteCoord);
      this.deselectNote(note);
      this.removeNote(note);
    }
  },

  removeAllNotes() {
    this.deselectAllNotes();
    for (let noteMap of this.state.sections[0].notes) {
      for (let note of Object.values(noteMap)) {
        this.removeNote(note);
      }
    }
  },

  setCurrentNoteType(noteType) {
    this.state.currentNoteType = noteType;
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
    console.log(this.state);
    const targetPosition = this.graphics.viewport.toWorld(
      this.state.placementPoint.x,
      this.state.placementPoint.y
    );
    const millisecondsPerXUnit =
      60000 / this.graphics.beatWidth / this.state.sections[0].bpm;
    targetPosition.x = Math.round(targetPosition.x * millisecondsPerXUnit);
    targetPosition.y = this.graphics.getKeyAtY(targetPosition.y);
    console.log("Finding note at " + JSON.stringify(targetPosition));
    return findNote(
      targetPosition.x,
      targetPosition.y,
      this.state.sections[0].notes,
      millisecondsPerXUnit
    );
  },

  refreshGridLines() {
    const state = this.state;
    this.graphics.renderGridLines(
      state.sections[0].bpm,
      state.sections[0].duration,
      state.snapInterval
    );
  },

  moveNoteCursor(moveData) {
    const worldPoint = this.graphics.viewport.toWorld(
      moveData.getLocalPosition(this.app.stage)
    );

    let targetWorldX = worldPoint.x;

    const snapY = this.graphics.getNoteLaneHeight();
    const targetWorldY =
      Math.round(worldPoint.y / snapY) * snapY -
      this.graphics.viewportOffsetY / 2;

    if (this.state.snapEnabled) {
      //find closest snap point
      const snapX = this.graphics.beatWidth / this.state.snapInterval;
      targetWorldX = Math.round(worldPoint.x / snapX) * snapX;
    }

    this.state.placementPoint = this.graphics.viewport.toScreen(
      targetWorldX,
      targetWorldY
    );
    this.graphics.drawNoteCursor(
      this.state.placementPoint,
      this.state.currentNoteType,
      this.state.currentNoteWidth
    );
  },

  zoomX(zoomAmount) {
    this.graphics.zoomX(zoomAmount);
    this.refreshGridLines();
  },

  toggleSnap() {
    this.state.snapEnabled = !this.state.snapEnabled;
  },

  setAudioTime(seconds) {
    this.audioTime = seconds * 1000;
  },

  setAudioTimeFromViewportPosition() {
    const viewportX = this.graphics.viewport.corner.x + 25;
    this.ui.audio.currentTime =
      viewportX /
      this.graphics.getXUnitsPerMillisecond(this.state.sections[0].bpm) /
      1000;
  }
});
