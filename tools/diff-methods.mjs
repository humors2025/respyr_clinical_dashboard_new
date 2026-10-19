// Differential harness: same sweep as diff-methods.php, through methods.js.
// Usage: node tools/diff-methods.mjs > js.txt ; php tools/diff-methods.php > php.txt ; diff
// CRs are stripped on both sides — line-ending-only differences are not real.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const M = require("../report/methods.js");

const inp = JSON.parse(readFileSync(new URL("./diff-inputs.json", import.meta.url)));
const out = [];
// PHP's echo: null -> "", floats via string cast (24.0 -> "24")
const CR = String.fromCharCode(13);
const cast = (v) => ((v === null || v === undefined) ? "" : String(v)).split(CR).join("");
const emit = (label, v) => out.push(label + " => " + cast(v));

const scoreFns = ["getScoreCategorySpan","getSugarScoreGlucoseMetabolism","getRespyrScoreMeaningSugarScore",
 "getClinicalSuggestionSugarScore","getLiverScoreHepaticStress","getRespyrScoreMeaningLiverScore",
 "getClinicalSuggestionLiverScore","getRespiratoryScoreAirflowVentilation","getRespyrScoreMeaningRespiratoryScore",
 "getClinicalSuggestionRespiratoryScore","getGutScoreFermentationActivity","getRespyrScoreMeaningGutScore",
 "getClinicalSuggestionGutScore","getScoreDiv","getScoreStatusDiv","getScoreProgressDiv","getScoreMessage","getScoreMessage1"];

for (const fn of scoreFns)
  for (const s of inp.scores)
    emit(`${fn}(${JSON.stringify(s)})`, M[fn](s));

for (const s of inp.scores)
  for (const t of inp.types)
    emit(`quick(${JSON.stringify(s)},${t})`, M.getQuickScoreInterpretation(s, t));

for (const n of inp.names) {
  emit(`corr(${n})`, M.getClinicalCorrelation(n));
  emit(`insight(${n})`, M.getClinicalInsight(n));
}
for (const p of inp.bmi) emit(`bmi(${JSON.stringify(p)})`, M.calculateBMI(p[0], p[1]));
for (const p of inp.bmr) emit(`bmr(${JSON.stringify(p)})`, M.calculateBMR(p[0], p[1], p[2], p[3]));
for (const t of inp.timestamps) emit(`ts(${JSON.stringify(t)})`, M.formatTimestamp(t));

inp.respjson.forEach((rj, i) => {
  const r = M.parseRespiratory(rj);
  for (const k of ["fev1_vs_predicted","fvc_vs_predicted","ratio_vs_predicted","predicted_fev1","predicted_fvc",
                   "predicted_ratio","respiratory_score","measured_fev1","measured_fvc","measured_ratio","measured_pef"])
    emit(`resp[${i}].${k}`, r[k]);
});

console.log(out.join("\n"));
