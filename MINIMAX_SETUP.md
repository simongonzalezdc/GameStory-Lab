# Minimax M2 API Setup Guide (Anthropic-Compatible)

## Overview
This project uses **Minimax M2** via the **Anthropic-compatible API**. All AI features use Minimax M2 as the primary provider.

## Required Environment Variables

Add this to your `.env` file:

```env
# Minimax M2 API Configuration (Primary AI Provider)
# Uses Anthropic-compatible API endpoint
MINIMAX_API_KEY=your-minimax-api-key-here
```

**Note**: GroupId is **NOT required** for the Anthropic-compatible API endpoint.

## Getting Your Minimax API Key

1. **Sign up/Login**: Go to [Minimax Platform](https://platform.minimax.io)
2. **Get API Key**: Navigate to API Keys section and create a new key
3. **Model**: The system uses `MiniMax-M2` (Anthropic-compatible format) by default

## API Configuration

### Endpoint
- **International**: `https://api.minimax.io/anthropic`
- **China**: `https://api.minimaxi.com/anthropic` (set via `MINIMAX_API_BASE_URL` environment variable)
- **API Path**: `/messages` (appended to base URL)

### Authentication
- Uses `x-api-key` header (Anthropic-compatible format)
- Requires `anthropic-version: 2023-06-01` header
- **No GroupId required** (unlike standard Minimax API)
- **No Bearer token** (uses `x-api-key` instead)

### Models
- `MiniMax-M2` - Agentic capabilities, Advanced reasoning (default)
- `MiniMax-M2-Stable` - High concurrency and commercial use

### Request Format
- Uses Anthropic Messages API format
- System prompt separated from messages array
- Content must be array format: `[{type: "text", text: "..."}]`

## What Changed

### ✅ Completed Changes

1. **Minimax Client**: Updated `packages/backend/src/services/ai/clients/minimax.ts`
   - Uses Anthropic-compatible API endpoint
   - Request format: Anthropic message format (content as array)
   - Response format: Anthropic format (content blocks with thinking/text)
   - Model: `MiniMax-M2` (Anthropic-compatible format)
   - No GroupId required

2. **Orchestrator Updated**: 
   - Minimax is primary provider (auto-selected)
   - GLM is fallback if Minimax unavailable
   - Ollama is fallback if neither cloud provider available

3. **Prompts Optimized**: All prompts updated for Minimax M2:
   - `mechanics.ts` - Game mechanics generation
   - `lore.ts` - Narrative and worldbuilding
   - `title.ts` - Title generation
   - `refinement.ts` - Concept refinement

4. **Environment Schema**: Updated to use `MINIMAX_API_KEY` only (GroupId removed)

## Testing the Setup

1. **Add API key to `.env`**:
   ```env
   MINIMAX_API_KEY=your-key-here
   ```

2. **Restart backend server**:
   ```bash
   cd packages/backend
   npm run dev
   ```

3. **Check logs**: You should see:
   ```
   Minimax M2 client initialized (primary AI provider, Anthropic-compatible API)
   ```

4. **Test AI features**:
   - Create a new project
   - Generate mechanics/lore
   - Use the AI assistant
   - All should use Minimax M2

## Troubleshooting

### "Minimax API key is required"
- Make sure `MINIMAX_API_KEY` is set in `.env`
- Restart the backend server after adding the key

### API calls failing
- Verify your API key is valid and has credits
- Check backend logs for detailed error messages
- Ensure you're using the correct endpoint (international vs China)
- Verify the endpoint is `/anthropic` (not `/v1` which is for OpenAI-compatible API)
- Check that `x-api-key` header is being sent (not `Authorization: Bearer`)

### Fallback to GLM/Ollama
- If Minimax fails, the system will automatically try GLM (if configured)
- Then fallback to Ollama (if running locally)
- Check logs to see which provider is being used

## API Format Details

### Request Format (Anthropic-compatible)
**Endpoint**: `POST https://api.minimax.io/anthropic/messages`

**Headers**:
```
x-api-key: YOUR_API_KEY
anthropic-version: 2023-06-01
Content-Type: application/json
```

**Request Body**:
```json
{
  "model": "MiniMax-M2",
  "messages": [
    {
      "role": "user",
      "content": [{"type": "text", "text": "Hello"}]
    }
  ],
  "system": "You are a helpful assistant.",
  "max_tokens": 2000,
  "temperature": 1.0
}
```

**Important Notes**:
- `temperature` range: (0.0, 1.0] - values outside this range will return an error
- Default `temperature` is 1.0 (recommended by Anthropic)
- `max_tokens` is required

### Response Format (Anthropic-compatible)
```json
{
  "id": "...",
  "type": "message",
  "role": "assistant",
  "content": [
    {"type": "thinking", "thinking": "..."},
    {"type": "text", "text": "..."}
  ],
  "model": "MiniMax-M2",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50
  }
}
```

## Migration Notes

- **GLM still supported**: GLM client remains as fallback option
- **No breaking changes**: Existing projects continue to work
- **Prompts optimized**: All prompts specifically tuned for Minimax M2's capabilities
- **Cost tracking**: Minimax pricing estimates included in cost tracking
- **GroupId removed**: No longer needed for Anthropic-compatible API
- **Different from OpenAI-compatible API**: This uses `/anthropic` endpoint, not `/v1` endpoint

## Key Differences from Standard Minimax API

1. **Endpoint**: Uses `/anthropic` path instead of `/v1/text/chatcompletion_v2`
2. **Authentication**: Uses `x-api-key` header instead of `Authorization: Bearer`
3. **No GroupId**: GroupId is not required (unlike standard Minimax API)
4. **Request Format**: Uses Anthropic Messages API format (content as array)
5. **Response Format**: Returns Anthropic-style response with content blocks

## Next Steps

1. ✅ Add `MINIMAX_API_KEY` to `.env`
2. ✅ Restart backend server
3. ✅ Test AI generation features
4. ✅ Verify Minimax is being used (check logs)
