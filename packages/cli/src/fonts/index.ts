import type { Command } from 'commander';
import { initFonts } from './init';
import { updateFonts } from './update';


export const registerFonts = (program: Command) => {
  const fontsProgram = program
    .command('fonts')
    .description('Manage app fonts');

  fontsProgram
    .command('init')
    .description('Initialize font assets')
    .option('--web', 'target web platform')
    .option('--ios', 'target iOS platform')
    .option('--android', 'target Android platform')
    .action(options => {
      initFonts(options);
    });

  fontsProgram
    .command('update')
    .description('Update font assets')
    .option('--web', 'target web platform')
    .option('--ios', 'target iOS platform')
    .option('--android', 'target Android platform')
    .action(options => {
      updateFonts(options);
    });
}
