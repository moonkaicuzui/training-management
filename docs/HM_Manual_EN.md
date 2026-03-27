# 24/7 Humidity Monitor Management Module — User Manual

**System**: Q-TRAIN (Quality Training Management)
**Version**: 1.0
**Date**: 2026-03-27
**Contact**: ksmoon@hsvina.com

---

## 1. Overview

### Purpose
This module manages **regular inspections of 38 humidity monitoring devices across 35 zones** in HWK Vietnam facilities.

### Why We Changed
| Before | After |
|--------|-------|
| Vo Thi Thuy Linh sends biweekly email report manually | Online input in Q-TRAIN system |
| No history tracking | Full inspection history with dashboard |
| Hard to see trends | Real-time trend charts and KPI cards |

### What You Can Do
- Enter inspection results for all 35 zones at once
- See dashboard with KPI cards and trend charts
- Export reports (Excel / PDF)
- Get automatic weekly and monthly email reports

---

## 2. How to Access

### Step 1: Open Browser
Go to: **https://q-train-web.web.app**

### Step 2: Login
Use your company email account (**@hsvina.com**)

### Step 3: Find the Menu
Left sidebar → **Equipment** → **Humidity Monitor**

---

## 3. Settings Page

**URL**: `/equipment/humidity-monitor/settings`

This page shows the master data for all **35 zones**.

### What You Can Do
| Action | How |
|--------|-----|
| View all zones | Open settings page — see the full list |
| Add a new zone | Click "Add Zone" button → fill in zone name, building, target quantity (T.O) |
| Edit a zone | Click the edit icon next to any zone → change details → save |
| Delete a zone | Click the delete icon next to any zone → confirm |
| Load initial data | Click "Load Initial Data" button (first time only) — adds all 35 zones at once |

### Zone Information
Each zone has:
- **Zone Name**: Name of the area (e.g., "A-1F Cutting")
- **Building**: Which building (A, B, C, D, E)
- **Target Quantity (T.O)**: How many devices should be in this zone

---

## 4. Inspection Input Page (Main Page)

**URL**: `/equipment/humidity-monitor`

This is the **most important page**. Use this page to enter inspection results.

### Step 1: Select Inspection Date
- Click the date input field
- Choose the date you did the inspection

### Step 2: Enter Inspector Name
- Type the name of the person who did the inspection

### Step 3: Enter Results for Each Zone

You will see a table with all **35 zones**. For each zone:

| Column | What It Means | What to Do |
|--------|--------------|------------|
| **Zone** | Zone name | (auto-filled) |
| **T.O** | Target quantity | (auto-filled from settings) |
| **OK** | Number of devices working normally | Default = T.O. Change only if different |
| **NO OK** | Number of devices NOT working | Default = 0. Enter the number if any device is not working |
| **Total** | OK + NO OK | (auto-calculated) |
| **Missing** | Total - T.O | (auto-calculated) Shows negative if devices are missing |
| **Remark** | Notes about problems | **Required** if NO OK > 0 or Missing != 0 |

### How to Enter Data Quickly
- **If everything is OK**: You don't need to change anything. Default values are OK = T.O, NO OK = 0
- **If there is a problem**: Only change the zones that have issues
- **Remark is required**: If a zone has NO OK > 0 or Missing devices, you must write a remark

### Step 4: Save
- Click the **"Save All"** button at the bottom
- All 35 zones are saved at once

### If Data Already Exists
- If you open a date that already has data, the system loads the existing data
- You can edit and save again (update mode)

---

## 5. Dashboard

**URL**: `/equipment/humidity-monitor/dashboard`

The dashboard shows the current status and trends.

### KPI Cards (Top)
| Card | What It Shows |
|------|-------------|
| **Total Devices** | Total number of monitoring devices (38) |
| **OK** | Number of devices working normally |
| **NO OK** | Number of devices NOT working |
| **Missing** | Number of devices missing from zones |

### OK Rate Trend Chart
- Shows the OK rate (%) for the **last 12 inspections**
- Helps you see if the situation is getting better or worse

### Building Comparison Table
- Compares status across buildings: **A, B, C, D, E**
- Shows OK count, NO OK count, and OK rate for each building

### Repeated Issue Zones
- Shows zones that had problems for **3 or more consecutive inspections**
- These zones need special attention

### Inspection History Table
- Shows all past inspection records
- You can click on a record to see details

---

## 6. Report Page

**URL**: `/equipment/humidity-monitor/report`

### How to Use
1. Select **start date** and **end date**
2. Click **"Generate Report"**
3. Export as **Excel** or **PDF**

### What the Report Includes
- Summary of all inspections in the selected period
- Zone-by-zone detail
- OK rate trends
- Problem zones list

---

## 7. Automatic Email Reports

The system sends automatic email reports:

| Report | When | Time |
|--------|------|------|
| **Weekly Report** | Every Sunday | 23:30 |
| **Monthly Report** | 1st day of each month | 07:00 |

### Monthly Report
- Combined report: **Charcoal Box + Humidity Monitor**
- Includes KPI summary, trends, and problem zones

### Who Gets the Email
- Managed by administrators in the **Email Settings** page
- Contact your administrator to add or remove recipients

---

## 8. Inspection Schedule

| Item | Detail |
|------|--------|
| **Frequency** | Every 2 weeks (biweekly) |
| **Person in Charge** | Vo Thi Thuy Linh (thuylinhrg@hsvina.com) |
| **Method** | Enter results in Q-TRAIN system |

### Important Notes
- Please enter the inspection results on the same day you do the inspection
- Make sure to write remarks for any problem zones
- If you have questions, contact: **ksmoon@hsvina.com**

---

*Q-TRAIN System — HWK Vietnam QIP Department*
*Document created: 2026-03-27*
