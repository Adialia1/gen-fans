import { db } from './lib/db/drizzle';
import { jobs } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function markJobsFailed() {
  const jobIds = [
    '9b23408d-8262-4049-acbd-bdf0d4920f63',
    '8c919444-3dcc-4729-b51b-048f3d9a0ca7'
  ];

  for (const jobId of jobIds) {
    await db
      .update(jobs)
      .set({
        status: 'failed',
        completedAt: new Date(),
        error: { message: 'Max retries exceeded' }
      })
      .where(eq(jobs.id, jobId));

    console.log(`✅ Marked job ${jobId} as failed`);
  }

  process.exit(0);
}

markJobsFailed().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
