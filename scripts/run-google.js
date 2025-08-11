#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

async function runGoogleServer() {
  console.log(chalk.blue.bold('\n🔐 Starting Google OAuth MCP Server\n'));

  const projectDir = path.join(process.cwd(), 'mcp-google-oauth');

  // Check if project directory exists
  if (!fs.existsSync(projectDir)) {
    console.log(chalk.red('❌ Google OAuth project directory not found!'));
    process.exit(1);
  }

  // Check if dependencies are installed
  const nodeModulesPath = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(chalk.yellow('⚠️ Dependencies not found. Installing...'));
    try {
      execSync('pnpm install', { stdio: 'inherit', cwd: projectDir });
      console.log(chalk.green('✓ Dependencies installed successfully'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to install dependencies'));
      process.exit(1);
    }
  }

  // Check if wrangler is authenticated
  try {
    execSync('wrangler whoami', { stdio: 'ignore', cwd: projectDir });
  } catch (error) {
    console.log(chalk.yellow('⚠️ Wrangler not authenticated. Please run:'));
    console.log(chalk.gray('wrangler auth login'));
    
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Continue anyway? (Server may not work without authentication)',
      default: false
    }]);

    if (!proceed) {
      process.exit(0);
    }
  }

  // Check wrangler configuration
  const wranglerPath = path.join(projectDir, 'wrangler.jsonc');
  if (fs.existsSync(wranglerPath)) {
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    if (wranglerContent.includes('f77baffe597f4b9389ba6dcd20653861')) {
      console.log(chalk.yellow('⚠️ Using example KV namespace ID. For production, create your own:'));
      console.log(chalk.gray('wrangler kv:namespace create "OAUTH_KV"'));
    }
  }

  console.log(chalk.blue('📦 Starting Google OAuth MCP server...'));
  console.log(chalk.gray('Server will be available at: http://localhost:8788/sse'));
  console.log(chalk.gray('Use Ctrl+C to stop the server\n'));

  console.log(chalk.blue.bold('🔧 Setup Requirements:'));
  console.log('1. Google OAuth App configured with callback: http://localhost:8788/callback');
  console.log('2. Gmail API enabled in Google Cloud Console');
  console.log('3. Secrets configured:');
  console.log('   - wrangler secret put GOOGLE_CLIENT_ID');
  console.log('   - wrangler secret put GOOGLE_CLIENT_SECRET');
  console.log('   - wrangler secret put COOKIE_ENCRYPTION_KEY');
  console.log();

  // Start the server
  const serverProcess = spawn('wrangler', ['dev'], {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Stopping server...'));
    serverProcess.kill('SIGINT');
  });

  serverProcess.on('close', (code) => {
    if (code === 0) {
      console.log(chalk.green('\n✅ Server stopped successfully'));
    } else {
      console.log(chalk.red(`\n❌ Server exited with code ${code}`));
    }
  });

  serverProcess.on('error', (error) => {
    console.log(chalk.red('❌ Failed to start server:'), error.message);
    console.log(chalk.yellow('\nTroubleshooting:'));
    console.log('1. Install Wrangler: npm install -g wrangler');
    console.log('2. Authenticate: wrangler auth login');
    console.log('3. Set up KV namespace and secrets (see SETUP.md)');
  });

  // Show connection instructions after a delay
  setTimeout(() => {
    console.log(chalk.blue.bold('\n📱 Connect with Puch AI:'));
    console.log(chalk.gray('Local: /mcp connect http://localhost:8788/sse'));
    console.log(chalk.gray('Production: /mcp connect https://your-worker.workers.dev/sse'));
    console.log(chalk.gray('\n🔍 Test with MCP Inspector:'));
    console.log(chalk.gray('npx @modelcontextprotocol/inspector@latest'));
    console.log(chalk.gray('URL: http://localhost:8788/sse\n'));
  }, 3000);
}

runGoogleServer().catch(console.error);
