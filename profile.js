const express = require("express");
const pool = require("../../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/profile — fetch the logged-in user's email + profile details
router.get("/", requireAuth, async (req, res) => {
  try {
    const [userRows] = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = :id",
      { id: req.user.id }
    );
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    const [profileRows] = await pool.query(
      "SELECT display_name, bio, avatar_url, updated_at FROM profiles WHERE user_id = :userId",
      { userId: req.user.id }
    );
    const profile = profileRows[0] || null;

    res.json({
      email: user.email, // read-only, fetched from the database, never from client input
      memberSince: user.created_at,
      profile,
    });
  } catch (err) {
    console.error("get profile error:", err);
    res.status(500).json({ error: "Something went wrong fetching your profile." });
  }
});

// POST /api/profile — create or update display name / bio / avatar
router.post("/", requireAuth, async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ error: "Display name is required." });
    }
    if (displayName.length > 30) {
      return res.status(400).json({ error: "Display name must be 30 characters or fewer." });
    }
    if (bio && bio.length > 280) {
      return res.status(400).json({ error: "Bio must be 280 characters or fewer." });
    }

    await pool.query(
      `INSERT INTO profiles (user_id, display_name, bio, avatar_url)
       VALUES (:userId, :displayName, :bio, :avatarUrl)
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         bio = VALUES(bio),
         avatar_url = VALUES(avatar_url)`,
      {
        userId: req.user.id,
        displayName: displayName.trim(),
        bio: bio ? bio.trim() : null,
        avatarUrl: avatarUrl || null,
      }
    );

    res.json({ message: "Profile saved." });
  } catch (err) {
    console.error("save profile error:", err);
    res.status(500).json({ error: "Something went wrong saving your profile." });
  }
});

module.exports = router;
