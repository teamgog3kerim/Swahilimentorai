import { sql } from "drizzle-orm";
import { db, pool } from "../server/db";

// Additive and non-interactive; deliberately does not backfill historical reviews.
try {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payment_reviews (
      subscription_id varchar PRIMARY KEY,
      reviewer_id varchar NOT NULL,
      reviewer_name text NOT NULL,
      outcome text NOT NULL,
      reviewed_at timestamp NOT NULL DEFAULT now(),
      start_date timestamp NOT NULL,
      end_date timestamp NOT NULL,
      subscription_ends_at timestamp,
      CONSTRAINT payment_reviews_outcome_check CHECK (outcome IN ('approved', 'rejected'))
    )
  `);
  console.log("Payment review audit schema is ready.");
} finally {
  await pool.end();
}
