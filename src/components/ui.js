const FileSaver = require("file-saver");
import { Note } from "../models/note";
import { NOTE_TYPES } from "../constants/note-types";

/**
 *
 * @param {StateManager} stateManager
 */
export default function registerUiHandlers(stateManager) {
  document.getElementById("bpm").onchange = function(e) {
    stateManager.setBpm(parseFloat(this.value));
  };

  document.getElementById("snap-interval").onchange = function(e) {
    stateManager.setSnapInterval(parseInt(this.value));
  };

  document.getElementById("note-width").onchange = function(e) {
    stateManager.setCurrentNoteWidth(parseInt(this.value));
  };

  document.getElementById("duration").onchange = function(e) {
    stateManager.setDuration(parseFloat(this.value));
  };

  document.getElementById("export-button").onclick = function(e) {
    // build the beatmap file
    const sections = stateManager.state.sections;
    const beatmap = {
      song: document.getElementById("song").value,
      sections: sections.map(section => {
        let obj = {
          bpm: section.bpm,
          duration: section.duration,
          notes: Object.values(section.notes)
            .map(note => {
              return [
                note.type,
                (note.y - stateManager.graphics.getStartY()) /
                  stateManager.graphics.getNoteLaneHeight(),
                Math.round(
                  (note.x / stateManager.state.beatWidth / sections[0].bpm) *
                    60000
                ),
                note.width
              ];
            })
            .sort(function(a, b) {
              return a[2] > b[2];
            })
        };
        return obj;
      })
    };

    // export file
    const blob = new Blob([JSON.stringify(beatmap)], {
      type: "text/plain;charset=utf-8"
    });
    FileSaver.saveAs(blob, "beatmap.json");
  };

  // document.getElementById("import-midi").onchange = function() {
  //   const file = this.files[0];
  //   const reader = new FileReader();
  //   reader.onload = function(e) {
  //     const beatmap = MidiConverter.convert(reader.result, "upper", "lower");
  //     // set the song
  //     document.getElementById("song").value = beatmap.song;

  //     // process each section
  //     // TODO process more than one section
  //     const section = beatmap.sections[0];

  //     document.getElementById("bpm").value = section.bpm;
  //     sections[0].bpm = section.bpm;

  //     document.getElementById("duration").value = section.duration;
  //     sections[0].duration = section.duration;
  //     const startY = (-1 * viewport.worldHeight) / 2;

  //     for (let note of section.notes) {
  //       //console.log(note);
  //       const targetX = (note[2] / 60000) * section.bpm * beatWidth; //convert time in milliseconds to pixels
  //       const targetY = note[1] * 80 + startY;
  //       let noteWidth = 1;
  //       if (note.length > 3) {
  //         noteWidth = note[3];
  //       }
  //       addNote(createNote(targetX, targetY, noteWidth));
  //     }
  //   };
  //   reader.readAsBinaryString(file);
  // };

  document.getElementById("import-file").onchange = function(e) {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const beatmap = JSON.parse(reader.result);
      // set the song
      document.getElementById("song").value = beatmap.song;

      // process each section
      // TODO process more than one section
      const section = beatmap.sections[0];

      document.getElementById("bpm").value = section.bpm;
      stateManager.setBpm(section.bpm);

      document.getElementById("duration").value = section.duration;
      stateManager.setDuration(section.duration);
      const startY = (-1 * stateManager.graphics.viewport.worldHeight) / 2;

      for (let note of section.notes) {
        //console.log(note);
        const noteType = note[0];
        const noteKey = note[1];
        const noteTime = note[2];
        const noteWidth = note[3];

        const targetX =
          (noteTime / 60000) * section.bpm * stateManager.state.beatWidth; //convert time in milliseconds to pixels
        const targetY =
          noteKey * stateManager.graphics.getNoteLaneHeight() + startY;
        stateManager.addNote(Note(noteType, targetX, targetY, noteWidth));
      }
    };
    reader.readAsText(file);
  };

  document.getElementById("clear-button").onclick = function(e) {
    stateManager.removeAllNotes();
  };
}
