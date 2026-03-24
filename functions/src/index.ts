import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { logger } from "firebase-functions";
import { google } from "googleapis";
import * as admin from "firebase-admin";
import { sendEmail, sendTemplatedEmail } from "./services/emailService";
import type { TemplateType, SupportedLanguage } from "./services/emailTemplates";
import {
  preflightCheck,
  sendAutoTemplatedEmail,
  logEmailResult,
} from "./services/autoEmailService";
import { fetchMonthData, fetchMonthList } from "./services/fivePrsApi";
import { fetchAqlMonthList, fetchAqlMonthData } from "./services/aqlApi";
import { fetchManpowerFromDrive } from "./services/driveService";
import {
  readAllEmployees as readSheetEmployees,
  findEmployeeRow,
  updateEmployeeRow,
  appendEmployee as appendSheetEmployee,
  ensureHeader,
} from "./services/sheetsService";
import type { EmployeeRow } from "./services/sheetsService";
import { analyzeFromRawData } from "./services/recommendationEngine";
import { generateAiBriefing } from "./services/aiService";
import { analyzeCAPARootCause } from "./services/capaAiService";
import { generateExecutiveReport } from "./services/executiveReportService";
import { runWeeklyAqlAnalysisAndEnroll } from "./services/aqlAnalysisService";
import {
  generateDailyTrainerDirective,
  checkDirectiveEscalation,
  trackTrainingEffectiveness,
} from "./services/trainerDirectiveService";
import type {
  RecommendationThreshold,
  DefectTrainingMapping,
  TqcEmployeeLink,
  ServerEmployee,
  ServerTrainingProgram,
} from "./services/recommendationEngine";

// Initialize Firebase Admin (idempotent check)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const PROJECT_ID = "q-train-web";
const PROJECT_NAME = `projects/${PROJECT_ID}`;
const REGION = "asia-southeast1";

// Global function options - cost control
setGlobalOptions({ maxInstances: 5 });

// =============================================================================
// Billing Alert
// =============================================================================

export const billingAlert = onMessagePublished(
  "budget-alerts",
  async (event) => {
    const data = JSON.parse(
      Buffer.from(event.data.message.data, "base64").toString()
    );

    const costAmount = data.costAmount;
    const budgetAmount = data.budgetAmount;

    logger.info(
      `Budget alert: cost=${costAmount}, budget=${budgetAmount}`
    );

    if (costAmount < budgetAmount) {
      logger.info(
        `Cost ${costAmount} is under budget ${budgetAmount}. No action needed.`
      );
      return;
    }

    logger.warn(
      `Cost ${costAmount} has exceeded budget ${budgetAmount}! Disabling billing...`
    );

    await disableBilling();
  }
);

async function disableBilling(): Promise<void> {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-billing"],
  });

  const billing = google.cloudbilling({ version: "v1", auth });

  const res = await billing.projects.getBillingInfo({ name: PROJECT_NAME });

  if (res.data.billingEnabled) {
    await billing.projects.updateBillingInfo({
      name: PROJECT_NAME,
      requestBody: { billingAccountName: "" },
    });
    logger.warn(`Billing disabled for ${PROJECT_ID}`);
  } else {
    logger.info(`Billing already disabled for ${PROJECT_ID}`);
  }
}

// =============================================================================
// Email (using string-based secrets like return-dashboard pattern)
// =============================================================================

export const sendEmailFn = onCall(
  {
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    region: REGION,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be authenticated to send emails."
      );
    }

    const {to, subject, html, text, cc, bcc, replyTo} = request.data;

    if (!to || !subject || !html) {
      throw new HttpsError(
        "invalid-argument",
        "Required fields: to, subject, html"
      );
    }

    const emailUser = process.env.GMAIL_USER;
    const emailPass = process.env.GMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      throw new HttpsError(
        "internal",
        "Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD secrets."
      );
    }

    const result = await sendEmail(
      {to, subject, html, text, cc, bcc, replyTo},
      emailUser,
      emailPass
    );

    if (!result.success) {
      throw new HttpsError("internal", result.error || "Failed to send email");
    }

    return result;
  }
);

export const sendTemplatedEmailFn = onCall(
  {
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    region: REGION,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Must be authenticated to send emails."
      );
    }

    const {
      to,
      templateType,
      data,
      language,
      subject,
      cc,
      bcc,
      replyTo,
    } = request.data;

    if (!to || !templateType || !data) {
      throw new HttpsError(
        "invalid-argument",
        "Required fields: to, templateType, data"
      );
    }

    const validTemplateTypes: TemplateType[] = [
      "trainingRegistration",
      "trainingResult",
      "trainingReminder",
      "expiryWarning",
      "certificateIssued",
      "retrainingRequired",
      "general",
    ];

    if (!validTemplateTypes.includes(templateType as TemplateType)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid templateType. Must be one of: ${validTemplateTypes.join(", ")}`
      );
    }

    const validLanguages: SupportedLanguage[] = ["ko", "en", "vi"];
    if (language && !validLanguages.includes(language as SupportedLanguage)) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid language. Must be one of: ${validLanguages.join(", ")}`
      );
    }

    const emailUser = process.env.GMAIL_USER;
    const emailPass = process.env.GMAIL_APP_PASSWORD;

    if (!emailUser || !emailPass) {
      throw new HttpsError(
        "internal",
        "Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD secrets."
      );
    }

    const result = await sendTemplatedEmail(
      {
        to,
        templateType: templateType as TemplateType,
        data,
        language: (language as SupportedLanguage) || "ko",
        subject,
        cc,
        bcc,
        replyTo,
      },
      emailUser,
      emailPass
    );

    if (!result.success) {
      throw new HttpsError(
        "internal",
        result.error || "Failed to send templated email"
      );
    }

    return result;
  }
);

// =============================================================================
// 1. onTrainingResultCreated
//    Firestore trigger: when a new training result is created,
//    check if employee has completed all required training and log to auditLogs.
// =============================================================================

export const onTrainingResultCreated = onDocumentCreated(
  {
    document: "training_results/{resultId}",
    region: REGION,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn("onTrainingResultCreated: No data in event.");
      return;
    }

    const resultData = snapshot.data();
    const resultId = event.params.resultId;
    const employeeId = resultData.employee_id;
    const programCode = resultData.program_code;

    logger.info(
      `New training result created: resultId=${resultId}, employee=${employeeId}, program=${programCode}`
    );

    // Write audit log
    await db.collection("auditLogs").add({
      action: "training_result_created",
      collection: "training_results",
      documentId: resultId,
      employeeId: employeeId,
      programCode: programCode,
      data: resultData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Check if employee has completed all required training programs
    try {
      // Get all active training programs
      const programsSnapshot = await db
        .collection("training_programs")
        .where("is_active", "==", true)
        .get();

      const requiredProgramCodes = programsSnapshot.docs.map(
        (doc) => doc.data().program_code || doc.id
      );

      // Get all passing results for this employee
      const resultsSnapshot = await db
        .collection("training_results")
        .where("employee_id", "==", employeeId)
        .where("result", "==", "pass")
        .get();

      const completedProgramCodes = new Set(
        resultsSnapshot.docs.map((doc) => doc.data().program_code)
      );

      const allCompleted = requiredProgramCodes.every((code) =>
        completedProgramCodes.has(code)
      );

      if (allCompleted && requiredProgramCodes.length > 0) {
        logger.info(
          `Employee ${employeeId} has completed ALL required training programs.`
        );

        await db.collection("notifications").add({
          type: "all_training_completed",
          employeeId: employeeId,
          message: `Employee ${employeeId} has completed all required training programs.`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const remaining = requiredProgramCodes.filter(
          (code) => !completedProgramCodes.has(code)
        );
        logger.info(
          `Employee ${employeeId} has ${remaining.length} remaining programs: ${remaining.join(", ")}`
        );
      }
    } catch (error) {
      logger.error(
        `Error checking training completion for employee ${employeeId}:`,
        error
      );
    }
  }
);

// =============================================================================
// 2. onCertificateExpiryScan
//    Scheduled: daily at 6:00 AM Asia/Ho_Chi_Minh
//    Scans certificates collection for expiring certificates (within 30 days).
// =============================================================================

export const onCertificateExpiryScan = onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
  },
  async () => {
    logger.info("Running certificate expiry scan...");

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const nowTimestamp = admin.firestore.Timestamp.fromDate(now);
    const futureTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysFromNow);

    try {
      const certificatesSnapshot = await db
        .collection("certificates")
        .where("expiry_date", ">=", nowTimestamp)
        .where("expiry_date", "<=", futureTimestamp)
        .get();

      if (certificatesSnapshot.empty) {
        logger.info("No certificates expiring within 30 days.");
        return;
      }

      logger.info(
        `Found ${certificatesSnapshot.size} certificate(s) expiring within 30 days.`
      );

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of certificatesSnapshot.docs) {
        const certData = doc.data();
        const expiryDate = certData.expiry_date?.toDate
          ? certData.expiry_date.toDate()
          : new Date(certData.expiry_date);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const notificationRef = db.collection("notifications").doc();
        batch.set(notificationRef, {
          type: "certificate_expiry_warning",
          employeeId: certData.employee_id,
          certificateId: doc.id,
          certificateName: certData.certificate_name || certData.name || doc.id,
          expiryDate: certData.expiry_date,
          daysUntilExpiry: daysUntilExpiry,
          message: `Certificate "${certData.certificate_name || certData.name || doc.id}" expires in ${daysUntilExpiry} day(s).`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        batchCount++;

        // Firestore batch limit is 500 writes
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
          logger.info("Committed notification batch (limit reached).");
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(
        `Created ${certificatesSnapshot.size} certificate expiry notification(s).`
      );
    } catch (error) {
      logger.error("Error during certificate expiry scan:", error);
    }
  }
);

// =============================================================================
// 3. onTrainingSessionReminder
//    Scheduled: daily at 7:00 AM Asia/Ho_Chi_Minh
//    Checks training_sessions for sessions happening in next 3 days.
// =============================================================================

export const onTrainingSessionReminder = onSchedule(
  {
    schedule: "0 7 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
  },
  async () => {
    logger.info("Running training session reminder scan...");

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const nowTimestamp = admin.firestore.Timestamp.fromDate(now);
    const futureTimestamp = admin.firestore.Timestamp.fromDate(threeDaysFromNow);

    try {
      const sessionsSnapshot = await db
        .collection("training_sessions")
        .where("date", ">=", nowTimestamp)
        .where("date", "<=", futureTimestamp)
        .get();

      if (sessionsSnapshot.empty) {
        logger.info("No training sessions within the next 3 days.");
        return;
      }

      logger.info(
        `Found ${sessionsSnapshot.size} session(s) in the next 3 days.`
      );

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of sessionsSnapshot.docs) {
        const sessionData = doc.data();
        const sessionDate = sessionData.date?.toDate
          ? sessionData.date.toDate()
          : new Date(sessionData.date);
        const daysUntilSession = Math.ceil(
          (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const notificationRef = db.collection("notifications").doc();
        batch.set(notificationRef, {
          type: "training_session_reminder",
          sessionId: doc.id,
          programCode: sessionData.program_code,
          sessionDate: sessionData.date,
          location: sessionData.location || "",
          trainer: sessionData.trainer || "",
          daysUntilSession: daysUntilSession,
          message: `Training session "${sessionData.program_code}" is scheduled in ${daysUntilSession} day(s) on ${sessionDate.toISOString().split("T")[0]}.`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        batchCount++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
          logger.info("Committed reminder batch (limit reached).");
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(
        `Created ${sessionsSnapshot.size} training session reminder(s).`
      );
    } catch (error) {
      logger.error("Error during training session reminder scan:", error);
    }
  }
);

// =============================================================================
// 4. aggregateDashboardKPIs
//    Scheduled: daily at 1:00 AM Asia/Ho_Chi_Minh
//    Aggregates training statistics into dashboard_metrics collection.
// =============================================================================

export const aggregateDashboardKPIs = onSchedule(
  {
    schedule: "0 1 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
  },
  async () => {
    logger.info("Running dashboard KPI aggregation...");

    try {
      // 1. Total employees (active) - from Google Drive CSV
      let totalEmployees = 0;
      try {
        const manpowerResult = await fetchManpowerFromDrive();
        totalEmployees = manpowerResult.data.filter(row => !row.stop_working_date).length;
        logger.info(`aggregateDashboardKPIs: totalEmployees from Drive CSV = ${totalEmployees}`);
      } catch (driveError) {
        logger.warn("aggregateDashboardKPIs: Drive CSV failed, falling back to Firestore", driveError);
        const employeesSnapshot = await db
          .collection("employees")
          .where("status", "==", "active")
          .get();
        totalEmployees = employeesSnapshot.size;
      }

      // 2. Total training results and pass/fail counts
      const resultsSnapshot = await db
        .collection("training_results")
        .get();
      const totalResults = resultsSnapshot.size;

      let passCount = 0;
      let failCount = 0;
      const completedEmployees = new Set<string>();

      for (const doc of resultsSnapshot.docs) {
        const data = doc.data();
        if (data.result === "pass") {
          passCount++;
          completedEmployees.add(data.employee_id);
        } else if (data.result === "fail") {
          failCount++;
        }
      }

      const passRate = totalResults > 0
        ? Math.round((passCount / totalResults) * 10000) / 100
        : 0;

      const completionRate = totalEmployees > 0
        ? Math.round((completedEmployees.size / totalEmployees) * 10000) / 100
        : 0;

      // 3. Active training programs
      const programsSnapshot = await db
        .collection("training_programs")
        .where("is_active", "==", true)
        .get();
      const totalActivePrograms = programsSnapshot.size;

      // 4. Expiring certificates (within 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      const nowTimestamp = admin.firestore.Timestamp.fromDate(now);
      const futureTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysFromNow);

      let expiringCertificatesCount = 0;
      try {
        const expiringSnapshot = await db
          .collection("certificates")
          .where("expiry_date", ">=", nowTimestamp)
          .where("expiry_date", "<=", futureTimestamp)
          .get();
        expiringCertificatesCount = expiringSnapshot.size;
      } catch (certError) {
        logger.warn(
          "Could not query certificates collection (may not exist yet):",
          certError
        );
      }

      // 5. Upcoming sessions (next 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      const sevenDayTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysFromNow);

      let upcomingSessionsCount = 0;
      try {
        const upcomingSnapshot = await db
          .collection("training_sessions")
          .where("date", ">=", nowTimestamp)
          .where("date", "<=", sevenDayTimestamp)
          .get();
        upcomingSessionsCount = upcomingSnapshot.size;
      } catch (sessionError) {
        logger.warn(
          "Could not query training_sessions for upcoming count:",
          sessionError
        );
      }

      // Store aggregated metrics
      const metricsData = {
        totalEmployees,
        totalActivePrograms,
        totalResults,
        passCount,
        failCount,
        passRate,
        completionRate,
        employeesWithPassingResults: completedEmployees.size,
        expiringCertificatesCount,
        upcomingSessionsCount,
        calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        date: now.toISOString().split("T")[0],
      };

      // Write to a date-keyed document for historical tracking
      const dateKey = now.toISOString().split("T")[0]; // e.g. "2026-02-18"
      await db
        .collection("dashboard_metrics")
        .doc(dateKey)
        .set(metricsData);

      // Also write to a "latest" document for fast dashboard loading
      await db
        .collection("dashboard_metrics")
        .doc("latest")
        .set(metricsData);

      logger.info("Dashboard KPI aggregation complete:", metricsData);
    } catch (error) {
      logger.error("Error during dashboard KPI aggregation:", error);
    }
  }
);

// =============================================================================
// 5. weeklyTrainingRecommendation
//    Scheduled: Every Monday 6:00 AM Asia/Ho_Chi_Minh
//    Fetches 5PRS data, analyzes defect patterns, generates training
//    recommendations, auto-enrolls IMMEDIATE items, and sends summary email.
// =============================================================================

const DEFAULT_THRESHOLDS: Omit<RecommendationThreshold, never> = {
  immediate_rate: 5,
  preventive_rate_min: 3,
  preventive_rate_max: 5,
  min_validation_count: 100,
  surge_multiplier: 2,
  surge_min_rate: 3,
  surge_recent_days: 3,
  surge_past_days: 28,
};

export const weeklyTrainingRecommendation = onSchedule(
  {
    schedule: "0 6 * * 1",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    logger.info("Running weekly training recommendation analysis...");

    try {
      // ---------------------------------------------------------------
      // 1. Load config from Firestore
      // ---------------------------------------------------------------

      // 1a. Thresholds (get first doc or use defaults)
      let thresholds: RecommendationThreshold = { ...DEFAULT_THRESHOLDS };
      try {
        const thresholdSnap = await db
          .collection("recommendation_thresholds")
          .limit(1)
          .get();
        if (!thresholdSnap.empty) {
          const doc = thresholdSnap.docs[0].data();
          thresholds = {
            immediate_rate: doc.immediate_rate ?? DEFAULT_THRESHOLDS.immediate_rate,
            preventive_rate_min: doc.preventive_rate_min ?? DEFAULT_THRESHOLDS.preventive_rate_min,
            preventive_rate_max: doc.preventive_rate_max ?? DEFAULT_THRESHOLDS.preventive_rate_max,
            min_validation_count: doc.min_validation_count ?? DEFAULT_THRESHOLDS.min_validation_count,
            surge_multiplier: doc.surge_multiplier ?? DEFAULT_THRESHOLDS.surge_multiplier,
            surge_min_rate: doc.surge_min_rate ?? DEFAULT_THRESHOLDS.surge_min_rate,
            surge_recent_days: doc.surge_recent_days ?? DEFAULT_THRESHOLDS.surge_recent_days,
            surge_past_days: doc.surge_past_days ?? DEFAULT_THRESHOLDS.surge_past_days,
          };
          logger.info("Loaded thresholds from Firestore");
        } else {
          logger.info("No thresholds in Firestore, using defaults");
        }
      } catch (err) {
        logger.warn("Failed to load thresholds, using defaults:", err);
      }

      // 1b. Defect-training mappings (active only)
      const mappingsSnap = await db
        .collection("defect_training_mappings")
        .where("is_active", "==", true)
        .get();
      const mappings: DefectTrainingMapping[] = mappingsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          mapping_id: doc.id,
          defect_type: d.defect_type,
          program_codes: d.program_codes || [],
          description: d.description,
          is_active: d.is_active,
        };
      });
      logger.info(`Loaded ${mappings.length} active defect-training mappings`);

      // 1c. TQC-Employee links (all)
      const linksSnap = await db.collection("tqc_employee_links").get();
      const links: TqcEmployeeLink[] = linksSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          link_id: doc.id,
          tqc_id: d.tqc_id,
          tqc_name: d.tqc_name,
          employee_id: d.employee_id,
          employee_name: d.employee_name,
        };
      });
      logger.info(`Loaded ${links.length} TQC-employee links`);

      // 1d. Active training programs
      const programsSnap = await db
        .collection("training_programs")
        .where("is_active", "==", true)
        .get();
      const programs: ServerTrainingProgram[] = programsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          program_code: d.program_code || doc.id,
          program_name: d.program_name,
          is_active: d.is_active,
        };
      });
      logger.info(`Loaded ${programs.length} active training programs`);

      // 1e. Active employees
      const employeesSnap = await db
        .collection("employees")
        .where("status", "in", ["active", "ACTIVE"])
        .get();
      const employees: ServerEmployee[] = employeesSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          employee_id: d.employee_id || doc.id,
          employee_name: d.employee_name,
          status: d.status,
        };
      });
      logger.info(`Loaded ${employees.length} active employees`);

      // ---------------------------------------------------------------
      // 2. Calculate current month (YYYY-MM)
      // ---------------------------------------------------------------
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      logger.info(`Current month: ${currentMonth}`);

      // ---------------------------------------------------------------
      // 3. Fetch 5PRS data
      // ---------------------------------------------------------------
      const rawData = await fetchMonthData(currentMonth);
      logger.info(`Fetched ${rawData.length} raw 5PRS rows for ${currentMonth}`);

      if (rawData.length === 0) {
        logger.info("No 5PRS data for current month. Skipping analysis.");
        return;
      }

      // ---------------------------------------------------------------
      // 4. Analyze
      // ---------------------------------------------------------------
      const recommendations = analyzeFromRawData(
        rawData,
        thresholds,
        mappings,
        links,
        employees,
        programs
      );

      const immediateCount = recommendations.filter(
        (r) => r.priority === "IMMEDIATE"
      ).length;
      const preventiveCount = recommendations.filter(
        (r) => r.priority === "PREVENTIVE"
      ).length;
      const surgeCount = recommendations.filter(
        (r) => r.priority === "SURGE"
      ).length;

      logger.info(
        `Recommendations: total=${recommendations.length}, ` +
          `IMMEDIATE=${immediateCount}, PREVENTIVE=${preventiveCount}, SURGE=${surgeCount}`
      );

      // ---------------------------------------------------------------
      // 5. Auto-enroll IMMEDIATE items with linked employees
      // ---------------------------------------------------------------
      let autoEnrolledCount = 0;
      const batch = db.batch();
      let batchCount = 0;

      for (const rec of recommendations) {
        if (rec.priority !== "IMMEDIATE" || !rec.linkedEmployee) continue;
        if (rec.recommendedPrograms.length === 0) continue;

        for (const prog of rec.recommendedPrograms) {
          // 5a. Create training session
          const sessionRef = db.collection("training_sessions").doc();
          const sessionId = sessionRef.id;
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() + 7); // Schedule 1 week ahead

          batch.set(sessionRef, {
            session_id: sessionId,
            program_code: prog.program_code,
            session_date: sessionDate.toISOString().split("T")[0],
            session_time: "08:00",
            trainer_name: "",
            trainer: "",
            location: rec.buildings[0] || "",
            max_attendees: 10,
            status: "PLANNED",
            notes: `Auto-created by weekly recommendation (5PRS ${currentMonth}). ` +
              `TQC: ${rec.tqc_name} (${rec.tqc_id}), Priority: ${rec.priority}, ` +
              `Defect: ${prog.match_reason}`,
            created_by: "system:weeklyRecommendation",
            created_at: new Date().toISOString(),
            attendees: [rec.linkedEmployee.employee_id],
          });

          // 5b. Create training result (enrolled status)
          const resultRef = db.collection("training_results").doc();
          batch.set(resultRef, {
            result_id: resultRef.id,
            session_id: sessionId,
            employee_id: rec.linkedEmployee.employee_id,
            program_code: prog.program_code,
            training_date: sessionDate.toISOString().split("T")[0],
            score: null,
            grade: null,
            result: "ABSENT", // Will be updated after actual training
            needs_retraining: false,
            evaluated_by: "",
            remarks: `Auto-enrolled via 5PRS recommendation. Status: enrolled. ` +
              `TQC: ${rec.tqc_name}, Reject rate: ${rec.rejectRate}%`,
            created_at: new Date().toISOString(),
            updated_at: null,
            updated_by: null,
          });

          // 5c. Create enrollment audit log (APPEND-ONLY)
          const logRef = db.collection("five_prs_enrollment_logs").doc();
          batch.set(logRef, {
            log_id: logRef.id,
            tqc_id: rec.tqc_id,
            tqc_name: rec.tqc_name,
            employee_id: rec.linkedEmployee.employee_id,
            employee_name: rec.linkedEmployee.employee_name,
            program_code: prog.program_code,
            program_name: prog.program_name,
            session_id: sessionId,
            priority: rec.priority,
            priority_score: rec.priorityScore,
            defect_types: rec.topDefects.map((d) => d.type),
            reject_rate: rec.rejectRate,
            enrolled_by: "system:weeklyRecommendation",
            enrolled_at: new Date().toISOString(),
            year_month: currentMonth,
          });

          autoEnrolledCount++;
          batchCount += 3; // 3 docs per enrollment

          // Firestore batch limit is 500 writes
          if (batchCount >= 450) {
            await batch.commit();
            batchCount = 0;
            logger.info("Committed enrollment batch (limit reached).");
          }
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(`Auto-enrolled ${autoEnrolledCount} training session(s)`);

      // ---------------------------------------------------------------
      // 6. Send summary email
      // ---------------------------------------------------------------
      const emailUser = process.env.GMAIL_USER;
      const emailPass = process.env.GMAIL_APP_PASSWORD;

      if (emailUser && emailPass) {
        const summaryHtml = [
          `<h2>[Q-TRAIN] Weekly Training Recommendation Report</h2>`,
          `<p><strong>Analysis Period:</strong> ${currentMonth}</p>`,
          `<p><strong>Total Analyzed TQC Records:</strong> ${recommendations.length}</p>`,
          `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">`,
          `  <tr style="background:#f0f0f0;">`,
          `    <th>Priority</th><th>Count</th>`,
          `  </tr>`,
          `  <tr><td>IMMEDIATE</td><td style="text-align:center;font-weight:bold;color:#dc2626;">${immediateCount}</td></tr>`,
          `  <tr><td>PREVENTIVE</td><td style="text-align:center;font-weight:bold;color:#d97706;">${preventiveCount}</td></tr>`,
          `  <tr><td>SURGE</td><td style="text-align:center;font-weight:bold;color:#7c3aed;">${surgeCount}</td></tr>`,
          `</table>`,
          `<p><strong>Auto-Enrolled Sessions:</strong> ${autoEnrolledCount}</p>`,
          `<br/>`,
          `<p style="color:#666;font-size:12px;">This is an automated report from Q-TRAIN Weekly Recommendation System.</p>`,
        ].join("\n");

        // Read recipients from Firestore config (synced with QOS)
        const recConfigSnap = await admin.firestore().doc("config/email").get();
        const recConfig = recConfigSnap.exists ? recConfigSnap.data() : null;
        const recRecipients = (recConfig?.groups?.recipients as string[]) || ["ksmoon@hsvina.com"];

        await sendTemplatedEmail(
          {
            to: recRecipients,
            templateType: "general" as TemplateType,
            data: {
              title: "Weekly Training Recommendation Report",
              body: summaryHtml,
            },
            language: "en" as SupportedLanguage,
            subject: `[Q-TRAIN] Weekly Training Recommendation Report - ${currentMonth}`,
          },
          emailUser,
          emailPass
        );

        logger.info("Summary email sent successfully.");
      } else {
        logger.warn(
          "Gmail credentials not configured. Skipping summary email."
        );
      }

      logger.info("Weekly training recommendation analysis complete.");
    } catch (error) {
      logger.error("Error during weekly training recommendation:", error);
    }
  }
);

// =============================================================================
// 5b. weeklyAqlInspectionEnrollment
//     Scheduled: Every Monday 6:30 AM Asia/Ho_Chi_Minh
//     Analyzes AQL inspection data and auto-enrolls CRITICAL/HIGH priority
//     inspectors into INS-001 (Inspection Competency Training).
// =============================================================================

export const weeklyAqlInspectionEnrollment = onSchedule(
  {
    schedule: "30 6 * * 1",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    logger.info("Running weekly AQL inspection enrollment...");

    try {
      const result = await runWeeklyAqlAnalysisAndEnroll();

      logger.info("Weekly AQL analysis complete:", result);

      // Send summary email
      const emailUser = process.env.GMAIL_USER;
      const emailPass = process.env.GMAIL_APP_PASSWORD;

      if (emailUser && emailPass) {
        // 퇴사자 테이블 HTML
        let resignedHtml = "";
        if (result.resignedEmployees && result.resignedEmployees.length > 0) {
          resignedHtml = [
            `<br/>`,
            `<h3 style="color:#dc2626;">⚠ Resigned Employees Excluded from Training (퇴사자 교육 제외)</h3>`,
            `<p>The following employees appeared in AQL data but are no longer active. They have been excluded from training enrollment.</p>`,
            `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">`,
            `  <tr style="background:#fef2f2;">`,
            `    <th>Employee No (사번)</th><th>Name (이름)</th><th>Fail Rate (불합격률)</th><th>Priority</th><th>Status</th>`,
            `  </tr>`,
            ...result.resignedEmployees.map((e) =>
              `  <tr><td>${e.employee_no}</td><td>${e.employee_name}</td><td style="text-align:center;">${e.fail_rate}%</td><td>${e.priority}</td><td style="color:#dc2626;font-weight:bold;">RESIGNED — 교육 제외</td></tr>`
            ),
            `</table>`,
          ].join("\n");
        }

        const summaryHtml = [
          `<h2>[Q-TRAIN] Weekly AQL Inspection Enrollment Report</h2>`,
          `<p><strong>Analysis Period:</strong> ${result.yearMonth}</p>`,
          `<p><strong>Total TQC/RQC Analyzed:</strong> ${result.totalInspectors}</p>`,
          `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">`,
          `  <tr style="background:#f0f0f0;">`,
          `    <th>Priority</th><th>Count</th>`,
          `  </tr>`,
          `  <tr><td>CRITICAL</td><td style="text-align:center;font-weight:bold;color:#dc2626;">${result.criticalCount}</td></tr>`,
          `  <tr><td>HIGH</td><td style="text-align:center;font-weight:bold;color:#d97706;">${result.highCount}</td></tr>`,
          `  <tr><td>MEDIUM</td><td style="text-align:center;font-weight:bold;color:#6b7280;">${result.mediumCount}</td></tr>`,
          `</table>`,
          `<br/>`,
          `<p><strong>Auto-Enrolled (INS-001):</strong> ${result.autoEnrolled}</p>`,
          `<p><strong>Skipped (Already Enrolled):</strong> ${result.skippedAlreadyEnrolled}</p>`,
          `<p><strong>Skipped (No Employee Match):</strong> ${result.skippedNoLink}</p>`,
          `<p><strong>Skipped (Resigned/INACTIVE):</strong> ${result.skippedResigned}</p>`,
          resignedHtml,
          `<br/>`,
          `<p style="color:#666;font-size:12px;">This is an automated report from Q-TRAIN AQL Analysis System.</p>`,
        ].join("\n");

        // Read recipients from Firestore config (synced with QOS)
        const aqlConfigSnap = await admin.firestore().doc("config/email").get();
        const aqlConfig = aqlConfigSnap.exists ? aqlConfigSnap.data() : null;
        const aqlRecipients = (aqlConfig?.groups?.recipients as string[]) || ["ksmoon@hsvina.com"];

        await sendTemplatedEmail(
          {
            to: aqlRecipients,
            templateType: "general" as TemplateType,
            data: {
              title: "Weekly AQL Inspection Enrollment Report",
              body: summaryHtml,
            },
            language: "en" as SupportedLanguage,
            subject: `[Q-TRAIN] AQL Inspection Enrollment Report - ${result.yearMonth}`,
          },
          emailUser,
          emailPass
        );

        logger.info("AQL summary email sent successfully.");
      } else {
        logger.warn("Gmail credentials not configured. Skipping AQL summary email.");
      }
    } catch (error) {
      logger.error("Error during weekly AQL inspection enrollment:", error);
    }
  }
);

// =============================================================================
// 5c. dailyTrainerDirective
//     Scheduled: Every day at 7:30 AM Asia/Ho_Chi_Minh
//     Generates daily work directive for trainers based on 5PRS data,
//     training session statuses, and AI-generated recommendations.
//     Multi-channel: Email + In-app notification
// =============================================================================

export const dailyTrainerDirective = onSchedule(
  {
    schedule: "30 7 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    secrets: [
      "GMAIL_USER",
      "GMAIL_APP_PASSWORD",
      "GEMINI_API_KEY",
      "GEMINI_BACKUP_KEY",
      "GROQ_API_KEY",
      "OPENROUTER_API_KEY",
    ],
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    logger.info("Running daily trainer directive generation...");
    try {
      await generateDailyTrainerDirective();
      logger.info("Daily trainer directive generation complete.");
    } catch (error) {
      logger.error("Error during daily trainer directive:", error);
    }
  }
);

// =============================================================================
// 5d. dailyDirectiveEscalation
//     Scheduled: Every day at 7:00 AM Asia/Ho_Chi_Minh
//     Checks for unacknowledged directives (>24h) and escalates to manager.
// =============================================================================

export const dailyDirectiveEscalation = onSchedule(
  {
    schedule: "0 7 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    secrets: ["GMAIL_USER", "GMAIL_APP_PASSWORD"],
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    logger.info("Running directive escalation check...");
    try {
      await checkDirectiveEscalation();
      logger.info("Directive escalation check complete.");
    } catch (error) {
      logger.error("Error during directive escalation:", error);
    }
  }
);

// =============================================================================
// 5e. weeklyTrainingEffectiveness
//     Scheduled: Every Friday at 18:00 Asia/Ho_Chi_Minh
//     Tracks pre/post training reject rate improvements.
//     Stores in training_effectiveness and unified_quality_metrics.
// =============================================================================

export const weeklyTrainingEffectiveness = onSchedule(
  {
    schedule: "0 18 * * 5",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async () => {
    logger.info("Running weekly training effectiveness tracking...");
    try {
      await trackTrainingEffectiveness();
      logger.info("Weekly training effectiveness tracking complete.");
    } catch (error) {
      logger.error("Error during training effectiveness tracking:", error);
    }
  }
);

// =============================================================================
// 6. onCAPAStatusChange
//    Firestore trigger: when a CAPA document is updated,
//    log the status change and create a notification if status becomes 'closed'.
// =============================================================================

export const onCAPAStatusChange = onDocumentUpdated(
  {
    document: "capas/{capaId}",
    region: REGION,
  },
  async (event) => {
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) {
      logger.warn("onCAPAStatusChange: Missing before/after data.");
      return;
    }

    const capaId = event.params.capaId;
    const previousStatus = beforeData.status;
    const newStatus = afterData.status;

    // Only process if status actually changed
    if (previousStatus === newStatus) {
      return;
    }

    logger.info(
      `CAPA ${capaId} status changed: "${previousStatus}" -> "${newStatus}"`
    );

    // Log the status change to auditLogs
    await db.collection("auditLogs").add({
      action: "capa_status_changed",
      collection: "capas",
      documentId: capaId,
      previousStatus: previousStatus,
      newStatus: newStatus,
      data: afterData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If status becomes 'closed', create a notification
    if (newStatus === "closed") {
      logger.info(`CAPA ${capaId} has been closed. Creating notification.`);

      await db.collection("notifications").add({
        type: "capa_closed",
        capaId: capaId,
        title: afterData.title || `CAPA #${capaId}`,
        message: `CAPA "${afterData.title || capaId}" has been closed.`,
        closedBy: afterData.updated_by || afterData.closed_by || "unknown",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

// =============================================================================
// 7. monthlyKpiSnapshot
//    Scheduled: 1st of every month at 02:00 Asia/Ho_Chi_Minh
//    Calculates and stores monthly KPI snapshot for anomaly detection.
// =============================================================================

export const monthlyKpiSnapshot = onSchedule(
  {
    schedule: "0 2 1 * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    logger.info("Running monthly KPI snapshot...");

    try {
      const now = new Date();
      // Calculate previous month (we snapshot last month's data on the 1st)
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const yearMonth = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}`;

      // 1. Total active employees - from Google Drive CSV
      let totalEmployees = 0;
      try {
        const manpowerResult = await fetchManpowerFromDrive();
        totalEmployees = manpowerResult.data.filter(row => !row.stop_working_date).length;
        logger.info(`monthlyKpiSnapshot: totalEmployees from Drive CSV = ${totalEmployees}`);
      } catch (driveError) {
        logger.warn("monthlyKpiSnapshot: Drive CSV failed, falling back to Firestore", driveError);
        const employeesSnap = await db
          .collection("employees")
          .where("status", "in", ["active", "ACTIVE"])
          .get();
        totalEmployees = employeesSnap.size;
      }

      // 2. Training results
      const resultsSnap = await db.collection("training_results").get();
      let totalPass = 0;
      let totalFail = 0;
      let firstTimePass = 0;
      let totalFirstAttempts = 0;
      let scoreSum = 0;
      let scoreCount = 0;
      let monthlyCompletions = 0;
      const completedEmployees = new Set<string>();
      const employeeAttempts = new Map<string, Set<string>>();

      for (const doc of resultsSnap.docs) {
        const d = doc.data();
        const date = d.training_date || d.created_at || "";
        const isInPeriod = typeof date === "string" && date.startsWith(yearMonth);

        if (d.result === "pass") {
          totalPass++;
          completedEmployees.add(d.employee_id);
        } else if (d.result === "fail") {
          totalFail++;
        }

        if (d.score && typeof d.score === "number") {
          scoreSum += d.score;
          scoreCount++;
        }

        if (isInPeriod) {
          monthlyCompletions++;
        }

        // Track first-time pass
        const key = `${d.employee_id}_${d.program_code}`;
        if (!employeeAttempts.has(key)) {
          employeeAttempts.set(key, new Set());
          totalFirstAttempts++;
          if (d.result === "pass") firstTimePass++;
        }
        employeeAttempts.get(key)!.add(doc.id);
      }

      const totalResults = totalPass + totalFail;
      const passRate = totalResults > 0
        ? Math.round((totalPass / totalResults) * 10000) / 100
        : 0;
      const firstTimePassRate = totalFirstAttempts > 0
        ? Math.round((firstTimePass / totalFirstAttempts) * 10000) / 100
        : 0;
      const averageScore = scoreCount > 0
        ? Math.round((scoreSum / scoreCount) * 100) / 100
        : 0;
      const overallCompletionRate = totalEmployees > 0
        ? Math.round((completedEmployees.size / totalEmployees) * 10000) / 100
        : 0;

      // 3. Retraining count
      let retrainingCount = 0;
      try {
        const retrainSnap = await db
          .collection("retraining_targets")
          .where("status", "==", "pending")
          .get();
        retrainingCount = retrainSnap.size;
      } catch { /* collection may not exist */ }

      // 4. Expiring certificates
      let expiringCount = 0;
      try {
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        const expiringSnap = await db
          .collection("certificates")
          .where("expiry_date", ">=", admin.firestore.Timestamp.fromDate(now))
          .where("expiry_date", "<=", admin.firestore.Timestamp.fromDate(thirtyDays))
          .get();
        expiringCount = expiringSnap.size;
      } catch { /* collection may not exist */ }

      // 5. Save snapshot
      const snapshot = {
        snapshot_id: yearMonth,
        year_month: yearMonth,
        overallCompletionRate,
        passRate,
        firstTimePassRate,
        averageScore,
        retrainingCount,
        expiringCount,
        totalEmployees,
        monthlyCompletions,
        calculated_at: now.toISOString(),
      };

      await db.collection("kpi_snapshots").doc(yearMonth).set(snapshot);

      logger.info(`KPI snapshot saved for ${yearMonth}:`, snapshot);
    } catch (error) {
      logger.error("Error during monthly KPI snapshot:", error);
    }
  }
);

// =============================================================================
// 8. onEmployeeWritten (Firestore → Sheet sync)
//    When an employee document is created/updated in Firestore,
//    sync the change to Google Sheet (unless it came from Sheet).
// =============================================================================

export const onEmployeeWritten = onDocumentWritten(
  {
    document: "employees/{employeeId}",
    region: REGION,
    secrets: ["EMPLOYEE_SHEET_ID"],
  },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) {
      logger.info("onEmployeeWritten: Document deleted, skipping Sheet sync.");
      return;
    }

    // Loop prevention: skip if change came from Sheet
    if (after._sync_source === "SHEET") {
      logger.info(
        `onEmployeeWritten: Change for ${event.params.employeeId} came from SHEET, skipping.`
      );
      return;
    }

    const sheetId = process.env.EMPLOYEE_SHEET_ID;
    if (!sheetId) {
      logger.warn("onEmployeeWritten: EMPLOYEE_SHEET_ID not configured, skipping Sheet sync.");
      return;
    }

    const employeeId = event.params.employeeId;

    try {
      const rowData: EmployeeRow = {
        employee_id: after.employee_id || employeeId,
        employee_name: after.employee_name || "",
        department: after.department || "",
        position: after.position || "",
        building: after.building || "",
        line: after.line || "",
        hire_date: after.hire_date || "",
        status: after.status || "ACTIVE",
        updated_at: after.updated_at
          ? (typeof after.updated_at === "object" && after.updated_at.toDate
            ? after.updated_at.toDate().toISOString()
            : String(after.updated_at))
          : new Date().toISOString(),
        _sync_source: "APP",
        _sync_timestamp: new Date().toISOString(),
      };

      // Find existing row or append new one
      const existingRow = await findEmployeeRow(sheetId, employeeId);
      if (existingRow) {
        await updateEmployeeRow(sheetId, existingRow, rowData);
        logger.info(
          `onEmployeeWritten: Updated Sheet row ${existingRow} for ${employeeId}`
        );
      } else {
        await appendSheetEmployee(sheetId, rowData);
        logger.info(
          `onEmployeeWritten: Appended new row for ${employeeId} to Sheet`
        );
      }
    } catch (error) {
      logger.error(
        `onEmployeeWritten: Failed to sync ${employeeId} to Sheet:`,
        error
      );
    }
  }
);

// =============================================================================
// 9. API Gateway (onRequest)
//    Handles Firebase Hosting rewrites: /api/** → api function
//    Routes:
//      GET  /api/drive/months           — 5PRS month list (proxy to GAS)
//      GET  /api/drive/data/:yearMonth  — 5PRS raw data   (proxy to GAS)
//      GET  /api/drive/latest           — 5PRS latest month data
//      POST /api/ai/briefing            — AI quality briefing (4-provider fallback)
//      POST /api/employee-sync/from-sheet — Sheet → Firestore sync (GAS calls)
//      POST /api/employee-sync/full-sync  — Full bidirectional sync
//      GET  /api/employee-sync/status     — Sync status
//      POST /api/sync/collection          — GAS sync proxy (collection/syncAll)
//      GET  /api/sync/status              — GAS sync status proxy
// =============================================================================

export const api = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [
      "GEMINI_API_KEY",
      "GEMINI_BACKUP_KEY",
      "GROQ_API_KEY",
      "OPENROUTER_API_KEY",
      "EMPLOYEE_SHEET_ID",
      "EMPLOYEE_SYNC_API_KEY",
      "GAS_SYNC_URL",
      "GAS_SYNC_API_KEY",
    ],
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async (req, res) => {
    const path = req.path;

    try {
      // ---------------------------------------------------------------
      // Drive Proxy Routes (5PRS GAS API)
      // ---------------------------------------------------------------

      if (req.method === "GET" && path === "/api/drive/months") {
        logger.info("API: GET /api/drive/months");
        const months = await fetchMonthList();
        res.json({ success: true, months });
        return;
      }

      const dataMatch = path.match(/^\/api\/drive\/data\/(.+)$/);
      if (req.method === "GET" && dataMatch) {
        const yearMonth = decodeURIComponent(dataMatch[1]);
        logger.info(`API: GET /api/drive/data/${yearMonth}`);
        const data = await fetchMonthData(yearMonth);
        res.json({ success: true, data, row_count: data.length });
        return;
      }

      if (req.method === "GET" && path === "/api/drive/latest") {
        logger.info("API: GET /api/drive/latest");
        const months = await fetchMonthList();
        if (!months.length) {
          res.json({ success: true, data: [], row_count: 0 });
          return;
        }
        const latestMonth = months[0].year_month;
        const data = await fetchMonthData(latestMonth);
        res.json({
          success: true,
          data,
          row_count: data.length,
          yearMonth: latestMonth,
        });
        return;
      }

      // ---------------------------------------------------------------
      // AI Briefing Route (4-provider fallback)
      // ---------------------------------------------------------------

      if (req.method === "POST" && path === "/api/ai/briefing") {
        logger.info("API: POST /api/ai/briefing");
        const body = req.body;

        if (!body || !body.stats) {
          res.status(400).json({ error: "Invalid request body: stats required" });
          return;
        }

        const result = await generateAiBriefing(body);

        res.json({
          success: true,
          briefing: result.briefing,
          provider: result.provider,
          cached: false,
        });
        return;
      }

      // ---------------------------------------------------------------
      // POST /api/ai/auto-enroll
      // ---------------------------------------------------------------
      if (req.method === "POST" && path === "/api/ai/auto-enroll") {
        const { yearMonth } = req.body || {};
        if (!yearMonth) {
          res.status(400).json({ error: "yearMonth is required" });
          return;
        }

        // 1. Load config from Firestore
        const configDoc = await db.collection("five_prs_config").doc("default").get();
        const config = configDoc.exists ? configDoc.data() : null;
        if (!config) {
          res.status(400).json({ error: "5PRS config not found" });
          return;
        }

        // 2. Fetch 5PRS data
        const rawData = await fetchMonthData(yearMonth);

        // 3. Run analysis
        const recommendations = analyzeFromRawData(
          rawData,
          config.thresholds as RecommendationThreshold,
          config.mappings as DefectTrainingMapping[],
          config.links as TqcEmployeeLink[],
          config.employees as ServerEmployee[],
          config.programs as ServerTrainingProgram[],
        );

        // 4. Auto-enroll IMMEDIATE priority items with linked employees
        const enrolled: Array<{ employee: string; program: string; priority: string }> = [];
        for (const rec of recommendations) {
          if (
            rec.priority === "IMMEDIATE" &&
            rec.linkedEmployee
          ) {
            const programCode = rec.recommendedPrograms?.[0]?.program_code || "";
            // Log enrollment
            await db.collection("five_prs_enrollment_logs").add({
              year_month: yearMonth,
              employee_id: rec.linkedEmployee.employee_id,
              program_code: programCode,
              tqc_name: rec.tqc_name,
              priority: rec.priority,
              auto_enrolled: true,
              created_at: new Date().toISOString(),
            });
            enrolled.push({
              employee: rec.linkedEmployee.employee_name,
              program: programCode || rec.tqc_name,
              priority: rec.priority,
            });
          }
        }

        res.json({
          success: true,
          enrolled: enrolled.length,
          enrollments: enrolled,
          totalRecommendations: recommendations.length,
        });
        return;
      }

      // ---------------------------------------------------------------
      // POST /api/ai/capa-analysis
      // ---------------------------------------------------------------
      if (req.method === "POST" && path === "/api/ai/capa-analysis") {
        const body = req.body || {};
        if (!body.problemDescription || !body.affectedArea) {
          res.status(400).json({
            error: "problemDescription and affectedArea are required",
          });
          return;
        }

        const result = await analyzeCAPARootCause({
          problemDescription: body.problemDescription,
          affectedArea: body.affectedArea,
          severity: body.severity || "minor",
          source: body.source || "",
          language: body.language,
        });

        res.json({
          success: true,
          ...result,
        });
        return;
      }

      // ---------------------------------------------------------------
      // POST /api/ai/executive-report
      // ---------------------------------------------------------------
      if (req.method === "POST" && path === "/api/ai/executive-report") {
        const body = req.body || {};
        if (!body.period) {
          res.status(400).json({ error: "period is required" });
          return;
        }

        const result = await generateExecutiveReport({
          period: body.period,
          language: body.language || "en",
          sections: body.sections || {
            includeKPI: true,
            includeCAPA: true,
            includeTQC: true,
            include5PRS: false,
            includeTraining: true,
          },
        });

        res.json({
          success: true,
          report: result.report,
          provider: result.provider,
          dataSnapshot: result.dataSnapshot,
        });
        return;
      }

      // ---------------------------------------------------------------
      // AQL Proxy Routes (AQL GAS API)
      // ---------------------------------------------------------------

      if (req.method === "GET" && path === "/api/aql/months") {
        logger.info("API: GET /api/aql/months");
        const months = await fetchAqlMonthList();
        res.json({ success: true, months });
        return;
      }

      const aqlDataMatch = path.match(/^\/api\/aql\/data\/(.+)$/);
      if (req.method === "GET" && aqlDataMatch) {
        const yearMonth = decodeURIComponent(aqlDataMatch[1]);
        logger.info(`API: GET /api/aql/data/${yearMonth}`);
        const data = await fetchAqlMonthData(yearMonth);
        res.json({ success: true, data, row_count: data.length });
        return;
      }

      if (req.method === "GET" && path === "/api/aql/manpower") {
        logger.info("API: GET /api/aql/manpower (via Drive service account)");
        const result = await fetchManpowerFromDrive();
        res.json({
          success: true,
          data: result.data,
          row_count: result.data.length,
          file_name: result.file_name,
          folder_name: result.folder_name,
        });
        return;
      }

      // ---------------------------------------------------------------
      // Employee Sync Routes (Sheet ↔ Firestore)
      // ---------------------------------------------------------------

      // POST /api/employee-sync/from-sheet — GAS onEdit calls this
      if (req.method === "POST" && path === "/api/employee-sync/from-sheet") {
        logger.info("API: POST /api/employee-sync/from-sheet");

        // API key authentication (GAS sends this header)
        const apiKey = (req.headers["x-api-key"] as string || "").trim();
        const expectedKey = (process.env.EMPLOYEE_SYNC_API_KEY || "").trim();
        if (!expectedKey || apiKey !== expectedKey) {
          res.status(401).json({ error: "Unauthorized: invalid API key" });
          return;
        }

        const { action, employee } = req.body || {};
        if (!employee || !employee.employee_id) {
          res.status(400).json({ error: "employee.employee_id is required" });
          return;
        }

        const employeeId = employee.employee_id;
        const docRef = db.collection("employees").doc(employeeId);

        if (action === "DELETE") {
          // Soft delete: set status to INACTIVE
          await docRef.update({
            status: "INACTIVE",
            _sync_source: "SHEET",
            _sync_timestamp: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          });
          logger.info(`employee-sync/from-sheet: Soft-deleted ${employeeId}`);
        } else {
          // CREATE or UPDATE: merge data from Sheet
          const docData: Record<string, unknown> = {
            employee_id: employeeId,
            employee_name: employee.employee_name || "",
            department: employee.department || "",
            position: employee.position || "",
            building: employee.building || "",
            line: employee.line || "",
            hire_date: employee.hire_date || "",
            status: employee.status || "ACTIVE",
            _sync_source: "SHEET",
            _sync_timestamp: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          };

          await docRef.set(docData, { merge: true });
          logger.info(
            `employee-sync/from-sheet: ${action || "UPSERT"} ${employeeId}`
          );
        }

        res.json({ success: true, employee_id: employeeId, action });
        return;
      }

      // POST /api/employee-sync/full-sync — Manual full sync (Sheet wins)
      if (req.method === "POST" && path === "/api/employee-sync/full-sync") {
        logger.info("API: POST /api/employee-sync/full-sync");

        const sheetId = process.env.EMPLOYEE_SHEET_ID;
        if (!sheetId) {
          res.status(500).json({ error: "EMPLOYEE_SHEET_ID not configured" });
          return;
        }

        // Read all from Sheet
        const sheetEmployees = await readSheetEmployees(sheetId);
        await ensureHeader(sheetId);

        // Read all from Firestore
        const firestoreSnapshot = await db.collection("employees").get();
        const firestoreMap = new Map<string, FirebaseFirestore.DocumentData>();
        firestoreSnapshot.docs.forEach((doc) => {
          firestoreMap.set(doc.id, doc.data());
        });

        let created = 0;
        let updated = 0;
        let sheetAppended = 0;

        // Sheet → Firestore (Sheet wins)
        const batch = db.batch();
        const processedIds = new Set<string>();

        for (const sheetEmp of sheetEmployees) {
          processedIds.add(sheetEmp.employee_id);
          const docRef = db.collection("employees").doc(sheetEmp.employee_id);
          const existing = firestoreMap.get(sheetEmp.employee_id);

          const docData: Record<string, unknown> = {
            employee_id: sheetEmp.employee_id,
            employee_name: sheetEmp.employee_name,
            department: sheetEmp.department,
            position: sheetEmp.position,
            building: sheetEmp.building,
            line: sheetEmp.line,
            hire_date: sheetEmp.hire_date,
            status: sheetEmp.status || "ACTIVE",
            _sync_source: "SHEET",
            _sync_timestamp: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (!existing) {
            batch.set(docRef, docData);
            created++;
          } else {
            // Check if data differs
            const changed =
              existing.employee_name !== sheetEmp.employee_name ||
              existing.department !== sheetEmp.department ||
              existing.position !== sheetEmp.position ||
              existing.building !== sheetEmp.building ||
              existing.line !== sheetEmp.line ||
              existing.hire_date !== sheetEmp.hire_date ||
              existing.status !== (sheetEmp.status || "ACTIVE");

            if (changed) {
              batch.set(docRef, docData, { merge: true });
              updated++;
            }
          }
        }

        await batch.commit();

        // Firestore → Sheet (employees not in Sheet)
        for (const [empId, empData] of firestoreMap) {
          if (!processedIds.has(empId)) {
            const rowData: EmployeeRow = {
              employee_id: empId,
              employee_name: empData.employee_name || "",
              department: empData.department || "",
              position: empData.position || "",
              building: empData.building || "",
              line: empData.line || "",
              hire_date: empData.hire_date || "",
              status: empData.status || "ACTIVE",
              updated_at: empData.updated_at
                ? (typeof empData.updated_at === "object" && empData.updated_at.toDate
                  ? empData.updated_at.toDate().toISOString()
                  : String(empData.updated_at))
                : new Date().toISOString(),
              _sync_source: "APP",
              _sync_timestamp: new Date().toISOString(),
            };
            await appendSheetEmployee(sheetId, rowData);
            sheetAppended++;
          }
        }

        // Save sync status
        await db.collection("employee_sync_status").doc("latest").set({
          last_sync_at: admin.firestore.FieldValue.serverTimestamp(),
          sync_type: "FULL",
          sheet_to_firestore: { created, updated },
          firestore_to_sheet: { appended: sheetAppended },
          total_sheet_employees: sheetEmployees.length,
          total_firestore_employees: firestoreMap.size,
        });

        res.json({
          success: true,
          sheet_to_firestore: { created, updated },
          firestore_to_sheet: { appended: sheetAppended },
          total_sheet: sheetEmployees.length,
          total_firestore: firestoreMap.size,
        });
        return;
      }

      // GET /api/employee-sync/status — Sync status
      if (req.method === "GET" && path === "/api/employee-sync/status") {
        logger.info("API: GET /api/employee-sync/status");

        const statusDoc = await db
          .collection("employee_sync_status")
          .doc("latest")
          .get();

        if (!statusDoc.exists) {
          res.json({
            success: true,
            status: "NOT_SYNCED",
            message: "No sync has been performed yet",
          });
          return;
        }

        const data = statusDoc.data();
        res.json({
          success: true,
          status: "SYNCED",
          ...data,
          last_sync_at: data?.last_sync_at?.toDate?.()?.toISOString() || null,
        });
        return;
      }

      // ---------------------------------------------------------------
      // GAS Sync Proxy Routes (Google Sheets ↔ Firestore sync)
      // ---------------------------------------------------------------

      if (req.method === "POST" && path === "/api/sync/collection") {
        logger.info("API: POST /api/sync/collection");

        const gasSyncUrl = process.env.GAS_SYNC_URL;
        const gasSyncApiKey = process.env.GAS_SYNC_API_KEY;

        if (!gasSyncUrl || !gasSyncApiKey) {
          res.status(500).json({
            error: "GAS Sync credentials not configured. Set GAS_SYNC_URL and GAS_SYNC_API_KEY secrets.",
          });
          return;
        }

        const { action, collection: col, direction, ...rest } = req.body || {};

        if (!action) {
          res.status(400).json({ error: "action is required" });
          return;
        }

        const gasResponse = await fetch(gasSyncUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action,
            apiKey: gasSyncApiKey,
            collection: col,
            direction,
            ...rest,
          }),
        });

        if (!gasResponse.ok) {
          res.status(gasResponse.status).json({
            error: `GAS request failed: ${gasResponse.status} ${gasResponse.statusText}`,
          });
          return;
        }

        const gasData = await gasResponse.json();
        res.json(gasData);
        return;
      }

      if (req.method === "GET" && path === "/api/sync/status") {
        logger.info("API: GET /api/sync/status");

        const gasSyncUrl = process.env.GAS_SYNC_URL;
        const gasSyncApiKey = process.env.GAS_SYNC_API_KEY;

        if (!gasSyncUrl || !gasSyncApiKey) {
          res.status(500).json({
            error: "GAS Sync credentials not configured. Set GAS_SYNC_URL and GAS_SYNC_API_KEY secrets.",
          });
          return;
        }

        const gasResponse = await fetch(gasSyncUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            action: "getSyncStatus",
            apiKey: gasSyncApiKey,
          }),
        });

        if (!gasResponse.ok) {
          res.status(gasResponse.status).json({
            error: `GAS request failed: ${gasResponse.status} ${gasResponse.statusText}`,
          });
          return;
        }

        const gasData = await gasResponse.json();
        res.json(gasData);
        return;
      }

      // ---------------------------------------------------------------
      // 404
      // ---------------------------------------------------------------
      res.status(404).json({ error: `Not found: ${req.method} ${path}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal server error";
      logger.error(`API error [${req.method} ${path}]:`, err);
      res.status(500).json({ error: msg });
    }
  }
);

// =============================================================================
// AUTO EMAIL FUNCTIONS (Firestore SMTP — QOS pushes config/smtp_settings)
// =============================================================================

// Helper: format Firestore Timestamp or Date to YYYY-MM-DD string
function formatDate(value: unknown): string {
  if (!value) return "";
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as admin.firestore.Timestamp).toDate().toISOString().split("T")[0];
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

// Helper: convert Firestore Timestamp to JS Date
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as admin.firestore.Timestamp).toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return null;
}

// =============================================================================
// 2a. sendTrainingNotifications
//     Scheduled: daily at 7:00 AM Asia/Ho_Chi_Minh (ICT)
//     Reads upcoming training sessions (next 3 days), sends notification emails
//     to trainees. Uses Firestore SMTP config (pushed by QOS).
// =============================================================================

export const sendTrainingNotifications = onSchedule(
  {
    schedule: "0 7 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    const EMAIL_TYPE = "training_notification";
    logger.info(`[${EMAIL_TYPE}] Starting sendTrainingNotifications...`);

    // Pre-flight: check SMTP + email type enabled
    const check = await preflightCheck(EMAIL_TYPE);
    if (!check.ok) {
      logger.info(`[${EMAIL_TYPE}] Skipped: ${check.skipReason}`);
      await logEmailResult({
        emailType: EMAIL_TYPE,
        recipients: [],
        subject: "",
        result: { success: false, skipped: true, reason: check.skipReason },
      });
      return;
    }

    const { smtp, settings } = check;
    const language = settings!.language || "ko";

    // Query upcoming sessions (next 3 days)
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const nowTimestamp = admin.firestore.Timestamp.fromDate(now);
    const futureTimestamp = admin.firestore.Timestamp.fromDate(threeDaysFromNow);

    try {
      const sessionsSnapshot = await db
        .collection("training_sessions")
        .where("date", ">=", nowTimestamp)
        .where("date", "<=", futureTimestamp)
        .get();

      if (sessionsSnapshot.empty) {
        logger.info(`[${EMAIL_TYPE}] No upcoming sessions within 3 days.`);
        return;
      }

      logger.info(`[${EMAIL_TYPE}] Found ${sessionsSnapshot.size} session(s) in the next 3 days.`);

      let sentCount = 0;
      let errorCount = 0;

      for (const sessionDoc of sessionsSnapshot.docs) {
        const session = sessionDoc.data();
        const sessionDate = toDate(session.date);
        const daysUntil = sessionDate
          ? Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        // Get trainees assigned to this session
        const trainees: string[] = session.trainee_ids || session.participants || [];

        // Determine recipients: from session trainees + settings recipients
        const allRecipients = new Set<string>();

        // If trainees have email addresses in their records, look them up
        if (trainees.length > 0) {
          // Batch lookup trainee emails from employees collection
          const batchSize = 10;
          for (let i = 0; i < trainees.length; i += batchSize) {
            const batch = trainees.slice(i, i + batchSize);
            const employeeSnap = await db
              .collection("employees")
              .where("employee_id", "in", batch)
              .get();
            for (const empDoc of employeeSnap.docs) {
              const email = empDoc.data().email;
              if (email) allRecipients.add(email);
            }
          }
        }

        // Add configured recipients from emailSettings
        if (settings!.recipients) {
          settings!.recipients.forEach((r) => allRecipients.add(r));
        }

        if (allRecipients.size === 0) {
          logger.info(`[${EMAIL_TYPE}] No recipients for session ${sessionDoc.id}, skipping.`);
          continue;
        }

        const recipientList = Array.from(allRecipients);

        const result = await sendAutoTemplatedEmail({
          to: recipientList,
          templateType: "trainingReminder",
          data: {
            programName: session.program_name || session.program_code || "",
            programCode: session.program_code || "",
            sessionDate: formatDate(session.date),
            sessionTime: session.time || session.start_time || "",
            location: session.location || "",
            trainerName: session.trainer || session.trainer_name || "",
            daysUntilExpiry: daysUntil,
          },
          language,
          cc: settings!.cc,
          bcc: settings!.bcc,
          smtp: smtp!,
        });

        await logEmailResult({
          emailType: EMAIL_TYPE,
          recipients: recipientList,
          subject: `[Q-TRAIN] Training Reminder - ${session.program_name || session.program_code}`,
          result,
          metadata: {
            sessionId: sessionDoc.id,
            sessionDate: formatDate(session.date),
            daysUntilSession: daysUntil,
          },
        });

        if (result.success) sentCount++;
        else errorCount++;
      }

      logger.info(`[${EMAIL_TYPE}] Complete. Sent: ${sentCount}, Errors: ${errorCount}`);
    } catch (error) {
      logger.error(`[${EMAIL_TYPE}] Fatal error:`, error);
    }
  }
);

// =============================================================================
// 2b. sendCapaDeadlineAlerts
//     Scheduled: daily at 8:00 AM Asia/Ho_Chi_Minh (ICT)
//     Queries CAPA items with deadline within 3 days or overdue.
//     Sends deadline warning emails to assignees.
// =============================================================================

export const sendCapaDeadlineAlerts = onSchedule(
  {
    schedule: "0 8 * * *",
    timeZone: "Asia/Ho_Chi_Minh",
    region: REGION,
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    const EMAIL_TYPE = "capa_deadline_alert";
    logger.info(`[${EMAIL_TYPE}] Starting sendCapaDeadlineAlerts...`);

    const check = await preflightCheck(EMAIL_TYPE);
    if (!check.ok) {
      logger.info(`[${EMAIL_TYPE}] Skipped: ${check.skipReason}`);
      await logEmailResult({
        emailType: EMAIL_TYPE,
        recipients: [],
        subject: "",
        result: { success: false, skipped: true, reason: check.skipReason },
      });
      return;
    }

    const { smtp, settings } = check;
    const language = settings!.language || "ko";

    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    const futureTimestamp = admin.firestore.Timestamp.fromDate(threeDaysFromNow);

    try {
      // Query CAPAs that are NOT closed/rejected and have a dueDate <= 3 days from now
      const capasSnapshot = await db
        .collection("capas")
        .where("dueDate", "<=", futureTimestamp)
        .get();

      if (capasSnapshot.empty) {
        logger.info(`[${EMAIL_TYPE}] No CAPAs with upcoming or overdue deadlines.`);
        return;
      }

      // Filter: only active CAPAs (not closed/rejected)
      const activeCAPAs = capasSnapshot.docs.filter((doc) => {
        const data = doc.data();
        const status = data.status || data.currentStage;
        return status !== "closed" && status !== "rejected";
      });

      if (activeCAPAs.length === 0) {
        logger.info(`[${EMAIL_TYPE}] All matched CAPAs are closed/rejected. No alerts needed.`);
        return;
      }

      logger.info(`[${EMAIL_TYPE}] Found ${activeCAPAs.length} active CAPA(s) with deadline alerts.`);

      let sentCount = 0;
      let errorCount = 0;

      for (const capaDoc of activeCAPAs) {
        const capa = capaDoc.data();
        const dueDate = toDate(capa.dueDate);
        const isOverdue = dueDate ? dueDate.getTime() < now.getTime() : false;
        const daysUntil = dueDate
          ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        // Determine recipients: CAPA owner + team + configured recipients
        const allRecipients = new Set<string>();

        // Look up owner email
        if (capa.owner) {
          // Try to find by name or email directly
          if (capa.owner.includes("@")) {
            allRecipients.add(capa.owner);
          }
        }
        if (capa.ownerEmail) {
          allRecipients.add(capa.ownerEmail);
        }

        // Add team members
        if (Array.isArray(capa.team)) {
          for (const member of capa.team) {
            if (typeof member === "string" && member.includes("@")) {
              allRecipients.add(member);
            }
          }
        }

        // Add configured recipients
        if (settings!.recipients) {
          settings!.recipients.forEach((r) => allRecipients.add(r));
        }

        if (allRecipients.size === 0) {
          logger.info(`[${EMAIL_TYPE}] No recipients for CAPA ${capaDoc.id}, skipping.`);
          continue;
        }

        const recipientList = Array.from(allRecipients);

        // Build subject and body based on language
        const statusLabel = isOverdue ? "OVERDUE" : "Due Soon";
        const subjects: Record<string, string> = {
          ko: `[Q-TRAIN] CAPA ${isOverdue ? "기한 초과" : "기한 임박"} - ${capa.capaNumber || capa.title}`,
          en: `[Q-TRAIN] CAPA ${statusLabel} - ${capa.capaNumber || capa.title}`,
          vi: `[Q-TRAIN] CAPA ${isOverdue ? "Qua han" : "Sap den han"} - ${capa.capaNumber || capa.title}`,
        };

        const bodies: Record<string, string> = {
          ko: `<p>CAPA <strong>${capa.capaNumber || capaDoc.id}</strong>: <strong>${capa.title || ""}</strong></p>
<p>현재 상태: ${capa.status || capa.currentStage || "N/A"}</p>
<p>기한: ${formatDate(capa.dueDate)} (${isOverdue ? `<span style="color:red;">기한 초과 ${Math.abs(daysUntil)}일</span>` : `${daysUntil}일 남음`})</p>
<p>담당자: ${capa.owner || "N/A"}</p>
<p>${isOverdue ? "즉시 조치가 필요합니다." : "기한 내 완료를 위해 조치해 주시기 바랍니다."}</p>`,
          en: `<p>CAPA <strong>${capa.capaNumber || capaDoc.id}</strong>: <strong>${capa.title || ""}</strong></p>
<p>Current Status: ${capa.status || capa.currentStage || "N/A"}</p>
<p>Due Date: ${formatDate(capa.dueDate)} (${isOverdue ? `<span style="color:red;">Overdue by ${Math.abs(daysUntil)} day(s)</span>` : `${daysUntil} day(s) remaining`})</p>
<p>Owner: ${capa.owner || "N/A"}</p>
<p>${isOverdue ? "Immediate action is required." : "Please take action to complete before the deadline."}</p>`,
          vi: `<p>CAPA <strong>${capa.capaNumber || capaDoc.id}</strong>: <strong>${capa.title || ""}</strong></p>
<p>Trang thai: ${capa.status || capa.currentStage || "N/A"}</p>
<p>Han chot: ${formatDate(capa.dueDate)} (${isOverdue ? `<span style="color:red;">Qua han ${Math.abs(daysUntil)} ngay</span>` : `Con ${daysUntil} ngay`})</p>
<p>Nguoi phu trach: ${capa.owner || "N/A"}</p>
<p>${isOverdue ? "Can hanh dong ngay lap tuc." : "Vui long hoan thanh truoc thoi han."}</p>`,
        };

        const result = await sendAutoTemplatedEmail({
          to: recipientList,
          templateType: "general",
          data: {
            title: subjects[language] || subjects.ko,
            body: bodies[language] || bodies.ko,
          },
          language,
          subject: subjects[language] || subjects.ko,
          cc: settings!.cc,
          bcc: settings!.bcc,
          smtp: smtp!,
        });

        await logEmailResult({
          emailType: EMAIL_TYPE,
          recipients: recipientList,
          subject: subjects[language] || subjects.ko,
          result,
          metadata: {
            capaId: capaDoc.id,
            capaNumber: capa.capaNumber || null,
            dueDate: formatDate(capa.dueDate),
            isOverdue,
            daysUntilDeadline: daysUntil,
          },
        });

        if (result.success) sentCount++;
        else errorCount++;
      }

      logger.info(`[${EMAIL_TYPE}] Complete. Sent: ${sentCount}, Errors: ${errorCount}`);
    } catch (error) {
      logger.error(`[${EMAIL_TYPE}] Fatal error:`, error);
    }
  }
);

// =============================================================================
// 2c. sendTqcResultNotifications
//     Firestore trigger: onDocumentUpdated on tqc_trainees/{traineeId}
//     When a trainee's training_status changes (pass/fail/completed),
//     sends result notification to trainee and supervisor.
// =============================================================================

export const sendTqcResultNotifications = onDocumentUpdated(
  {
    document: "tqc_trainees/{traineeId}",
    region: REGION,
  },
  async (event) => {
    const EMAIL_TYPE = "tqc_result_notification";
    const traineeId = event.params.traineeId;

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) {
      logger.warn(`[${EMAIL_TYPE}] No data in event for trainee ${traineeId}`);
      return;
    }

    // Detect training_status change
    const beforeStatus = beforeData.training_status;
    const afterStatus = afterData.training_status;

    if (beforeStatus === afterStatus) {
      // No status change — skip
      return;
    }

    // Only send for meaningful status transitions
    const notifiableStatuses = ["passed", "failed", "completed", "pass", "fail"];
    if (!notifiableStatuses.includes(afterStatus)) {
      return;
    }

    logger.info(
      `[${EMAIL_TYPE}] Trainee ${traineeId} status changed: ${beforeStatus} → ${afterStatus}`
    );

    // Pre-flight check
    const check = await preflightCheck(EMAIL_TYPE);
    if (!check.ok) {
      logger.info(`[${EMAIL_TYPE}] Skipped: ${check.skipReason}`);
      return;
    }

    const { smtp, settings } = check;
    const language = settings!.language || "ko";

    try {
      const allRecipients = new Set<string>();

      // Look up trainee's email from employees collection
      const employeeId = afterData.employee_id;
      if (employeeId) {
        const empSnap = await db
          .collection("employees")
          .where("employee_id", "==", employeeId)
          .limit(1)
          .get();
        if (!empSnap.empty) {
          const empEmail = empSnap.docs[0].data().email;
          if (empEmail) allRecipients.add(empEmail);
        }
      }

      // Look up supervisor/team lead from tqc_teams
      const teamId = afterData.team_id;
      if (teamId) {
        const teamSnap = await db.collection("tqc_teams").doc(teamId).get();
        if (teamSnap.exists) {
          const teamData = teamSnap.data();
          if (teamData?.leader_email) allRecipients.add(teamData.leader_email);
          if (teamData?.supervisor_email) allRecipients.add(teamData.supervisor_email);
        }
      }

      // Add configured recipients
      if (settings!.recipients) {
        settings!.recipients.forEach((r) => allRecipients.add(r));
      }

      if (allRecipients.size === 0) {
        logger.info(`[${EMAIL_TYPE}] No recipients for trainee ${traineeId}, skipping.`);
        return;
      }

      const recipientList = Array.from(allRecipients);

      // Determine result text
      const isPassed = ["passed", "pass", "completed"].includes(afterStatus);
      const resultText = isPassed ? "Pass" : "Fail";

      const result = await sendAutoTemplatedEmail({
        to: recipientList,
        templateType: "trainingResult",
        data: {
          recipientName: afterData.employee_name || "",
          programName: "TQC Training",
          programCode: afterData.training_code || "",
          result: resultText,
          score: afterData.score || "",
          grade: afterData.grade || "",
          remarks: `Status: ${beforeStatus} → ${afterStatus}`,
        },
        language,
        cc: settings!.cc,
        bcc: settings!.bcc,
        smtp: smtp!,
      });

      await logEmailResult({
        emailType: EMAIL_TYPE,
        recipients: recipientList,
        subject: `[Q-TRAIN] TQC Result - ${afterData.employee_name || traineeId}`,
        result,
        metadata: {
          traineeId,
          employeeId: afterData.employee_id,
          employeeName: afterData.employee_name,
          beforeStatus,
          afterStatus,
          isPassed,
        },
      });

      logger.info(`[${EMAIL_TYPE}] Email ${result.success ? "sent" : "failed"} for trainee ${traineeId}`);
    } catch (error) {
      logger.error(`[${EMAIL_TYPE}] Error for trainee ${traineeId}:`, error);
    }
  }
);

// =============================================================================
// 2d. sendMetalShoeAlerts
//     Firestore trigger: onDocumentCreated on metal_shoe_cases/{year}/cases/{caseId}
//     When a new metal shoe case is registered, sends alert to managers.
// =============================================================================

export const sendMetalShoeAlerts = onDocumentCreated(
  {
    document: "metal_shoe_cases/{year}/cases/{caseId}",
    region: REGION,
  },
  async (event) => {
    const EMAIL_TYPE = "metal_shoe_alert";
    const { year, caseId } = event.params;

    const caseData = event.data?.data();
    if (!caseData) {
      logger.warn(`[${EMAIL_TYPE}] No data in event for case ${caseId}`);
      return;
    }

    logger.info(`[${EMAIL_TYPE}] New metal shoe case created: ${year}/${caseId}`);

    // Pre-flight check
    const check = await preflightCheck(EMAIL_TYPE);
    if (!check.ok) {
      logger.info(`[${EMAIL_TYPE}] Skipped: ${check.skipReason}`);
      return;
    }

    const { smtp, settings } = check;
    const language = settings!.language || "ko";

    try {
      const allRecipients = new Set<string>();

      // Read manager emails from md_email_recipients collection
      const mdRecipientsSnap = await db.collection("md_email_recipients").get();
      for (const doc of mdRecipientsSnap.docs) {
        const data = doc.data();
        if (data.email) allRecipients.add(data.email);
        if (Array.isArray(data.emails)) {
          data.emails.forEach((e: string) => allRecipients.add(e));
        }
      }

      // Add configured recipients from emailSettings
      if (settings!.recipients) {
        settings!.recipients.forEach((r) => allRecipients.add(r));
      }

      if (allRecipients.size === 0) {
        logger.info(`[${EMAIL_TYPE}] No recipients found, skipping.`);
        return;
      }

      const recipientList = Array.from(allRecipients);

      // Build multi-language alert content
      const subjects: Record<string, string> = {
        ko: `[Q-TRAIN] 금속 발견 신발 신규 등록 - ${caseData.case_no || caseId}`,
        en: `[Q-TRAIN] Metal Shoe Case Registered - ${caseData.case_no || caseId}`,
        vi: `[Q-TRAIN] Truong hop giay kim loai moi - ${caseData.case_no || caseId}`,
      };

      const bodies: Record<string, string> = {
        ko: `<p>새로운 금속 발견 신발 사례가 등록되었습니다.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;width:30%;">사례 번호</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.case_no || caseId}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">발견일</td><td style="padding:8px;border:1px solid #e5e7eb;">${formatDate(caseData.found_date || caseData.created_at)}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">빌딩/라인</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.building || ""} / ${caseData.line || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">모델</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.model || caseData.style || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">금속 종류</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.metal_type || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">발견 위치</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.found_location || caseData.location || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">공급업체</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.supplier || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">심각도</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.severity || caseData.risk_level || ""}</td></tr>
</table>
<p>즉시 확인 및 조치를 부탁드립니다.</p>`,
        en: `<p>A new metal shoe case has been registered.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;width:30%;">Case No.</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.case_no || caseId}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Found Date</td><td style="padding:8px;border:1px solid #e5e7eb;">${formatDate(caseData.found_date || caseData.created_at)}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Building/Line</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.building || ""} / ${caseData.line || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Model</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.model || caseData.style || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Metal Type</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.metal_type || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Found At</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.found_location || caseData.location || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Supplier</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.supplier || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Severity</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.severity || caseData.risk_level || ""}</td></tr>
</table>
<p>Please review and take immediate action.</p>`,
        vi: `<p>Mot truong hop giay kim loai moi da duoc dang ky.</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;width:30%;">Ma so</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.case_no || caseId}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Ngay phat hien</td><td style="padding:8px;border:1px solid #e5e7eb;">${formatDate(caseData.found_date || caseData.created_at)}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Toa nha/Chuyen</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.building || ""} / ${caseData.line || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Model</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.model || caseData.style || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Loai kim loai</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.metal_type || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Vi tri phat hien</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.found_location || caseData.location || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Nha cung cap</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.supplier || ""}</td></tr>
  <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:bold;">Muc do</td><td style="padding:8px;border:1px solid #e5e7eb;">${caseData.severity || caseData.risk_level || ""}</td></tr>
</table>
<p>Vui long kiem tra va xu ly ngay.</p>`,
      };

      const subject = subjects[language] || subjects.ko;
      const body = bodies[language] || bodies.ko;

      const result = await sendAutoTemplatedEmail({
        to: recipientList,
        templateType: "general",
        data: {
          title: subject,
          body: body,
        },
        language,
        subject,
        cc: settings!.cc,
        bcc: settings!.bcc,
        smtp: smtp!,
      });

      await logEmailResult({
        emailType: EMAIL_TYPE,
        recipients: recipientList,
        subject,
        result,
        metadata: {
          caseId,
          year,
          caseNo: caseData.case_no || null,
          building: caseData.building || null,
          line: caseData.line || null,
          metalType: caseData.metal_type || null,
        },
      });

      logger.info(`[${EMAIL_TYPE}] Email ${result.success ? "sent" : "failed"} for case ${caseId}`);
    } catch (error) {
      logger.error(`[${EMAIL_TYPE}] Error for case ${caseId}:`, error);
    }
  }
);
