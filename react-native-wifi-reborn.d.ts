declare module "react-native-wifi-reborn" {
  export interface WifiEntry {
    SSID: string;
    BSSID: string;
    capabilities: string;
    frequency: number;
    level: number; // RSSI value in dBm
    timestamp: number;
  }

  const WifiManager: {
    /**
     * Returns a promise that resolves to a list of nearby WiFi networks with their RSSI values
     */
    loadWifiList: () => Promise<WifiEntry[]>;

    /**
     * Get current WiFi SSID
     */
    getCurrentWifiSSID: () => Promise<string>;

    /**
     * Get current WiFi BSSID
     */
    getCurrentWifiBSSID: () => Promise<string>;

    /**
     * Get current WiFi signal strength (RSSI)
     * Returns a number representing the signal strength in dBm
     */
    getCurrentSignalStrength: () => Promise<number>;

    /**
     * Scan for WiFi networks and return a fresh list
     * For Android only
     */
    reScanAndLoadWifiList: () => Promise<WifiEntry[]>;

    /**
     * For Android only: Enable/disable WiFi
     * @param enabled - Whether WiFi should be enabled
     */
    setEnabled: (enabled: boolean) => Promise<boolean>;

    /**
     * For Android only: Check if WiFi is enabled
     */
    isEnabled: () => Promise<boolean>;
  };

  export default WifiManager;
}
