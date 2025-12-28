import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FolderOpen,
  Search,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit,
  FileText,
  FileVideo,
  FileImage,
  FileArchive,
  File,
  FolderPlus,
  Grid3X3,
  List,
  MoreVertical,
  Link2,
  Clock,
  User,
  HardDrive,
  Tag,
  Star,
  StarOff,
  Copy,
  Move,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Types
interface MaterialFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

interface TrainingMaterial {
  id: string;
  name: string;
  type: 'document' | 'video' | 'image' | 'archive' | 'other';
  mimeType: string;
  size: number;
  folderId: string | null;
  programId: string | null;
  programName: string | null;
  description: string;
  tags: string[];
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  downloadCount: number;
  isStarred: boolean;
  isPublic: boolean;
  url: string;
}

// Sample Data
const generateSampleFolders = (): MaterialFolder[] => [
  { id: 'f1', name: '품질관리', parentId: null, createdAt: '2024-01-01', updatedAt: '2024-03-15', itemCount: 15 },
  { id: 'f2', name: '안전교육', parentId: null, createdAt: '2024-01-01', updatedAt: '2024-03-10', itemCount: 23 },
  { id: 'f3', name: '리더십', parentId: null, createdAt: '2024-01-01', updatedAt: '2024-02-28', itemCount: 8 },
  { id: 'f4', name: '신입사원', parentId: null, createdAt: '2024-01-01', updatedAt: '2024-03-01', itemCount: 12 },
  { id: 'f5', name: '법정교육', parentId: null, createdAt: '2024-01-01', updatedAt: '2024-03-20', itemCount: 18 },
  { id: 'f6', name: 'ISO 문서', parentId: 'f1', createdAt: '2024-01-15', updatedAt: '2024-03-15', itemCount: 7 },
  { id: 'f7', name: '작업지침서', parentId: 'f1', createdAt: '2024-01-15', updatedAt: '2024-03-12', itemCount: 8 },
];

const generateSampleMaterials = (): TrainingMaterial[] => {
  const types: TrainingMaterial['type'][] = ['document', 'video', 'image', 'archive', 'other'];
  const mimeTypes: Record<TrainingMaterial['type'], string> = {
    document: 'application/pdf',
    video: 'video/mp4',
    image: 'image/png',
    archive: 'application/zip',
    other: 'application/octet-stream',
  };
  const extensions: Record<TrainingMaterial['type'], string> = {
    document: '.pdf',
    video: '.mp4',
    image: '.png',
    archive: '.zip',
    other: '.bin',
  };

  const materials: TrainingMaterial[] = [];
  const names = [
    '품질관리 기초 교재',
    '안전교육 영상',
    '작업표준서',
    '리더십 워크북',
    '신입사원 오리엔테이션',
    'ISO 9001 가이드',
    '비상대피 훈련 자료',
    '5S 활동 안내서',
    'KPI 관리 매뉴얼',
    '고객응대 가이드',
    '설비점검 체크리스트',
    '환경안전 규정집',
    '품질검사 기준서',
    '개인보호구 착용법',
    '화학물질 취급 안내',
  ];

  const tags = ['필수', 'ISO', '법정', '추천', '신규', '개정'];
  const uploaders = ['김철수', '이영희', '박민수', '정수진', '최동훈'];
  const folderIds = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', null];

  for (let i = 0; i < 30; i++) {
    const type = types[i % types.length];
    const selectedTags = tags.filter(() => Math.random() > 0.7);

    materials.push({
      id: `MAT${String(i + 1).padStart(4, '0')}`,
      name: names[i % names.length] + extensions[type],
      type,
      mimeType: mimeTypes[type],
      size: Math.floor(Math.random() * 50000000) + 100000,
      folderId: folderIds[i % folderIds.length],
      programId: i % 3 === 0 ? `PRG${String((i % 5) + 1).padStart(3, '0')}` : null,
      programName: i % 3 === 0 ? names[i % 5] : null,
      description: '교육용 자료입니다.',
      tags: selectedTags,
      version: `v${Math.floor(i / 10) + 1}.${i % 10}`,
      uploadedBy: uploaders[i % uploaders.length],
      uploadedAt: new Date(2024, Math.floor(i / 10), (i % 28) + 1).toISOString(),
      updatedAt: new Date(2024, Math.floor(i / 10) + 1, (i % 28) + 1).toISOString(),
      downloadCount: Math.floor(Math.random() * 200),
      isStarred: Math.random() > 0.8,
      isPublic: Math.random() > 0.3,
      url: `/materials/MAT${String(i + 1).padStart(4, '0')}`,
    });
  }

  return materials;
};

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
  useTranslation();
  const [folders] = useState<MaterialFolder[]>(generateSampleFolders);
  const [materials, setMaterials] = useState<TrainingMaterial[]>(generateSampleMaterials);
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

  const handleToggleStar = (materialId: string) => {
    setMaterials(prev => prev.map(m =>
      m.id === materialId ? { ...m, isStarred: !m.isStarred } : m
    ));
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

  const handleDeleteSelected = () => {
    setMaterials(prev => prev.filter(m => !selectedItems.includes(m.id)));
    setSelectedItems([]);
  };

  const getBreadcrumbs = () => {
    const breadcrumbs: { id: string | null; name: string }[] = [
      { id: null, name: '모든 자료' }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">교육 자료 관리</h1>
          <p className="text-muted-foreground">
            교육 프로그램 관련 자료를 중앙에서 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            새 폴더
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            파일 업로드
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 파일</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">
              {folders.length}개 폴더
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">저장 용량</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <Progress value={35} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">즐겨찾기</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{starredCount}</div>
            <p className="text-xs text-muted-foreground">
              자주 사용하는 자료
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 업로드</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentUploads}</div>
            <p className="text-xs text-muted-foreground">
              최근 7일간
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="files">파일 탐색</TabsTrigger>
          <TabsTrigger value="starred">즐겨찾기</TabsTrigger>
          <TabsTrigger value="recent">최근 업로드</TabsTrigger>
          <TabsTrigger value="programs">프로그램별</TabsTrigger>
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
                        placeholder="파일명, 태그 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="파일 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 유형</SelectItem>
                      <SelectItem value="document">문서</SelectItem>
                      <SelectItem value="video">동영상</SelectItem>
                      <SelectItem value="image">이미지</SelectItem>
                      <SelectItem value="archive">압축파일</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {selectedItems.length > 0 && (
                    <>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        다운로드 ({selectedItems.length})
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
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
                        {folder.itemCount}개 항목
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
                      <TableHead>파일명</TableHead>
                      <TableHead>크기</TableHead>
                      <TableHead>태그</TableHead>
                      <TableHead>업로더</TableHead>
                      <TableHead>업로드일</TableHead>
                      <TableHead>다운로드</TableHead>
                      <TableHead className="text-right">작업</TableHead>
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
                                  상세보기
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  다운로드
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link2 className="h-4 w-4 mr-2" />
                                  링크 복사
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  수정
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  복사
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Move className="h-4 w-4 mr-2" />
                                  이동
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  공유
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  삭제
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
              <CardTitle>즐겨찾기 자료</CardTitle>
              <CardDescription>자주 사용하는 교육 자료입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>파일명</TableHead>
                    <TableHead>크기</TableHead>
                    <TableHead>업로더</TableHead>
                    <TableHead>업로드일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
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
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
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
              <CardTitle>최근 업로드</CardTitle>
              <CardDescription>최근 7일간 업로드된 자료입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>파일명</TableHead>
                    <TableHead>크기</TableHead>
                    <TableHead>업로더</TableHead>
                    <TableHead>업로드일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
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
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
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
              <CardTitle>프로그램별 자료</CardTitle>
              <CardDescription>교육 프로그램에 연결된 자료입니다</CardDescription>
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
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>파일 업로드</DialogTitle>
            <DialogDescription>
              교육 자료를 업로드합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <Button variant="outline">
                파일 선택
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>폴더 선택</Label>
                <Select defaultValue={currentFolderId ?? 'root'}>
                  <SelectTrigger>
                    <SelectValue placeholder="폴더 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">모든 자료 (루트)</SelectItem>
                    {folders.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>연결 프로그램</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="프로그램 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    <SelectItem value="prg1">품질관리 기초</SelectItem>
                    <SelectItem value="prg2">안전교육 정기</SelectItem>
                    <SelectItem value="prg3">리더십 향상</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>태그</Label>
              <Input placeholder="태그를 쉼표로 구분하여 입력" />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea placeholder="파일에 대한 설명을 입력하세요" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              취소
            </Button>
            <Button onClick={() => setShowUploadDialog(false)}>
              업로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 폴더</DialogTitle>
            <DialogDescription>
              새 폴더를 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>폴더명</Label>
              <Input placeholder="폴더명을 입력하세요" />
            </div>
            <div className="space-y-2">
              <Label>상위 폴더</Label>
              <Select defaultValue={currentFolderId ?? 'root'}>
                <SelectTrigger>
                  <SelectValue placeholder="상위 폴더 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">모든 자료 (루트)</SelectItem>
                  {folders.filter(f => !f.parentId).map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              취소
            </Button>
            <Button onClick={() => setShowNewFolderDialog(false)}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>파일 상세 정보</DialogTitle>
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
                  <Label className="text-muted-foreground">업로더</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedMaterial.uploadedBy}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">업로드일</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedMaterial.uploadedAt.split('T')[0]}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">다운로드 횟수</Label>
                  <p className="mt-1">{selectedMaterial.downloadCount}회</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">공개 여부</Label>
                  <p className="mt-1">{selectedMaterial.isPublic ? '공개' : '비공개'}</p>
                </div>
              </div>

              {selectedMaterial.programName && (
                <div>
                  <Label className="text-muted-foreground">연결 프로그램</Label>
                  <p className="mt-1">{selectedMaterial.programName}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">태그</Label>
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
                <Label className="text-muted-foreground">설명</Label>
                <p className="mt-1 p-3 bg-muted rounded-lg">
                  {selectedMaterial.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              닫기
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              다운로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
