#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

function checkCommand(command, name, installInstructions) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    console.log(chalk.green(`✓ ${name} is installed`));
    return true;
  } catch (error) {
    console.log(chalk.red(`✗ ${name} is not installed`));
    if (installInstructions) {
      console.log(chalk.yellow(`  Install with: ${installInstructions}`));
    }
    return false;
  }
}

function checkVersion(command, name, minVersion) {
  try {
    const version = execSync(command, { encoding: 'utf8' }).trim();
    console.log(chalk.green(`✓ ${name} version: ${version}`));
    return true;
  } catch (error) {
    console.log(chalk.red(`✗ Cannot check ${name} version`));
    return false;
  }
}

console.log(chalk.blue.bold('\n🔍 Checking dependencies...\n'));

let allGood = true;

// Check Node.js
allGood &= checkVersion('node --version', 'Node.js', '>=18.0.0');

// Check pnpm
allGood &= checkCommand('pnpm', 'pnpm', 'npm install -g pnpm');

// Check Python
allGood &= checkVersion('python3 --version', 'Python', '>=3.11');

// Check uv
allGood &= checkCommand('uv', 'uv (Python package manager)', 'curl -LsSf https://astral.sh/uv/install.sh | sh');

// Check ngrok
const ngrokInstalled = checkCommand('ngrok', 'ngrok (for Python server)', 'Visit https://ngrok.com/download');

// Check git
checkCommand('git', 'git', 'Install from https://git-scm.com/');

console.log('\n' + chalk.blue.bold('📋 Next steps:'));

if (!allGood) {
  console.log(chalk.red('Please install the missing dependencies above.'));
} else {
  console.log(chalk.green('All core dependencies are installed! 🎉'));
  
  console.log(chalk.yellow('\nOptional setup steps:'));
  console.log('1. Run: pnpm run install-all    # Install all project dependencies');
  console.log('2. Run: pnpm run setup-python   # Set up Python virtual environment');
  console.log('3. Run: pnpm run setup-env      # Interactive environment setup');
  
  if (!ngrokInstalled) {
    console.log(chalk.yellow('\n⚠️  For Python MCP server, you\'ll need ngrok to make it publicly accessible.'));
  }
}

console.log('\n' + chalk.blue('📖 See SETUP.md for detailed setup instructions.'));
