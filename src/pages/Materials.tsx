import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrainingMaterial, MaterialFolder } from '@/types/material';
import * as api from '@/services/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  FolderOpen,
  Upload,
  FileText,
  FolderPlus,
  Clock,
  HardDrive,
  Star,
} from 'lucide-react';

import { formatFileSize } from '@/components/materials/materialUtils';
import { MaterialsToolbar } from '@/components/materials/MaterialsToolbar';
import { MaterialTable, MaterialSimpleTable, MaterialProgramsView } from '@/components/materials/MaterialTable';
import { MaterialUploadDialog, NewFolderDialog } from '@/components/materials/MaterialUploadDialog';
import { MaterialDetailDialog } from '@/components/materials/MaterialDetailDialog';

export default function Materials() {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [foldersData, materialsData] = await Promise.all([
        api.getFolders(),
        api.getMaterials(),
      ]);
      setFolders(foldersData);
      setMaterials(materialsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('files');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<TrainingMaterial | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);

  // Get current folder's children
  const childFolders = folders.filter(f => f.parentId === currentFolderId);

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || m.type === selectedType;
    const matchesFolder = m.folderId === currentFolderId;
    return matchesSearch && matchesType && matchesFolder;
  });

  // Calculate statistics
  const totalSize = materials.reduce((sum, m) => sum + m.size, 0);
  const totalFiles = materials.length;
  const starredCount = materials.filter(m => m.isStarred).length;
  const recentUploads = materials.filter(m => {
    const uploadDate = new Date(m.uploadedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return uploadDate >= weekAgo;
  }).length;

  const handleToggleStar = async (materialId: string) => {
    try {
      const material = materials.find(m => m.id === materialId);
      if (!material) return;
      await api.updateMaterial(materialId, { isStarred: !material.isStarred });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.updateFailed'));
    }
  };

  const handleSelectItem = (materialId: string) => {
    setSelectedItems(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredMaterials.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredMaterials.map(m => m.id));
    }
  };

  const handleViewDetails = (material: TrainingMaterial) => {
    setSelectedMaterial(material);
    setShowDetailDialog(true);
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedItems.map(id => api.deleteMaterial(id)));
      setSelectedItems([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.deleteFailed'));
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await api.deleteMaterial(materialId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.deleteFailed'));
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder({
        id: `f-${Date.now()}`,
        name: newFolderName.trim(),
        parentId: newFolderParentId,
        itemCount: 0,
      });
      setShowNewFolderDialog(false);
      setNewFolderName('');
      setNewFolderParentId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errors.saveFailed'));
    }
  };

  const getBreadcrumbs = () => {
    const breadcrumbs: { id: string | null; name: string }[] = [
      { id: null, name: t('materials.allFiles') }
    ];
    if (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (folder) {
        if (folder.parentId) {
          const parent = folders.find(f => f.id === folder.parentId);
          if (parent) breadcrumbs.push({ id: parent.id, name: parent.name });
        }
        breadcrumbs.push({ id: folder.id, name: folder.name });
      }
    }
    return breadcrumbs;
  };

  // Starred and recent materials
  const starredMaterials = materials.filter(m => m.isStarred);
  const recentMaterials = [...materials]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('materials.title')}</h1>
          <p className="text-muted-foreground">{t('materials.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            setNewFolderParentId(currentFolderId);
            setShowNewFolderDialog(true);
          }}>
            <FolderPlus className="mr-2 h-4 w-4" />
            {t('materials.newFolder')}
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('materials.uploadFile')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('materials.totalFiles')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              {t('materials.folderCount', { count: folders.length })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('materials.storageUsed')}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <Progress value={35} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('materials.favorites')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{starredCount}</div>
            <p className="text-xs text-muted-foreground">{t('materials.favoritesDesc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('materials.recentUploads')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUploads}</div>
            <p className="text-xs text-muted-foreground">{t('materials.recentUploadsDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="files">{t('materials.tabBrowse')}</TabsTrigger>
          <TabsTrigger value="starred">{t('materials.tabFavorites')}</TabsTrigger>
          <TabsTrigger value="recent">{t('materials.tabRecent')}</TabsTrigger>
          <TabsTrigger value="programs">{t('materials.tabPrograms')}</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm">
            {getBreadcrumbs().map((bc, idx) => (
              <div key={bc.id ?? 'root'} className="flex items-center gap-2">
                {idx > 0 && <span className="text-muted-foreground">/</span>}
                <button
                  className={`hover:text-primary ${
                    idx === getBreadcrumbs().length - 1 ? 'font-medium' : 'text-muted-foreground'
                  }`}
                  onClick={() => setCurrentFolderId(bc.id)}
                >
                  {bc.name}
                </button>
              </div>
            ))}
          </div>

          <MaterialsToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedItemsCount={selectedItems.length}
            onDeleteSelected={handleDeleteSelected}
          />

          {/* Folders */}
          {childFolders.length > 0 && (
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
              {childFolders.map(folder => (
                <Card
                  key={folder.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <FolderOpen className="h-12 w-12 text-yellow-500 mb-2" />
                      <p className="font-medium truncate w-full">{folder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('materials.folderItems', { count: folder.itemCount })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <MaterialTable
            materials={filteredMaterials}
            selectedItems={selectedItems}
            viewMode={viewMode}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onToggleStar={handleToggleStar}
            onViewDetails={handleViewDetails}
            onDeleteMaterial={handleDeleteMaterial}
          />
        </TabsContent>

        <TabsContent value="starred" className="space-y-4">
          <MaterialSimpleTable
            materials={starredMaterials}
            onViewDetails={handleViewDetails}
            title={t('materials.starredTitle')}
            description={t('materials.starredDesc')}
          />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <MaterialSimpleTable
            materials={recentMaterials}
            onViewDetails={handleViewDetails}
            title={t('materials.recentTitle')}
            description={t('materials.recentDesc')}
          />
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <MaterialProgramsView
            materials={materials}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MaterialUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />

      <NewFolderDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        folderName={newFolderName}
        onFolderNameChange={setNewFolderName}
        parentFolderId={newFolderParentId}
        onParentFolderChange={setNewFolderParentId}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onClose={() => {
          setShowNewFolderDialog(false);
          setNewFolderName('');
          setNewFolderParentId(null);
        }}
      />

      <MaterialDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        material={selectedMaterial}
      />
    </div>
  );
}
