import { Graphics, Sprite, Texture } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { NOTE_TYPES } from "../constants/note-types";

export const GraphicsManager = app => {
  const overlayGraphics = new Graphics();
  const graphics = new Graphics();
  const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1200,
    worldHeight: 640,
    interaction: app.renderer.plugins.interaction
  })
    .drag({
      direction: "x"
    })
    .clamp({
      left: -25,
      right: 1200
    });

  viewport.addChild(graphics);
  app.stage.addChild(viewport);
  app.stage.addChild(overlayGraphics);

  return {
    viewportOffsetY: 20,
    viewport: viewport,
    graphics: graphics,
    overlayGraphics: overlayGraphics,
    sprites: {},

    getStartY() {
      return -viewport.worldHeight / 2;
    },

    getNoteLaneHeight() {
      return (this.viewport.worldHeight - this.viewportOffsetY) / 8;
    },

    drawNoteCursor(placementPoint) {
      const overlayGraphics = this.overlayGraphics;
      overlayGraphics.clear();
      overlayGraphics.moveTo(placementPoint.x, placementPoint.y);
      overlayGraphics.beginFill(0xffffff);
      overlayGraphics.drawRect(
        placementPoint.x - 2,
        placementPoint.y,
        5,
        this.getNoteLaneHeight()
      );
      overlayGraphics.endFill();
    },

    destroyNote(noteCoord) {
      this.sprites[noteCoord].sprite.destroy();
      delete this.sprites[noteCoord];
    },

    createNote(note) {
      const noteSprite = new Sprite(Texture.WHITE);
      noteSprite.width = 5;
      noteSprite.height = this.getNoteLaneHeight() * note.width;
      noteSprite.tint = 0xffffff;
      if (note.type == NOTE_TYPES.SLIDE) {
        noteSprite.tint = 0xffff00;
      }
      noteSprite.x = note.x - 2;
      noteSprite.y = note.y;
      this.sprites[note.x + "," + note.y] = {
        sprite: noteSprite,
        originalTint: noteSprite.tint
      };
      this.viewport.addChild(noteSprite);
    },

    deselectNote(noteCoord) {
      this.sprites[noteCoord].sprite.tint = this.sprites[
        noteCoord
      ].originalTint;
    },

    selectNote(noteCoord) {
      this.sprites[noteCoord].tint = 0x0000ff;
    },

    zoomX(zoomAmount) {
      const newX = this.viewport.transform.scale.x - zoomAmount;
      this.viewport.transform.scale.set(newX, 1);
    },

    renderGridLines(bpm, duration, beatWidth, snapInterval) {
      if (bpm && duration) {
        const graphics = this.graphics;
        const viewport = this.viewport;
        const startY = this.getStartY();
        // const startY = 0;
        // const endY = viewport.worldHeight;
        // clear old snap lines
        graphics.clear();

        // calculate map width
        const numBeats = (bpm / 60) * duration;
        const mapWidth = beatWidth * numBeats;
        viewport.worldWidth = mapWidth;
        viewport.clamp({
          left: -25,
          right: mapWidth
        });

        // draw horizontal lines
        graphics.lineStyle(1, 0x008800);
        const noteSize = this.getNoteLaneHeight();
        for (let i = 0; i < 9; i += 1) {
          const y = i * noteSize + startY;
          graphics.moveTo(0, y);
          graphics.lineTo(mapWidth, y);
        }

        // draw vertical lines
        graphics.lineStyle(
          Math.max(1, 1 / viewport.transform.scale.x),
          0x008800
        );
        const endY = startY + noteSize * 8;
        const numLines = numBeats * snapInterval;
        const intervalSize = beatWidth / snapInterval;
        for (let i = 0; i < numLines; i += 1) {
          let x = i * intervalSize;
          graphics.moveTo(x, startY);
          graphics.lineTo(x, endY);
        }
      }
    }
  };
};
