export const NoteIndexSearchResult = (index, noteCoordinates, result) => ({
  index,
  noteCoordinates,
  result
});

/**
 *
 * @param {*} noteX
 * @param {*} noteY
 * @param {*} arr
 * @returns { NoteIndexSearchResult }
 */
export default function findNote(noteX, noteY, arr) {
  return bstNote(noteX, noteY, arr, 0, arr.length);
}

function bstNote(noteX, noteY, arr, start, end) {
  if (start == end)
    // no note found return index of insertion
    return NoteIndexSearchResult(start, { x: noteX, y: noteY }, false);

  const pivot = ((start + end) / 2) >> 0;
  const diff = arr[pivot][0] - noteX;
  //console.log("Searching indices: " + start + ", " + end + " Pivot: " + pivot);
  if (Math.abs(diff) < 0.000001) {
    return NoteIndexSearchResult(
      pivot,
      { x: arr[pivot][0], y: noteY },
      arr[pivot][1].indexOf(noteY) != -1
    );
  } else if (diff < 0) {
    return bstNote(noteX, noteY, arr, pivot + 1, end);
  } else {
    return bstNote(noteX, noteY, arr, start, pivot);
  }
}
