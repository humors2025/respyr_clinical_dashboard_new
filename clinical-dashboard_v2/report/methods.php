<?php
function calculateBMI($weightKg, $heightCm) {
    if ($heightCm <= 0 || $weightKg <= 0) {
        return "Invalid input";
    }

    $heightM = $heightCm / 100; // Convert cm to meters
    $bmi = $weightKg / ($heightM * $heightM);
    return round($bmi, 2); // Round to 2 decimal places
}

function calculateBMR($weightKg, $heightCm, $ageYears, $gender) {
    if ($weightKg <= 0 || $heightCm <= 0 || $ageYears <= 0) {
        return "Invalid input";
    }

    if (strtolower($gender) === 'male') {
        $bmr = 10 * $weightKg + 6.25 * $heightCm - 5 * $ageYears + 5;
    } elseif (strtolower($gender) === 'female') {
        $bmr = 10 * $weightKg + 6.25 * $heightCm - 5 * $ageYears - 161;
    } else {
        return "Invalid gender";
    }

    return round($bmr, 2); // kcal/day
}

function getScoreCategorySpan($score) {
    if (!is_numeric($score)) {
        return '<span class="text-invalid">Invalid</span>';
    }

    if ($score < 70) {
        return '<span class="text-poor">Poor</span>';
    } elseif ($score >= 70 && $score < 80) {
        return '<span class="text-fair">Fair</span>';
    } else {
        return '<span class="text-good">Good</span>';
    }
}

function getSugarScoreGlucoseMetabolism($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Indicates Significant reduction in glucose utilization efficiency.";
    } elseif ($score >= 70 && $score < 80) {
        return "Indicates Mild impairment in glucose efficiency.";
    } else {
        return "Indicates Efficient glucose metabolism.";
    }
}

function getRespyrScoreMeaningSugarScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }         

    if ($score < 70) {
        return "Correlating with marked elevations in fasting glucose and/or HbA1c trends. Suggests increasing reliance on alternative energy pathways (lipolysis/ketone production).";
    } elseif ($score >= 70 && $score < 80) {
        return "Correlating with slight elevations in fasting glucose and/or HbA1c. This may reflect early-stage reduction in insulin sensitivity or changes in metabolic substrate use.";
    } else {
        return "Correlates with normal fasting glucose and HbA1c levels. No abnormal trends in glucose utilization or metabolic flexibility are observed.";
    }
}

function getClinicalSuggestionSugarScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Further metabolic evaluation may be suggested to explore potential contributors to impaired glucose handling.";
    } elseif ($score >= 70 && $score < 80) {
        return "Periodic monitoring of metabolic markers may be considered.";
    } else {
        return "No further evaluation typically required unless clinically indicated.";
    }
}

function getClinicalCorrelation($scoreName) {
    $correlations = [
        "sugarScore" => "The Respyr Sugar Score correlates with fasting blood glucose and HbA1c trends, based on internal validation studies benchmarking exhaled breath VoC levels against standard clinical markers of glucose metabolism.",
        "liverScore" => "The Respyr Liver Stress Score demonstrates correlation with liver enzyme and imaging findings in individuals with confirmed liver conditions, based on internal validation studies. The score aligns with emerging scientific evidence linking elevated exhaled ethanol levels to increased hepatic metabolic burden and gut-liver axis dysfunction.",
        "respiratoryScore" => "The Respyr Respiratory Score correlates with pulmonary function trends derived from expiratory pressure converted into flow, and subsequently into FEV1 (Forced Expiratory Volume in 1 second) values. Calibration was conducted using the AveloAir Digital Spirometer, a globally certified spirometry device. For validation, individuals with doctor-confirmed respiratory issues and valid Pulmonary Function Test (PFT) reports were included. Respyr’s pressure-derived FEV1 trends were compared with the respiratory status of each individual. Lower FEV1 values consistently corresponded with lower Respyr Scores, aligning with expected patterns of airflow changes.",
        "gutScore" => "The Respyr Gut Fermentation Score is based on rapid, single-point exhaled hydrogen (H₂) measurement and correlates with globally recognized breath test benchmarks. While traditional clinical standards are based on multi-step glucose or lactulose challenge tests, Respyr adapts validated baseline H₂ concentration ranges observed in gut fermentation studies. Sensor calibration is aligned with literaturereported thresholds reflecting physiological and dysbiotic fermentation patterns. This makes the score areliable, non-invasive functional screening tool for assessing real-time gut fermentation activity."
    ];

    return $correlations[$scoreName] ?? "No correlation info available for this score.";
}

function getClinicalInsight($scoreName) {
    $insights = [
        "sugarScore" => "This score provides clinical insights on overall glucose metabolism efficiency, including insulin sensitivity and metabolic flexibility. It offers an early, non-invasive indicator of carbohydrate utilization trends without directly measuring blood glucose levels..",
        "liverScore" => "This score provides clinical insights on patterns of hepatic metabolic stress and gut-liver axis interaction. It serves as a non-invasive functional screening tool to detect potential liver strain, without diagnosing specific hepatic disorders.",
        "respiratoryScore" => "This score provides clinical insights on the following key components of respiratory function:Expiratory flow capacity, through FEV1 estimation. Airway resistance, derived from pressure-to-flow dynamics. Ventilatory efficiency, using additional indicators such as FVC, PEF, and FEV1/FVC ratio. These combined outputs offer a comprehensive, non-invasive view of respiratory performance trends. While FEV1 is the sole input used to calculate the Respyr Score, additional parameters such as FVC, PEF, and the FEV1/FVC ratio are provided for clinical context. The score functions as a non-invasive pre-screening feature designed to support the early identification of respiratory decline, longitudinal trend monitoring, and preventive assessment in health contexts.",
        "gutScore" => "This score provides clinical insights on degree of intestinal fermentation activity, microbial balance, and carbohydrate absorption efficiency. It offers a non-invasive, real-time indicator of potential gut dysbiosis or malabsorption trends. While not diagnostic, it helps monitor functional gut health andsupports early identification of fermentation-related imbalances without pinpointing specific gastrointestinal disorders."
    ];

    return $insights[$scoreName] ?? "No clinical insight available for this score.";
}

// Liver
function getLiverScoreHepaticStress($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Indicates significant hepatic stress";
    } elseif ($score >= 70 && $score < 80) {
        return "Indicates mild hepatic stress.";
    } else {
        return "Indicates minimal hepatic stress";
    }
}

function getRespyrScoreMeaningLiverScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "May indicate early metabolic strain, minor inefficiencies in hepatic processing, or subtle gut-liver axis interactions";
    } elseif ($score >= 70 && $score < 80) {
        return "May indicate early metabolic strain,minor inefficiencies in hepatic processing, or subtle gut-liver axis interactions.";
    } else {
        return "Metabolic liver function appears consistent with healthy patterns, with no significant evidence of gut-liver axis disturbance.";
    }
}

function getClinicalSuggestionLiverScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Comprehensive liver function evaluation is suggested based on the individual's clinical scenario.";
    } elseif ($score >= 70 && $score < 80) {
        return "Further evaluation may be considered depending on individual clinical context, lifestyle, or dietary history.";
    } else {
        return "No further evaluation typically required unless clinically indicated.";
    }
}

// Respiratory
function getRespiratoryScoreAirflowVentilation($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Significant reduction in expiratory capacity. FEV1 < 70% of predicted. FVC, PEF, and FEV1/FVC ratio may also be reduced.";
    } elseif ($score >= 70 && $score < 80) {
        return "Mild reduction in expiratory efficiency. FEV1 between 70–79% of predicted. Subtle variations may be seen in supporting metrics.";
    } else {
        return "Normal expiratory flow and lung capacity. Pressure-derived FEV1 ≥ 80% of predicted value. FVC, PEF, and FEV1/FVC ratio are also within expected ranges.";
    }
}

function getRespyrScoreMeaningRespiratoryScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Indicates notable decline in ventilatory function. May reflect increasing resistance or reduced flow capacity.";
    } elseif ($score >= 70 && $score < 80) {
        return "Indicates early changes in respiratory performance. Respyr Score flags minor reduction in airflow capacity.";
    } else {
        return "Indicates efficient ventilatory function. Respyr Score reflects normal respiratory performance.";
    }
}

function getClinicalSuggestionRespiratoryScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Further clinical evaluation with spirometry may be considered based on the individual’s clinical scenario. Suitable for early screening or referral in occupational or preventive health contexts.";
    } elseif ($score >= 70 && $score < 80) {
        return "Periodic monitoring may be considered. Clinical spirometry may be suggested if symptoms such as breathlessness or chronic cough are present.";
    } else {
        return "No further evaluation typically required unless clinically indicated.";
    }
}

// Gut
function getGutScoreFermentationActivity($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Indicates Significant fermentation imbalance.";
    } elseif ($score >= 70 && $score < 80) {
        return "Indicates Moderate elevation in fermentation activity.";
    } else {
        return "Indicates Balanced gut fermentation activity.";
    }
}

function getRespyrScoreMeaningGutScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "Correlating with markedly elevated hydrogen levels. May reflect considerable dysbiosis, potential carbohydrate absorption inefficiency, or excessive microbial fermentation. Bloating and digestive discomfort are likely.";
    } elseif ($score >= 70 && $score < 80) {
        return "Correlating with slight increases in hydrogen production. This may be associated with early dysbiosis or mild inefficiencies in carbohydrate absorption. Occasional bloating or digestive discomfort may be reported.";
    } else {
        return "Hydrogen levels fall within expected physiological ranges, correlating with efficient carbohydrate absorption and stable microbial fermentation. No significant gastrointestinal concerns observed.";
    }
}

function getClinicalSuggestionGutScore($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score < 70) {
        return "As a screening result, further gastrointestinal evaluation may be warranted.";
    } elseif ($score >= 70 && $score < 80) {
        return "Further assessment of gut fermentation trends may be considered if symptoms persist.";
    } else {
        return "No further evaluation typically required unless clinically indicated.";
    }
}

// UI Score Blocks
function getScoreDiv($score) {
    if (!is_numeric($score)) {
        return '<div class="score-value invalid">Invalid</div>';
    }

    if ($score >= 80) {
        $class = "good";
    } elseif ($score >= 70) {
        $class = "fair";
    } else {
        $class = "poor";
    }

    return '<div class="score-value ' . $class . '">' . $score . '%</div>';
}

function getScoreStatusDiv($score) {
    if (!is_numeric($score)) {
        return '<div class="score-status invalid">Invalid!</div>';
    }

    if ($score >= 80) {
        $class = "good";
        $text = "Good!";
    } elseif ($score >= 70) {
        $class = "fair";
        $text = "Fair!";
    } else {
        $class = "poor";
        $text = "Poor!";
    }

    return '<div class="score-status ' . $class . '">' . $text . '</div>';
}

function getScoreProgressDiv($score) {
    if (!is_numeric($score)) {
        return '<div class="score-progress"><div class="progress" style="width:0%">.</div></div>';
    }

    $width = max(0, min(100, round($score))); // Ensure 0–100 range
    return '<div class="score-progress">
                <div class="progress" style="width:' . $width . '%" data-value="' . $width . '">.</div>
            </div>';
}

function getScoreMessage($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score >= 80) {
        return "Everything looks good!";
    } elseif ($score >= 70) {
        return "Room for improvement";
    } else {
        return "Attention required";
    }
}



function getScoreMessage1($score) {
    if (!is_numeric($score)) {
        return "Invalid score";
    }

    if ($score >= 80) {
        return '<p class="score-message good">Everything looks good!</p>';
    } elseif ($score >= 70) {
        return '<p class="score-message fair">Attention required!</p>';
    } else {
        return '<p class="score-message poor">Attention required</p>';
    }
}

function formatTimestamp($timestamp) {
    if (!is_numeric($timestamp)) {
        return "Invalid timestamp";
    }

    return date('j F Y, g:iA', $timestamp); // Example: 2 May 2025, 12:15PM
}


function getQuickScoreInterpretation($score, $scoreType) {
    $scoreInterpretations = [
        'sugar' => [
            'good' => 'Efficient glucose metabolism.',
            'fair' => 'May suggest early changes in insulin sensitivity.',
            'poor' => 'Reduced glucose utilization; metabolic follow-up may be helpful.',
        ],
        'gut' => [
            'good' => 'Balanced gut fermentation.',
            'fair' => 'Mild dysbiosis or early malabsorption possible.',
            'poor' => 'Elevated fermentation; gut imbalance may be present.',
        ],
        'respiratory' => [
            'good' => 'Normal respiratory performance.',
            'fair' => 'Mild airflow reduction; monitor symptoms.',
            'poor' => 'Reduced lung capacity; clinical review may be considered.',
        ],
        'liver' => [
            'good' => 'Minimal hepatic stress.',
            'fair' => 'Early metabolic strain may be present.',
            'poor' => 'Increased liver stress; dietary or medical review may help.',
        ],
    ];

    // Normalize score type to lowercase to avoid case mismatch
    $scoreType = strtolower($scoreType);

    if (!isset($scoreInterpretations[$scoreType])) {
        return "Invalid score type.";
    }

    if ($score >= 80) {
        $class = 'good';
    } elseif ($score >= 70) {
        $class = 'fair';
    } else {
        $class = 'poor';
    }

    return $scoreInterpretations[$scoreType][$class] ?? "Interpretation not available.";
}




$data = json_decode($respiratoryJson, true);

// 1. Comparison with Predicted
$fev1_vs_predicted = $data["Comparison_with_Predicted(%)"]["FEV1_vs_Predicted"] ?? null;
$fvc_vs_predicted = $data["Comparison_with_Predicted(%)"]["FVC_vs_Predicted"] ?? null;
$ratio_vs_predicted = $data["Comparison_with_Predicted(%)"]["Ratio_vs_Predicted"] ?? null;

// 2. Predicted Values
$predicted_fev1 = $data["Predicted"]["FEV1(L)"] ?? null;
$predicted_fvc = $data["Predicted"]["FVC(L)"] ?? null;
$predicted_ratio = $data["Predicted"]["FEV1/FVC_Ratio(%)"] ?? null;

// 3. Respiratory Score
$respiratory_score = $data["Respiratory Score(%)"]["Respiratory Score(%)"] ?? null;

// 4. Respyr Measured Values
$measured_fev1 = $data["Respyr_Measured"]["FEV1(L)"] ?? null;
$measured_fvc = $data["Respyr_Measured"]["FVC(L)"] ?? null;
$measured_ratio = $data["Respyr_Measured"]["FEV1/FVC Ratio(%)"] ?? null;
$measured_pef = $data["Respyr_Measured"]["PEF(L/min)"] ?? null;


?>

























