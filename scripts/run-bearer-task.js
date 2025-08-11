#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

async function runTaskServer() {
  console.log(chalk.blue.bold('\n📋 Starting Python Task Management MCP Server\n'));

  // Check if .env exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log(chalk.red('❌ .env file not found!'));
    console.log(chalk.yellow('Run: pnpm run setup-env  # to create environment file'));
    process.exit(1);
  }

  // Check if virtual environment exists
  const venvPath = path.join(process.cwd(), '.venv');
  if (!fs.existsSync(venvPath)) {
    console.log(chalk.yellow('⚠️ Python virtual environment not found. Setting up...'));
    try {
      execSync('uv venv && uv sync', { stdio: 'inherit', cwd: process.cwd() });
      console.log(chalk.green('✓ Python environment set up successfully'));
    } catch (error) {
      console.log(chalk.red('❌ Failed to set up Python environment'));
      console.log('Make sure you have uv installed: curl -LsSf https://astral.sh/uv/install.sh | sh');
      process.exit(1);
    }
  }

  // Determine Python executable path
  const isWindows = process.platform === 'win32';
  const pythonPath = isWindows 
    ? path.join(venvPath, 'Scripts', 'python.exe')
    : path.join(venvPath, 'bin', 'python');

  console.log(chalk.blue('📦 Starting Task Management MCP server...'));
  console.log(chalk.gray('Server will be available at: http://localhost:8086'));
  console.log(chalk.gray('This server demonstrates user-scoped data with puch_user_id'));
  console.log(chalk.gray('Use Ctrl+C to stop the server\n'));

  // Start the Python server
  const serverProcess = spawn(pythonPath, ['puch-user-id-mcp-example.py'], {
    cwd: path.join(process.cwd(), 'mcp-bearer-token'),
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
    console.log('1. Make sure Python 3.11+ is installed');
    console.log('2. Run: pnpm run setup-python');
    console.log('3. Check that .env file has AUTH_TOKEN and MY_NUMBER');
  });

  // Show connection instructions after a delay
  setTimeout(() => {
    console.log(chalk.blue.bold('\n📱 Connect with Puch AI:'));
    console.log(chalk.gray('1. Make server public: ngrok http 8086'));
    console.log(chalk.gray('2. Copy the HTTPS ngrok URL'));
    console.log(chalk.gray('3. In Puch AI: /mcp connect https://your-ngrok-url.ngrok.io/mcp your_auth_token'));
    console.log(chalk.gray('4. Try: "Add a task: Buy groceries"'));
    console.log(chalk.gray('5. Try: "List my tasks"'));
    console.log(chalk.gray('\n💡 This server shows how to scope data per user with puch_user_id\n'));
  }, 2000);
}

runTaskServer().catch(console.error);
