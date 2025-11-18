# How AI Assistant Changes Music Parameters - Complete Flow

## Overview
The AI assistant **DOES** actually change music parameters. It's not hallucinating. Here's the complete technical flow showing exactly how it works.

---

## Step-by-Step Flow

### 1. User Types Message in Chat
**File**: `src/components/ai/AIChat.tsx` (line 186-194)
- User types message in input field
- Clicks "Send" or presses Enter
- `handleSend()` function is called (line 25)

### 2. Project Context is Gathered
**File**: `src/components/ai/AIChat.tsx` (lines 46-49)
```typescript
const currentScene = projectStore.project?.scenes.find(
  s => s.id === projectStore.currentSceneId
);
```
- Gets the current scene with ALL its data (tracks, clips, BPM, key, etc.)
- This is passed to the AI so it knows what exists

### 3. AI Request is Sent
**File**: `src/components/ai/AIChat.tsx` (lines 52-66)
```typescript
const response = await sendAIMessage(
  config,
  [...messages, { role: 'user', content: userMessage }],
  {
    currentScene,  // ← Full scene data with IDs
    projectSnapshot: { bpm, defaultKey, defaultScale }
  },
  controller.signal
);
```

### 4. AI Client Processes Request
**File**: `src/lib/ai/local-client.ts` (lines 54-82)
- Builds system prompt with project context (including scene/track/clip IDs)
- Sends request to Ollama/OpenRouter/etc.
- Gets response back

### 5. AI Response is Parsed for Actions
**File**: `src/lib/ai/local-client.ts` (lines 84-95)
```typescript
const data = await response.json();
const validated = validateOllamaResponse(data);
const content = validated.content;

const actions = parseActions(content);  // ← Extracts <actions> tags
const message = extractCleanMessage(content);  // ← Removes action tags
```

**File**: `src/lib/ai/intent-parser.ts` (lines 11-24)
```typescript
export function parseActions(content: string): MusicAction[] {
  const match = content.match(/<actions>(.*?)<\/actions>/s);
  if (!match) return [];
  
  const actions = JSON.parse(match[1]);  // ← Parses JSON from <actions> tags
  return actions as MusicAction[];
}
```

**Example AI Response**:
```
I'll slow down the tempo to 90 BPM.
<actions>[{"type":"updateScene","target":"scene-abc-123","params":{"bpm":90}}]</actions>
```

### 6. Actions Are Applied to Project Store
**File**: `src/components/ai/AIChat.tsx` (lines 80-83)
```typescript
const result = applyMusicActions(response.actions, {
  ...projectStore,  // ← Full access to project store methods
  currentSceneId: projectStore.currentSceneId,
});
```

**File**: `src/lib/ai/ai-service.ts` (lines 90-98)
```typescript
case 'updateScene': {
  const sceneId = resolveSceneId(action.target);
  projectStore.updateScene(sceneId, action.params);  // ← CALLS ACTUAL STORE METHOD
  success++;
  break;
}
```

### 7. Project Store Updates State
**File**: `src/stores/project-store.ts` (lines 138-150)
```typescript
updateScene: (sceneId, updates) => {
  const { project } = get();
  if (!project) return;

  const updatedProject = sceneStore.updateScene(project, sceneId, updates);
  
  set({
    project: updatedProject,  // ← STATE IS ACTUALLY UPDATED
    isDirty: true,
  });
  useHistoryStore.getState().push(updatedProject);  // ← Added to undo history
},
```

### 8. React Components Re-render
- `project-store.ts` uses Zustand, which triggers React re-renders
- Components like `SceneEditor.tsx` read from `useProjectStore()`
- UI updates automatically to show new BPM, settings, etc.

### 9. Audio Engine Reloads Scene
**File**: `src/components/scene/SceneEditor.tsx` (lines 23-29)
```typescript
useEffect(() => {
  if (currentScene) {
    audioEngine.loadScene(currentScene).catch((error) => {
      errorHandler.handle(error, 'Scene Loading', ErrorSeverity.ERROR);
    });
  }
}, [currentScene, audioEngine]);
```
- When scene data changes, `useEffect` triggers
- Audio engine reloads the scene with new parameters
- Music playback reflects the changes

---

## What Parameters Can Be Changed?

### Scene Parameters (via `updateScene`)
- `bpm`: Tempo in beats per minute
- `key`: Musical key (C, D, E, etc.)
- `scale`: Scale type (major, minor, etc.)
- `intensityRange`: [min, max] intensity values (0-1)

**Code**: `src/stores/scene-store.ts` (lines 37-62)

### Track Parameters (via `updateTrack`)
- `volume`: Track volume (0-1)
- `pan`: Stereo panning (-1 to 1)
- `muted`: Mute/unmute track
- `solo`: Solo track

**Code**: `src/stores/track-store.ts`

### Clip Parameters (via `updateClip`)
- `muted`: Mute/unmute clip
- `density`: Note density (0-1)
- `probability`: Play probability (0-1)
- `generator`: Generator type and parameters

**Code**: `src/stores/clip-store.ts`

---

## Example: "Make it slower"

### What Happens:
1. AI receives: "make it slower"
2. AI sees current scene has `bpm: 120`
3. AI generates action:
   ```json
   {
     "type": "updateScene",
     "target": "scene-abc-123",
     "params": { "bpm": 90 }
   }
   ```
4. `applyMusicActions()` calls `projectStore.updateScene("scene-abc-123", { bpm: 90 })`
5. Project store updates the scene's BPM to 90
6. `SceneEditor` component re-renders (shows "90 BPM")
7. Audio engine reloads scene with new BPM
8. Music plays at 90 BPM instead of 120

---

## Verification: How to See It Working

### 1. Check Browser Console
Open DevTools (F12) → Console tab. In development mode, you'll see:
```
[AI Actions] [{type: "updateScene", target: "...", params: {...}}]
[AI Action] Applying updateScene to scene-abc-123 {bpm: 90}
[AI Actions] Successfully applied 1 action(s)
```

### 2. Watch the UI
- BPM display changes
- Track mute/solo buttons update
- Volume sliders move
- Scene settings update

### 3. Listen to the Music
- Tempo changes are audible
- Muted tracks stop playing
- Volume changes are audible

### 4. Check Project State
In console, type:
```javascript
useProjectStore.getState().project.scenes[0].bpm
```
You'll see the actual BPM value that was set.

---

## Why Some Actions Fail

Actions fail when:
1. **Wrong IDs**: AI uses `"currentScene"` instead of actual scene ID
2. **Invalid format**: Track target is `"drums"` instead of `"sceneId/trackId"`
3. **Missing parameters**: Action missing required fields
4. **Validation errors**: BPM out of range, invalid key/scale, etc.

**Error messages now show exactly what failed and why.**

---

## The Complete Chain

```
User Message
    ↓
AI Client (Ollama/OpenRouter/etc.)
    ↓
AI Response with <actions> tags
    ↓
parseActions() extracts JSON
    ↓
applyMusicActions() validates and calls store methods
    ↓
projectStore.updateScene/Track/Clip() updates Zustand state
    ↓
React components re-render (SceneEditor, TrackRow, etc.)
    ↓
Audio engine reloads scene with new parameters
    ↓
Music playback reflects changes
```

---

## Conclusion

**The AI assistant DOES change music parameters.** It's not hallucinating. The changes are:
1. ✅ Parsed from AI responses
2. ✅ Validated for correctness
3. ✅ Applied to the project store
4. ✅ Reflected in the UI
5. ✅ Applied to audio playback

The system is fully functional. Some actions may fail due to ID mismatches, but successful actions do change the music in real-time.

