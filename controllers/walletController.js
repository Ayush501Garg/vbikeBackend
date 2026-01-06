const Wallet = require("../models/WalletModel");

// ----------------------------------------------------
// AUTO-CREATE WALLET ON GET
// ----------------------------------------------------
exports.getWallet = async (req, res) => {
  try {
    const userId = req.params.userId;

    let wallet = await Wallet.findOne({ user: userId });

    // Auto-create if does not exist
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        default_points: 50,
        available_points: 50
      });
    }

    res.json(wallet);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------------------------------
// ADD / EARN POINTS
// ----------------------------------------------------
exports.addPoints = async (req, res) => {
  try {
    const { userId, points } = req.body;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    wallet.earned_points += points;
    wallet.available_points += points;

    await wallet.save();

    res.json({ message: "Points added successfully", wallet });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------------------------------
// SPEND POINTS
// ----------------------------------------------------
exports.spendPoints = async (req, res) => {
  try {
    const { userId, points } = req.body;

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    if (points > wallet.available_points) {
      return res.status(400).json({ message: "Not enough available points" });
    }

    wallet.spent_points += points;
    wallet.available_points -= points;

    await wallet.save();

    res.json({ message: "Points spent successfully", wallet });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------------------------------
// UPDATE WALLET MANUALLY
// ----------------------------------------------------
exports.updateWallet = async (req, res) => {
  try {
    const userId = req.params.userId;
    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const { earned_points, default_points, spent_points } = req.body;

    // Increment existing fields
    if (earned_points !== undefined) {
      wallet.earned_points += earned_points;
    }

    if (default_points !== undefined) {
      wallet.default_points += default_points;
    }

    if (spent_points !== undefined) {
      // Ensure it does NOT exceed available
      if (spent_points > wallet.available_points) {
        return res.status(400).json({
          message: "Cannot spend more points than available"
        });
      }
      wallet.spent_points += spent_points;
    }

    // Recalculate available points
    wallet.available_points =
      wallet.earned_points + wallet.default_points - wallet.spent_points;

    await wallet.save();

    res.json({ message: "Wallet updated successfully", wallet });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------------------------------
// DELETE WALLET
// ----------------------------------------------------
exports.deleteWallet = async (req, res) => {
  try {
    await Wallet.findOneAndDelete({ user: req.params.userId });

    res.json({ message: "Wallet deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
