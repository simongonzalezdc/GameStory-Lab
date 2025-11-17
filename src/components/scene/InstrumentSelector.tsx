/**
 * Instrument selector component for choosing instrument presets
 */

import { useProjectStore } from '@/stores/project-store';
import { INSTRUMENT_PRESETS, getDefaultInstrument } from '@/lib/audio/instruments';
import { Select } from '../ui/Select';
import type { TrackRole } from '@/types';

interface InstrumentSelectorProps {
  sceneId: string;
  trackId: string;
  role: TrackRole;
  currentInstrumentRef: string;
}

export default function InstrumentSelector({
  sceneId,
  trackId,
  role,
  currentInstrumentRef,
}: InstrumentSelectorProps) {
  const { updateTrack } = useProjectStore();
  const presets = INSTRUMENT_PRESETS[role] || INSTRUMENT_PRESETS.other;

  const handleInstrumentChange = (presetName: string) => {
    updateTrack(sceneId, trackId, {
      instrumentRef: presetName,
    });
  };

  const options = presets.map((preset) => ({
    value: preset.name,
    label: `${preset.name} - ${preset.description}`,
  }));

  // Add default option if current instrument is not in presets
  const hasCurrentPreset = presets.some((p) => p.name === currentInstrumentRef);
  if (!hasCurrentPreset && currentInstrumentRef) {
    options.unshift({
      value: currentInstrumentRef,
      label: `${currentInstrumentRef} (current)`,
    });
  }

  return (
    <Select
      label="Instrument"
      value={currentInstrumentRef || getDefaultInstrument(role).name}
      onValueChange={handleInstrumentChange}
      options={options}
    />
  );
}

