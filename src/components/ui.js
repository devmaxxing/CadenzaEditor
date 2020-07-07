const FileSaver = require("file-saver");
const JSZip = require("jszip");
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
      document.getElementById("song").value = document.getElementById("import-audio").files[0].name.replace(/\.[^/.]+$/, "");
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

    document.getElementById("export-button").onclick = () => {
      if (document.getElementById("import-audio").files.length == 0) {
        alert("Please import an audio file");
        return;
      }
      // build the beatmap file
      const sections = stateManager.state.sections;
      const beatmap = {
        song: document.getElementById("song").value,
        songFile: document.getElementById("import-audio").files[0].name,
        image: "",
        artist: document.getElementById("artist").value,
        mapper: document.getElementById("mapper").value,
        difficulty: 0, // defaulting to EASY for now
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

      const imageFile = document.getElementById("image").files[0];
      if (imageFile) {
        beatmap.image = imageFile.name;
      }

      // export file
      const blob = new Blob([JSON.stringify(beatmap)], {
        type: "text/plain;charset=utf-8"
      });

      // zip beatmap with music and image
      const zip = new JSZip();
      const songName = beatmap.song.replace(/\.[^/.]+$/, "");
      zip.file(songName + ".json", blob);
      fetch(this.audio.src).then(r => {
        zip.file(beatmap.songFile, r.blob());
        if (imageFile) {
          fetch(URL.createObjectURL(imageFile)).then(r => {
            zip.file(imageFile.name, r.blob());
            zip.generateAsync({type:"blob"}).then(file => FileSaver.saveAs(file, songName + ".zip"));
          });
        } else {
          zip.generateAsync({type:"blob"}).then(file => FileSaver.saveAs(file, songName + ".zip"));
        }
      });
    };

    document.getElementById("import-file").onchange = () => {
      const file = document.getElementById("import-file").files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const zip = new JSZip();
        zip.loadAsync(reader.result).then(() => {
          zip.forEach((path, file) => {
            if (path.endsWith(".json")) {
              file.async("text").then(text => {
                const beatmap = JSON.parse(text);
                // set the song
                document.getElementById("song").value = beatmap.song;

                // set artist
                document.getElementById("artist").value = beatmap.artist;
  
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
              });
            } else {
              file.async("blob").then(blob => {
                this.audio.src = URL.createObjectURL(blob);
              });
            }
          });
        });
      };
      reader.readAsArrayBuffer(file);
    };

    document.getElementById("snap-input").onchange = function(e) {
      stateManager.toggleSnap();
    },

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

  setSnapEnabled(isSnapEnabled) {
    document.getElementById("snap-input").checked = isSnapEnabled;
  },

  setBeatmapProperties(bpm, duration) {
    document.getElementById("bpm").value = bpm;
    document.getElementById("duration").value = duration;
  },

  setSelectedNotesDisabled(disabled, disableDuration = false) {
    document.getElementById("selected-note-type").disabled = disabled;
    document.getElementById("selected-note-duration").disabled = disabled || disableDuration;
    document.getElementById("selected-note-start-time").disabled = disabled;
    document.getElementById("selected-note-width").disabled = disabled;
  },

  setSelectedNote(note) {
    this.setSelectedNotesDisabled(false, note.type != NOTE_TYPES.HOLD);
    document.getElementById("selected-note-type").value = note.type;
    document.getElementById("selected-note-duration").value = note.duration;
    document.getElementById("selected-note-start-time").value = note.x;
    document.getElementById("selected-note-width").value = note.width;
  }
});
