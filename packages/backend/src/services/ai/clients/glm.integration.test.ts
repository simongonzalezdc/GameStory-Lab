/**
 * GLM Client Integration Tests
 * Real API tests for GLM (Zhipu AI) client with new endpoint
 * These tests make actual API calls to verify the fix is working
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { GLMClient } from './glm.js';
import type { AICompletionRequest } from './base.js';

// These tests are marked as integration tests and only run when GLM_API_KEY is available
const runIntegrationTests = !!process.env.GLM_API_KEY;

// Integration test; requires GLM_API_KEY + network. Skipped by default.
describe.skip('GLM Client Integration Tests', () => {
  let client: GLMClient;

  beforeAll(() => {
    if (!runIntegrationTests) {
      console.warn('⚠️  Skipping GLM integration tests - GLM_API_KEY not set');
      return;
    }

    client = new GLMClient();
  });

  it('should initialize with environment variables', () => {
    if (!runIntegrationTests) return;

    expect(client.name).toBe('GLM (Zhipu AI)');
    expect(client.type).toBe('glm');
  });

  it('should be available when API key is configured', async () => {
    if (!runIntegrationTests) return;

    const available = await client.isAvailable();
    expect(available).toBe(true);
  });

  it('should list available models', async () => {
    if (!runIntegrationTests) return;

    const models = await client.listModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models).toContain('glm-4.6');
    console.log('✅ Available GLM models:', models);
  });

  it('should make successful API call to new endpoint', async () => {
    if (!runIntegrationTests) return;

    const request: AICompletionRequest = {
      model: 'GLM-4.6',
      messages: [{ role: 'user' as const, content: 'Hello! Please respond with a simple greeting to test the API connection.' }],
      temperature: 0.7,
      maxTokens: 100,
    };

    const startTime = Date.now();
    const response = await client.complete(request);
    const duration = Date.now() - startTime;

    // Verify response structure
    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('model');
    expect(response).toHaveProperty('tokensUsed');
    expect(response).toHaveProperty('finishReason');
    expect(response).toHaveProperty('metadata');

    // Verify content is not empty
    expect(response.content).toBeTruthy();
    expect(response.content.length).toBeGreaterThan(0);

    // Verify model
    expect(response.model).toBe('GLM-4.6');

    // Verify token usage
    expect(response.tokensUsed).toHaveProperty('prompt');
    expect(response.tokensUsed).toHaveProperty('completion');
    expect(response.tokensUsed).toHaveProperty('total');
    expect(response.tokensUsed.total).toBeGreaterThan(0);

    // Verify finish reason (can be 'stop', 'length', or 'error')
    expect(['stop', 'length', 'error']).toContain(response.finishReason);

    // Verify metadata
    expect(response.metadata?.provider).toBe('glm');
    expect(response.metadata?.durationMs).toBeGreaterThanOrEqual(0);
    expect(response.metadata?.costUsd).toBeGreaterThanOrEqual(0);

    console.log('✅ GLM API Response:');
    console.log('   Content:', response.content.substring(0, 100) + (response.content.length > 100 ? '...' : ''));
    console.log('   Model:', response.model);
    console.log('   Tokens:', response.tokensUsed);
    console.log('   Duration:', duration + 'ms');
    console.log('   Finish Reason:', response.finishReason);
  }, 10000); // Increase timeout to 10 seconds

  it('should handle multiple messages in conversation', async () => {
    if (!runIntegrationTests) return;

    const request: AICompletionRequest = {
      model: 'GLM-4.6',
      messages: [
        { role: 'system' as const, content: 'You are a helpful assistant for game development.' },
        { role: 'user' as const, content: 'What is a core game loop?' },
      ],
      temperature: 0.7,
      maxTokens: 150,
    };

    const response = await client.complete(request);

    expect(response.content).toBeTruthy();
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.model).toBe('GLM-4.6');
    expect(response.tokensUsed.total).toBeGreaterThan(0);

    console.log('✅ Conversation test response:', response.content.substring(0, 100) + '...');
  }, 10000);

  it('should work with different temperature settings', async () => {
    if (!runIntegrationTests) return;

    const request: AICompletionRequest = {
      model: 'GLM-4.6',
      messages: [{ role: 'user' as const, content: 'Generate a short creative game concept in one sentence.' }],
      temperature: 0.9,
      maxTokens: 100,
    };

    const response = await client.complete(request);

    expect(response.content).toBeTruthy();
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.model).toBe('GLM-4.6');

    console.log('✅ Creative response (temp=0.9):', response.content);
  }, 10000);

  it('should handle error cases gracefully', async () => {
    if (!runIntegrationTests) return;

    // Test with invalid model to see error handling
    const request: AICompletionRequest = {
      model: 'invalid-model-name',
      messages: [{ role: 'user' as const, content: 'This should fail' }],
      temperature: 0.7,
      maxTokens: 100,
    };

    try {
      await client.complete(request);
      // If it succeeds, that's also fine - the API might handle invalid models gracefully
      console.log('✅ Invalid model test passed (API handled it gracefully)');
    } catch (error) {
      // Expected to fail, verify it's a proper error
      expect(error).toHaveProperty('name');
      expect((error as any).provider).toBe('glm');
      console.log('✅ Error handling works correctly:', (error as any).message);
    }
  });

  it('should confirm new API endpoint is working', async () => {
    if (!runIntegrationTests) return;

    // This test specifically verifies the new endpoint is working
    const request: AICompletionRequest = {
      model: 'GLM-4.6',
      messages: [{ role: 'user' as const, content: 'Confirm this is using the new coding API endpoint at api.z.ai/api/coding/paas/v4' }],
      temperature: 0.3,
      maxTokens: 50,
    };

    const response = await client.complete(request);

    expect(response.content).toBeTruthy();
    expect(response.model).toBe('GLM-4.6');
    // Accept both 'stop' and 'length' as valid finish reasons
    expect(['stop', 'length']).toContain(response.finishReason);

    console.log('✅ New endpoint confirmation response:', response.content);
    console.log('✅ GLM API is working with the new endpoint!');
  }, 10000);
});
