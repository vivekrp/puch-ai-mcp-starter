#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');

async function quickStart() {
  console.log(chalk.blue.bold('\n🚀 Puch AI MCP Starter - Quick Start Guide\n'));
  
  console.log('Welcome! Let\'s get you up and running with your first MCP server.\n');
  
  const { choice } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Which MCP server would you like to set up first?',
    choices: [
      {
        name: '🐍 Python Bearer Token Server (Recommended for beginners)',
        value: 'bearer',
        short: 'Python Bearer'
      },
      {
        name: '📋 Python Task Management Server (Shows user scoping)',
        value: 'bearer-task',
        short: 'Python Tasks'
      },
      {
        name: '🔐 Google OAuth Server (Advanced - requires Google Cloud setup)',
        value: 'google',
        short: 'Google OAuth'
      },
      {
        name: '🐙 GitHub OAuth Server (Advanced - requires GitHub OAuth app)',
        value: 'github',
        short: 'GitHub OAuth'
      },
      {
        name: '🔍 Just check my system dependencies first',
        value: 'check',
        short: 'Check deps'
      }
    ]
  }]);

  switch (choice) {
    case 'bearer':
      console.log(chalk.green('\n✅ Great choice! The Bearer Token server is the easiest to set up.\n'));
      console.log(chalk.blue('📋 Here\'s what we\'ll do:'));
      console.log('1. Check your system dependencies');
      console.log('2. Set up your environment variables');
      console.log('3. Install Python dependencies');
      console.log('4. Start the MCP server');
      console.log('5. Show you how to connect with Puch AI\n');
      
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Ready to proceed?',
        default: true
      }]);

      if (proceed) {
        console.log(chalk.yellow('\n🔄 Running setup steps...\n'));
        try {
          execSync('pnpm run check-deps && pnpm run setup-env && pnpm run setup-python', { stdio: 'inherit' });
          console.log(chalk.green('\n✅ Setup complete! Now starting the server...\n'));
          console.log(chalk.blue('💡 In another terminal, run: ngrok http 8086\n'));
          execSync('pnpm run bearer', { stdio: 'inherit' });
        } catch (error) {
          console.log(chalk.red('\n❌ Setup failed. Please check the error messages above.'));
          console.log(chalk.yellow('💡 Try running individual commands manually or check SETUP.md'));
        }
      }
      break;

    case 'bearer-task':
      console.log(chalk.green('\n✅ Task Management server demonstrates user-scoped data!\n'));
      console.log(chalk.blue('This server shows how to use puch_user_id to scope data per user.\n'));
      execSync('pnpm run bearer:task', { stdio: 'inherit' });
      break;

    case 'google':
      console.log(chalk.yellow('\n⚠️ Google OAuth setup requires additional configuration:\n'));
      console.log('1. Google Cloud Project with OAuth credentials');
      console.log('2. Gmail API enabled'); 
      console.log('3. Cloudflare account for deployment');
      console.log('4. Wrangler CLI authenticated\n');
      console.log(chalk.blue('📖 See SETUP.md for detailed Google OAuth setup instructions.\n'));
      
      const { proceedGoogle } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceedGoogle',
        message: 'Continue with Google OAuth setup?',
        default: false
      }]);

      if (proceedGoogle) {
        execSync('pnpm run google', { stdio: 'inherit' });
      }
      break;

    case 'github':
      console.log(chalk.yellow('\n⚠️ GitHub OAuth setup requires additional configuration:\n'));
      console.log('1. GitHub OAuth App created');
      console.log('2. Cloudflare account with Workers AI enabled');
      console.log('3. KV namespace configured');
      console.log('4. Wrangler CLI authenticated\n');
      console.log(chalk.blue('📖 See SETUP.md for detailed GitHub OAuth setup instructions.\n'));
      
      const { proceedGitHub } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceedGitHub',
        message: 'Continue with GitHub OAuth setup?',
        default: false
      }]);

      if (proceedGitHub) {
        execSync('pnpm run github', { stdio: 'inherit' });
      }
      break;

    case 'check':
      console.log(chalk.blue('\n🔍 Checking your system dependencies...\n'));
      execSync('pnpm run check-deps', { stdio: 'inherit' });
      break;
  }

  console.log(chalk.blue.bold('\n📚 Additional Resources:'));
  console.log('• Detailed setup guide: SETUP.md');
  console.log('• Architecture overview: WARP.md');
  console.log('• Puch AI documentation: https://puch.ai/mcp');
  console.log('• Discord community: https://discord.gg/VMCnMvYx\n');
}

quickStart().catch(console.error);
