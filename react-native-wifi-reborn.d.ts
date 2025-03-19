declare module "react-native-wifi-reborn" {
  const WifiManager: {
    loadWifiList: () => Promise<string>;
    // Add any other methods if needed
  };
  export default WifiManager;
}
