import { Router } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.clerkUserId = userId;
  next();
}

// ─── User Profile ────────────────────────────────────────────────────────────

router.get("/user/profile", requireAuth, async (req: any, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM user_profiles WHERE clerk_user_id = $1",
      [req.clerkUserId],
    );
    if (rows.length === 0) {
      // Return defaults for new users
      return res.json({ initialBalance: 0, language: "ar" });
    }
    const p = rows[0];
    res.json({
      initialBalance: parseFloat(p.initial_balance),
      language: p.language,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/user/profile", requireAuth, async (req: any, res) => {
  const { initialBalance, language } = req.body;
  try {
    await pool.query(
      `INSERT INTO user_profiles (clerk_user_id, email, initial_balance, language, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (clerk_user_id) DO UPDATE
       SET initial_balance = EXCLUDED.initial_balance,
           language = EXCLUDED.language,
           updated_at = NOW()`,
      [req.clerkUserId, "", initialBalance ?? 0, language ?? "ar"],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Trades ──────────────────────────────────────────────────────────────────

router.get("/trades", requireAuth, async (req: any, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, pair, direction, date, entry_price, exit_price, lot_size,
              profit_loss, starting_balance, ending_balance, strategy,
              timeframe, duration, notes, created_at
       FROM user_trades WHERE clerk_user_id = $1
       ORDER BY date ASC, created_at ASC`,
      [req.clerkUserId],
    );
    const trades = rows.map((r) => ({
      id: r.id,
      pair: r.pair,
      direction: r.direction,
      date: r.date,
      entryPrice: r.entry_price != null ? parseFloat(r.entry_price) : undefined,
      exitPrice: r.exit_price != null ? parseFloat(r.exit_price) : undefined,
      lotSize: r.lot_size != null ? parseFloat(r.lot_size) : undefined,
      profitLoss: parseFloat(r.profit_loss),
      startingBalance: parseFloat(r.starting_balance),
      endingBalance: parseFloat(r.ending_balance),
      strategy: r.strategy ?? undefined,
      timeframe: r.timeframe ?? undefined,
      duration: r.duration ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: r.created_at,
    }));
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/trades", requireAuth, async (req: any, res) => {
  const t = req.body;
  if (!t?.id) return res.status(400).json({ error: "Missing id" });
  try {
    await pool.query(
      `INSERT INTO user_trades
         (id, clerk_user_id, pair, direction, date, entry_price, exit_price,
          lot_size, profit_loss, starting_balance, ending_balance, strategy,
          timeframe, duration, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO UPDATE SET
         pair=EXCLUDED.pair, direction=EXCLUDED.direction, date=EXCLUDED.date,
         entry_price=EXCLUDED.entry_price, exit_price=EXCLUDED.exit_price,
         lot_size=EXCLUDED.lot_size, profit_loss=EXCLUDED.profit_loss,
         starting_balance=EXCLUDED.starting_balance,
         ending_balance=EXCLUDED.ending_balance, strategy=EXCLUDED.strategy,
         timeframe=EXCLUDED.timeframe, duration=EXCLUDED.duration,
         notes=EXCLUDED.notes, updated_at=NOW()`,
      [
        t.id, req.clerkUserId, t.pair, t.direction, t.date,
        t.entryPrice ?? null, t.exitPrice ?? null, t.lotSize ?? null,
        t.profitLoss, t.startingBalance, t.endingBalance,
        t.strategy ?? null, t.timeframe ?? null, t.duration ?? null,
        t.notes ?? null, t.createdAt ?? new Date().toISOString(),
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/trades/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const t = req.body;
  try {
    await pool.query(
      `UPDATE user_trades SET
         pair=$1, direction=$2, date=$3, entry_price=$4, exit_price=$5,
         lot_size=$6, profit_loss=$7, starting_balance=$8, ending_balance=$9,
         strategy=$10, timeframe=$11, duration=$12, notes=$13, updated_at=NOW()
       WHERE id=$14 AND clerk_user_id=$15`,
      [
        t.pair, t.direction, t.date,
        t.entryPrice ?? null, t.exitPrice ?? null, t.lotSize ?? null,
        t.profitLoss, t.startingBalance, t.endingBalance,
        t.strategy ?? null, t.timeframe ?? null, t.duration ?? null,
        t.notes ?? null, id, req.clerkUserId,
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/trades/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "DELETE FROM user_trades WHERE id=$1 AND clerk_user_id=$2",
      [id, req.clerkUserId],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Strategies ──────────────────────────────────────────────────────────────

router.get("/strategies", requireAuth, async (req: any, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT name FROM user_strategies WHERE clerk_user_id=$1 ORDER BY created_at ASC",
      [req.clerkUserId],
    );
    res.json(rows.map((r) => r.name));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/strategies", requireAuth, async (req: any, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing name" });
  try {
    await pool.query(
      `INSERT INTO user_strategies (clerk_user_id, name)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.clerkUserId, name],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/strategies/:name", requireAuth, async (req: any, res) => {
  const { name } = req.params;
  try {
    await pool.query(
      "DELETE FROM user_strategies WHERE clerk_user_id=$1 AND name=$2",
      [req.clerkUserId, name],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Full sync (replace all user data) ───────────────────────────────────────

router.post("/sync", requireAuth, async (req: any, res) => {
  const { trades, strategies, initialBalance, language } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Upsert profile
    await client.query(
      `INSERT INTO user_profiles (clerk_user_id, email, initial_balance, language, updated_at)
       VALUES ($1, '', $2, $3, NOW())
       ON CONFLICT (clerk_user_id) DO UPDATE
       SET initial_balance=EXCLUDED.initial_balance, language=EXCLUDED.language, updated_at=NOW()`,
      [req.clerkUserId, initialBalance ?? 0, language ?? "ar"],
    );
    // Replace all trades
    await client.query(
      "DELETE FROM user_trades WHERE clerk_user_id=$1",
      [req.clerkUserId],
    );
    for (const t of trades ?? []) {
      await client.query(
        `INSERT INTO user_trades
           (id, clerk_user_id, pair, direction, date, entry_price, exit_price,
            lot_size, profit_loss, starting_balance, ending_balance, strategy,
            timeframe, duration, notes, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO NOTHING`,
        [
          t.id, req.clerkUserId, t.pair, t.direction, t.date,
          t.entryPrice ?? null, t.exitPrice ?? null, t.lotSize ?? null,
          t.profitLoss, t.startingBalance, t.endingBalance,
          t.strategy ?? null, t.timeframe ?? null, t.duration ?? null,
          t.notes ?? null, t.createdAt ?? new Date().toISOString(),
        ],
      );
    }
    // Replace all strategies
    await client.query(
      "DELETE FROM user_strategies WHERE clerk_user_id=$1",
      [req.clerkUserId],
    );
    for (const name of strategies ?? []) {
      await client.query(
        "INSERT INTO user_strategies (clerk_user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [req.clerkUserId, name],
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

export default router;
