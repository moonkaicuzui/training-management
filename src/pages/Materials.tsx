import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TrainingMaterial, MaterialFolder } from '@/types/material';
import * as api from '@/services/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FolderOpen,
  Search,
  Upload,
  Eye,
  Trash2,
  FileText,
  FileVideo,
  FileImage,
  FileArchive,
  File,
  FolderPlus,
  Grid3X3,
  List,
  MoreVertical,
  Clock,
  User,
  HardDrive,
  Tag,
  Star,
  StarOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: TrainingMaterial['type']) => {
  const icons = {
    document: FileText,
    video: FileVideo,
    image: FileImage,
    archive: FileArchive,
    other: File,
  };
  return icons[type];
};

const getFileIconColor = (type: TrainingMaterial['type']) => {
  const colors = {
    document: 'text-blue-500',
    video: 'text-red-500',
    image: 'text-green-500',
    archive: 'text-yellow-500',
    other: 'text-gray-500',
  };
  return colors[type];
};

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
      setError(err instanceof Error ? err.message : 'Failed to load data');
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
      setError(err instanceof Error ? err.message : 'Failed to toggle star');
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
      setError(err instanceof Error ? err.message : 'Failed to delete materials');
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
      setError(err instanceof Error ? err.message : 'Failed to create folder');
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
          if (parent) {
            breadcrumbs.push({ id: parent.id, name: parent.name });
          }
        }
        breadcrumbs.push({ id: folder.id, name: folder.name });
      }
    }

    return breadcrumbs;
  };

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
          <p className="text-muted-foreground">
            {t('materials.description')}
          </p>
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
            <p className="text-xs text-muted-foreground">
              {t('materials.favoritesDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('materials.recentUploads')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUploads}</div>
            <p className="text-xs text-muted-foreground">
              {t('materials.recentUploadsDesc')}
            </p>
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

        {/* Files Tab */}
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

          {/* Toolbar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 flex-1">
                  <div className="flex-1 min-w-[200px] max-w-md">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('materials.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder={t('materials.allTypes')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('materials.allTypes')}</SelectItem>
                      <SelectItem value="document">{t('materials.typeDocument')}</SelectItem>
                      <SelectItem value="video">{t('materials.typeVideo')}</SelectItem>
                      <SelectItem value="image">{t('materials.typeImage')}</SelectItem>
                      <SelectItem value="archive">{t('materials.typeArchive')}</SelectItem>
                      <SelectItem value="other">{t('materials.typeOther')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {selectedItems.length > 0 && (
                    <>
                      <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.delete')}
                      </Button>
                    </>
                  )}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Files List/Grid */}
          {viewMode === 'list' ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <Checkbox
                          checked={selectedItems.length === filteredMaterials.length && filteredMaterials.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>{t('materials.colFileName')}</TableHead>
                      <TableHead>{t('materials.colSize')}</TableHead>
                      <TableHead>{t('materials.colTags')}</TableHead>
                      <TableHead>{t('materials.colUploader')}</TableHead>
                      <TableHead>{t('materials.colUploadDate')}</TableHead>
                      <TableHead>{t('materials.colDownloads')}</TableHead>
                      <TableHead className="text-right">{t('materials.colActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => {
                      const FileIcon = getFileIcon(material.type);
                      return (
                        <TableRow key={material.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.includes(material.id)}
                              onCheckedChange={() => handleSelectItem(material.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <button onClick={() => handleToggleStar(material.id)}>
                              {material.isStarred ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4 text-muted-foreground hover:text-yellow-400" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileIcon className={`h-5 w-5 ${getFileIconColor(material.type)}`} />
                              <div>
                                <p className="font-medium">{material.name}</p>
                                <p className="text-xs text-muted-foreground">{material.version}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(material.size)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {material.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {material.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{material.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{material.uploadedBy}</TableCell>
                          <TableCell>{material.uploadedAt.split('T')[0]}</TableCell>
                          <TableCell>{material.downloadCount}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(material)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('materials.menuDetail')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={async () => {
                                    try {
                                      await api.deleteMaterial(material.id);
                                      await loadData();
                                    } catch (err) {
                                      setError(err instanceof Error ? err.message : 'Failed to delete material');
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('materials.menuDelete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredMaterials.map((material) => {
                const FileIcon = getFileIcon(material.type);
                return (
                  <Card
                    key={material.id}
                    className={`cursor-pointer transition-colors ${
                      selectedItems.includes(material.id) ? 'border-primary' : 'hover:border-primary/50'
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative w-full mb-4">
                          <button
                            className="absolute top-0 left-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectItem(material.id);
                            }}
                          >
                            <Checkbox checked={selectedItems.includes(material.id)} />
                          </button>
                          <button
                            className="absolute top-0 right-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(material.id);
                            }}
                          >
                            {material.isStarred ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground hover:text-yellow-400" />
                            )}
                          </button>
                          <FileIcon className={`h-16 w-16 mx-auto ${getFileIconColor(material.type)}`} />
                        </div>
                        <p className="font-medium truncate w-full" title={material.name}>
                          {material.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(material.size)}
                        </p>
                        <div className="flex gap-1 mt-2 flex-wrap justify-center">
                          {material.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Starred Tab */}
        <TabsContent value="starred" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('materials.starredTitle')}</CardTitle>
              <CardDescription>{t('materials.starredDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('materials.colFileName')}</TableHead>
                    <TableHead>{t('materials.colSize')}</TableHead>
                    <TableHead>{t('materials.colUploader')}</TableHead>
                    <TableHead>{t('materials.colUploadDate')}</TableHead>
                    <TableHead className="text-right">{t('materials.colActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.filter(m => m.isStarred).map((material) => {
                    const FileIcon = getFileIcon(material.type);
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileIcon className={`h-5 w-5 ${getFileIconColor(material.type)}`} />
                            <span className="font-medium">{material.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatFileSize(material.size)}</TableCell>
                        <TableCell>{material.uploadedBy}</TableCell>
                        <TableCell>{material.uploadedAt.split('T')[0]}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(material)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('materials.recentTitle')}</CardTitle>
              <CardDescription>{t('materials.recentDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('materials.colFileName')}</TableHead>
                    <TableHead>{t('materials.colSize')}</TableHead>
                    <TableHead>{t('materials.colUploader')}</TableHead>
                    <TableHead>{t('materials.colUploadDate')}</TableHead>
                    <TableHead className="text-right">{t('materials.colActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials
                    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                    .slice(0, 10)
                    .map((material) => {
                      const FileIcon = getFileIcon(material.type);
                      return (
                        <TableRow key={material.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileIcon className={`h-5 w-5 ${getFileIconColor(material.type)}`} />
                              <span className="font-medium">{material.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(material.size)}</TableCell>
                          <TableCell>{material.uploadedBy}</TableCell>
                          <TableCell>{material.uploadedAt.split('T')[0]}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(material)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('materials.programsTitle')}</CardTitle>
              <CardDescription>{t('materials.programsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from(new Set(materials.filter(m => m.programName).map(m => m.programName))).map(programName => (
                  <div key={programName} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">{programName}</h3>
                    <div className="space-y-2">
                      {materials.filter(m => m.programName === programName).map((material) => {
                        const FileIcon = getFileIcon(material.type);
                        return (
                          <div key={material.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <FileIcon className={`h-5 w-5 ${getFileIconColor(material.type)}`} />
                              <span>{material.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatFileSize(material.size)}
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(material)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('materials.uploadTitle')}</DialogTitle>
            <DialogDescription>
              {t('materials.uploadDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('materials.newFolderTitle')}</DialogTitle>
            <DialogDescription>
              {t('materials.newFolderDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('materials.folderName')}</Label>
              <Input
                placeholder={t('materials.folderNamePlaceholder')}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('materials.parentFolder')}</Label>
              <Select
                value={newFolderParentId ?? 'root'}
                onValueChange={(val) => setNewFolderParentId(val === 'root' ? null : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('materials.selectParentFolder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">{t('materials.rootFolder')}</SelectItem>
                  {folders.filter(f => !f.parentId).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowNewFolderDialog(false);
              setNewFolderName('');
              setNewFolderParentId(null);
            }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              {t('materials.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('materials.detailTitle')}</DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {(() => {
                  const FileIcon = getFileIcon(selectedMaterial.type);
                  return <FileIcon className={`h-12 w-12 ${getFileIconColor(selectedMaterial.type)}`} />;
                })()}
                <div>
                  <h3 className="font-medium text-lg">{selectedMaterial.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedMaterial.version} · {formatFileSize(selectedMaterial.size)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">{t('materials.detailUploader')}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedMaterial.uploadedBy}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('materials.detailUploadDate')}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedMaterial.uploadedAt.split('T')[0]}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('materials.detailDownloadCount')}</Label>
                  <p className="mt-1">{t('materials.detailDownloadUnit', { count: selectedMaterial.downloadCount })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('materials.detailVisibility')}</Label>
                  <p className="mt-1">{selectedMaterial.isPublic ? t('materials.detailPublic') : t('materials.detailPrivate')}</p>
                </div>
              </div>

              {selectedMaterial.programName && (
                <div>
                  <Label className="text-muted-foreground">{t('materials.detailLinkedProgram')}</Label>
                  <p className="mt-1">{selectedMaterial.programName}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">{t('materials.detailTags')}</Label>
                <div className="flex gap-2 mt-2">
                  {selectedMaterial.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">{t('materials.detailDescription')}</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">
                  {selectedMaterial.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
