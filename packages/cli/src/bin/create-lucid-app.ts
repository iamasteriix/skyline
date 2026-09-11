import type { CliOptions } from './types';
import type { Command } from 'commander';
import { Option, } from 'commander';
import { basename, resolve } from 'path';
import { execSync } from 'child_process';
import { logger } from '@/config';
import inquirer from 'inquirer';
import fs from 'fs/promises';


/**
 * Registers the init/create-app command
 */
export const createLucidApp = (program: Command) => {
  program
    .command('init')
    .description('Initialize a new Lucid.js app')
    .argument('[dir]', 'target directory', 'express-app')
    .option('--with-tests', 'include test suite', true)
    .addOption(
      new Option('--test-scope <kinds...>', 'specify test scopes')
        .choices(['unit', 'i9n', 'e2e'])
        .default(['unit', 'i9n', 'e2e'])
    )
    .option('--with-docs', 'include swagger docs', true)
    .action(async (dirArg, opts) => {
      await executeProgram(dirArg, opts);
    });
}


export const executeProgram = async (
  dirArg: string = 'express-app',
  opts: CliOptions,
) => {
  const targetDir = resolve(process.cwd(), dirArg);

  await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Select platform framework',
      choices: ['server'],
      default: 'server',
    },
  ]);
  const templateDir = resolve(__dirname, '../../templates/server');
  await fs.cp(templateDir, targetDir, { recursive: true, });

  if (!opts.withTests) {
    const testFiles = fs.glob('./src/**/*.test.ts', { cwd: targetDir });
    for await (const file of testFiles) await fs.rm(resolve(targetDir, file), { force: true });
  } else if (opts.testScope) {
    const testScopes = opts.testScope ?? ['unit', 'i9n', 'e2e'];
    const excluded = ['unit', 'i9n', 'e2e'].filter(scope => !testScopes.includes(scope));
    for (const scope of excluded) {
      const testScopedFiles = fs.glob(`src/**/*.${scope}.test.ts`, { cwd: targetDir });
      for await (const file of testScopedFiles) await fs.rm(resolve(targetDir, file), { force: true });
    }
  }

  if (!opts.withDocs) {
    const docFiles = fs.glob('./src/**/*.docs.yml', { cwd: targetDir });
    for await (const file of docFiles) await fs.rm(resolve(targetDir, file), { force: true });
  }

  // rename consumer package
  const pkgPath = resolve(targetDir, 'package.json');
  const pkgContent = await fs.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgContent);
  const pkgParsed = editPkgJson(pkg, targetDir, opts);
  await fs.writeFile(pkgPath, JSON.stringify(pkgParsed, null, 2), 'utf-8');

  logger.info('Installing dependencies...');
  execSync('npm install', {
    cwd: targetDir,
    stdio: 'inherit',
  });

  logger.info(`\nDone! Next steps:\n  cd ${dirArg}\n  npm run dev\n`);
}


const editPkgJson = (
  pkg: any,
  targetDir: string,
  opts: CliOptions,
) => {
  // rename package
  pkg.name = basename(targetDir);

  // clean up docs dependencies
  if (!opts.withDocs) {
    delete pkg.dependencies['swagger-jsdoc'];
    delete pkg.dependencies['swagger-ui-express'];
    delete pkg.devDependencies['@types/swagger-jsdoc'];
    delete pkg.devDependencies['@types/swagger-ui-express'];
  }

  // clean up test dependencies and scripts
  if (!opts.withTests) {
    delete pkg.scripts['test:unit'];
    delete pkg.scripts['test:i9n'];
    delete pkg.scripts['test:e2e'];

    delete pkg.devDependencies['vitest'];
    delete pkg.devDependencies['@playwright/test'];
    delete pkg.devDependencies['supertest'];
    delete pkg.devDependencies['@types/supertest'];
  }
  
  else if (opts.testScope) {
    // prune specific test scripts based on excluded scopes
    const testScopes = opts.testScope ?? ['unit', 'i9n', 'e2e'];
    if (!testScopes.includes('unit')) delete pkg.scripts['test:unit'];
    if (!testScopes.includes('i9n')) delete pkg.scripts['test:i9n'];
    if (!testScopes.includes('e2e')) {
      delete pkg.scripts['test:e2e'];
      delete pkg.devDependencies['@playwright/test'];
    }

    // remove vitest if neither unit nor i9n are selected
    if (!testScopes.includes('unit') && !testScopes.includes('i9n')) {
      delete pkg.devDependencies['vitest'];
      delete pkg.devDependencies['supertest'];
      delete pkg.devDependencies['@types/supertest'];
    }
  }

  return pkg;
}
