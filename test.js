const MidiConverter = require("./src/MidiConverter");
const fs = require("fs");

const beatmap = MidiConverter.convert(
  fs.readFileSync("rondo_alla_turca.mid"),
  "Track 1",
  "Track 2",
  "hard"
);
fs.appendFileSync("rondo_alla_turca_hard.json", JSON.stringify(beatmap));
