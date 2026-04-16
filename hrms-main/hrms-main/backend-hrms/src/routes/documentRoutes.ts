
import express from 'express';
import { getAllLetterTemplates, getLetterTemplateById, createLetterTemplate, updateLetterTemplate, deleteLetterTemplate } from '../controllers/letterTemplateController';
import { getAllLetterTemplateVariables, getLetterTemplateVariableById, createLetterTemplateVariable, deleteLetterTemplateVariable } from '../controllers/letterTemplateVariableController';
import { getAllGeneratedLetters, getGeneratedLetterById, createGeneratedLetter, updateGeneratedLetter, deleteGeneratedLetter } from '../controllers/generatedLetterController';
import { getAllLetterCustomVariables, getLetterCustomVariableById, createLetterCustomVariable, updateLetterCustomVariable, deleteLetterCustomVariable } from '../controllers/letterCustomVariableController';

const router = express.Router();

// Letter Templates Routes
router.get('/letter-templates', getAllLetterTemplates);
router.get('/letter-templates/:id', getLetterTemplateById);
router.post('/letter-templates', createLetterTemplate);
router.put('/letter-templates/:id', updateLetterTemplate);
router.delete('/letter-templates/:id', deleteLetterTemplate);

// Letter Template Variables Routes
router.get('/letter-template-variables', getAllLetterTemplateVariables);
router.get('/letter-template-variables/:template_id/:variable_name', getLetterTemplateVariableById);
router.post('/letter-template-variables', createLetterTemplateVariable);
router.delete('/letter-template-variables/:template_id/:variable_name', deleteLetterTemplateVariable);

// Generated Letters Routes
router.get('/generated-letters', getAllGeneratedLetters);
router.get('/generated-letters/:id', getGeneratedLetterById);
router.post('/generated-letters', createGeneratedLetter);
router.put('/generated-letters/:id', updateGeneratedLetter);
router.delete('/generated-letters/:id', deleteGeneratedLetter);

// Letter Custom Variables Routes
router.get('/letter-custom-variables', getAllLetterCustomVariables);
router.get('/letter-custom-variables/:letter_id/:variable_name', getLetterCustomVariableById);
router.post('/letter-custom-variables', createLetterCustomVariable);
router.put('/letter-custom-variables/:letter_id/:variable_name', updateLetterCustomVariable);
router.delete('/letter-custom-variables/:letter_id/:variable_name', deleteLetterCustomVariable);

export default router;
