// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
import { deleteSingleAirtableRecord, deleteBatchAirtableRecords } from './airtableService';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Configuration from environment variables ---
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_PAT = process.env.AIRTABLE_PAT; // Personal Access Token

// Basic validation for environment variables
if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME || !AIRTABLE_PAT) {
  console.error('Missing one or more required environment variables: AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME, AIRTABLE_PAT');
  process.exit(1); // Exit if critical config is missing
}

// --- Routes ---

// Health check endpoint - required for Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Version endpoint
app.get('/version', (req, res) => {
  res.status(200).json({ service: 'airtable-record-deleter', version: '1.0.0' });
});

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Airtable Record Deleter Service is running!',
    endpoints: {
      health: '/healthz',
      version: '/version',
      deleteSingle: 'DELETE /api/records/:id',
      deleteBatch: 'POST /api/records/batch-delete'
    }
  });
});

// Endpoint for single record deletion
// Example: DELETE /api/records/recXXXXXXXXXXXXXX
app.delete('/api/records/:id', async (req, res) => {
  const recordId = req.params.id;

  if (!recordId || recordId.trim() === '') {
    return res.status(400).json({ error: 'Record ID is required' });
  }

  try {
    const result = await deleteSingleAirtableRecord(
      AIRTABLE_BASE_ID!,
      AIRTABLE_TABLE_NAME!,
      recordId,
      AIRTABLE_PAT!
    );
    res.status(200).json({
      message: `Record ${recordId} successfully deleted.`,
      deletedRecord: result,
    });
  } catch (error: any) {
    console.error('Delete single record error:', error);
    // Determine appropriate status code based on error message
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('API error') || error.message.includes('rate limit')) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to delete record: ${error.message}` });
    }
  }
});

// Endpoint for batch record deletion
// Example: POST /api/records/batch-delete with body: { "recordIds": ["recA", "recB"] }
app.post('/api/records/batch-delete', async (req, res) => {
  const { recordIds } = req.body;

  if (!Array.isArray(recordIds) || recordIds.some(id => typeof id !== 'string')) {
    return res.status(400).json({ error: 'Invalid request body: recordIds must be an array of strings.' });
  }

  if (recordIds.length === 0) {
    return res.status(200).json({ message: 'No record IDs provided for batch deletion.' });
  }

  try {
    const results = await deleteBatchAirtableRecords(
      AIRTABLE_BASE_ID!,
      AIRTABLE_TABLE_NAME!,
      recordIds,
      AIRTABLE_PAT!
    );
    res.status(200).json({
      message: `Batch deletion request processed.`,
      deletedRecords: results,
      // Note: If some records didn't exist, they won't appear in `results`
      // The `results` array only contains records that Airtable confirmed as deleted
    });
  } catch (error: any) {
    console.error('Delete batch records error:', error);
    res.status(500).json({ error: `Failed to perform batch deletion: ${error.message}` });
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
  console.log(`Airtable Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`Airtable Table Name: ${AIRTABLE_TABLE_NAME}`);
  console.log('Service ready to accept requests!');
});