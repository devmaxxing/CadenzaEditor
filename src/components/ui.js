const FileSaver = require("file-saver");
import { Note } from "../models/note";
import { NOTE_TYPES } from "../constants/note-types";

export const UI = () => ({
  audio: new Audio(),
  init(stateManager) {
    this.audio.addEventListener("timeupdate", () => {
      stateManager.setAudioTime(this.audio.currentTime);
      document.getElementById("current-audio-time").value =
        this.audio.currentTime * 1000;

      if (this.audio.ended) {
        document.getElementById("current-audio-time").value = 0;
        document.getElementById("audio-play-button").innerText = "Play";
      }
    });

    document.getElementById("audio-play-button").onclick = () => {
      if (this.audio.paused) {
        this.audio.play();
        document.getElementById("audio-play-button").innerText = "Pause";
      } else {
        this.audio.pause();
        document.getElementById("audio-play-button").innerText = "Play";
      }
    };

    document.getElementById("import-audio").onchange = () => {
      this.audio.src = URL.createObjectURL(
        document.getElementById("import-audio").files[0]
      );
    };

    document.getElementById("selected-note-type").onchange = function() {
      stateManager.setSelectedNoteType(parseInt(this.value));
    };

    document.getElementById("selected-note-duration").onchange = function() {
      stateManager.setSelectedNoteDuration(parseInt(this.value));
    };

    document.getElementById("selected-note-width").onchange = function() {
      stateManager.setSelectedNoteWidth(parseInt(this.value));
    };

    document.getElementById("bpm").onchange = function(e) {
      stateManager.setBpm(parseFloat(this.value));
    };

    document.getElementById("snap-interval").onchange = function(e) {
      stateManager.setSnapInterval(parseInt(this.value));
    };

    document.getElementById("note-type-select").onchange = function(e) {
      stateManager.setCurrentNoteType(parseInt(this.value));
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
        sections: sections.map((section, i) => {
          let obj = {
            bpm: section.bpm,
            duration: section.duration,
            notes: stateManager.state
              .getSortedNoteArray(i)
              .map(note => [
                note.type,
                note.y,
                note.x,
                note.width,
                note.x + note.duration
              ])
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

        for (let note of section.notes) {
          //console.log(note);
          const noteType = note[0];
          const noteKey = note[1];
          const noteTime = note[2];
          const noteWidth = note[3];
          let noteDuration = 0;
          if (noteType == NOTE_TYPES.HOLD) {
            noteDuration = note[4] - noteTime;
          }
          stateManager.addNote(
            Note(noteType, noteTime, noteKey, noteWidth, noteDuration)
          );
        }
      };
      reader.readAsText(file);
    };

    document.getElementById("clear-button").onclick = function(e) {
      stateManager.removeAllNotes();
    };

    stateManager.setBpm(document.getElementById("bpm").value);
    stateManager.setDuration(document.getElementById("duration").value);
    stateManager.setSnapInterval(
      parseInt(document.getElementById("snap-interval").value)
    );
    stateManager.setCurrentNoteWidth(
      parseInt(document.getElementById("note-width").value)
    );
  },

  setSelectedNotesDisabled(disabled) {
    document.getElementById("selected-note-type").disabled = disabled;
    document.getElementById("selected-note-duration").disabled = disabled;
    document.getElementById("selected-note-start-time").disabled = disabled;
    document.getElementById("selected-note-width").disabled = disabled;
  },

  setSelectedNote(note) {
    this.setSelectedNotesDisabled(false);
    document.getElementById("selected-note-type").value = note.type;
    document.getElementById("selected-note-duration").value = note.duration;
    document.getElementById("selected-note-start-time").value = note.x;
    document.getElementById("selected-note-width").value = note.width;
  }
});
