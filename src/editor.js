import { Application } from "pixi.js";
import { GraphicsManager } from "./components/graphics";
import * as InputHandler from "./components/input-handler";
import { StateManager } from "./components/state-manager";
import { UI } from "./components/ui";

const app = new Application({
  height: 640,
  width: window.innerWidth - 20
});
document.querySelector("#canvas-container").appendChild(app.view);

// Init graphics
const graphics = GraphicsManager(app);

const ui = UI();

// Init state
const stateManager = StateManager(graphics, app, ui);
stateManager.init();

stateManager.refreshGridLines();

InputHandler.registerInputListeners(stateManager);
