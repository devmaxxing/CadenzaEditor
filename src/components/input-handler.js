import hotkeys from "hotkeys-js";

export function registerInputListeners(stateManager) {
  // deselect all
  hotkeys("alt+d", function() {
    stateManager.deselectAllNotes();
  });

  // remove selected
  hotkeys("alt+r", function() {
    stateManager.removeSelectedNotes();
  });

  document.addEventListener("wheel", e => {
    stateManager.zoomX(0.01 * e.deltaY);
  });

  stateManager.graphics.viewport.addListener("mousemove", e => {
    stateManager.moveNoteCursor(e.data);
  });

  stateManager.graphics.viewport.addListener("click", e => {
    if (stateManager.state.notePlacementEnabled) {
      const noteData = stateManager.getNoteUnderCursor();
      const targetPosition = noteData.noteCoordinates;
      if (!noteData.result) {
        if (hotkeys.isPressed("ctrl")) {
          stateManager.pasteSelection(targetPosition.x, targetPosition.y);
        } else {
          stateManager.addNewNote(targetPosition.x, targetPosition.y);
        }
      } else if (hotkeys.isPressed("shift")) {
        stateManager.selectNote(targetPosition.x, targetPosition.y);
      } else {
        stateManager.deselectAllNotes();
        stateManager.selectNote(targetPosition.x, targetPosition.y);
      }
    }
  });

  stateManager.graphics.viewport.on("drag-start", () => {
    stateManager.state.notePlacementEnabled = false;
  });

  stateManager.graphics.viewport.on("drag-end", () => {
    stateManager.state.notePlacementEnabled = true;
  });
}
