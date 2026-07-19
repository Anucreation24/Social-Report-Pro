import { SocialPlatform, SocialPlatformConnector } from './types'
import { FacebookConnector } from './facebook/connector'
import { InstagramConnector } from './instagram/connector'
import { YoutubeConnector } from './youtube/connector'
import { TiktokConnector } from './tiktok/connector'

class ConnectorRegistry {
  private connectors = new Map<SocialPlatform, SocialPlatformConnector>()

  public register(connector: SocialPlatformConnector) {
    this.connectors.set(connector.provider, connector)
  }

  public get(provider: SocialPlatform): SocialPlatformConnector {
    const connector = this.connectors.get(provider)
    if (!connector) {
      throw new Error(`No social platform connector registered for: ${provider}`)
    }
    return connector
  }

  public list(): SocialPlatformConnector[] {
    return Array.from(this.connectors.values())
  }
}

export const connectorRegistry = new ConnectorRegistry()

// Register default platform connectors
connectorRegistry.register(new FacebookConnector())
connectorRegistry.register(new InstagramConnector())
connectorRegistry.register(new YoutubeConnector())
connectorRegistry.register(new TiktokConnector())

export default connectorRegistry
