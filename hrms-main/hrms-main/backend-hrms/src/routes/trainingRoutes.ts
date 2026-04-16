
import express from 'express';
import { getAllTrainingPrograms, getTrainingProgramById, createTrainingProgram, updateTrainingProgram, deleteTrainingProgram } from '../controllers/trainingProgramController';
import { getAllEmployeeTraining, getEmployeeTrainingById, createEmployeeTraining, updateEmployeeTraining, deleteEmployeeTraining } from '../controllers/employeeTrainingController';

const router = express.Router();

// Training Programs Routes
router.get('/training-programs', getAllTrainingPrograms);
router.get('/training-programs/:id', getTrainingProgramById);
router.post('/training-programs', createTrainingProgram);
router.put('/training-programs/:id', updateTrainingProgram);
router.delete('/training-programs/:id', deleteTrainingProgram);

// Employee Training Routes
router.get('/employee-training', getAllEmployeeTraining);
router.get('/employee-training/:id', getEmployeeTrainingById);
router.post('/employee-training', createEmployeeTraining);
router.put('/employee-training/:id', updateEmployeeTraining);
router.delete('/employee-training/:id', deleteEmployeeTraining);

export default router;
