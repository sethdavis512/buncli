import { input } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';

// Prompt types available from '@inquirer/prompts':
//   input     - text input with optional validation/default
//   select    - single choice from a list (arrow keys)
//   checkbox  - multiple selections from a list
//   confirm   - yes/no question
//   search    - filterable/searchable list selection
//   password  - masked text input
//   expand    - compact selection with keyboard shortcuts
//   editor    - opens $VISUAL/$EDITOR for long-form input
//   number    - numeric input with validation
//   rawlist   - numbered list selection

try {
    const name = await input({ message: 'Enter your name' });
    console.log(`Hello, ${name}!`);
} catch (error) {
    if (error instanceof ExitPromptError) {
        process.exit(0);
    }
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
}
