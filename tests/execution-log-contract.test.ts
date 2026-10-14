import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import solc from 'solc';

test('compiles the non-custodial execution log with the expected public surface', () => {
  const contractPath = path.join(process.cwd(), 'deploy', 'contracts', 'RovaExecutionLog.sol');
  const source = fs.readFileSync(contractPath, 'utf8');
  const input = {
    language: 'Solidity',
    sources: { 'RovaExecutionLog.sol': { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((entry: { severity: string }) => entry.severity === 'error');
  assert.deepEqual(errors, []);

  const compiled = output.contracts['RovaExecutionLog.sol'].RovaExecutionLog;
  assert.ok(compiled.evm.bytecode.object.length > 0);

  const functions = compiled.abi
    .filter((entry: { type: string }) => entry.type === 'function')
    .map((entry: { name: string; stateMutability: string }) => `${entry.name}:${entry.stateMutability}`)
    .sort();

  assert.deepEqual(functions, [
    'getExecution:view',
    'logExecution:nonpayable',
    'totalExecutions:view',
  ]);
});
