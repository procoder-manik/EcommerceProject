import { Queue, Worker } from "bullmq";
import { env } from "../config/env.js";

interface EmailQueueLike {
  add(name: string, data: Record<string, unknown>): Promise<unknown>;
}

// Without Redis (local dev), "queued" emails are just logged.
const logQueue: EmailQueueLike = {
  async add(name, data) {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] ${name}`, data);
  },
};

export const emailQueue: EmailQueueLike = env.redisUrl
  ? (new Queue("email", { connection: { url: env.redisUrl } }) as unknown as EmailQueueLike)
  : logQueue;

export function startEmailWorker() {
  if (!env.redisUrl) return null;
  return new Worker(
    "email",
    async (job) => {
      // TODO: send via Resend/SendGrid based on job.data.template
      // eslint-disable-next-line no-console
      console.log("Sending email job", job.id, job.data);
    },
    { connection: { url: env.redisUrl } }
  );
}
