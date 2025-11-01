const Address = require('../models/addressModel');
const User = require('../models/User');

// 📦 Add New Address
exports.createAddress = async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      email,
      phone,
      address_line,
      city,
      state,
      postal_code,
      country,
      is_default
    } = req.body;

    // 🧍‍♂️ Ensure user exists
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found.'
      });
    }

    // ✅ Unset previous default address if this one is default
    if (is_default) {
      await Address.updateMany({ user_id }, { $set: { is_default: false } });
    }

    // 🏠 Create new address
    const address = new Address({
      user_id,
      full_name,
      email,         // ✅ Added email field
      phone,
      address_line,
      city,
      state,
      postal_code,
      country,
      is_default: is_default || false
    });

    const savedAddress = await address.save();

    res.status(201).json({
      status: 'success',
      code: 201,
      message: 'Address added successfully.',
      data: savedAddress
    });
  } catch (err) {
    console.error('❌ Error creating address:', err.message);
    res.status(400).json({
      status: 'error',
      code: 400,
      message: err.message
    });
  }
};

// 📬 Get All Addresses for a User
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user_id: req.params.userId })
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      code: 200,
      message: 'Addresses retrieved successfully.',
      data: addresses
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err.message
    });
  }
};

// 🧾 Update Address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // If updating to default, unset others
    if (req.body.is_default === true) {
      const address = await Address.findById(id);
      if (address) {
        await Address.updateMany({ user_id: address.user_id }, { $set: { is_default: false } });
      }
    }

    const updated = await Address.findByIdAndUpdate(id, req.body, { new: true }).select('-__v');

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Address not found.'
      });
    }

    res.json({
      status: 'success',
      code: 200,
      message: 'Address updated successfully.',
      data: updated
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      code: 400,
      message: err.message
    });
  }
};

// ❌ Delete Address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Address.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Address not found.'
      });
    }

    res.json({
      status: 'success',
      code: 200,
      message: 'Address deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: err.message
    });
  }
};
