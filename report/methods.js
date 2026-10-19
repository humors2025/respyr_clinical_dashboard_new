// ---------------------------------------------------------------------------
// Respyr report interpretation engine — JavaScript port of methods.php.
//
// Every function returns BYTE-IDENTICAL output to its PHP original; the
// equivalence is enforced by tools/diff-methods test harnesses that run both
// implementations over a sweep of inputs and diff the results. The clinical
// wording and the 70/80 thresholds must not drift — clinicians read the
// report against them. Change a string here only together with a re-run of
// that harness against the PHP file in git history.
//
// Loaded as a plain script: everything is exposed on window.RspMethods.
// ---------------------------------------------------------------------------
(function () {
    "use strict";

    // PHP's is_numeric(): numeric strings (int/float/exponent, surrounding
    // whitespace allowed), actual numbers. Hex/binary strings are NOT numeric.
    function isNumeric(v) {
        if (typeof v === "number") return isFinite(v);
        if (typeof v !== "string") return false;
        return /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(v.trim());
    }

    // PHP round(): half away from zero (Math.round rounds half toward +inf).
    function phpRound(value, precision) {
        var p = Math.pow(10, precision || 0);
        var n = Number(value) * p;
        // counter float artifacts the way PHP's pre-rounding does
        n = Number(n.toPrecision(14));
        var r = (n >= 0 ? Math.round(n) : -Math.round(-n)) / p;
        return r;
    }

    function calculateBMI(weightKg, heightCm) {
        var w = Number(weightKg), h = Number(heightCm);
        if (!(h > 0) || !(w > 0)) return "Invalid input";
        var heightM = h / 100;
        return phpRound(w / (heightM * heightM), 2);
    }

    function calculateBMR(weightKg, heightCm, ageYears, gender) {
        var w = Number(weightKg), h = Number(heightCm), a = Number(ageYears);
        if (!(w > 0) || !(h > 0) || !(a > 0)) return "Invalid input";
        var g = String(gender).toLowerCase();
        var bmr;
        if (g === "male") bmr = 10 * w + 6.25 * h - 5 * a + 5;
        else if (g === "female") bmr = 10 * w + 6.25 * h - 5 * a - 161;
        else return "Invalid gender";
        return phpRound(bmr, 2);
    }

    function getScoreCategorySpan(score) {
        if (!isNumeric(score)) return '<span class="text-invalid">Invalid</span>';
        var s = Number(score);
        if (s < 70) return '<span class="text-poor">Poor</span>';
        if (s >= 70 && s < 80) return '<span class="text-fair">Fair</span>';
        return '<span class="text-good">Good</span>';
    }

    function getSugarScoreGlucoseMetabolism(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Indicates Significant reduction in glucose utilization efficiency.";
        if (s >= 70 && s < 80) return "Indicates Mild impairment in glucose efficiency.";
        return "Indicates Efficient glucose metabolism.";
    }

    function getRespyrScoreMeaningSugarScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Correlating with marked elevations in fasting glucose and/or HbA1c trends. Suggests increasing reliance on alternative energy pathways (lipolysis/ketone production).";
        if (s >= 70 && s < 80) return "Correlating with slight elevations in fasting glucose and/or HbA1c. This may reflect early-stage reduction in insulin sensitivity or changes in metabolic substrate use.";
        return "Correlates with normal fasting glucose and HbA1c levels. No abnormal trends in glucose utilization or metabolic flexibility are observed.";
    }

    function getClinicalSuggestionSugarScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Further metabolic evaluation may be suggested to explore potential contributors to impaired glucose handling.";
        if (s >= 70 && s < 80) return "Periodic monitoring of metabolic markers may be considered.";
        return "No further evaluation typically required unless clinically indicated.";
    }

    var CORRELATIONS = {
        "sugarScore": "The Respyr Sugar Score correlates with fasting blood glucose and HbA1c trends, based on internal validation studies benchmarking exhaled breath VoC levels against standard clinical markers of glucose metabolism.",
        "liverScore": "The Respyr Liver Stress Score demonstrates correlation with liver enzyme and imaging findings in individuals with confirmed liver conditions, based on internal validation studies. The score aligns with emerging scientific evidence linking elevated exhaled ethanol levels to increased hepatic metabolic burden and gut-liver axis dysfunction.",
        "respiratoryScore": "The Respyr Respiratory Score correlates with pulmonary function trends derived from expiratory pressure converted into flow, and subsequently into FEV1 (Forced Expiratory Volume in 1 second) values. Calibration was conducted using the AveloAir Digital Spirometer, a globally certified spirometry device. For validation, individuals with doctor-confirmed respiratory issues and valid Pulmonary Function Test (PFT) reports were included. Respyr’s pressure-derived FEV1 trends were compared with the respiratory status of each individual. Lower FEV1 values consistently corresponded with lower Respyr Scores, aligning with expected patterns of airflow changes.",
        "gutScore": "The Respyr Gut Fermentation Score is based on rapid, single-point exhaled hydrogen (H₂) measurement and correlates with globally recognized breath test benchmarks. While traditional clinical standards are based on multi-step glucose or lactulose challenge tests, Respyr adapts validated baseline H₂ concentration ranges observed in gut fermentation studies. Sensor calibration is aligned with literaturereported thresholds reflecting physiological and dysbiotic fermentation patterns. This makes the score areliable, non-invasive functional screening tool for assessing real-time gut fermentation activity."
    };

    function getClinicalCorrelation(scoreName) {
        return Object.prototype.hasOwnProperty.call(CORRELATIONS, scoreName)
            ? CORRELATIONS[scoreName]
            : "No correlation info available for this score.";
    }

    var INSIGHTS = {
        "sugarScore": "This score provides clinical insights on overall glucose metabolism efficiency, including insulin sensitivity and metabolic flexibility. It offers an early, non-invasive indicator of carbohydrate utilization trends without directly measuring blood glucose levels..",
        "liverScore": "This score provides clinical insights on patterns of hepatic metabolic stress and gut-liver axis interaction. It serves as a non-invasive functional screening tool to detect potential liver strain, without diagnosing specific hepatic disorders.",
        "respiratoryScore": "This score provides clinical insights on the following key components of respiratory function:Expiratory flow capacity, through FEV1 estimation. Airway resistance, derived from pressure-to-flow dynamics. Ventilatory efficiency, using additional indicators such as FVC, PEF, and FEV1/FVC ratio. These combined outputs offer a comprehensive, non-invasive view of respiratory performance trends. While FEV1 is the sole input used to calculate the Respyr Score, additional parameters such as FVC, PEF, and the FEV1/FVC ratio are provided for clinical context. The score functions as a non-invasive pre-screening feature designed to support the early identification of respiratory decline, longitudinal trend monitoring, and preventive assessment in health contexts.",
        "gutScore": "This score provides clinical insights on degree of intestinal fermentation activity, microbial balance, and carbohydrate absorption efficiency. It offers a non-invasive, real-time indicator of potential gut dysbiosis or malabsorption trends. While not diagnostic, it helps monitor functional gut health andsupports early identification of fermentation-related imbalances without pinpointing specific gastrointestinal disorders."
    };

    function getClinicalInsight(scoreName) {
        return Object.prototype.hasOwnProperty.call(INSIGHTS, scoreName)
            ? INSIGHTS[scoreName]
            : "No clinical insight available for this score.";
    }

    function getLiverScoreHepaticStress(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Indicates significant hepatic stress";
        if (s >= 70 && s < 80) return "Indicates mild hepatic stress.";
        return "Indicates minimal hepatic stress";
    }

    function getRespyrScoreMeaningLiverScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "May indicate early metabolic strain, minor inefficiencies in hepatic processing, or subtle gut-liver axis interactions";
        if (s >= 70 && s < 80) return "May indicate early metabolic strain,minor inefficiencies in hepatic processing, or subtle gut-liver axis interactions.";
        return "Metabolic liver function appears consistent with healthy patterns, with no significant evidence of gut-liver axis disturbance.";
    }

    function getClinicalSuggestionLiverScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Comprehensive liver function evaluation is suggested based on the individual's clinical scenario.";
        if (s >= 70 && s < 80) return "Further evaluation may be considered depending on individual clinical context, lifestyle, or dietary history.";
        return "No further evaluation typically required unless clinically indicated.";
    }

    function getRespiratoryScoreAirflowVentilation(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Significant reduction in expiratory capacity. FEV1 < 70% of predicted. FVC, PEF, and FEV1/FVC ratio may also be reduced.";
        if (s >= 70 && s < 80) return "Mild reduction in expiratory efficiency. FEV1 between 70–79% of predicted. Subtle variations may be seen in supporting metrics.";
        return "Normal expiratory flow and lung capacity. Pressure-derived FEV1 ≥ 80% of predicted value. FVC, PEF, and FEV1/FVC ratio are also within expected ranges.";
    }

    function getRespyrScoreMeaningRespiratoryScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Indicates notable decline in ventilatory function. May reflect increasing resistance or reduced flow capacity.";
        if (s >= 70 && s < 80) return "Indicates early changes in respiratory performance. Respyr Score flags minor reduction in airflow capacity.";
        return "Indicates efficient ventilatory function. Respyr Score reflects normal respiratory performance.";
    }

    function getClinicalSuggestionRespiratoryScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Further clinical evaluation with spirometry may be considered based on the individual’s clinical scenario. Suitable for early screening or referral in occupational or preventive health contexts.";
        if (s >= 70 && s < 80) return "Periodic monitoring may be considered. Clinical spirometry may be suggested if symptoms such as breathlessness or chronic cough are present.";
        return "No further evaluation typically required unless clinically indicated.";
    }

    function getGutScoreFermentationActivity(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Indicates Significant fermentation imbalance.";
        if (s >= 70 && s < 80) return "Indicates Moderate elevation in fermentation activity.";
        return "Indicates Balanced gut fermentation activity.";
    }

    function getRespyrScoreMeaningGutScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "Correlating with markedly elevated hydrogen levels. May reflect considerable dysbiosis, potential carbohydrate absorption inefficiency, or excessive microbial fermentation. Bloating and digestive discomfort are likely.";
        if (s >= 70 && s < 80) return "Correlating with slight increases in hydrogen production. This may be associated with early dysbiosis or mild inefficiencies in carbohydrate absorption. Occasional bloating or digestive discomfort may be reported.";
        return "Hydrogen levels fall within expected physiological ranges, correlating with efficient carbohydrate absorption and stable microbial fermentation. No significant gastrointestinal concerns observed.";
    }

    function getClinicalSuggestionGutScore(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s < 70) return "As a screening result, further gastrointestinal evaluation may be warranted.";
        if (s >= 70 && s < 80) return "Further assessment of gut fermentation trends may be considered if symptoms persist.";
        return "No further evaluation typically required unless clinically indicated.";
    }

    function getScoreDiv(score) {
        if (!isNumeric(score)) return '<div class="score-value invalid">Invalid</div>';
        var s = Number(score);
        var cls = s >= 80 ? "good" : (s >= 70 ? "fair" : "poor");
        return '<div class="score-value ' + cls + '">' + score + '%</div>';
    }

    function getScoreStatusDiv(score) {
        if (!isNumeric(score)) return '<div class="score-status invalid">Invalid!</div>';
        var s = Number(score);
        var cls, text;
        if (s >= 80) { cls = "good"; text = "Good!"; }
        else if (s >= 70) { cls = "fair"; text = "Fair!"; }
        else { cls = "poor"; text = "Poor!"; }
        return '<div class="score-status ' + cls + '">' + text + '</div>';
    }

    function getScoreProgressDiv(score) {
        if (!isNumeric(score)) {
            return '<div class="score-progress"><div class="progress" style="width:0%">.</div></div>';
        }
        var width = Math.max(0, Math.min(100, phpRound(Number(score), 0)));
        return '<div class="score-progress">\n                <div class="progress" style="width:' + width + '%" data-value="' + width + '">.</div>\n            </div>';
    }

    function getScoreMessage(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s >= 80) return "Everything looks good!";
        if (s >= 70) return "Room for improvement";
        return "Attention required";
    }

    function getScoreMessage1(score) {
        if (!isNumeric(score)) return "Invalid score";
        var s = Number(score);
        if (s >= 80) return '<p class="score-message good">Everything looks good!</p>';
        if (s >= 70) return '<p class="score-message fair">Attention required!</p>';
        return '<p class="score-message poor">Attention required</p>';
    }

    // date('j F Y, g:iA') in Asia/Kolkata, e.g. "2 May 2025, 12:15PM".
    var MONTHS = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    function formatTimestamp(timestamp) {
        if (!isNumeric(timestamp)) return "Invalid timestamp";
        var d = new Date(Number(timestamp) * 1000);
        var parts = {};
        new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kolkata", year: "numeric", month: "numeric",
            day: "numeric", hour: "numeric", minute: "2-digit",
            // h12, not hour12:true — some locales map hour12 to the h11
            // cycle, which renders noon as 0 instead of PHP's 12
            hourCycle: "h12",
        }).formatToParts(d).forEach(function (p) { parts[p.type] = p.value; });
        var ampm = String(parts.dayPeriod || "").toUpperCase().replace(/\./g, "");
        var hr = String(Number(parts.hour)); // g = 12-hour without leading zero
        return Number(parts.day) + " " + MONTHS[Number(parts.month) - 1] + " " + parts.year
            + ", " + hr + ":" + parts.minute + ampm;
    }

    var QUICK = {
        sugar: { good: "Efficient glucose metabolism.", fair: "May suggest early changes in insulin sensitivity.", poor: "Reduced glucose utilization; metabolic follow-up may be helpful." },
        gut: { good: "Balanced gut fermentation.", fair: "Mild dysbiosis or early malabsorption possible.", poor: "Elevated fermentation; gut imbalance may be present." },
        respiratory: { good: "Normal respiratory performance.", fair: "Mild airflow reduction; monitor symptoms.", poor: "Reduced lung capacity; clinical review may be considered." },
        liver: { good: "Minimal hepatic stress.", fair: "Early metabolic strain may be present.", poor: "Increased liver stress; dietary or medical review may help." },
    };

    // Unlike every other score function, the PHP original has NO is_numeric
    // guard here, so a non-numeric string falls into PHP 8's string-vs-int
    // comparison (the int is cast to a string and compared bytewise). Real
    // scores are always numeric; this only matters for matching PHP exactly.
    function phpGte(score, n) {
        if (typeof score === "string" && !isNumeric(score)) return score >= String(n);
        return Number(score) >= n;
    }

    function getQuickScoreInterpretation(score, scoreType) {
        var t = String(scoreType).toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(QUICK, t)) return "Invalid score type.";
        var cls = phpGte(score, 80) ? "good" : (phpGte(score, 70) ? "fair" : "poor");
        return QUICK[t][cls] || "Interpretation not available.";
    }

    // The include-time tail of methods.php: pull the spirometry numbers out of
    // the respiratory_fvc_json query parameter. null stays null (renders as
    // the empty string, exactly as PHP echoed it).
    function parseRespiratory(respiratoryJson) {
        var data = null;
        try { data = JSON.parse(respiratoryJson); } catch (e) { data = null; }
        var get = function (a, b) {
            return (data && data[a] && data[a][b] !== undefined) ? data[a][b] : null;
        };
        return {
            fev1_vs_predicted: get("Comparison_with_Predicted(%)", "FEV1_vs_Predicted"),
            fvc_vs_predicted: get("Comparison_with_Predicted(%)", "FVC_vs_Predicted"),
            ratio_vs_predicted: get("Comparison_with_Predicted(%)", "Ratio_vs_Predicted"),
            predicted_fev1: get("Predicted", "FEV1(L)"),
            predicted_fvc: get("Predicted", "FVC(L)"),
            predicted_ratio: get("Predicted", "FEV1/FVC_Ratio(%)"),
            respiratory_score: get("Respiratory Score(%)", "Respiratory Score(%)"),
            measured_fev1: get("Respyr_Measured", "FEV1(L)"),
            measured_fvc: get("Respyr_Measured", "FVC(L)"),
            measured_ratio: get("Respyr_Measured", "FEV1/FVC Ratio(%)"),
            measured_pef: get("Respyr_Measured", "PEF(L/min)"),
        };
    }

    var api = {
        isNumeric: isNumeric,
        phpRound: phpRound,
        calculateBMI: calculateBMI,
        calculateBMR: calculateBMR,
        getScoreCategorySpan: getScoreCategorySpan,
        getSugarScoreGlucoseMetabolism: getSugarScoreGlucoseMetabolism,
        getRespyrScoreMeaningSugarScore: getRespyrScoreMeaningSugarScore,
        getClinicalSuggestionSugarScore: getClinicalSuggestionSugarScore,
        getClinicalCorrelation: getClinicalCorrelation,
        getClinicalInsight: getClinicalInsight,
        getLiverScoreHepaticStress: getLiverScoreHepaticStress,
        getRespyrScoreMeaningLiverScore: getRespyrScoreMeaningLiverScore,
        getClinicalSuggestionLiverScore: getClinicalSuggestionLiverScore,
        getRespiratoryScoreAirflowVentilation: getRespiratoryScoreAirflowVentilation,
        getRespyrScoreMeaningRespiratoryScore: getRespyrScoreMeaningRespiratoryScore,
        getClinicalSuggestionRespiratoryScore: getClinicalSuggestionRespiratoryScore,
        getGutScoreFermentationActivity: getGutScoreFermentationActivity,
        getRespyrScoreMeaningGutScore: getRespyrScoreMeaningGutScore,
        getClinicalSuggestionGutScore: getClinicalSuggestionGutScore,
        getScoreDiv: getScoreDiv,
        getScoreStatusDiv: getScoreStatusDiv,
        getScoreProgressDiv: getScoreProgressDiv,
        getScoreMessage: getScoreMessage,
        getScoreMessage1: getScoreMessage1,
        formatTimestamp: formatTimestamp,
        getQuickScoreInterpretation: getQuickScoreInterpretation,
        parseRespiratory: parseRespiratory,
    };

    if (typeof window !== "undefined") window.RspMethods = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
