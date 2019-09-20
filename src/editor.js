import * as PIXI from "pixi.js";
import * as MidiConverter from "./MidiConverter";
import { Viewport } from "pixi-viewport";
import hotkeys from "hotkeys-js";

var FileSaver = require("file-saver");
const NOTE_TYPES = {
  BASIC: 0
};

let snapInterval = 1;
let beatWidth = 120;
let currentNoteWidth = 1;
let notePlacementEnabled = true;
const sections = [
  {
    bpm: null,
    duration: null,
    notes: {}
  }
];
const selectedNotes = new Set();

let noteIndex = []; //TODO merge this with section notes.

const app = new PIXI.Application({
  height: 640,
  width: 1200
});
const graphics = new PIXI.Graphics();
document.body.appendChild(app.view);

const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: 1200,
  worldHeight: 640,
  interaction: app.renderer.plugins.interaction
});

app.stage.addChild(viewport);

// activate plugins
viewport
  .drag({
    direction: "x"
  })
  .clamp({
    left: -25,
    right: viewport.worldWidth
  });

viewport.addChild(graphics);

// placement point
let placementPoint = new PIXI.Point();

let overlayGraphics = new PIXI.Graphics();
app.stage.addChild(overlayGraphics);
app.ticker.add(() => {
  overlayGraphics.clear();
  overlayGraphics.moveTo(placementPoint.x, placementPoint.y);
  overlayGraphics.beginFill(0xff0000);
  overlayGraphics.drawRect(placementPoint.x - 2, placementPoint.y, 5, 80);
  overlayGraphics.endFill();
});

// default values
sections[0].bpm = document.getElementById("bpm").value;
sections[0].duration = document.getElementById("bpm").value;
snapInterval = parseInt(document.getElementById("snap-interval").value);
currentNoteWidth = parseInt(document.getElementById("note-width").value);
renderGridLines();

document.addEventListener("wheel", e => {
  const newX = viewport.transform.scale.x - 0.01 * e.deltaY;
  viewport.transform.scale.set(newX, 1);
  renderGridLines();
});

viewport.addListener("mousemove", e => {
  let worldPoint = viewport.toWorld(e.data.getLocalPosition(app.stage));

  //find closest snap point
  const snapX = beatWidth / snapInterval;
  const snapY = 80;
  let targetWorldX = Math.round(worldPoint.x / snapX) * snapX;
  let targetWorldY = Math.round(worldPoint.y / snapY) * snapY;

  placementPoint = viewport.toScreen(targetWorldX, targetWorldY);
});

viewport.addListener("click", e => {
  if (notePlacementEnabled) {
    let targetPosition = viewport.toWorld(placementPoint.x, placementPoint.y);
    const noteData = findNote(targetPosition.x, targetPosition.y, noteIndex);
    if (!noteData[1]) {
      if (hotkeys.isPressed("ctrl")) {
        pasteSelection(targetPosition.x, targetPosition.y);
      } else {
        addNote(
          createNote(targetPosition.x, targetPosition.y, currentNoteWidth)
        );
      }
    } else if (hotkeys.isPressed("shift")) {
      selectNote(noteIndex[noteData[0]][0] + "," + targetPosition.y);
    } else {
      for (let noteCoord of selectedNotes) {
        deselectNote(noteCoord);
      }
      selectNote(noteIndex[noteData[0]][0] + "," + targetPosition.y);
    }
  }
});

// deselect all
hotkeys("alt+d", function() {
  for (let noteCoord of selectedNotes) {
    deselectNote(noteCoord);
  }
});

// remove selected
hotkeys("alt+r", function() {
  for (let noteCoord of selectedNotes) {
    deselectNote(noteCoord);
    deleteNote(noteCoord);
  }
});

function findNote(noteX, noteY, arr) {
  return bstNote(noteX, noteY, arr, 0, arr.length);
}

function bstNote(noteX, noteY, arr, start, end) {
  if (start == end)
    // no note found return index of insertion
    return [start, false];

  const pivot = ((start + end) / 2) >> 0;
  const diff = arr[pivot][0] - noteX;
  //console.log("Searching indices: " + start + ", " + end + " Pivot: " + pivot);
  if (Math.abs(diff) < 0.000001) {
    return [pivot, arr[pivot][1].indexOf(noteY) != -1];
  } else if (diff < 0) {
    return bstNote(noteX, noteY, arr, pivot + 1, end);
  } else {
    return bstNote(noteX, noteY, arr, start, pivot);
  }
}

function pasteSelection(x, y) {
  // copy selected notes and find upper leftmost note
  const newNotes = [];
  let upperLeftNote = null;
  for (let noteCoord of selectedNotes) {
    let noteCopy = copyNote(noteCoord);
    if (
      upperLeftNote === null ||
      noteCopy.x < upperLeftNote.x ||
      (noteCopy.x === upperLeftNote.x && noteCopy.y === upperLeftNote.y)
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
    note.sprite.x += transX;
    note.sprite.y += transY;
    note.x += transX;
    note.y += transY;
    addNote(note);
  }
}

function copyNote(noteCoord) {
  const original = sections[0].notes[noteCoord];
  const copy = {
    type: original.type,
    x: original.x,
    y: original.y,
    width: original.width,
    sprite: new PIXI.Sprite(PIXI.Texture.WHITE)
  };
  copy.sprite.width = original.sprite.width;
  copy.sprite.height = original.sprite.height;
  copy.sprite.tint = 0xff0000;
  copy.sprite.x = original.x - 2;
  copy.sprite.y = original.y;
  return copy;
}

function deselectNote(noteCoord) {
  sections[0].notes[noteCoord].sprite.tint = 0xff0000;
  selectedNotes.delete(noteCoord);
}

function selectNote(noteCoord) {
  // console.log(noteCoord);
  // console.log(sections[0].notes);
  sections[0].notes[noteCoord].sprite.tint = 0x0000ff;
  selectedNotes.add(noteCoord);
}

function deleteNote(noteCoord) {
  sections[0].notes[noteCoord].sprite.destroy();
  removeNoteFromIndex(sections[0].notes[noteCoord]);
  delete sections[0].notes[noteCoord];
}

function createNote(x, y, noteWidth) {
  let note = {
    type: NOTE_TYPES.BASIC,
    x: x,
    y: y,
    width: noteWidth
  };
  let noteSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
  noteSprite.width = 5;
  noteSprite.height = 80 * noteWidth;
  noteSprite.tint = 0xff0000;
  noteSprite.x = x - 2;
  noteSprite.y = y;
  note.sprite = noteSprite;
  return note;
}

function removeNoteFromIndex(note) {
  let index = findNote(note.x, note.y, noteIndex)[0];
  let noteData = noteIndex[index];
  if (noteData[1].length > 1) {
    noteData[1].splice(noteData[1].indexOf(note.y), 1);
  } else {
    // remove the entry
    noteIndex.splice(index, 1);
  }
}

function indexNote(note) {
  if (noteIndex.length == 0) {
    noteIndex.push([note.x, [note.y]]);
  } else {
    // assuming we only index non duplicate notes
    let index = findNote(note.x, note.y, noteIndex)[0];
    let noteData = noteIndex[index];
    //console.log("Notes at index" + index + ": " + noteData);
    if (noteData && Math.abs(noteData[0] - note.x) < 0.000001) {
      // existing note at same x position
      noteData[1].push(note.y);
    } else {
      noteIndex.splice(index, 0, [note.x, [note.y]]);
    }
  }
  //console.log("New index: " + noteIndex);
}

function addNote(note) {
  viewport.addChild(note.sprite);
  sections[0].notes[note.x + "," + note.y] = note;
  indexNote(note);
  //console.log("Added note: " + note.x + "," + note.y);
}

viewport.on("drag-start", () => {
  notePlacementEnabled = false;
});
viewport.on("drag-end", () => {
  notePlacementEnabled = true;
});

document.getElementById("bpm").onchange = function(e) {
  sections[0].bpm = parseFloat(this.value);
  renderGridLines();
};

document.getElementById("snap-interval").onchange = function(e) {
  snapInterval = parseInt(this.value);
  renderGridLines();
};

document.getElementById("note-width").onchange = function(e) {
  currentNoteWidth = parseInt(this.value);
};

document.getElementById("duration").onchange = function(e) {
  sections[0].duration = parseFloat(this.value);
  renderGridLines();
};

document.getElementById("export-button").onclick = function(e) {
  //console.log(sections[0].notes);
  // build the beatmap file
  let beatmap = {
    song: document.getElementById("song").value,
    sections: sections.map(section => {
      let obj = {
        bpm: section.bpm,
        duration: section.duration,
        notes: Object.values(section.notes)
          .map(note => {
            let beatMapNote = [
              note.type,
              note.y / 80,
              (note.x / beatWidth / sections[0].bpm) * 60000,
              note.width
            ];
            return beatMapNote;
          })
          .sort(function(a, b) {
            return a[2] > b[2];
          })
      };
      return obj;
    })
  };

  // export file
  //console.log(beatmap);
  let blob = new Blob([JSON.stringify(beatmap)], {
    type: "text/plain;charset=utf-8"
  });
  FileSaver.saveAs(blob, "beatmap.json");
};

document.getElementById("import-midi").onchange = function() {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const beatmap = MidiConverter.convert(reader.result, "upper", "lower");
    // set the song
    document.getElementById("song").value = beatmap.song;

    // process each section
    // TODO process more than one section
    const section = beatmap.sections[0];

    document.getElementById("bpm").value = section.bpm;
    sections[0].bpm = section.bpm;

    document.getElementById("duration").value = section.duration;
    sections[0].duration = section.duration;
    const startY = (-1 * viewport.worldHeight) / 2;

    for (let note of section.notes) {
      //console.log(note);
      const targetX = (note[2] / 60000) * section.bpm * beatWidth; //convert time in milliseconds to pixels
      const targetY = note[1] * 80 + startY;
      let noteWidth = 1;
      if (note.length > 3) {
        noteWidth = note[3];
      }
      addNote(createNote(targetX, targetY, noteWidth));
    }
  };
  reader.readAsBinaryString(file);
};

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
    sections[0].bpm = section.bpm;

    document.getElementById("duration").value = section.duration;
    sections[0].duration = section.duration;
    const startY = (-1 * viewport.worldHeight) / 2;

    for (let note of section.notes) {
      //console.log(note);
      const targetX = (note[2] / 60000) * section.bpm * beatWidth; //convert time in milliseconds to pixels
      const targetY = note[1] * 80 + startY;
      let noteWidth = 1;
      if (note.length > 3) {
        noteWidth = note[3];
      }
      addNote(createNote(targetX, targetY, noteWidth));
    }
  };
  reader.readAsText(file);
};

document.getElementById("clear-button").onclick = function(e) {
  for (let note of Object.values(sections[0].notes)) {
    note.sprite.destroy();
  }
  sections[0].notes = {};
  noteIndex = [];
};

function renderGridLines() {
  let bpm = sections[0].bpm;
  let duration = sections[0].duration;
  if (bpm && duration) {
    const startY = (-1 * viewport.worldHeight) / 2;
    // clear old snap lines
    graphics.clear();

    // calculate map width
    let numBeats = (bpm / 60) * duration;
    let mapWidth = beatWidth * numBeats;
    viewport.worldWidth = mapWidth;
    viewport.clamp({
      left: -25,
      right: viewport.worldWidth
    });

    // draw horizontal lines
    graphics.lineStyle(1, 0xffffff);
    const noteSize = 80;
    for (let i = 0; i < 9; i += 1) {
      const y = i * noteSize + startY;
      graphics.moveTo(0, y);
      graphics.lineTo(mapWidth, y);
    }

    // draw vertical lines
    graphics.lineStyle(Math.max(1, 1 / viewport.transform.scale.x), 0xffffff);
    let numLines = numBeats * snapInterval;
    let intervalSize = beatWidth / snapInterval;
    for (let i = 0; i < numLines; i += 1) {
      let x = i * intervalSize;
      graphics.moveTo(x, startY);
      graphics.lineTo(x, startY * -1);
    }
  }
}
