import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'os';
import { executeProgram } from './create-lucid-app';
import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';


vi.mock('inquirer');
vi.mock('child_process', () => ({
  execSync: vi.fn(), // Prevent actual 'npm install' execution
}));


describe(
  'createLucidApp integration',
  () => {
    let tempDir: string;
    let targetDir: string;

    beforeEach(
      async () => {
        // Create an isolated temporary working directory for each test
        tempDir = await fs.mkdtemp(path.join(tmpdir(), 'lucid-test-'));
        targetDir = path.join(tempDir, 'express-test-app');

        vi.mocked(inquirer.prompt).mockResolvedValue({ type: 'server' });

        // Spy on process.cwd() so resolve(process.cwd(), dirArg) uses the tempDir
        vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
    });

    afterEach(
      async () => {
        vi.restoreAllMocks();
        // Clean up temporary files on disk after each run
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it(
      'scaffolds app on disk and prunes docs and test scopes correctly',
      async () => {
        await executeProgram('express-test-app', {
          withDocs: false,
          withTests: true,
          testScope: ['unit'],
        });

        // 1. Verify package.json changes on disk
        const pkgContent = await fs.readFile(path.join(targetDir, 'package.json'), 'utf-8');
        const pkg = JSON.parse(pkgContent);

        expect(pkg.name).toBe('express-test-app');
        expect(pkg.dependencies['swagger-jsdoc']).toBeUndefined();
        expect(pkg.scripts['test:unit']).toBeDefined();
        expect(pkg.scripts['test:e2e']).toBeUndefined();

        // 2. Verify file system changes
        const files = await fs.readdir(path.join(targetDir, 'src'), { recursive: true });
        
        // Ensure e2e and i9n test files were physically removed
        expect(files.some(f => f.includes('.e2e.test.ts'))).toBe(false);
        expect(files.some(f => f.includes('.i9n.test.ts'))).toBe(false);
    });
});