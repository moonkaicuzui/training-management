export interface TemplateFormData {
  name: string;
  description: string;
  border_style: 'double' | 'solid' | 'ornate';
  border_color: string;
  logo_text: string;
  org_name: string;
  title_text: string;
  is_default: boolean;
}

export const INITIAL_FORM_DATA: TemplateFormData = {
  name: '',
  description: '',
  border_style: 'double',
  border_color: '#1E40AF',
  logo_text: 'Q-TRAIN',
  org_name: 'HWK Vietnam QIP Team',
  title_text: 'Certificate of Completion',
  is_default: false,
};
