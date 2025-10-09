const path = require('path');
const Module = require('module');

const globalNodeModules = path.join(process.env.APPDATA || '', 'npm', 'node_modules');
const existingNodePath = process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [];
if (!existingNodePath.includes(globalNodeModules)) {
  process.env.NODE_PATH = [...existingNodePath, globalNodeModules].filter(Boolean).join(path.delimiter);
  Module._initPaths();
}

const sdkBasePath = path.join(
  globalNodeModules,
  'chrome-devtools-mcp',
  'node_modules',
  '@modelcontextprotocol',
  'sdk',
  'dist',
  'cjs',
);

const { Client } = require(path.join(sdkBasePath, 'client', 'index.js'));
const { StdioClientTransport } = require(path.join(sdkBasePath, 'client', 'stdio.js'));

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node scripts/get-page-title.js <url>');
    process.exit(1);
  }

  const client = new Client(
    { name: 'chrome-devtools-script', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  const transport = new StdioClientTransport({
    command: 'chrome-devtools-mcp',
    args: ['--headless', '--isolated'],
    stderr: 'pipe',
  });

  const stderrChunks = [];
  const stderrStream = transport.stderr;
  if (stderrStream) {
    stderrStream.on('data', chunk => {
      stderrChunks.push(chunk.toString());
    });
  }

  try {
    await client.connect(transport);
    await client.listTools({});
    await client.callTool({
      name: 'new_page',
      arguments: { url },
    });
    const result = await client.callTool({
      name: 'evaluate_script',
      arguments: { function: '() => document.title' },
    });

    const textBlock = result.content.find(block => block.type === 'text');
    if (!textBlock) {
      throw new Error('ページタイトルを含む出力が見つかりませんでした。');
    }

    const match = textBlock.text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) {
      throw new Error('ページタイトルを抽出できませんでした。');
    }

    let title;
    try {
      title = JSON.parse(match[1]);
    } catch (error) {
      throw new Error('ページタイトルの解析に失敗しました。');
    }

    console.log(title);
  } finally {
    await client.close().catch(() => {});
    const stderrOutput = stderrChunks.join('').trim();
    if (stderrOutput) {
      console.error(stderrOutput);
    }
  }
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
