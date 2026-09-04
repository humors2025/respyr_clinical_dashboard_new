/**
 * Clinical interpretation text for the printed report.
 *
 * GENERATED from the legacy report/methods.php by executing it, not by
 * transcription — clinicians read this wording against the score bands and it
 * must stay byte-identical to what the PHP portal produced.
 *
 * If the clinical copy needs to change, change it deliberately here and note
 * that the legacy report will then disagree.
 */
import type { Band, ScoreKey } from "./scores";

interface ScoreCopy {
  /** Headline finding, e.g. "Indicates Efficient glucose metabolism." */
  finding: string;
  /** "Respyr Score Meaning" paragraph. */
  meaning: string;
  /** "Clinical Considerations / Suggested Next Steps". */
  nextSteps: string;
}

export const SCORE_COPY: Record<ScoreKey, Record<Band, ScoreCopy>> = {
  sugar: {
    good: {
      finding: "Indicates Efficient glucose metabolism.",
      meaning: "Correlates with normal fasting glucose and HbA1c levels. No abnormal trends in glucose utilization or metabolic flexibility are observed.",
      nextSteps: "No further evaluation typically required unless clinically indicated.",
    },
    fair: {
      finding: "Indicates Mild impairment in glucose efficiency.",
      meaning: "Correlating with slight elevations in fasting glucose and/or HbA1c. This may reflect early-stage reduction in insulin sensitivity or changes in metabolic substrate use.",
      nextSteps: "Periodic monitoring of metabolic markers may be considered.",
    },
    poor: {
      finding: "Indicates Significant reduction in glucose utilization efficiency.",
      meaning: "Correlating with marked elevations in fasting glucose and/or HbA1c trends. Suggests increasing reliance on alternative energy pathways (lipolysis/ketone production).",
      nextSteps: "Further metabolic evaluation may be suggested to explore potential contributors to impaired glucose handling.",
    },
  },
  liver: {
    good: {
      finding: "Indicates minimal hepatic stress",
      meaning: "Metabolic liver function appears consistent with healthy patterns, with no significant evidence of gut-liver axis disturbance.",
      nextSteps: "No further evaluation typically required unless clinically indicated.",
    },
    fair: {
      finding: "Indicates mild hepatic stress.",
      meaning: "May indicate early metabolic strain,minor inefficiencies in hepatic processing, or subtle gut-liver axis interactions.",
      nextSteps: "Further evaluation may be considered depending on individual clinical context, lifestyle, or dietary history.",
    },
    poor: {
      finding: "Indicates significant hepatic stress",
      meaning: "May indicate early metabolic strain, minor inefficiencies in hepatic processing, or subtle gut-liver axis interactions",
      nextSteps: "Comprehensive liver function evaluation is suggested based on the individual's clinical scenario.",
    },
  },
  respiratory: {
    good: {
      finding: "Normal expiratory flow and lung capacity. Pressure-derived FEV1 ≥ 80% of predicted value. FVC, PEF, and FEV1/FVC ratio are also within expected ranges.",
      meaning: "Indicates efficient ventilatory function. Respyr Score reflects normal respiratory performance.",
      nextSteps: "No further evaluation typically required unless clinically indicated.",
    },
    fair: {
      finding: "Mild reduction in expiratory efficiency. FEV1 between 70–79% of predicted. Subtle variations may be seen in supporting metrics.",
      meaning: "Indicates early changes in respiratory performance. Respyr Score flags minor reduction in airflow capacity.",
      nextSteps: "Periodic monitoring may be considered. Clinical spirometry may be suggested if symptoms such as breathlessness or chronic cough are present.",
    },
    poor: {
      finding: "Significant reduction in expiratory capacity. FEV1 < 70% of predicted. FVC, PEF, and FEV1/FVC ratio may also be reduced.",
      meaning: "Indicates notable decline in ventilatory function. May reflect increasing resistance or reduced flow capacity.",
      nextSteps: "Further clinical evaluation with spirometry may be considered based on the individual’s clinical scenario. Suitable for early screening or referral in occupational or preventive health contexts.",
    },
  },
  gut: {
    good: {
      finding: "Indicates Balanced gut fermentation activity.",
      meaning: "Hydrogen levels fall within expected physiological ranges, correlating with efficient carbohydrate absorption and stable microbial fermentation. No significant gastrointestinal concerns observed.",
      nextSteps: "No further evaluation typically required unless clinically indicated.",
    },
    fair: {
      finding: "Indicates Moderate elevation in fermentation activity.",
      meaning: "Correlating with slight increases in hydrogen production. This may be associated with early dysbiosis or mild inefficiencies in carbohydrate absorption. Occasional bloating or digestive discomfort may be reported.",
      nextSteps: "Further assessment of gut fermentation trends may be considered if symptoms persist.",
    },
    poor: {
      finding: "Indicates Significant fermentation imbalance.",
      meaning: "Correlating with markedly elevated hydrogen levels. May reflect considerable dysbiosis, potential carbohydrate absorption inefficiency, or excessive microbial fermentation. Bloating and digestive discomfort are likely.",
      nextSteps: "As a screening result, further gastrointestinal evaluation may be warranted.",
    },
  },
};

/** One-line summary used on the Quick Summary page. */
export const QUICK_SUMMARY: Record<ScoreKey, Record<Band, string>> = {
  sugar: {
    good: "Efficient glucose metabolism.",
    fair: "May suggest early changes in insulin sensitivity.",
    poor: "Reduced glucose utilization; metabolic follow-up may be helpful.",
  },
  liver: {
    good: "Minimal hepatic stress.",
    fair: "Early metabolic strain may be present.",
    poor: "Increased liver stress; dietary or medical review may help.",
  },
  respiratory: {
    good: "Normal respiratory performance.",
    fair: "Mild airflow reduction; monitor symptoms.",
    poor: "Reduced lung capacity; clinical review may be considered.",
  },
  gut: {
    good: "Balanced gut fermentation.",
    fair: "Mild dysbiosis or early malabsorption possible.",
    poor: "Elevated fermentation; gut imbalance may be present.",
  },
};

/** How the score was validated against conventional clinical markers. */
export const CORRELATION: Record<ScoreKey, string> = {
  sugar: "The Respyr Sugar Score correlates with fasting blood glucose and HbA1c trends, based on internal validation studies benchmarking exhaled breath VoC levels against standard clinical markers of glucose metabolism.",
  liver: "The Respyr Liver Stress Score demonstrates correlation with liver enzyme and imaging findings in individuals with confirmed liver conditions, based on internal validation studies. The score aligns with emerging scientific evidence linking elevated exhaled ethanol levels to increased hepatic metabolic burden and gut-liver axis dysfunction.",
  respiratory: "The Respyr Respiratory Score correlates with pulmonary function trends derived from expiratory pressure converted into flow, and subsequently into FEV1 (Forced Expiratory Volume in 1 second) values. Calibration was conducted using the AveloAir Digital Spirometer, a globally certified spirometry device. For validation, individuals with doctor-confirmed respiratory issues and valid Pulmonary Function Test (PFT) reports were included. Respyr’s pressure-derived FEV1 trends were compared with the respiratory status of each individual. Lower FEV1 values consistently corresponded with lower Respyr Scores, aligning with expected patterns of airflow changes.",
  gut: "The Respyr Gut Fermentation Score is based on rapid, single-point exhaled hydrogen (H₂) measurement and correlates with globally recognized breath test benchmarks. While traditional clinical standards are based on multi-step glucose or lactulose challenge tests, Respyr adapts validated baseline H₂ concentration ranges observed in gut fermentation studies. Sensor calibration is aligned with literaturereported thresholds reflecting physiological and dysbiotic fermentation patterns. This makes the score areliable, non-invasive functional screening tool for assessing real-time gut fermentation activity.",
};

/** What the score tells a clinician. */
export const CLINICAL_INSIGHT: Record<ScoreKey, string> = {
  sugar: "This score provides clinical insights on overall glucose metabolism efficiency, including insulin sensitivity and metabolic flexibility. It offers an early, non-invasive indicator of carbohydrate utilization trends without directly measuring blood glucose levels..",
  liver: "This score provides clinical insights on patterns of hepatic metabolic stress and gut-liver axis interaction. It serves as a non-invasive functional screening tool to detect potential liver strain, without diagnosing specific hepatic disorders.",
  respiratory: "This score provides clinical insights on the following key components of respiratory function:Expiratory flow capacity, through FEV1 estimation. Airway resistance, derived from pressure-to-flow dynamics. Ventilatory efficiency, using additional indicators such as FVC, PEF, and FEV1/FVC ratio. These combined outputs offer a comprehensive, non-invasive view of respiratory performance trends. While FEV1 is the sole input used to calculate the Respyr Score, additional parameters such as FVC, PEF, and the FEV1/FVC ratio are provided for clinical context. The score functions as a non-invasive pre-screening feature designed to support the early identification of respiratory decline, longitudinal trend monitoring, and preventive assessment in health contexts.",
  gut: "This score provides clinical insights on degree of intestinal fermentation activity, microbial balance, and carbohydrate absorption efficiency. It offers a non-invasive, real-time indicator of potential gut dysbiosis or malabsorption trends. While not diagnostic, it helps monitor functional gut health andsupports early identification of fermentation-related imbalances without pinpointing specific gastrointestinal disorders.",
};

export const REPORT_DISCLAIMER =
  "Respyr provides non-invasive screening insights based on breath analysis. The scores and " +
  "interpretations presented are intended to indicate physiological trends and support lifestyle " +
  "and preventive health monitoring. Respyr does not diagnose, treat, or prevent any disease. " +
  "This interpretation guide is intended for use by qualified healthcare providers to understand " +
  "screening trends. Clinical judgment and confirmatory testing should be used before making any " +
  "medical decisions. Respyr is not a substitute for standard clinical testing or professional " +
  "medical evaluation.";
