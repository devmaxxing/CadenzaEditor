import { Application } from "pixi.js";
import { GraphicsManager } from "./components/graphics";
import * as InputHandler from "./components/input-handler";
import registerUiHandlers from "./components/ui";
import { StateManager } from "./components/state-manager";

const app = new Application({
  height: 640,
  width: window.innerWidth - 20
});
document.body.appendChild(app.view);

// Init graphics
const graphics = GraphicsManager(app);

// Init state
const stateManager = StateManager(graphics, app);
stateManager.setBpm(document.getElementById("bpm").value);
stateManager.setDuration(document.getElementById("duration").value);
stateManager.setSnapInterval(
  parseInt(document.getElementById("snap-interval").value)
);
stateManager.setCurrentNoteWidth(
  parseInt(document.getElementById("note-width").value)
);
stateManager.refreshGridLines();

InputHandler.registerInputListeners(stateManager);
registerUiHandlers(stateManager);
