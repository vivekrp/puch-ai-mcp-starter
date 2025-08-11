#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

async function setupEnvironment() {
  console.log(chalk.blue.bold('\n🚀 Puch AI MCP Starter - Environment Setup\n'));

  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  let existingEnv = {};
  
  if (fs.existsSync(envPath)) {
    console.log(chalk.yellow('Found existing .env file. Current values will be shown as defaults.\n'));
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        existingEnv[key.trim()] = value.trim().replace(/"/g, '');
      }
    });
  }

  const questions = [
    {
      type: 'password',
      name: 'authToken',
      message: 'Enter a secret AUTH_TOKEN (make it long and random):',
      default: existingEnv.AUTH_TOKEN || '',
      validate: input => input.length >= 20 || 'Token should be at least 20 characters long'
    },
    {
      type: 'input', 
      name: 'phoneNumber',
      message: 'Enter your WhatsApp number (with country code, no + or spaces):',
      default: existingEnv.MY_NUMBER || '919876543210',
      validate: input => /^\d{10,15}$/.test(input) || 'Please enter a valid phone number with country code'
    },
    {
      type: 'confirm',
      name: 'setupOAuth',
      message: 'Do you want to set up OAuth servers (Google/GitHub)?',
      default: false
    }
  ];

  if (!existingEnv.AUTH_TOKEN) {
    console.log(chalk.gray('💡 Tip: You can generate a random token with: openssl rand -hex 32\n'));
  }

  const answers = await inquirer.prompt(questions);

  // Generate random token if empty
  if (!answers.authToken) {
    try {
      answers.authToken = execSync('openssl rand -hex 32', { encoding: 'utf8' }).trim();
      console.log(chalk.green('✓ Generated random AUTH_TOKEN'));
    } catch (error) {
      answers.authToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      console.log(chalk.yellow('✓ Generated fallback AUTH_TOKEN'));
    }
  }

  // Write .env file
  const envContent = `AUTH_TOKEN="${answers.authToken}"
MY_NUMBER="${answers.phoneNumber}"
`;

  fs.writeFileSync(envPath, envContent);
  console.log(chalk.green('✓ Created .env file'));

  // Copy .env.example if it doesn't exist
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    const exampleContent = `AUTH_TOKEN="<your-auth-token>"
MY_NUMBER="91<your-number>"
`;
    fs.writeFileSync(envExamplePath, exampleContent);
    console.log(chalk.green('✓ Created .env.example file'));
  }

  console.log(chalk.blue.bold('\n📋 Next steps:'));
  console.log('1. Run: pnpm run bearer     # Start Python Bearer Token server');
  
  if (answers.setupOAuth) {
    console.log('2. Set up OAuth apps:');
    console.log('   - Google: https://console.cloud.google.com/');
    console.log('   - GitHub: https://github.com/settings/developers');
    console.log('3. Run: pnpm run google     # Start Google OAuth server');
    console.log('4. Run: pnpm run github     # Start GitHub OAuth server');
  }

  console.log('\n' + chalk.yellow('📖 See SETUP.md for detailed OAuth setup instructions.'));
  console.log(chalk.green('\n🎉 Environment setup complete!'));
}

setupEnvironment().catch(console.error);
