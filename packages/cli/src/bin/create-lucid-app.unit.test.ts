import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { createLucidApp, executeProgram } from './create-lucid-app';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';


vi.mock('fs/promises');
vi.mock('child_process');
vi.mock('inquirer');


describe(
  'createLucidApp command & execution',
  () => {
    const mockPkgJson = {
      name: '@lucidjs/server-template',
      scripts: { 'test:unit': 'vitest', 'test:e2e': 'playwright' },
      dependencies: { 'swagger-jsdoc': '1.0.0' },
      devDependencies: { vitest: '1.0.0', '@playwright/test': '1.0.0' },
    };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(inquirer.prompt).mockResolvedValue({ type: 'server' });
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockPkgJson));
      vi.mocked(fs.cp).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    });

    it(
      'registers the init command on the Commander instance',
      () => {
        const program = new Command();
        createLucidApp(program);

        const initCmd = program.commands.find(cmd => cmd.name() === 'init');
        expect(initCmd).toBeDefined();
        expect(initCmd?.description()).toBe('Initialize a new Lucid.js app');
    });

    it(
      'prunes swagger dependencies when withDocs is false',
      async () => {
        await executeProgram('express-app', { withDocs: false, withTests: true });

        const writtenPkg = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
        expect(writtenPkg.name).toBe('express-app');
        expect(writtenPkg.dependencies['swagger-jsdoc']).toBeUndefined();
    });

    it(
      'prunes test scripts and packages when unit tests are excluded',
      async () => {
        await executeProgram('express-app', {
          withTests: true,
          testScope: ['e2e'],
        });

        const writtenPkg = JSON.parse(vi.mocked(fs.writeFile).mock.calls[0][1] as string);
        expect(writtenPkg.scripts['test:unit']).toBeUndefined();
        expect(writtenPkg.devDependencies['vitest']).toBeUndefined();
        expect(writtenPkg.scripts['test:e2e']).toBeDefined();
    });
});
