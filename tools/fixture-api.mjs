// Throwaway fixture server standing in for the humorstech PHP API.
// All names/values are fabricated — no real patient data.
import { createServer } from "node:http";

const NAMES = [
  ["Ishan Sinha","Male",28],["Arun Prakash","Male",52],["Meera Iyer","Female",34],
  ["Shashi Mukesh","Male",58],["Nilu Bala","Female",54],["Priya Sharma","Female",31],
  ["Rohan Desai","Male",22],["Kavya Nair","Female",45],["Vikram Rao","Male",61],
  ["Ananya Bose","Female",26],["Farhan Qureshi","Male",39],["Divya Menon","Female",47],
  ["Sanjay Gupta","Male",44],["Riya Kapoor","Female",19],
];
const seeded = (i,s) => { const x = Math.sin((i+1)*12.9898 + s*78.233)*43758.5453; return x - Math.floor(x); };
const score  = (i,s) => Math.round((52 + seeded(i,s)*48)*10)/10;
const pad = n => String(n).padStart(2,"0");

createServer((req,res) => {
  const now = new Date();
  const p = req.url.split("?")[0];
  res.setHeader("Content-Type","application/json");
  let body;

  if (p.includes("age-gender-diversity")) {
    body = NAMES.map(([name,gender,age],i) => ({
      profile_id:`subject${140+i}`, name, gender, age,
      Db_Score:score(i,1), liver_score:score(i,2), Blow_Score:score(i,3), Gut_Score_per:score(i,4),
      acetone_ppm:Math.round(seeded(i,5)*90)/10, ethnol_ppm:Math.round(seeded(i,6)*60)/10,
      h2_ppm:Math.round(seeded(i,7)*40)/10,
      dttm:`${pad(now.getMonth()+1)}/${pad(now.getDate())}/${now.getFullYear()} ${pad(8+(i%9))}:${pad((i*7)%60)}:00`,
    }));
  } else if (p.includes("data-weeks")) {
    body = [];
    for (let d=45; d>=0; d--) {
      const day = new Date(now); day.setDate(day.getDate()-d);
      for (let k=0, n=Math.floor(seeded(d,9)*6); k<n; k++)
        body.push({ timestamp: Math.floor(day.getTime()/1000)+k*900 });
    }
  } else if (p.includes("opd-encry-data_v2")) {
    // Subject roster: one row per subject, not per test.
    body = NAMES.map(([name,gender,age],i) => ({
      profile_id:`subject${140+i}`, name, gender, age,
      count_taken: 1 + Math.floor(seeded(i,11)*22),
      Db_Score:score(i,1), liver_score:score(i,2), Blow_Score:score(i,3), Gut_Score_per:score(i,4),
      dttm:`${pad(now.getMonth()+1)}/${pad(Math.max(1, now.getDate()-(i%20)))}/${now.getFullYear()} ${pad(8+(i%9))}:${pad((i*7)%60)}:00`,
    }));
  } else if (p.includes("data-interp")) {
    body = { name:"Vikram Rao", gender:"male", age:61, height:172, weight:78 };
  } else if (p.includes("trends-history")) {
    body = [];
    for (let k = 0; k < 9; k++) {
      const d = new Date(now); d.setDate(d.getDate() - k*9);
      body.push({
        dttm:`${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(9+(k%8))}:${pad((k*13)%60)}:00`,
        Db_Score:score(k,21), liver_score:score(k,22), Blow_Score:score(k,23), Gut_Score_per:score(k,24),
        acetone_ppm:Math.round(seeded(k,25)*90)/10, h2_ppm:Math.round(seeded(k,26)*40)/10,
        ethnol_ppm:Math.round(seeded(k,27)*60)/10, FEV1_L:Math.round((1.8+seeded(k,28)*1.9)*100)/100,
        maxpress:993.19, blow_raw_values:"908.18,935.55,947.27,966.57,984.28,989.96,988.77,974.14,955.92,930.55",
        respiratory_fvc_json:JSON.stringify({"Respyr_Measured":{"FEV1(L)":2.48,"FVC(L)":3.32}}),
      });
    }
  } else if (p.includes("fetch_clinical_profiles2")) {
    body = { status:"success", data: NAMES.map(([name,gender,age],i) => ({
      subject_id:`subject${140+i}`, profile_name:name, gender, age,
      height: 150 + Math.round(seeded(i,13)*45),
      weight: 45 + Math.round(seeded(i,14)*55),
      clinic_name:"verify-demo",
      dttm:`2026-0${1+(i%9)}-${pad(1+(i%27))} ${pad(9+(i%8))}:${pad((i*11)%60)}:00`,
    })) };
  } else if (p.includes("update_clinical_profile")) {
    body = { status:"success", message:"Profile updated successfully." };
  } else if (p.includes("onboard-pat")) {
    body = { onboarded: 128 };
  } else if (p.includes("testallow")) {
    body = { test_allow:"true", clinical_score_count:214, test_no:500 };
  } else {
    res.statusCode = 404; body = { error:`unmocked ${p}` };
  }
  req.resume();
  res.end(JSON.stringify(body));
}).listen(3005, () => console.log("fixture API on :3005"));
