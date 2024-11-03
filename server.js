const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 5001;


const bcrypt = require('bcryptjs');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});



// Hash password before saving user
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);


const jwt = require('jsonwebtoken');



const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};




// Register new user
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering user', error: error.message });
  }
});


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid username or password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});









// MongoDB connection
mongoose.connect('mongodb://localhost:27017/TransportDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Transport Input Schema
const transportInputSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  transportType: { type: String, required: true },
  distanceTraveled: { type: Number, required: true },
  fuelType: { type: String }, // Optional
  fuelEfficiency: { type: Number }, // Optional
  dataDate: { type: Date, required: true },
});

const TransportInput = mongoose.model('TransportInput', transportInputSchema);

// POST route to handle form submission
app.post('/api/transport', authMiddleware, async (req, res) => {
  try {
    console.log("Incoming data:", req.body); // Log incoming data

    // Validate required fields
    const { userId, transportType, distanceTraveled, dataDate } = req.body;
    if (!userId || !transportType || !distanceTraveled || !dataDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create new transport input
    const newTransportInput = new TransportInput(req.body);

    // Save to database
    const savedInput = await newTransportInput.save();
    res.status(201).json({ message: "Transport consumption data added successfully!", data: savedInput });
  } catch (error) {
    console.error("Error saving data:", error); // Log the full error object
    res.status(500).json({ message: "Error saving data", error: error.message });
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
app.post('/api/water', authMiddleware, async (req, res) => {
  try {
    const waterData = new WaterUsage({ ...req.body, userId: req.user.userId });
    await waterData.save();
    res.status(200).json({ message: "Water consumption data added successfully!" }); // Send JSON response
  } catch (error) {
    console.error("Error saving data:", error); // Log error for debugging
    res.status(500).json({ message: "Error saving data", error: error.message }); // Send JSON error response
  }
});


// Define the schema
const electricitySchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  usage: { type: Number, required: true },
  source: { type: String, required: true },
  renewablePercentage: { type: Number, default: 0 },
  nonRenewablePercentage: { type: Number, default: 0 },
  energyEfficientAppliances: { type: Boolean, required: true }, // Changed to Boolean
  solarPanels: { type: Boolean, required: true }, // Changed to Boolean
  heatingCooling: { type: Boolean, required: true }, // Changed to Boolean
  acUsage: { type: String, required: true },
  largeAppliances: { type: Number, default: 0 }, // Set default to 0
  electricWaterHeating: { type: Boolean, required: true }, // Changed to Boolean
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Create the model
const ElectricityConsumption = mongoose.model('ElectricityConsumption', electricitySchema);

// POST route to handle form submission
app.post('/api/consumption',authMiddleware, async (req, res) => {
  try {
    const { month, year, usage, source, renewablePercentage, nonRenewablePercentage, energyEfficientAppliances, solarPanels, heatingCooling, acUsage, largeAppliances, electricWaterHeating } = req.body;
    const consumptionData = new ElectricityConsumption({ // Declare and initialize consumptionData
      month,
      year,
      usage,
      source,
      renewablePercentage,
      nonRenewablePercentage,
      energyEfficientAppliances,
      solarPanels,
      heatingCooling,
      acUsage,
      largeAppliances,
      electricWaterHeating,
      userId: req.user.userId // Ensure user is authenticated and userId is available
    });
   
    
    await consumptionData.save();
    res.status(201).json({ message: "Electricity consumption data added successfully!" }); // Changed status to 201 for created resource
  } catch (error) {
    console.error("Error saving data:", error); // Log the error
    res.status(500).json({ message: "Error saving data", error: error.message });
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
  console.log('Server is running on port ${PORT}');
}); 