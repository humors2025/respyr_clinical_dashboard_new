<?php
// Differential harness: run every methods.php function over the shared input
// sweep and print each result AS ECHO WOULD (string cast). Compare the output
// of this file with tools/diff-methods.mjs — they must be identical.
// CR characters are stripped before comparison: whether a multi-line string
// literal contains \r\n or \n depends on how git checked the file out, and
// browsers collapse both identically.
date_default_timezone_set('Asia/Kolkata');
error_reporting(E_ERROR); // the sweep deliberately feeds junk; warnings differ by PHP version

$in = json_decode(file_get_contents(__DIR__ . '/diff-inputs.json'), true);
$respiratoryJson = $in['respjson'][0];
ob_start();                                   // swallow whitespace after the close tag
include __DIR__ . '/reference/methods.php';
ob_end_clean();

$out = [];
$emit = function ($label, $v) use (&$out) {
    $out[] = $label . ' => ' . str_replace(chr(13), '', is_null($v) ? '' : (string)$v);
};

$scoreFns = ['getScoreCategorySpan','getSugarScoreGlucoseMetabolism','getRespyrScoreMeaningSugarScore',
 'getClinicalSuggestionSugarScore','getLiverScoreHepaticStress','getRespyrScoreMeaningLiverScore',
 'getClinicalSuggestionLiverScore','getRespiratoryScoreAirflowVentilation','getRespyrScoreMeaningRespiratoryScore',
 'getClinicalSuggestionRespiratoryScore','getGutScoreFermentationActivity','getRespyrScoreMeaningGutScore',
 'getClinicalSuggestionGutScore','getScoreDiv','getScoreStatusDiv','getScoreProgressDiv','getScoreMessage','getScoreMessage1'];

foreach ($scoreFns as $fn)
    foreach ($in['scores'] as $s)
        $emit("$fn(" . json_encode($s) . ")", $fn($s));

foreach ($in['scores'] as $s)
    foreach ($in['types'] as $t)
        $emit("quick(" . json_encode($s) . ",$t)", getQuickScoreInterpretation($s, $t));

foreach ($in['names'] as $n) {
    $emit("corr($n)", getClinicalCorrelation($n));
    $emit("insight($n)", getClinicalInsight($n));
}
foreach ($in['bmi'] as $p) $emit("bmi(" . json_encode($p) . ")", calculateBMI($p[0], $p[1]));
foreach ($in['bmr'] as $p) $emit("bmr(" . json_encode($p) . ")", calculateBMR($p[0], $p[1], $p[2], $p[3]));
foreach ($in['timestamps'] as $t) $emit("ts(" . json_encode($t) . ")", formatTimestamp($t));

// the include-time globals, per respjson variant
foreach ($in['respjson'] as $i => $rj) {
    $data = json_decode($rj, true);
    $vals = [
        'fev1_vs_predicted' => $data["Comparison_with_Predicted(%)"]["FEV1_vs_Predicted"] ?? null,
        'fvc_vs_predicted' => $data["Comparison_with_Predicted(%)"]["FVC_vs_Predicted"] ?? null,
        'ratio_vs_predicted' => $data["Comparison_with_Predicted(%)"]["Ratio_vs_Predicted"] ?? null,
        'predicted_fev1' => $data["Predicted"]["FEV1(L)"] ?? null,
        'predicted_fvc' => $data["Predicted"]["FVC(L)"] ?? null,
        'predicted_ratio' => $data["Predicted"]["FEV1/FVC_Ratio(%)"] ?? null,
        'respiratory_score' => $data["Respiratory Score(%)"]["Respiratory Score(%)"] ?? null,
        'measured_fev1' => $data["Respyr_Measured"]["FEV1(L)"] ?? null,
        'measured_fvc' => $data["Respyr_Measured"]["FVC(L)"] ?? null,
        'measured_ratio' => $data["Respyr_Measured"]["FEV1/FVC Ratio(%)"] ?? null,
        'measured_pef' => $data["Respyr_Measured"]["PEF(L/min)"] ?? null,
    ];
    foreach ($vals as $k => $v) $emit("resp[$i].$k", $v);
}

echo implode("\n", $out), "\n";
