import { input } from '@inquirer/prompts';
import { ExitPromptError } from '@inquirer/core';
import { $ } from 'bun';
import type { Command } from 'commander';

async function getLastWorkingDayCommits(): Promise<string[]> {
    const today = new Date();
    const daysBack = today.getDay() === 1 ? 3 : 1; // Monday → look back to Friday
    const since = new Date(today);
    since.setDate(since.getDate() - daysBack);
    const sinceStr = since.toISOString().split('T')[0];
    try {
        const result = await $`git log --since=${sinceStr} --format=%s`.text();
        return result.trim().split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

function formatStandup(yesterday: string, today: string, blockers: string): string {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const blockerText = blockers.trim() || 'None';

    const yesterdayLines = yesterday
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => (l.startsWith('-') ? l : `- ${l}`))
        .join('\n');

    const todayLines = today
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => (l.startsWith('-') ? l : `- ${l}`))
        .join('\n');

    return [
        `Standup — ${date}`,
        '',
        'Yesterday:',
        yesterdayLines || '- (nothing)',
        '',
        'Today:',
        todayLines || '- (nothing)',
        '',
        'Blockers:',
        blockerText,
    ].join('\n');
}

async function copyToClipboard(text: string): Promise<void> {
    await $`echo ${text} | pbcopy`.quiet();
}

export function registerStandup(program: Command): void {
    program
        .command('standup')
        .description('Generate a standup update from git log and prompts')
        .action(async () => {
            try {
                const commits = await getLastWorkingDayCommits();
                const commitDefault = commits.map(c => `- ${c}`).join('\n');

                const yesterday = await input({
                    message: 'Yesterday (one item per line):',
                    default: commitDefault,
                });

                const today = await input({
                    message: 'Today (one item per line):',
                });

                const blockers = await input({
                    message: 'Blockers (leave blank for none):',
                });

                const standup = formatStandup(yesterday, today, blockers);

                console.log('\n' + standup);

                try {
                    await copyToClipboard(standup);
                    console.log('\n(Copied to clipboard)');
                } catch {
                    console.warn('\n(Could not copy to clipboard)');
                }
            } catch (error) {
                if (error instanceof ExitPromptError) {
                    process.exit(0);
                }
                throw error;
            }
        });
}
