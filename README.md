# Respyr Clinical Dashboard

Web portal for clinics using the Respyr breath-based health screening device.

Clinicians sign in, review patient (subject) test results across four breath-derived
scores, drill into individual trends, and generate branded PDF health reports.

## Scores

| Score | Key | Biomarker |
| --- | --- | --- |
| Sugar | `Db_Score` | Acetone (ppm) |
| Liver | `liver_score` | Ethanol (ppm) |
| Gut | `Gut_Score_per` | Hydrogen (ppm) |
| Respiratory | `Blow_Score` | FEV1 / FVC from expiratory pressure |

Bands: **Good** ≥ 80, **Fair** 70–79, **Poor** < 70.

## Layout

| Path | Purpose |
| --- | --- |
| `clinical-v2/` | Login portal, JWT issuing, authenticated API proxy |
| `clinical-dashboard_v2/` | Dashboard UI, patient pages, PDF report generator |

## Status

Repository initialised. Application source is added in follow-up commits.

---

© Humorstech Pvt Ltd
