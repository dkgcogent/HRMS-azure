
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getAllJobOpenings, getJobOpeningById, createJobOpening, updateJobOpening, deleteJobOpening, assignJob, updateJobProgress, getJobActivities } from '../controllers/jobOpeningController';
import { getAllCandidates, getCandidateById, createCandidate, updateCandidate, deleteCandidate } from '../controllers/candidateController';
import { getAllInterviews, getInterviewById, createInterview, updateInterview, deleteInterview } from '../controllers/interviewController';

const router = express.Router();

// Job Openings Routes
router.get('/job-openings', authenticateToken, getAllJobOpenings);
router.get('/job-openings/:id', authenticateToken, getJobOpeningById);
router.post('/job-openings', authenticateToken, createJobOpening);
router.put('/job-openings/:id', authenticateToken, updateJobOpening);
router.delete('/job-openings/:id', authenticateToken, deleteJobOpening);
router.post('/job-openings/:id/assign', authenticateToken, assignJob);
router.put('/job-openings/:id/progress', authenticateToken, updateJobProgress);
router.get('/job-openings/:id/activities', authenticateToken, getJobActivities);

// Candidates Routes
router.get('/candidates', getAllCandidates);
router.get('/candidates/:id', getCandidateById);
router.post('/candidates', createCandidate);
router.put('/candidates/:id', updateCandidate);
router.delete('/candidates/:id', deleteCandidate);

// Interviews Routes
router.get('/interviews', getAllInterviews);
router.get('/interviews/:id', getInterviewById);
router.post('/interviews', createInterview);
router.put('/interviews/:id', updateInterview);
router.delete('/interviews/:id', deleteInterview);

export default router;
