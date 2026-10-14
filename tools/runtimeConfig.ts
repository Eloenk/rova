export type OperationalVariable =
  | 'ARC_CHAIN_ID'
  | 'ARC_RPC_URL'
  | 'ROVA_AGENT_REGISTRATION_CONFIRMATION'
  | 'ROVA_ALLOW_AGENT_REGISTRATION'
  | 'ROVA_ALLOW_CONTRACT_DEPLOY'
  | 'ROVA_DEPLOY_CONFIRMATION'
  | 'ROVA_DEPLOYER_PRIVATE_KEY'
  | 'ROVA_METADATA_URI';

export function readOperationalVariable(name: OperationalVariable): string {
  return process.env[name]?.trim() || '';
}

export function requireOperationalVariable(name: OperationalVariable): string {
  const value = readOperationalVariable(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function operationalFlag(name: OperationalVariable): boolean {
  return readOperationalVariable(name).toLowerCase() === 'true';
}

export function operationalChainId(): bigint {
  const raw = readOperationalVariable('ARC_CHAIN_ID') || '5042';
  if (!/^\d+$/.test(raw) || raw === '0') throw new Error('ARC_CHAIN_ID must be a positive integer');
  return BigInt(raw);
}
