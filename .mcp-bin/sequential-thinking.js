#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new Server(
  {
    name: 'sequential-thinking',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'sequential_think',
      description: 'Sequential thinking tool',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'The prompt to process'
          }
        },
        required: ['prompt']
      }
    }
  ]
}));

const transport = new StdioServerTransport();
server.connect(transport);
