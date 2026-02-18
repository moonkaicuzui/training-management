import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2/options";
import { logger } from "firebase-functions";
import { google } from "googleapis";
import * as admin from "firebase-admin";
import { sendEmail, sendTemplatedEmail } from "./services/emailService";
import type { TemplateType, SupportedLanguage } from "./services/emailTemplates";

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
      // 1. Total employees (active)
      const employeesSnapshot = await db
        .collection("employees")
        .where("status", "==", "active")
        .get();
      const totalEmployees = employeesSnapshot.size;

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
// 5. onCAPAStatusChange
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
