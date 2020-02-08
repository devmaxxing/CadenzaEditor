export const Note = (type, x, y, width, duration = 0) => ({
  type,
  x: Number(x.toFixed(4)),
  y: Math.round(Number(y)),
  width,
  duration: duration,
  getCoordinates() {
    return this.x + "," + this.y;
  },
  isValid() {
    return this.y > -1 && this.y < 8;
  }
});
