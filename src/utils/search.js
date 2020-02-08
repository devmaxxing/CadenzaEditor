const SearchResult = (result, target) => ({
  result,
  target
});

/**
 *
 * @param {*} noteX
 * @param {*} noteY
 * @param {*} arr
 * @param {*} millisecondsPerXUnit
 * @returns { SearchResult }
 */
export default function findNote(
  noteX,
  noteY,
  noteArray,
  millisecondsPerXUnit
) {
  const coordinates = { x: noteX, y: noteY };
  if (noteY < 0 || noteY >= noteArray.length) {
    return SearchResult(false, coordinates);
  }
  const closestVal = Object.keys(noteArray[noteY])
    .map(x => Number(x))
    .reduce((accumulator, currentValue) => {
      const diff = Math.abs(currentValue - noteX);
      if (!accumulator || diff < accumulator[1]) {
        return [currentValue, diff];
      }
      return accumulator;
    }, null);

  if (closestVal) {
    const note = noteArray[noteY][closestVal[0]];
    const matchThreshold = 4 * millisecondsPerXUnit;
    if (
      closestVal[1] < matchThreshold ||
      (note.x - matchThreshold < noteX &&
        note.x + note.duration + matchThreshold > noteX)
    ) {
      return SearchResult(true, note);
    }
  }
  return SearchResult(false, coordinates);
}
