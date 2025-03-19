declare module "react-native-wifi-reborn" {
  export interface WifiEntry {
    SSID: string;
    BSSID: string;
    capabilities: string;
    frequency: number;
    level: number;
    timestamp: number;
  }

  const WifiManager: {
    /**
     * Returns a promise that resolves to a list of nearby WiFi networks
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
     * Force device to connect to a specific network
     * @param ssid - The SSID of the network to connect to
     * @param password - The password for the network (use empty string for open networks)
     */
    connectToProtectedSSID: (
      ssid: string,
      password: string,
      isWEP?: boolean,
    ) => Promise<void>;

    /**
     * Disconnect from current WiFi network
     */
    disconnect: () => Promise<boolean>;

    /**
     * For Android only: Enable/disable WiFi
     * @param enabled - Whether WiFi should be enabled
     */
    setEnabled: (enabled: boolean) => Promise<boolean>;

    /**
     * For Android only: Check if WiFi is enabled
     */
    isEnabled: () => Promise<boolean>;

    /**
     * For Android only: Request location permissions needed for WiFi scanning
     */
    reScanAndLoadWifiList: () => Promise<WifiEntry[]>;

    /**
     * For iOS only: Check if the device has location services enabled
     */
    locationServicesEnabled: () => Promise<boolean>;

    /**
     * For iOS only: Request location permissions needed for WiFi scanning
     */
    requestLocationPermission: () => Promise<boolean>;

    /**
     * For iOS only: Check if the app has location permissions
     */
    hasLocationPermission: () => Promise<boolean>;

    /**
     * For iOS only: Determine if the device is connected to a WiFi network
     */
    isConnectedToWifi: () => Promise<boolean>;
  };

  export default WifiManager;
}
