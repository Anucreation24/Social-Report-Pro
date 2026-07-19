export class ConnectorError extends Error {
  public code: string
  public provider: string
  public status?: number

  constructor(message: string, code: string, provider: string, status?: number) {
    super(message)
    this.name = 'ConnectorError'
    this.code = code
    this.provider = provider
    this.status = status
  }
}

export class ConfigurationMissingError extends ConnectorError {
  constructor(provider: string, variableName: string) {
    super(
      `Provider configuration missing: ${variableName} is not set.`,
      'CONFIG_MISSING',
      provider
    )
  }
}

export class TokenExchangeError extends ConnectorError {
  constructor(provider: string, message: string, status?: number) {
    super(message, 'TOKEN_EXCHANGE_FAILED', provider, status)
  }
}

export class AccountDiscoveryError extends ConnectorError {
  constructor(provider: string, message: string, status?: number) {
    super(message, 'ACCOUNT_DISCOVERY_FAILED', provider, status)
  }
}
