export const Note = (type, x, y, width) => ({
  type,
  x: Number(x.toFixed(4)),
  y: Number(y.toFixed(4)),
  width
});
