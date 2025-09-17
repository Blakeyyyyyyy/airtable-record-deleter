// src/airtableService.ts

const AIRTABLE_API_BASE_URL = 'https://api.airtable.com/v0';

interface AirtableDeleteResponse {
  id: string;
  deleted: boolean;
}

interface AirtableErrorResponse {
  error: {
    type: string;
    message: string;
  };
}

/**
 * Deletes a single record from Airtable.
 * @param baseId The ID of the Airtable base (e.g., 'appkFjwZcHgh04shT').
 * @param tableName The name of the table (e.g., 'responses').
 * @param recordId The ID of the record to delete (e.g., 'recXXXXXXXXXXXXXX').
 * @param airtablePat Your Airtable Personal Access Token.
 * @returns A promise that resolves with the deleted record's ID and status, or rejects with an error.
 */
export async function deleteSingleAirtableRecord(
  baseId: string,
  tableName: string,
  recordId: string,
  airtablePat: string
): Promise<AirtableDeleteResponse> {
  const url = `${AIRTABLE_API_BASE_URL}/${baseId}/${tableName}/${recordId}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${airtablePat}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle HTTP errors (4xx, 5xx)
    if (!response.ok) {
      const errorData: AirtableErrorResponse = await response.json();
      const errorMessage = errorData.error?.message || 'Unknown Airtable API error';

      if (response.status === 404) {
        throw new Error(`Record with ID "${recordId}" not found in Airtable. Details: ${errorMessage}`);
      } else {
        throw new Error(`Airtable API error (${response.status}): ${errorMessage}`);
      }
    }

    // Parse success response
    const data: AirtableDeleteResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Error deleting record ${recordId}:`, error);
    throw error; // Re-throw to be handled by the caller (Express route)
  }
}

/**
 * Deletes multiple records from Airtable in a batch.
 * @param baseId The ID of the Airtable base.
 * @param tableName The name of the table.
 * @param recordIds An array of record IDs to delete (max 10 per request).
 * @param airtablePat Your Airtable Personal Access Token.
 * @returns A promise that resolves with an array of deleted record IDs and their statuses.
 */
export async function deleteBatchAirtableRecords(
  baseId: string,
  tableName: string,
  recordIds: string[],
  airtablePat: string
): Promise<AirtableDeleteResponse[]> {
  if (recordIds.length === 0) {
    return []; // No records to delete
  }
  if (recordIds.length > 10) {
    console.warn('Airtable batch delete is limited to 10 records per request. Only the first 10 will be processed.');
    recordIds = recordIds.slice(0, 10);
  }

  const queryParams = new URLSearchParams();
  recordIds.forEach(id => queryParams.append('records[]', id));

  const url = `${AIRTABLE_API_BASE_URL}/${baseId}/${tableName}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${airtablePat}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: AirtableErrorResponse = await response.json();
      const errorMessage = errorData.error?.message || 'Unknown Airtable API error';
      throw new Error(`Airtable API error (${response.status}): ${errorMessage}`);
    }

    const data: { records: AirtableDeleteResponse[] } = await response.json();
    return data.records;
  } catch (error) {
    console.error(`Error deleting batch records (${recordIds.join(', ')}):`, error);
    throw error;
  }
}