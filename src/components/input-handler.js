import hotkeys from "hotkeys-js";

/**
 *
 * @param {StateManager} stateManager
 */
export function registerInputListeners(stateManager) {
  // deselect all
  hotkeys("d", function(event) {
    stateManager.deselectAllNotes();
  });

  // remove selected
  hotkeys("delete", function(event) {
    stateManager.removeSelectedNotes();
  });

  // toggle snap
  hotkeys("s", function(event) {
    stateManager.toggleSnap();
  });

  // select next
  hotkeys("shift+right", function(event) {
    stateManager.selectNext();
  });

  document.addEventListener("wheel", e => {
    stateManager.zoomX(0.01 * e.deltaY);
  });

  stateManager.graphics.viewport.addListener("mousemove", e => {
    stateManager.moveNoteCursor(e.data);
  });

  stateManager.graphics.viewport.addListener("click", e => {
    if (stateManager.state.notePlacementEnabled) {
      const searchResult = stateManager.getNoteUnderCursor();
      const target = searchResult.target;
      if (!searchResult.result) {
        if (hotkeys.isPressed("ctrl")) {
          stateManager.pasteSelection(target.x, target.y);
        } else {
          console.log("Adding new note: " + JSON.stringify(searchResult));
          stateManager.addNewNote(target.x, target.y);
        }
      } else if (hotkeys.isPressed("shift")) {
        stateManager.selectNote(target);
      } else {
        console.log("Selecting note: " + JSON.stringify(searchResult));
        stateManager.deselectAllNotes();
        stateManager.selectNote(target);
      }
    }
  });

  stateManager.graphics.viewport.on("drag-start", () => {
    stateManager.state.notePlacementEnabled = false;
  });

  stateManager.graphics.viewport.on("drag-end", () => {
    stateManager.state.notePlacementEnabled = true;
    stateManager.setAudioTimeFromViewportPosition();
  });
}
