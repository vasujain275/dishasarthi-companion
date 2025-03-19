import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import WifiManager from "react-native-wifi-reborn";
import * as Location from "expo-location";
import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  const [rssi, setRssi] = useState("Loading...");
  const [currentSSID, setCurrentSSID] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("checking");

  // Request location permissions
  const requestPermissions = async () => {
    try {
      // For Android: request location permission
      if (Platform.OS === "android") {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setPermissionStatus("denied");
          setRssi("Permission required");
          setCurrentSSID("No access");
          return false;
        }
      }

      setPermissionStatus("granted");
      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      setPermissionStatus("error");
      return false;
    }
  };

  const fetchWifiInfo = async () => {
    try {
      // Don't attempt to fetch if permission not granted
      if (permissionStatus !== "granted") {
        const permissionGranted = await requestPermissions();
        if (!permissionGranted) return;
      }

      setRefreshing(true);

      // Get current SSID
      const ssid = await WifiManager.getCurrentWifiSSID();
      setCurrentSSID(ssid);

      // Get RSSI value
      const level = await WifiManager.getCurrentSignalStrength();
      setRssi(level.toString());
    } catch (error) {
      console.error("Error fetching WiFi information:", error);
      setRssi("Error");

      // Handle specific error cases
      if (error.message && error.message.includes("Location permission")) {
        setPermissionStatus("denied");
        setRssi("Permission required");
        Alert.alert(
          "Location Permission Required",
          "Please enable location permission in your device settings to access WiFi information.",
          [{ text: "OK" }],
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial permission check and data fetch
    const initialize = async () => {
      const permissionGranted = await requestPermissions();
      if (permissionGranted) {
        fetchWifiInfo();
      }
    };

    initialize();

    // Set interval to update RSSI value every 5 seconds if permission granted
    let interval;
    if (permissionStatus === "granted") {
      interval = setInterval(fetchWifiInfo, 5000);
    }

    // Clear interval on component unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [permissionStatus]);

  // Convert RSSI to signal quality description
  const getSignalQuality = (rssiValue) => {
    if (
      rssiValue === "Loading..." ||
      rssiValue === "Error" ||
      rssiValue === "Permission required"
    )
      return rssiValue;

    const rssiNum = parseInt(rssiValue, 10);
    if (rssiNum >= -50) return "Excellent";
    if (rssiNum >= -60) return "Good";
    if (rssiNum >= -70) return "Fair";
    if (rssiNum >= -80) return "Poor";
    return "Very Poor";
  };

  // Get signal bars (1-4) based on RSSI value
  const getSignalBars = (rssiValue) => {
    if (
      rssiValue === "Loading..." ||
      rssiValue === "Error" ||
      rssiValue === "Permission required"
    )
      return "";

    const rssiNum = parseInt(rssiValue, 10);
    if (rssiNum >= -55) return "█ █ █ █";
    if (rssiNum >= -65) return "█ █ █ ░";
    if (rssiNum >= -75) return "█ █ ░ ░";
    if (rssiNum >= -85) return "█ ░ ░ ░";
    return "░ ░ ░ ░";
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">WiFi Signal</ThemedText>
          <HelloWave />
        </ThemedView>

        {/* Permission status message if needed */}
        {permissionStatus === "denied" && (
          <ThemedView style={styles.permissionContainer}>
            <ThemedText type="defaultSemiBold">
              Location Permission Required
            </ThemedText>
            <ThemedText>
              This app needs location permission to access WiFi information on
              Android.
            </ThemedText>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermissions}
            >
              <ThemedText style={styles.buttonText}>
                Grant Permission
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* RSSI Display Section */}
        <TouchableOpacity
          style={styles.rssiContainer}
          onPress={fetchWifiInfo}
          activeOpacity={0.7}
          disabled={permissionStatus === "denied"}
        >
          <ThemedText type="subtitle">
            Current Network: {currentSSID}
          </ThemedText>

          <ThemedView style={styles.rssiValueContainer}>
            <ThemedText style={styles.rssiValue}>{rssi}</ThemedText>
            {rssi !== "Loading..." &&
              rssi !== "Error" &&
              rssi !== "Permission required" && (
                <ThemedText type="defaultSemiBold">dBm</ThemedText>
              )}
          </ThemedView>

          <ThemedText type="subtitle">{getSignalQuality(rssi)}</ThemedText>
          <ThemedText style={styles.signalBars}>
            {getSignalBars(rssi)}
          </ThemedText>

          {permissionStatus === "granted" && (
            <ThemedText style={styles.tapToRefresh}>
              {refreshing ? "Refreshing..." : "Tap to refresh"}
            </ThemedText>
          )}
        </TouchableOpacity>

        {permissionStatus === "granted" && (
          <ThemedView style={styles.infoContainer}>
            <ThemedText type="subtitle">About WiFi Signal Strength</ThemedText>
            <ThemedText>
              RSSI (Received Signal Strength Indicator) measures WiFi signal
              strength in dBm. Higher values (closer to 0) indicate stronger
              signals.
            </ThemedText>
            <ThemedText>
              • <ThemedText type="defaultSemiBold">-50 to -30 dBm:</ThemedText>{" "}
              Excellent signal
            </ThemedText>
            <ThemedText>
              • <ThemedText type="defaultSemiBold">-67 to -50 dBm:</ThemedText>{" "}
              Good signal
            </ThemedText>
            <ThemedText>
              • <ThemedText type="defaultSemiBold">-80 to -67 dBm:</ThemedText>{" "}
              Fair signal
            </ThemedText>
            <ThemedText>
              • <ThemedText type="defaultSemiBold">Below -80 dBm:</ThemedText>{" "}
              Poor signal
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  permissionContainer: {
    padding: 16,
    backgroundColor: "rgba(255, 204, 0, 0.2)",
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  permissionButton: {
    backgroundColor: "#A1CEDC",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    fontWeight: "600",
  },
  rssiContainer: {
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "rgba(161, 206, 220, 0.2)",
    marginVertical: 12,
  },
  rssiValueContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 16,
  },
  rssiValue: {
    fontSize: 48,
    fontWeight: "bold",
    marginRight: 4,
  },
  signalBars: {
    fontSize: 24,
    letterSpacing: 2,
    marginTop: 8,
  },
  tapToRefresh: {
    marginTop: 16,
    opacity: 0.7,
    fontSize: 12,
  },
  infoContainer: {
    gap: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(161, 206, 220, 0.1)",
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
