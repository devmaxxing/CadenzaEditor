export const Note = (type, x, y, width) => ({
  type,
  x: Number(x.toFixed(4)),
  y: Math.round(Number(y)),
  width,
  getCoordinates() {
    return this.x + "," + this.y;
  },
  isValid() {
    return this.y > -1 && this.y < 8;
  }
});
