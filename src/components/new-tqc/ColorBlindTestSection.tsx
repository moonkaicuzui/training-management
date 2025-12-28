import { useState } from 'react';
import { Eye, EyeOff, Plus, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColorBlindBadge } from './TraineeStatusBadge';
import type { NewTQCColorBlindTest, NewTQCColorBlindTestInput } from '@/types/newTqc';
import { format } from 'date-fns';

interface ColorBlindTestSectionProps {
  traineeId: string;
  traineeName: string;
  currentStatus: 'PASS' | 'FAIL' | null;
  tests: NewTQCColorBlindTest[];
  onAddTest: (input: NewTQCColorBlindTestInput) => Promise<void>;
}

export function ColorBlindTestSection({
  traineeId,
  traineeName,
  currentStatus,
  tests,
  onAddTest,
}: ColorBlindTestSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<{
    result: 'PASS' | 'FAIL';
    notes: string;
  }>({
    result: 'PASS',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onAddTest({
        trainee_id: traineeId,
        test_date: new Date().toISOString().split('T')[0],
        result: formData.result,
        notes: formData.notes || undefined,
      });
      setDialogOpen(false);
      setFormData({ result: 'PASS', notes: '' });
    } finally {
      setSaving(false);
    }
  };

  // Sort tests by date (newest first)
  const sortedTests = [...tests].sort(
    (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Color Blind 검사</CardTitle>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              검사 등록
            </Button>
          </div>
          <CardDescription>
            {traineeName}의 색맹 검사 이력입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Status */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">현재 상태:</span>
            <ColorBlindBadge result={currentStatus} />
          </div>

          {/* Test History */}
          {sortedTests.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">검사 이력</h4>
              <div className="space-y-2">
                {sortedTests.map((test) => (
                  <div
                    key={test.test_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <ColorBlindBadge result={test.result} />
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(test.test_date), 'yyyy-MM-dd')}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        {test.tested_by}
                      </div>
                    </div>
                    {test.notes && (
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {test.notes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>검사 이력이 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Test Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Color Blind 검사 등록</DialogTitle>
            <DialogDescription>
              {traineeName}의 색맹 검사 결과를 등록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>검사 결과</Label>
              <Select
                value={formData.result}
                onValueChange={(value: 'PASS' | 'FAIL') =>
                  setFormData((prev) => ({ ...prev, result: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASS">정상 (PASS)</SelectItem>
                  <SelectItem value="FAIL">색맹 (FAIL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>비고 (선택)</Label>
              <Textarea
                placeholder="특이사항을 입력하세요"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? '저장 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
