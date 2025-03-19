import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import WifiManager from "react-native-wifi-reborn";
import * as Location from "expo-location";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ParallaxScrollView from "@/components/ParallaxScrollView";

export default function HomeScreen() {
  // Form data
  const [serverUrl, setServerUrl] = useState("");
  const [location, setLocation] = useState(""); // room number or name
  const [place, setPlace] = useState(""); // building, mall, university name
  const [username, setUsername] = useState("");

  // Collection state
  const [isRecording, setIsRecording] = useState(false);
  const [collectedData, setCollectedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("checking");
  const recordingInterval = useRef(null);
  const [networkCount, setNetworkCount] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  // Request location permissions
  const requestPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setPermissionStatus("denied");
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

  // Collect single sample of RSSI data
  const collectRssiSample = async () => {
    try {
      if (permissionStatus !== "granted") {
        return;
      }

      setIsLoading(true);

      // Get all available WiFi networks with RSSI values
      const networks = await WifiManager.loadWifiList();

      // Process and format for whereami
      const timestamp = new Date().toISOString();
      const rssiData = {};

      networks.forEach((network) => {
        rssiData[network.BSSID] = network.level;
      });

      // Add to collected data
      setCollectedData((prevData) => [
        ...prevData,
        {
          timestamp,
          rssi_values: rssiData,
        },
      ]);

      setSampleCount((prev) => prev + 1);
      setNetworkCount(networks.length);
    } catch (error) {
      console.error("Error collecting RSSI data:", error);

      if (error.message && error.message.includes("Location permission")) {
        setPermissionStatus("denied");
        stopRecording();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Start recording RSSI data
  const startRecording = async () => {
    // Validate form fields
    if (!serverUrl || !location || !place || !username) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields before recording",
      );
      return;
    }

    // Ensure permission
    if (permissionStatus !== "granted") {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to collect WiFi data",
        );
        return;
      }
    }

    // Clear previous data
    setCollectedData([]);
    setSampleCount(0);
    setRecordingTime(0);

    // Start recording
    setIsRecording(true);

    // Collect samples every second
    recordingInterval.current = setInterval(collectRssiSample, 1000);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // Stop recording
  const stopRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  };

  // Submit data to server
  const submitData = async () => {
    if (collectedData.length === 0) {
      Alert.alert("No Data", "Please record some data before submitting");
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data for whereami format
      const payload = {
        username: username,
        location: location,
        place: place,
        samples: collectedData,
      };

      // Send data to server
      const response = await fetch(serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Success
      Alert.alert(
        "Success",
        `Successfully submitted ${collectedData.length} samples`,
      );

      // Clear collected data
      setCollectedData([]);
      setSampleCount(0);
      setRecordingTime(0);
    } catch (error) {
      console.error("Error submitting data:", error);
      Alert.alert(
        "Submission Error",
        error.message || "Failed to submit data to server",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize permissions on component mount
  useEffect(() => {
    requestPermissions();

    // Clean up on unmount
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      >
        <ScrollView>
          <ThemedView style={styles.formContainer}>
            <ThemedText type="title" style={styles.title}>
              RSSI Data Collection
            </ThemedText>

            {/* Permission message if needed */}
            {permissionStatus === "denied" && (
              <ThemedView style={styles.permissionContainer}>
                <ThemedText type="defaultSemiBold">
                  Location Permission Required
                </ThemedText>
                <TouchableOpacity
                  style={styles.button}
                  onPress={requestPermissions}
                >
                  <ThemedText style={styles.buttonText}>
                    Grant Permission
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}

            {/* Form Fields */}
            <ThemedView style={styles.formField}>
              <ThemedText type="defaultSemiBold">Server URL</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/api/collect"
                value={serverUrl}
                onChangeText={setServerUrl}
                editable={!isRecording && !submitting}
                autoCapitalize="none"
                keyboardType="url"
              />
            </ThemedView>

            <ThemedView style={styles.formField}>
              <ThemedText type="defaultSemiBold">Location (Room)</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Room 202"
                value={location}
                onChangeText={setLocation}
                editable={!isRecording && !submitting}
              />
            </ThemedView>

            <ThemedView style={styles.formField}>
              <ThemedText type="defaultSemiBold">Place</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="NCU University, Vegas Mall, etc."
                value={place}
                onChangeText={setPlace}
                editable={!isRecording && !submitting}
              />
            </ThemedView>

            <ThemedView style={styles.formField}>
              <ThemedText type="defaultSemiBold">Username</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                value={username}
                onChangeText={setUsername}
                editable={!isRecording && !submitting}
              />
            </ThemedView>

            {/* Recording Status */}
            {isRecording && (
              <ThemedView style={styles.statusContainer}>
                <ThemedView style={styles.statusRow}>
                  <ThemedText type="defaultSemiBold">
                    Recording Time:
                  </ThemedText>
                  <ThemedText>{formatTime(recordingTime)}</ThemedText>
                </ThemedView>

                <ThemedView style={styles.statusRow}>
                  <ThemedText type="defaultSemiBold">
                    Samples Collected:
                  </ThemedText>
                  <ThemedText>{sampleCount}</ThemedText>
                </ThemedView>

                <ThemedView style={styles.statusRow}>
                  <ThemedText type="defaultSemiBold">
                    Networks Detected:
                  </ThemedText>
                  <ThemedText>{networkCount}</ThemedText>
                </ThemedView>

                <ThemedView style={styles.recordingIndicator}>
                  <ActivityIndicator size="small" color="#ff0000" />
                  <ThemedText style={styles.recordingText}>
                    RECORDING
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            )}

            {!isRecording && collectedData.length > 0 && (
              <ThemedView style={styles.summaryContainer}>
                <ThemedText type="subtitle">Collection Summary</ThemedText>
                <ThemedText>
                  ✓ {collectedData.length} samples collected over{" "}
                  {formatTime(recordingTime)}
                </ThemedText>
                <ThemedText>
                  ✓ Average of{" "}
                  {Math.round(networkCount / (collectedData.length || 1))}{" "}
                  networks per sample
                </ThemedText>
              </ThemedView>
            )}

            {/* Action Buttons */}
            <ThemedView style={styles.buttonContainer}>
              {!isRecording ? (
                <TouchableOpacity
                  style={[styles.button, styles.startButton]}
                  onPress={startRecording}
                  disabled={submitting || permissionStatus !== "granted"}
                >
                  <ThemedText style={styles.buttonText}>
                    Start Recording
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <ThemedText style={styles.buttonText}>
                    Stop Recording
                  </ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (isRecording || collectedData.length === 0 || submitting) &&
                    styles.disabledButton,
                ]}
                onPress={submitData}
                disabled={
                  isRecording || collectedData.length === 0 || submitting
                }
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Submit Data</ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ParallaxScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    gap: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  permissionContainer: {
    padding: 16,
    backgroundColor: "rgba(255, 204, 0, 0.2)",
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "center",
  },
  formField: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#f44336",
  },
  submitButton: {
    backgroundColor: "#2196F3",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    fontWeight: "600",
    color: "white",
    fontSize: 16,
  },
  statusContainer: {
    padding: 16,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 12,
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  recordingText: {
    color: "#ff0000",
    fontWeight: "bold",
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 12,
    marginVertical: 12,
  },
});
