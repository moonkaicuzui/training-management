/**
 * Material Service Tests
 * materialService.ts 의 Firestore CRUD 로직 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase module
vi.mock('@/services/firebase', () => ({
  db: {},
  doc: vi.fn(() => 'mock-doc-ref'),
  collection: vi.fn(() => 'mock-collection-ref'),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(() => 'mock-query'),
  where: vi.fn(() => 'mock-where'),
  orderBy: vi.fn(() => 'mock-orderBy'),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: class MockTimestamp {
    toDate() {
      return new Date('2024-01-01T00:00:00.000Z');
    }
    static fromDate(d: Date) {
      return { toDate: () => d };
    }
  },
}));

import {
  getMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '@/services/materialService';

import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from '@/services/firebase';

// ============================================================
// Test Data
// ============================================================

const mockMaterialData = {
  id: 'mat-001',
  name: 'Safety Training Guide',
  type: 'document',
  mimeType: 'application/pdf',
  size: 1024000,
  folderId: 'folder-001',
  programId: 'prog-001',
  programName: 'Safety Program',
  description: 'Comprehensive safety training guide',
  tags: ['safety', 'training'],
  version: 'v1.0',
  uploadedBy: 'admin@test.com',
  uploadedAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  downloadCount: 5,
  isStarred: false,
  isPublic: true,
  url: 'https://example.com/file.pdf',
};

const mockFolderData = {
  id: 'folder-001',
  name: 'Safety Documents',
  parentId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  itemCount: 3,
};

const createMockDocSnapshot = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  data: () => data,
  exists: () => exists,
});

const createMockQuerySnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
  })),
  empty: docs.length === 0,
});

// ============================================================
// Tests
// ============================================================

describe('materialService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // Material Read Operations
  // ----------------------------------------------------------

  describe('getMaterials', () => {
    it('필터 없이 모든 자료를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'mat-001', data: mockMaterialData },
        ]) as never
      );

      const result = await getMaterials();

      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-001');
      expect(result[0].name).toBe('Safety Training Guide');
    });

    it('folderId 필터로 자료를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'mat-001', data: mockMaterialData },
        ]) as never
      );

      await getMaterials({ folderId: 'folder-001' });

      expect(where).toHaveBeenCalledWith('folderId', '==', 'folder-001');
    });

    it('type 필터로 클라이언트 사이드 필터링을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'mat-001', data: { ...mockMaterialData, type: 'document' } },
          { id: 'mat-002', data: { ...mockMaterialData, id: 'mat-002', type: 'video' } },
        ]) as never
      );

      const result = await getMaterials({ type: 'document' });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('document');
    });

    it('isStarred 필터로 즐겨찾기 자료만 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'mat-001', data: { ...mockMaterialData, isStarred: true } },
          { id: 'mat-002', data: { ...mockMaterialData, id: 'mat-002', isStarred: false } },
        ]) as never
      );

      const result = await getMaterials({ isStarred: true });

      expect(result).toHaveLength(1);
      expect(result[0].isStarred).toBe(true);
    });

    it('search 필터로 이름 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'mat-001', data: { ...mockMaterialData, name: 'Safety Guide', tags: [] } },
          { id: 'mat-002', data: { ...mockMaterialData, id: 'mat-002', name: 'Quality Manual', tags: [] } },
        ]) as never
      );

      const result = await getMaterials({ search: 'safety' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Safety Guide');
    });

    it('search 필터로 태그 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'mat-001', data: { ...mockMaterialData, name: 'Document A', tags: ['safety'] } },
          { id: 'mat-002', data: { ...mockMaterialData, id: 'mat-002', name: 'Document B', tags: ['quality'] } },
        ]) as never
      );

      const result = await getMaterials({ search: 'quality' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mat-002');
    });

    it('빈 결과를 반환할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await getMaterials();

      expect(result).toHaveLength(0);
    });
  });

  describe('getMaterial', () => {
    it('ID로 자료를 조회한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('mat-001', mockMaterialData) as never
      );

      const result = await getMaterial('mat-001');

      expect(doc).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('mat-001');
      expect(result!.name).toBe('Safety Training Guide');
    });

    it('존재하지 않는 자료는 null을 반환한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('nonexistent', {}, false) as never
      );

      const result = await getMaterial('nonexistent');

      expect(result).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // Material Write Operations
  // ----------------------------------------------------------

  describe('createMaterial', () => {
    it('새 자료를 생성한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const input = {
        id: 'mat-new',
        name: 'New Material',
        type: 'document' as const,
        mimeType: 'application/pdf',
        size: 2048,
        folderId: null,
        programId: null,
        programName: null,
        description: 'A new material',
        tags: ['new'],
        version: 'v1.0',
        uploadedBy: 'user@test.com',
        uploadedAt: '2024-01-01T00:00:00.000Z',
        downloadCount: 0,
        isStarred: false,
        isPublic: false,
        url: 'https://example.com/new.pdf',
      };

      const result = await createMaterial(input);

      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          ...input,
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );
      expect(result.id).toBe('mat-new');
      expect(result.name).toBe('New Material');
      expect(result.updatedAt).toBeTruthy();
    });
  });

  describe('updateMaterial', () => {
    it('자료를 업데이트한다', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateMaterial('mat-001', { name: 'Updated Name' });

      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          name: 'Updated Name',
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );
    });
  });

  describe('deleteMaterial', () => {
    it('자료를 삭제한다', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

      await deleteMaterial('mat-001');

      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });
  });

  // ----------------------------------------------------------
  // Folder Read Operations
  // ----------------------------------------------------------

  describe('getFolders', () => {
    it('모든 폴더를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'folder-001', data: mockFolderData },
        ]) as never
      );

      const result = await getFolders();

      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Safety Documents');
    });

    it('parentId로 필터링하여 폴더를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'folder-002', data: { ...mockFolderData, id: 'folder-002', parentId: 'folder-001' } },
        ]) as never
      );

      await getFolders('folder-001');

      expect(where).toHaveBeenCalledWith('parentId', '==', 'folder-001');
    });

    it('parentId가 null인 경우 최상위 폴더를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'folder-001', data: mockFolderData },
        ]) as never
      );

      await getFolders(null);

      expect(where).toHaveBeenCalledWith('parentId', '==', null);
    });
  });

  // ----------------------------------------------------------
  // Folder Write Operations
  // ----------------------------------------------------------

  describe('createFolder', () => {
    it('새 폴더를 생성한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const input = {
        id: 'folder-new',
        name: 'New Folder',
        parentId: null,
        itemCount: 0,
      };

      const result = await createFolder(input);

      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          ...input,
          createdAt: 'SERVER_TIMESTAMP',
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );
      expect(result.id).toBe('folder-new');
      expect(result.name).toBe('New Folder');
      expect(result.createdAt).toBeTruthy();
      expect(result.updatedAt).toBeTruthy();
    });
  });

  describe('updateFolder', () => {
    it('폴더를 업데이트한다', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateFolder('folder-001', { name: 'Renamed Folder' });

      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          name: 'Renamed Folder',
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );
    });
  });

  describe('deleteFolder', () => {
    it('폴더를 삭제한다', async () => {
      vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

      await deleteFolder('folder-001');

      expect(doc).toHaveBeenCalled();
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });
  });
});
