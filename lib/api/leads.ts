import pb from '@/lib/pocketbase';
import type {
  Lead,
  CreateLeadDto,
  UpdateLeadDto,
  Note,
  CreateNoteDto,
  LeadsResponse,
  LeadsListParams,
} from '@/types/lead';

/**
 * Fetch all leads with pagination and filtering
 */
export async function fetchLeads(params: LeadsListParams = {}): Promise<LeadsResponse> {
  const {
    page = 1,
    perPage = 50,
    search = '',
    status,
    tags,
    sort = '-created',
  } = params;

  const filterParts: string[] = [];

  // Search filter (name, phone, or email)
  if (search) {
    filterParts.push(`name ~ "${search}" || phone ~ "${search}" || email ~ "${search}"`);
  }

  // Status filter
  if (status) {
    filterParts.push(`status = "${status}"`);
  }

  // Tags filter (any of the provided tags)
  if (tags && tags.length > 0) {
    const tagFilters = tags.map(tag => `tags ~ "${tag}"`);
    filterParts.push(`(${tagFilters.join(' || ')})`);
  }

  const options: any = { sort };

  // Only add filter if it exists
  if (filterParts.length > 0) {
    options.filter = filterParts.join(' && ');
  }

  const response = await pb.collection('leads').getList<Lead>(page, perPage, options);

  return {
    page: response.page,
    perPage: response.perPage,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
    items: response.items,
  };
}

/**
 * Fetch a single lead by ID
 */
export async function fetchLead(id: string): Promise<Lead> {
  return await pb.collection('leads').getOne<Lead>(id);
}

/**
 * Create a new lead
 */
export async function createLead(data: CreateLeadDto): Promise<Lead> {
  const userId = pb.authStore.model?.id;

  const record = await pb.collection('leads').create<Lead>({
    ...data,
    createdBy: userId,
    status: data.status || 'new',
    score: data.score ?? 0,
    quality: data.quality || 'pending',
    tags: data.tags || [],
  });

  return record;
}

/**
 * Update an existing lead
 */
export async function updateLead(id: string, data: UpdateLeadDto): Promise<Lead> {
  return await pb.collection('leads').update<Lead>(id, data);
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  await pb.collection('leads').delete(id);
}

/**
 * Add a note to a lead
 */
export async function addNote(data: CreateNoteDto): Promise<Note> {
  const userId = pb.authStore.model?.id;

  if (!userId) {
    throw new Error('Oturum açmanız gerekiyor');
  }

  const record = await pb.collection('notes').create<Note>({
    leadId: data.leadId,
    userId: userId,
    content: data.content,
  });

  return record;
}

/**
 * Get notes for a lead
 */
export async function getNotes(leadId: string): Promise<Note[]> {
  const response = await pb.collection('notes').getList<Note>(1, 50, {
    filter: `leadId = "${leadId}"`,
    sort: '-created',
    expand: 'userId',
  });

  return response.items;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  await pb.collection('notes').delete(noteId);
}
