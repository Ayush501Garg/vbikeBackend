const BatteryVendor = require("../models/BatteryVendor");
const Battery = require("../models/Battery");
const geocodeAddress = require("../utils/geocode");

// ------------------------------
// CREATE BATTERY VENDOR
// ------------------------------
exports.createBatteryVendor = async (req, res) => {
  try {
    const {
      name,
      address_line,
      city,
      state,
      postal_code,
      country,
      phone,
      email,
      opening_hours,
      rating,
      inventory
    } = req.body;

    const fullAddress = `${address_line}, ${city}, ${state}, ${postal_code}, ${country}`;
    const coordinates = await geocodeAddress(fullAddress);

    if (!coordinates)
      return res.status(400).json({ message: "Unable to geocode address" });

    const location = Array.isArray(coordinates)
      ? { lat: coordinates[1], lng: coordinates[0] }
      : coordinates;

    let formattedInventory = [];

    if (Array.isArray(inventory)) {
      for (const item of inventory) {
        const battery = await Battery.findById(item.battery);
        if (!battery)
          return res.status(404).json({ message: "Battery not found" });

        if (item.assigned_stock > battery.available_stock)
          return res.status(400).json({
            message: `Only ${battery.available_stock} batteries available`
          });

        battery.available_stock -= item.assigned_stock;
        await battery.save();

        formattedInventory.push({
          battery: item.battery,
          assigned_stock: item.assigned_stock,
          sold_stock: 0,
          available_stock: item.assigned_stock
        });
      }
    }

    const vendor = await BatteryVendor.create({
      name,
      address_line,
      city,
      state,
      postal_code,
      country,
      phone,
      email,
      opening_hours,
      rating,
      location,
      inventory: formattedInventory
    });

    res.status(201).json({
      message: "Battery vendor created",
      vendor
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




exports.addBatteryToInventory = async (req, res) => {
  const { vendorId, batteryId, assigned_stock } = req.body;

  const vendor = await BatteryVendor.findById(vendorId);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  const battery = await Battery.findById(batteryId);
  if (!battery) return res.status(404).json({ message: "Battery not found" });

  if (assigned_stock > battery.available_stock)
    return res.status(400).json({ message: "Insufficient battery stock" });

  const exists = vendor.inventory.find(
    i => i.battery.toString() === batteryId
  );
  if (exists)
    return res.status(400).json({ message: "Battery already assigned" });

  battery.available_stock -= assigned_stock;
  await battery.save();

  vendor.inventory.push({
    battery: batteryId,
    assigned_stock,
    sold_stock: 0,
    available_stock: assigned_stock
  });

  await vendor.save();

  res.json({ message: "Battery assigned to vendor", vendor });
};




exports.updateBatteryInventory = async (req, res) => {
  const { vendorId, batteryId, sold_stock } = req.body;

  const vendor = await BatteryVendor.findById(vendorId);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  const item = vendor.inventory.find(
    i => i.battery.toString() === batteryId
  );
  if (!item)
    return res.status(404).json({ message: "Battery not in inventory" });

  if (sold_stock > item.assigned_stock)
    return res.status(400).json({ message: "Sold exceeds assigned" });

  item.sold_stock = sold_stock;
  item.available_stock = item.assigned_stock - sold_stock;

  await vendor.save();

  res.json({ message: "Inventory updated", vendor });
};




exports.removeBatteryFromInventory = async (req, res) => {
  const { vendorId, batteryId } = req.body;

  const vendor = await BatteryVendor.findById(vendorId);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  const item = vendor.inventory.find(
    i => i.battery.toString() === batteryId
  );
  if (!item)
    return res.status(404).json({ message: "Battery not found in vendor" });

  const battery = await Battery.findById(batteryId);
  if (battery) {
    battery.available_stock += item.available_stock;
    await battery.save();
  }

  vendor.inventory = vendor.inventory.filter(
    i => i.battery.toString() !== batteryId
  );
  await vendor.save();

  res.json({ message: "Battery removed from vendor", vendor });
};



exports.getBatteryVendors = async (req, res) => {
  const vendors = await BatteryVendor.find()
    .populate("inventory.battery");

  res.json({
    count: vendors.length,
    vendors
  });
};



exports.getNearbyBatteryVendors = async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;

  const vendors = await BatteryVendor.find()
    .populate("inventory.battery");

  const near = vendors.filter(v =>
    v.location?.lat &&
    getDistance(lat, lng, v.location.lat, v.location.lng) <= radius
  );

  res.json({
    count: near.length,
    vendors: near
  });
};




