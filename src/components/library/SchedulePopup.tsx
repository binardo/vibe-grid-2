import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ScheduleConfig } from '@/types';

interface SchedulePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ScheduleConfig;
  onSave: (schedule: ScheduleConfig) => void;
  gridName: string;
}

export function SchedulePopup({ open, onOpenChange, schedule, onSave, gridName }: SchedulePopupProps) {
  const [enabled, setEnabled] = useState(schedule?.enabled ?? false);
  const [scheduleType, setScheduleType] = useState<'time' | 'source_data'>(schedule?.type ?? 'time');
  const [frequency, setFrequency] = useState(schedule?.timeConfig?.frequency ?? 'daily');
  const [time, setTime] = useState(schedule?.timeConfig?.time ?? '07:00');
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.timeConfig?.dayOfWeek ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(schedule?.timeConfig?.dayOfMonth ?? 1);
  const [onNewFiling, setOnNewFiling] = useState(schedule?.sourceDataConfig?.onNewFiling ?? false);
  const [onNewEarningsCall, setOnNewEarningsCall] = useState(schedule?.sourceDataConfig?.onNewEarningsCall ?? false);

  const handleSave = () => {
    const config: ScheduleConfig = {
      enabled,
      type: scheduleType,
      timeConfig: scheduleType === 'time' ? {
        frequency: frequency as 'daily' | 'weekly' | 'monthly',
        time,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      } : undefined,
      sourceDataConfig: scheduleType === 'source_data' ? {
        onNewFiling,
        onNewEarningsCall,
      } : undefined,
    };
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border border-white/40">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            Schedule: {gridName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="enabled"
              checked={enabled}
              onCheckedChange={(checked) => setEnabled(checked === true)}
            />
            <Label htmlFor="enabled" className="text-slate-700">Enable scheduled regeneration</Label>
          </div>

          {enabled && (
            <>
              <div className="space-y-3">
                <Label className="text-slate-700">Trigger Type</Label>
                <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as 'time' | 'source_data')}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-based</SelectItem>
                    <SelectItem value="source_data">New Source Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleType === 'time' && (
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-lg">
                  <div className="space-y-3">
                    <Label className="text-slate-700">Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="bg-white/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-700">Time</Label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-white/50"
                    />
                  </div>

                  {frequency === 'weekly' && (
                    <div className="space-y-3">
                      <Label className="text-slate-700">Day of Week</Label>
                      <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                        <SelectTrigger className="bg-white/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {frequency === 'monthly' && (
                    <div className="space-y-3">
                      <Label className="text-slate-700">Day of Month</Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(Number(e.target.value))}
                        className="bg-white/50"
                      />
                    </div>
                  )}
                </div>
              )}

              {scheduleType === 'source_data' && (
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    Only rows for companies with new data will be regenerated.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="newFiling"
                        checked={onNewFiling}
                        onCheckedChange={(checked) => setOnNewFiling(checked === true)}
                      />
                      <Label htmlFor="newFiling" className="text-slate-700">On new filing</Label>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="newEarningsCall"
                        checked={onNewEarningsCall}
                        onCheckedChange={(checked) => setOnNewEarningsCall(checked === true)}
                      />
                      <Label htmlFor="newEarningsCall" className="text-slate-700">On new earnings call</Label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600">
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
