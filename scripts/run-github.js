#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

async function runGitHubServer() {
  console.log(chalk.blue.bold('\n🐙 Starting GitHub OAuth MCP Server\n'));

  const projectDir = path.join(process.cwd(), 'mcp-oauth-github');

  // Check if project directory exists
  if (!fs.existsSync(projectDir)) {
    console.log(chalk.red('❌ GitHub OAuth project directory not found!'));
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
    if (wranglerContent.includes('<Add-KV-ID>')) {
      console.log(chalk.red('❌ KV namespace not configured!'));
      console.log(chalk.yellow('Please run: wrangler kv:namespace create "OAUTH_KV"'));
      console.log(chalk.yellow('Then update the ID in wrangler.jsonc'));
      
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Continue anyway? (OAuth will not work)',
        default: false
      }]);

      if (!proceed) {
        process.exit(0);
      }
    }
  }

  console.log(chalk.blue('📦 Starting GitHub OAuth MCP server...'));
  console.log(chalk.gray('Server will be available at: http://localhost:8788/sse'));
  console.log(chalk.gray('Use Ctrl+C to stop the server\n'));

  console.log(chalk.blue.bold('🔧 Setup Requirements:'));
  console.log('1. GitHub OAuth App configured with callback: http://localhost:8788/callback');
  console.log('2. Cloudflare Workers AI enabled (for image generation)');
  console.log('3. KV namespace created and configured in wrangler.jsonc');
  console.log('4. Secrets configured:');
  console.log('   - wrangler secret put GITHUB_CLIENT_ID');
  console.log('   - wrangler secret put GITHUB_CLIENT_SECRET');
  console.log('   - wrangler secret put COOKIE_ENCRYPTION_KEY');
  console.log();

  // Check access control configuration
  const indexPath = path.join(projectDir, 'src', 'index.ts');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (indexContent.includes('const ALLOWED_USERNAMES = new Set<string>([]);')) {
      console.log(chalk.yellow('💡 Tip: Add GitHub usernames to ALLOWED_USERNAMES in src/index.ts'));
      console.log(chalk.yellow('   for access to protected tools like image generation'));
      console.log();
    }
  }

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
    console.log('3. Enable Workers AI in Cloudflare dashboard');
    console.log('4. Set up KV namespace and secrets (see SETUP.md)');
  });

  // Show connection instructions after a delay
  setTimeout(() => {
    console.log(chalk.blue.bold('\n📱 Connect with Puch AI:'));
    console.log(chalk.gray('Local: /mcp connect http://localhost:8788/sse'));
    console.log(chalk.gray('Production: /mcp connect https://your-worker.workers.dev/sse'));
    console.log(chalk.gray('\n🔍 Test with MCP Inspector:'));
    console.log(chalk.gray('npx @modelcontextprotocol/inspector@latest'));
    console.log(chalk.gray('URL: http://localhost:8788/sse'));
    console.log(chalk.gray('\n🎨 Available tools:'));
    console.log(chalk.gray('- userInfoOctokit: Get GitHub user info'));
    console.log(chalk.gray('- generateImage: AI image generation (restricted access)'));
    console.log(chalk.gray('- validate: Puch AI validation\n'));
  }, 3000);
}

runGitHubServer().catch(console.error);
