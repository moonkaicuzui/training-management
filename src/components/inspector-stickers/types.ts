import type { InspectorSticker } from '@/types/inspectorSticker';
import type { Employee } from '@/types';

export interface FormState {
  sticker_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  building: string;
  line: string;
  notes: string;
}

export const EMPTY_FORM: FormState = {
  sticker_id: '',
  employee_id: '',
  employee_name: '',
  department: '',
  building: '',
  line: '',
  notes: '',
};

export interface StickerTableProps {
  stickers: InspectorSticker[];
  isLoading: boolean;
  search: string;
  onEdit: (sticker: InspectorSticker) => void;
  onDelete: (sticker: InspectorSticker) => void;
  onToggleStatus: (sticker: InspectorSticker) => void;
}

export interface StickerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export interface StickerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSticker: InspectorSticker | null;
  form: FormState;
  onFormChange: React.Dispatch<React.SetStateAction<FormState>>;
  employees: Employee[];
  isSaving: boolean;
  onSave: () => void;
}

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteTarget: InspectorSticker | null;
  isSaving: boolean;
  onDelete: () => void;
}
