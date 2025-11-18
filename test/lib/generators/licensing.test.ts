import { describe, it, expect } from 'vitest';
import {
  POPULAR_LICENSES,
  generateLicenseText,
  compareLicenses,
  getAllLicenses,
} from '@/lib/generators/licensing';

describe('Licensing Generator', () => {
  describe('POPULAR_LICENSES', () => {
    it('should have all required licenses', () => {
      const requiredLicenses = ['mit', 'apache2', 'gpl3', 'agpl3', 'bsd3', 'lgpl3', 'mpl2', 'unlicense'];

      requiredLicenses.forEach((id) => {
        expect(POPULAR_LICENSES[id]).toBeDefined();
        expect(POPULAR_LICENSES[id].name).toBeTruthy();
        expect(POPULAR_LICENSES[id].spdxId).toBeTruthy();
      });
    });

    it('should have correct license categories', () => {
      expect(POPULAR_LICENSES.mit.category).toBe('permissive');
      expect(POPULAR_LICENSES.apache2.category).toBe('permissive');
      expect(POPULAR_LICENSES.gpl3.category).toBe('copyleft');
      expect(POPULAR_LICENSES.agpl3.category).toBe('copyleft');
    });

    it('should have permissions, conditions, and limitations', () => {
      Object.values(POPULAR_LICENSES).forEach((license) => {
        expect(Array.isArray(license.permissions)).toBe(true);
        expect(Array.isArray(license.conditions)).toBe(true);
        expect(Array.isArray(license.limitations)).toBe(true);
        expect(license.permissions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateLicenseText', () => {
    it('should generate MIT license text', () => {
      const text = generateLicenseText('mit', 'TestProject', 'John Doe', 2025);

      expect(text).toContain('MIT License');
      expect(text).toContain('Copyright (c) 2025 John Doe');
      expect(text).toContain('Permission is hereby granted');
    });

    it('should generate Apache 2.0 license text', () => {
      const text = generateLicenseText('apache2', 'TestProject', 'Jane Doe', 2025);

      expect(text).toContain('Apache License');
      expect(text).toContain('Copyright 2025 Jane Doe');
      expect(text).toContain('Version 2.0');
    });

    it('should use current year by default', () => {
      const currentYear = new Date().getFullYear();
      const text = generateLicenseText('mit', 'TestProject', 'John Doe');

      expect(text).toContain(`Copyright (c) ${currentYear} John Doe`);
    });

    it('should handle GPL licenses with instructions', () => {
      const text = generateLicenseText('gpl3', 'TestProject', 'Free Software Foundation', 2025);

      expect(text).toContain('GNU General Public License');
      expect(text).toContain('https://www.gnu.org/licenses/gpl-3.0.txt');
    });
  });

  describe('compareLicenses', () => {
    it('should compare multiple licenses', () => {
      const comparison = compareLicenses(['mit', 'apache2', 'gpl3']);

      expect(comparison.licenses).toHaveLength(3);
      expect(comparison.comparison.permissions).toBeDefined();
      expect(comparison.comparison.conditions).toBeDefined();
      expect(comparison.comparison.limitations).toBeDefined();
      expect(comparison.summary).toContain('Comparing 3 licenses');
    });

    it('should identify permissive vs copyleft licenses', () => {
      const comparison = compareLicenses(['mit', 'gpl3']);

      expect(comparison.summary).toContain('Permissive licenses');
      expect(comparison.summary).toContain('Copyleft licenses');
    });

    it('should map permissions to licenses', () => {
      const comparison = compareLicenses(['mit', 'apache2']);

      expect(comparison.comparison.permissions['Commercial use']).toBeDefined();
      expect(comparison.comparison.permissions['Commercial use'].length).toBeGreaterThan(0);
    });
  });

  describe('getAllLicenses', () => {
    it('should return all available licenses', () => {
      const licenses = getAllLicenses();

      expect(Array.isArray(licenses)).toBe(true);
      expect(licenses.length).toBeGreaterThan(0);

      licenses.forEach((license) => {
        expect(license.id).toBeTruthy();
        expect(license.name).toBeTruthy();
        expect(license.category).toBeTruthy();
      });
    });

    it('should return at least 8 popular licenses', () => {
      const licenses = getAllLicenses();
      expect(licenses.length).toBeGreaterThanOrEqual(8);
    });
  });
});
