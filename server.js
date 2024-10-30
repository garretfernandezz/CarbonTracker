const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/TransportDB')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Transport Input Schema
const transportInputSchema = new mongoose.Schema({
  transportType: { type: String, required: true },
  distanceTraveled: { type: Number, required: true },
  fuelType: { type: String, required: false }, // Optional field
  fuelEfficiency: { type: Number, required: false }, // Optional field
  dataDate: { type: Date, required: true }, // Date field, required
});

// Create the TransportInput model
const TransportInput = mongoose.model('TransportInput', transportInputSchema);

// POST route to handle form submission
app.post('/api/transport', async (req, res) => {
  try {
    const newTransportInput = new TransportInput(req.body);
    await newTransportInput.save();
    res.status(201).send(newTransportInput);
  } catch (error) {
    console.error('Error saving transport data:', error); // Log error details
    res.status(400).send({ error: error.message }); // Send back the error message
  }
});

// Waste Input Schema
const wasteInputSchema = new mongoose.Schema({
  wasteType: { type: [String], required: true }, // Array of selected waste types
  wasteWeight: { type: Number, required: true }, // Weight of the waste in kg
  wasteSource: { type: String, required: true }, // Source of the waste
  recycleStatus: { type: String, required: true }, // Whether waste was recycled (yes or no)
  wasteNotes: { type: String, required: false }, // Optional field for additional notes
  dataDate: { type: Date, required: true }, // Date of data entry, required
});

// Create the WasteInput model
const WasteInput = mongoose.model('WasteInput', wasteInputSchema);

// POST route to handle waste form submission
app.post('/api/waste', async (req, res) => {
  try {
    const newWasteInput = new WasteInput(req.body);
    await newWasteInput.save();
    res.status(201).send(newWasteInput);
  } catch (error) {
    console.error('Error saving waste data:', error);
    res.status(400).send({ error: error.message });
  }
});

// Define Water Usage schema
const waterUsageSchema = new mongoose.Schema({
  category: String,
  showerTime: Number,
  numberOfShowers: Number,
  laundryLoads: Number,
  dishwashingTimes: Number,
  flushes: Number,
  miscellaneousAmount: Number,
  date: { type: Date, default: Date.now }
});

const WaterUsage = mongoose.model('WaterUsage', waterUsageSchema);

// POST endpoint to save water consumption data
app.post('/api/water', async (req, res) => {
  try {
    const waterData = new WaterUsage(req.body);
    await waterData.save();
    res.status(200).send("Water consumption data added successfully!");
  } catch (error) {
    res.status(500).send("Error saving data: " + error);
  }
});

// Define the schema
const electricitySchema = new mongoose.Schema({
  month: Number,
  year: Number,
  usage: Number,
  source: String,
  renewablePercentage: { type: Number, default: 0 },
  nonRenewablePercentage: { type: Number, default: 0 },
  energyEfficientAppliances: String,
  solarPanels: String,
  heatingCooling: String,
  acUsage: String,
  largeAppliances: Number,
  electricWaterHeating: String,
});

// Create the model
const ElectricityConsumption = mongoose.model('ElectricityConsumption', electricitySchema);

// POST route to handle form submission
app.post('/api/consumption', async (req, res) => {
  try {
    const consumptionData = new ElectricityConsumption(req.body);
    await consumptionData.save();
    res.status(201).send(consumptionData);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Define the schema for food consumption data
const foodConsumptionSchema = new mongoose.Schema({
    consumptionDate: { type: Date, required: true },
    dietType: { type: String, required: true },
    meatConsumption: { type: String, required: true },
    dairyConsumption: { type: Number, required: true },
    eggConsumption: { type: Number, required: true },
    processedFood: { type: String, required: true },
    localFood: { type: String, required: true },
    grainConsumption: { type: Number, required: true },
    vegConsumption: { type: Number, required: true },
    beverageConsumption: { type: Number, required: true },
  });
  
  // Create the model
  const FoodConsumption = mongoose.model('FoodConsumption', foodConsumptionSchema);
  
  // Define API endpoint to handle food consumption data
  app.post('/api/food', async (req, res) => {
    try {
      const foodData = new FoodConsumption(req.body); // Create a new instance of the model
      await foodData.save(); // Save it to the database
      res.status(201).json({ message: 'Data saved successfully', data: foodData });
    } catch (error) {
      res.status(500).json({ message: 'Error saving data', error: error.message });
    }
  });
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
