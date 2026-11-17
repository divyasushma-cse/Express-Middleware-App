import express from "express";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 6500;

// In-memory data store for actual patient records
let patients = [
  { id: 1, name: "Divya Sushma", age: 20, ward: "General" }
];

// 1. Application-level middleware
// 4. Third party.
app.use(cors());
app.use(morgan("dev"));

// built-in middleware for parsing JSON request body.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Application-level middleware for logging request details.
const logger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const period = Date.now() - start;
    const log = `${req.method} ${req.originalUrl} ${res.statusCode} - ${period}ms`;
    fs.appendFile("server.log", log + "\n", (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
  next();
};

// 2. Route specific
const validatePatient = (req, res, next) => {
  const { name, age, ward } = req.body;
  if (!name || !age || !ward) {
    return res.status(400).json({ message: "Invalid patient data" });
  }
  next();
};

app.use(logger);

// CRUD
// POST - Create : http://localhost:6500/api/v1/patients
app.post("/api/v1/patients", validatePatient, (req, res) => {
  const { name, age, ward } = req.body;
  const newPatient = {
    id: patients.length > 0 ? Math.max(...patients.map((p) => p.id)) + 1 : 1,
    name,
    age,
    ward
  };
  patients.push(newPatient);
  res.status(201).json({ message: "Patient created successfully", data: newPatient });
});

// GET - Read : http://localhost:6500/api/v1/patients
app.get("/api/v1/patients", (req, res) => {
  res.status(200).json({ message: "patients fetched successfully", data: patients });
});

// GET - Read by ID: http://localhost:6500/api/v1/patients/:id
app.get("/api/v1/patients/:id", (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id, 10);
  if (numId < 1 || isNaN(numId)) {
    const err = new Error("Patient not found");
    err.statusCode = 404;
    throw err;
  }
  const patient = patients.find((p) => p.id === numId);
  if (!patient) {
    const err = new Error("Patient not found");
    err.statusCode = 404;
    throw err;
  }
  res.status(200).json({ message: "patient details fetched successfully", data: patient });
});

// PUT - Update URL: http://localhost:6500/api/v1/patients/:id
app.put("/api/v1/patients/:id", validatePatient, (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id, 10);
  if (numId < 1 || isNaN(numId)) {
    const err = new Error("Patient not found");
    err.statusCode = 404;
    throw err;
  }
  const index = patients.findIndex((p) => p.id === numId);
  if (index === -1) {
    const err = new Error("Patient not found");
    err.statusCode = 404;
    throw err;
  }
  const { name, age, ward } = req.body;
  patients[index] = { ...patients[index], name, age, ward };
  res.status(200).json({ message: "Patient updated successfully", data: patients[index] });
});

// DELETE - URL: http://localhost:6500/api/v1/patients/:id
app.delete("/api/v1/patients/:id", (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id, 10);
  if (numId < 1 || isNaN(numId)) {
    const err = new Error("Patient not found");
    err.statusCode = 404;
    throw err;
  }
  const index = patients.findIndex((p) => p.id === numId);
  if (index === -1) {
    const err = new Error("Patient not found");
    err.statusCode = 404;
    throw err;
  }
  const deleted = patients.splice(index, 1)[0];
  res.status(200).json({ message: "Patient deleted successfully", data: deleted });
});

// 5. Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ message });
});

// 6. Handle 404 error
app.use((req, res, next) => {
  res.status(404).json({ message: "Resource not found" });
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
