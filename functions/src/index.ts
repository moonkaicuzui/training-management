import { onMessagePublished } from "firebase-functions/v2/pubsub";
import { logger } from "firebase-functions";
import { google } from "googleapis";

const PROJECT_ID = "q-train-web";
const PROJECT_NAME = `projects/${PROJECT_ID}`;

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
