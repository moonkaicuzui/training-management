import { logger } from '@/utils/logger';

export const sendSlackNotification = async (
  webhookUrl: string,
  message: {
    title: string;
    text: string;
    color?: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }
): Promise<void> => {
  try {
    const slackPayload = {
      attachments: [
        {
          color: message.color || '#2563eb',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: message.title,
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: message.text,
              },
            },
            ...(message.fields
              ? [
                  {
                    type: 'section',
                    fields: message.fields.map((f) => ({
                      type: 'mrkdwn',
                      text: `*${f.title}*\n${f.value}`,
                    })),
                  },
                ]
              : []),
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Q-TRAIN | ${new Date().toISOString()}`,
                },
              ],
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Slack API returned ${response.status}: ${body}`);
    }

    logger.info('[integrationService] Slack notification sent successfully');
  } catch (error) {
    logger.error('[integrationService] sendSlackNotification failed:', error);
    throw error;
  }
};

export const sendTeamsNotification = async (
  webhookUrl: string,
  message: {
    title: string;
    text: string;
    themeColor?: string;
    facts?: Array<{ name: string; value: string }>;
  }
): Promise<void> => {
  try {
    const teamsPayload = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: message.title,
                weight: 'Bolder',
                size: 'Medium',
                color: 'Accent',
              },
              {
                type: 'TextBlock',
                text: message.text,
                wrap: true,
              },
              ...(message.facts
                ? [
                    {
                      type: 'FactSet',
                      facts: message.facts.map((f) => ({
                        title: f.name,
                        value: f.value,
                      })),
                    },
                  ]
                : []),
              {
                type: 'TextBlock',
                text: `Q-TRAIN | ${new Date().toISOString()}`,
                size: 'Small',
                isSubtle: true,
              },
            ],
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsPayload),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Teams API returned ${response.status}: ${body}`);
    }

    logger.info('[integrationService] Teams notification sent successfully');
  } catch (error) {
    logger.error('[integrationService] sendTeamsNotification failed:', error);
    throw error;
  }
};

export const sendCustomApiNotification = async (
  config: Record<string, string>,
  event: string,
  data: Record<string, unknown>
): Promise<void> => {
  const url = config.url || config.api_url;
  if (!url) {
    throw new Error('Custom API integration missing "url" or "api_url" in config');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.api_key) {
    headers['Authorization'] = `Bearer ${config.api_key}`;
  }

  if (config.custom_headers) {
    config.custom_headers.split(',').forEach((pair) => {
      const [key, ...valueParts] = pair.split(':');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    });
  }

  const payload = {
    source: 'q-train',
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Custom API returned ${response.status}: ${body}`);
  }
};

export const buildNotificationMessage = (
  event: string,
  data: Record<string, unknown>
): { title: string; text: string; fields: Array<{ title: string; value: string }> } => {
  const eventParts = event.split('.');
  const domain = eventParts[0] || 'system';
  const action = eventParts.slice(1).join('.') || 'event';

  const title = `[Q-TRAIN] ${domain.charAt(0).toUpperCase() + domain.slice(1)}: ${action.replace(/_/g, ' ')}`;

  const fields: Array<{ title: string; value: string }> = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      fields.push({ title: key, value: String(value) });
    }
  }

  const text = data.message
    ? String(data.message)
    : `Event \`${event}\` triggered at ${new Date().toISOString()}`;

  return { title, text, fields: fields.slice(0, 10) };
};
